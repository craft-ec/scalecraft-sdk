import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  SendOptions,
  VersionedTransaction,
  SimulatedTransactionResponse,
  SystemProgram,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN, Wallet, translateError } from "@coral-xyz/anchor";
import { PDA } from "./pda";
import { PROGRAM_ID } from "./constants";
import type { Scalecraft } from "./idl-types";
import type {
  ProtocolConfig,
  DefenderPool,
  ChallengerPool,
  JurorPool,
  Subject,
  Dispute,
  Escrow,
  JurorRecord,
  ChallengerRecord,
  DefenderRecord,
  DisputeType,
  VoteChoice,
  RestoreVoteChoice,
  BondSource,
} from "./types";
import idl from "./idl.json";

// Error codes from the program
const ERROR_CODES: Record<number, string> = {
  6000: "Unauthorized",
  6001: "InvalidConfig",
  6002: "StakeBelowMinimum",
  6003: "BondBelowMinimum",
  6004: "InsufficientStake",
  6005: "InsufficientAvailableStake",
  6006: "StakeLocked",
  6007: "SubjectCannotBeDisputed",
  6008: "SubjectCannotBeStaked",
  6009: "DisputeAlreadyExists",
  6010: "DisputeNotFound",
  6011: "DisputeAlreadyResolved",
  6012: "VotingNotStarted",
  6013: "VotingEnded",
  6014: "VotingNotEnded",
  6015: "AlreadyVoted",
  6016: "InvalidVoteChoice",
  6017: "RewardAlreadyClaimed",
  6018: "NotOnWinningSide",
  6019: "InvalidSubjectStatus",
  6020: "AppealNotAllowed",
  6021: "AppealAlreadyExists",
  6022: "NotRestorer",
  6023: "RestorationFailed",
};

export interface SimulationResult {
  success: boolean;
  error?: string;
  errorCode?: number;
  logs?: string[];
  unitsConsumed?: number;
}

export interface ScaleCraftClientConfig {
  connection: Connection;
  wallet?: Wallet;
  programId?: PublicKey;
  /** If true, all transactions will be simulated before sending */
  simulateFirst?: boolean;
}

export interface TransactionResult {
  signature: string;
  accounts?: Record<string, PublicKey>;
}

/**
 * ScaleCraft SDK Client
 *
 * Framework-agnostic client for interacting with the ScaleCraft Solana program.
 * Can be used in Node.js, browser, React, Vue, or any JavaScript/TypeScript environment.
 *
 * @example
 * ```ts
 * import { ScaleCraftClient } from "@scalecraft/sdk";
 * import { Connection, Keypair } from "@solana/web3.js";
 *
 * const connection = new Connection("https://api.devnet.solana.com");
 * const wallet = new Wallet(keypair);
 * const client = new ScaleCraftClient({ connection, wallet });
 *
 * // Register as a juror
 * const result = await client.registerJuror(new BN(100_000_000));
 * console.log("Signature:", result.signature);
 * ```
 */
export class ScaleCraftClient {
  public readonly connection: Connection;
  public readonly programId: PublicKey;
  public readonly pda: PDA;
  public simulateFirst: boolean;
  private wallet: Wallet | null;
  private anchorProgram: Program<Scalecraft>;

  constructor(config: ScaleCraftClientConfig) {
    this.connection = config.connection;
    this.programId = config.programId ?? PROGRAM_ID;
    this.pda = new PDA(this.programId);
    this.wallet = config.wallet ?? null;
    this.simulateFirst = config.simulateFirst ?? false;

    // Initialize program with read-only provider (no wallet needed for fetching)
    const readOnlyProvider = new AnchorProvider(
      this.connection,
      {} as Wallet, // Dummy wallet for read-only operations
      { commitment: "confirmed" }
    );
    this.anchorProgram = new Program<Scalecraft>(
      idl as unknown as Scalecraft,
      readOnlyProvider
    );

    // If wallet provided, reinitialize with real wallet
    if (this.wallet) {
      this.initProgram();
    }
  }

  private initProgram(): void {
    if (!this.wallet) return;

    const provider = new AnchorProvider(this.connection, this.wallet, {
      commitment: "confirmed",
    });
    this.anchorProgram = new Program<Scalecraft>(
      idl as unknown as Scalecraft,
      provider
    );
  }

  /**
   * Set or update the wallet
   */
  setWallet(wallet: Wallet): void {
    this.wallet = wallet;
    this.initProgram();
  }

  /**
   * Get the current wallet public key
   */
  get walletPublicKey(): PublicKey | null {
    return this.wallet?.publicKey ?? null;
  }

  /**
   * Get the Anchor program instance (for advanced usage)
   */
  get program(): Program<Scalecraft> | null {
    return this.anchorProgram;
  }

  /**
   * Get wallet and program, throwing if not connected
   */
  private getWalletAndProgram(): { wallet: Wallet; program: Program<Scalecraft> } {
    if (!this.wallet || !this.anchorProgram) {
      throw new Error("Wallet not connected. Call setWallet() first.");
    }
    return { wallet: this.wallet, program: this.anchorProgram };
  }

  // ===========================================================================
  // Transaction Simulation
  // ===========================================================================

  /**
   * Parse program error from simulation logs
   */
  private parseErrorFromLogs(logs: string[]): { code?: number; message: string } {
    for (const log of logs) {
      // Look for custom program error
      const customErrorMatch = log.match(/Program log: AnchorError.*Error Code: (\w+)\. Error Number: (\d+)\. Error Message: (.+)\./);
      if (customErrorMatch) {
        const errorCode = parseInt(customErrorMatch[2], 10);
        const errorMessage = customErrorMatch[3];
        return { code: errorCode, message: `${customErrorMatch[1]}: ${errorMessage}` };
      }

      // Look for error number pattern
      const errorNumberMatch = log.match(/Error Number: (\d+)/);
      if (errorNumberMatch) {
        const code = parseInt(errorNumberMatch[1], 10);
        const message = ERROR_CODES[code] || `Unknown error (${code})`;
        return { code, message };
      }

      // Look for instruction error
      const instructionErrorMatch = log.match(/Program.*failed: custom program error: 0x([0-9a-fA-F]+)/);
      if (instructionErrorMatch) {
        const code = parseInt(instructionErrorMatch[1], 16);
        const message = ERROR_CODES[code] || `Custom error 0x${instructionErrorMatch[1]}`;
        return { code, message };
      }

      // Look for generic error message
      if (log.includes("Error:") || log.includes("failed:")) {
        return { message: log };
      }
    }
    return { message: "Transaction simulation failed" };
  }

  /**
   * Simulate a transaction and return detailed results
   */
  async simulateTransaction(
    tx: Transaction | VersionedTransaction
  ): Promise<SimulationResult> {
    try {
      let response: SimulatedTransactionResponse;

      if (tx instanceof Transaction) {
        // Legacy transaction
        const { blockhash } = await this.connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = this.wallet?.publicKey;

        const result = await this.connection.simulateTransaction(tx);
        response = result.value;
      } else {
        // Versioned transaction
        const result = await this.connection.simulateTransaction(tx);
        response = result.value;
      }

      if (response.err) {
        const { code, message } = this.parseErrorFromLogs(response.logs || []);
        return {
          success: false,
          error: message,
          errorCode: code,
          logs: response.logs || [],
          unitsConsumed: response.unitsConsumed,
        };
      }

      return {
        success: true,
        logs: response.logs || [],
        unitsConsumed: response.unitsConsumed,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        logs: [],
      };
    }
  }

  /**
   * Build and simulate a method call without sending
   * Returns simulation result with parsed errors
   */
  async simulateMethod(
    methodName: string,
    args: unknown[],
    accounts?: Record<string, PublicKey | null>
  ): Promise<SimulationResult> {
    const { program } = this.getWalletAndProgram();

    try {
      // Build the instruction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const method = (program.methods as unknown as Record<string, (...args: any[]) => any>)[methodName](...args);
      if (accounts) {
        method.accountsPartial(accounts);
      }

      // Get the transaction
      const tx = await method.transaction();

      return this.simulateTransaction(tx);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        logs: [],
      };
    }
  }

  /**
   * Helper to run RPC with optional simulation first
   * Wraps Anchor's rpc() call with simulation check using Anchor's simulate()
   * @param forceSimulate - If true, always simulate regardless of simulateFirst setting
   */
  private async rpcWithSimulation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    methodBuilder: {
      simulate: () => Promise<any>;
      rpc: () => Promise<string>;
    },
    actionName: string,
    forceSimulate: boolean = false
  ): Promise<string> {
    console.log(`[SDK] rpcWithSimulation called: ${actionName}, simulateFirst=${this.simulateFirst}, forceSimulate=${forceSimulate}`);

    if (this.simulateFirst || forceSimulate) {
      console.log(`[Simulation] Running simulation for ${actionName}...`);
      try {
        const simResult = await methodBuilder.simulate();
        console.log(`[Simulation] ${actionName} passed`);
        if (simResult.raw && simResult.raw.length > 0) {
          // Log last few lines for debugging
          console.log("[Simulation] Logs:", simResult.raw.slice(-5).join("\n"));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Try to extract logs from the error
        let logs: string[] = [];
        if (err && typeof err === "object" && "logs" in err) {
          logs = (err as { logs: string[] }).logs || [];
        }
        if (logs.length === 0 && err && typeof err === "object" && "simulationResponse" in err) {
          const simResponse = (err as { simulationResponse: { logs?: string[] } }).simulationResponse;
          logs = simResponse?.logs || [];
        }

        // Check if the program actually succeeded despite simulate() throwing
        // This can happen when Anchor's simulate has type mismatches but the program ran fine
        const programSucceeded = logs.some(log =>
          log.includes(`Program ${this.programId.toBase58()} success`) ||
          log.includes("success")
        );

        if (programSucceeded) {
          console.warn(`[Simulation] ${actionName} threw but program succeeded, proceeding with RPC`);
          // Don't throw - proceed to RPC call
        } else {
          // Parse error from logs if available
          const parsedError = logs.length > 0 ? this.parseErrorFromLogs(logs) : { message: errorMessage };

          const errorMsg = `Simulation failed for ${actionName}: ${parsedError.message}`;
          console.error(errorMsg);
          if (logs.length > 0) {
            console.error("Logs:", logs.slice(-10).join("\n"));
          }
          throw new Error(errorMsg);
        }
      }
    }

    try {
      return await methodBuilder.rpc();
    } catch (rpcError) {
      // Log full error details for debugging
      console.error(`[RPC] ${actionName} failed:`, rpcError);

      // Try to extract and log transaction logs
      if (rpcError && typeof rpcError === "object") {
        const err = rpcError as Record<string, unknown>;
        if ("logs" in err && Array.isArray(err.logs)) {
          console.error(`[RPC] Transaction logs:`);
          err.logs.forEach((log: string, i: number) => console.error(`  ${i}: ${log}`));
        }
        if ("transactionLogs" in err && Array.isArray(err.transactionLogs)) {
          console.error(`[RPC] Transaction logs:`);
          err.transactionLogs.forEach((log: string, i: number) => console.error(`  ${i}: ${log}`));
        }
      }
      throw rpcError;
    }
  }

  // ===========================================================================
  // Protocol Config
  // ===========================================================================

  /**
   * Initialize protocol config (one-time setup by deployer)
   */
  async initializeConfig(): Promise<TransactionResult> {
    const { program } = this.getWalletAndProgram();
    const [protocolConfig] = this.pda.protocolConfig();

    const signature = await program.methods
      .initializeConfig()
      .rpc();

    return { signature, accounts: { protocolConfig } };
  }

  /**
   * Update treasury address (admin only)
   */
  async updateTreasury(newTreasury: PublicKey): Promise<TransactionResult> {
    const { program } = this.getWalletAndProgram();

    const signature = await program.methods
      .updateTreasury(newTreasury)
      .rpc();

    return { signature };
  }

  // ===========================================================================
  // Defender Pool
  // ===========================================================================

  /**
   * Create a defender pool with initial deposit and max bond setting
   */
  async createDefenderPool(initialAmount: BN, maxBond: BN = new BN(0)): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const [defenderPool] = this.pda.defenderPool(wallet.publicKey);

    const signature = await program.methods
      .createDefenderPool(initialAmount, maxBond)
      .rpc();

    return { signature, accounts: { defenderPool } };
  }

  /**
   * Deposit to defender pool
   */
  async depositDefenderPool(amount: BN): Promise<TransactionResult> {
    const { program } = this.getWalletAndProgram();

    const signature = await program.methods
      .depositDefenderPool(amount)
      .rpc();

    return { signature };
  }

  /**
   * Withdraw from defender pool
   */
  async withdrawDefenderPool(amount: BN): Promise<TransactionResult> {
    const { program } = this.getWalletAndProgram();

    const signature = await program.methods
      .withdrawDefenderPool(amount)
      .rpc();

    return { signature };
  }

  /**
   * Update max_bond setting for defender pool
   */
  async updateMaxBond(newMaxBond: BN): Promise<TransactionResult> {
    const { program } = this.getWalletAndProgram();

    const signature = await program.methods
      .updateMaxBond(newMaxBond)
      .rpc();

    return { signature };
  }

  // ===========================================================================
  // Subject Management
  // ===========================================================================

  /**
   * Create a subject with its associated Dispute and Escrow accounts
   * Creator's pool is linked automatically. If initialBond > 0, transfers from wallet.
   * Subject starts as Valid if pool.balance > 0 or initialBond > 0.
   */
  async createSubject(params: {
    subjectId: PublicKey;
    detailsCid: string;
    matchMode?: boolean;
    votingPeriod: BN;
    initialBond?: BN;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const [subject] = this.pda.subject(params.subjectId);
    const [dispute] = this.pda.dispute(params.subjectId);
    const [escrow] = this.pda.escrow(params.subjectId);
    const [defenderPool] = this.pda.defenderPool(wallet.publicKey);
    const [defenderRecord] = this.pda.defenderRecord(params.subjectId, wallet.publicKey, 0);

    const signature = await program.methods
      .createSubject(
        params.subjectId,
        params.detailsCid,
        params.matchMode ?? true,
        params.votingPeriod,
        params.initialBond ?? new BN(0)
      )
      .accountsPartial({
        creator: wallet.publicKey,
        subject,
        dispute,
        escrow,
        defenderPool,
        defenderRecord,
      })
      .rpc();

    return { signature, accounts: { subject, dispute, escrow, defenderPool, defenderRecord } };
  }

  /**
   * Add bond directly from wallet to a subject
   * Creates DefenderRecord for the current round
   * Also creates DefenderPool if it doesn't exist
   */
  async addBondDirect(
    subjectId: PublicKey,
    amount: BN
  ): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const subject = await this.fetchSubjectById(subjectId);
    if (!subject) throw new Error("Subject not found");

    console.log(`[SDK] addBondDirect: amount=${amount.toString()} lamports (${amount.toNumber() / 1e9} SOL)`);

    const [subjectPda] = this.pda.subject(subjectId);
    const [disputePda] = this.pda.dispute(subjectId);
    const [defenderRecord] = this.pda.defenderRecord(subjectId, wallet.publicKey, subject.round);
    const [defenderPool] = this.pda.defenderPool(wallet.publicKey);

    const methodBuilder = program.methods
      .addBondDirect(amount)
      .accountsPartial({
        defender: wallet.publicKey,
        subject: subjectPda,
        defenderRecord,
        defenderPool,
        dispute: disputePda,
      });

    const signature = await this.rpcWithSimulation(methodBuilder, "addBondDirect");

    return { signature, accounts: { defenderRecord } };
  }

  /**
   * Add bond from defender pool to a subject
   * Creates DefenderRecord for the current round
   */
  async addBondFromPool(
    subjectId: PublicKey,
    amount: BN
  ): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const subject = await this.fetchSubjectById(subjectId);
    if (!subject) throw new Error("Subject not found");

    const [subjectPda] = this.pda.subject(subjectId);
    const [disputePda] = this.pda.dispute(subjectId);
    const [defenderPool] = this.pda.defenderPool(wallet.publicKey);
    const [defenderRecord] = this.pda.defenderRecord(subjectId, wallet.publicKey, subject.round);

    const signature = await program.methods
      .addBondFromPool(amount)
      .accountsPartial({
        defender: wallet.publicKey,
        subject: subjectPda,
        defenderPool,
        defenderRecord,
        dispute: disputePda,
      })
      .rpc();

    return { signature, accounts: { defenderRecord } };
  }

  // ===========================================================================
  // Juror Management
  // ===========================================================================

  /**
   * Register as a juror with initial stake
   */
  async registerJuror(stakeAmount: BN): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const [jurorPool] = this.pda.jurorPool(wallet.publicKey);

    const signature = await program.methods
      .registerJuror(stakeAmount)
      .rpc();

    return { signature, accounts: { jurorPool } };
  }

  /**
   * Add more stake to juror account
   */
  async addJurorStake(amount: BN): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();

    const signature = await program.methods
      .addJurorStake(amount)
      .rpc();

    return { signature };
  }

  /**
   * Withdraw available stake from juror account
   */
  async withdrawJurorStake(amount: BN): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();

    const signature = await program.methods
      .withdrawJurorStake(amount)
      .rpc();

    return { signature };
  }

  /**
   * Unregister juror and withdraw all available stake
   */
  async unregisterJuror(): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();

    const signature = await program.methods.unregisterJuror().rpc();

    return { signature };
  }

  // ===========================================================================
  // Challenger Pool Management
  // ===========================================================================

  /**
   * Register as a challenger with initial stake
   */
  async registerChallenger(stakeAmount: BN): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const [challengerPool] = this.pda.challengerPool(wallet.publicKey);

    const signature = await program.methods
      .registerChallenger(stakeAmount)
      .rpc();

    return { signature, accounts: { challengerPool } };
  }

  /**
   * Add more stake to challenger pool
   */
  async addChallengerStake(amount: BN): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();

    const signature = await program.methods
      .addChallengerStake(amount)
      .rpc();

    return { signature };
  }

  /**
   * Withdraw available stake from challenger pool
   */
  async withdrawChallengerStake(amount: BN): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();

    const signature = await program.methods
      .withdrawChallengerStake(amount)
      .rpc();

    return { signature };
  }

  // ===========================================================================
  // Dispute Management
  // ===========================================================================

  /**
   * Create a new dispute against a subject
   * This initiates the dispute and creates a ChallengerRecord for the caller
   * Auto-pulls min(pool.balance, max_bond) from creator's defender pool
   */
  async createDispute(params: {
    subjectId: PublicKey;
    disputeType: DisputeType;
    detailsCid: string;
    stake: BN;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const subject = await this.fetchSubjectById(params.subjectId);
    if (!subject) throw new Error("Subject not found");

    const [subjectPda] = this.pda.subject(params.subjectId);
    const [disputePda] = this.pda.dispute(params.subjectId);
    const [escrowPda] = this.pda.escrow(params.subjectId);
    const [challengerRecord] = this.pda.challengerRecord(
      params.subjectId,
      wallet.publicKey,
      subject.round
    );
    const [challengerPool] = this.pda.challengerPool(wallet.publicKey);

    // Creator's defender pool and record for auto-matching
    const [creatorDefenderPool] = this.pda.defenderPool(subject.creator);
    const [creatorDefenderRecord] = this.pda.defenderRecord(
      params.subjectId,
      subject.creator,
      subject.round
    );

    const methodBuilder = program.methods
      .createDispute(params.disputeType, params.detailsCid, params.stake)
      .accountsPartial({
        challenger: wallet.publicKey,
        subject: subjectPda,
        dispute: disputePda,
        escrow: escrowPda,
        challengerRecord,
        challengerPool,
        creatorDefenderPool,
        creatorDefenderRecord,
      });

    const signature = await this.rpcWithSimulation(methodBuilder, "createDispute");

    return { signature, accounts: { challengerRecord } };
  }

  /**
   * Join an existing dispute as additional challenger
   */
  async joinChallengers(params: {
    subjectId: PublicKey;
    detailsCid: string;
    stake: BN;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const subject = await this.fetchSubjectById(params.subjectId);
    if (!subject) throw new Error("Subject not found");

    const [subjectPda] = this.pda.subject(params.subjectId);
    const [disputePda] = this.pda.dispute(params.subjectId);
    const [challengerRecord] = this.pda.challengerRecord(
      params.subjectId,
      wallet.publicKey,
      subject.round
    );
    const [challengerPool] = this.pda.challengerPool(wallet.publicKey);

    const signature = await program.methods
      .joinChallengers(params.detailsCid, params.stake)
      .accountsPartial({
        challenger: wallet.publicKey,
        subject: subjectPda,
        dispute: disputePda,
        challengerRecord,
        challengerPool,
      })
      .rpc();

    return { signature, accounts: { challengerRecord } };
  }

  /**
   * Submit a restoration request against an invalidated subject
   * Fees are collected during resolution from total pool
   */
  async submitRestore(params: {
    subjectId: PublicKey;
    disputeType: DisputeType;
    detailsCid: string;
    stakeAmount: BN;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();

    // Fetch subject to get current round (restore creates round + 1)
    const subject = await this.fetchSubjectById(params.subjectId);
    if (!subject) throw new Error("Subject not found");

    const [subjectPda] = this.pda.subject(params.subjectId);
    const [disputePda] = this.pda.dispute(params.subjectId);
    const [escrowPda] = this.pda.escrow(params.subjectId);
    // Challenger record uses next round (subject.round + 1)
    const [challengerRecord] = this.pda.challengerRecord(
      params.subjectId,
      wallet.publicKey,
      subject.round + 1
    );

    const methodBuilder = program.methods
      .submitRestore(params.disputeType, params.detailsCid, params.stakeAmount)
      .accountsPartial({
        restorer: wallet.publicKey,
        subject: subjectPda,
        dispute: disputePda,
        escrow: escrowPda,
        challengerRecord,
      });

    const signature = await this.rpcWithSimulation(methodBuilder, "submitRestore");

    return { signature, accounts: { challengerRecord } };
  }

  // ===========================================================================
  // Voting
  // ===========================================================================

  /**
   * Vote on a dispute
   * Creates a JurorRecord for the current round
   */
  async voteOnDispute(params: {
    subjectId: PublicKey;
    choice: VoteChoice;
    stakeAllocation: BN;
    rationaleCid?: string;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const subject = await this.fetchSubjectById(params.subjectId);
    if (!subject) throw new Error("Subject not found");

    const [subjectPda] = this.pda.subject(params.subjectId);
    const [disputePda] = this.pda.dispute(params.subjectId);
    const [jurorPool] = this.pda.jurorPool(wallet.publicKey);
    const [jurorRecord] = this.pda.jurorRecord(
      params.subjectId,
      wallet.publicKey,
      subject.round
    );

    const methodBuilder = program.methods
      .voteOnDispute(
        params.choice,
        params.stakeAllocation,
        params.rationaleCid ?? ""
      )
      .accountsPartial({
        juror: wallet.publicKey,
        subject: subjectPda,
        dispute: disputePda,
        jurorPool,
        jurorRecord,
      });

    const signature = await this.rpcWithSimulation(methodBuilder, "voteOnDispute");

    return { signature, accounts: { jurorRecord } };
  }

  /**
   * Vote on a restoration request
   * Creates a JurorRecord for the current round
   */
  async voteOnRestore(params: {
    subjectId: PublicKey;
    choice: RestoreVoteChoice;
    stakeAllocation: BN;
    rationaleCid?: string;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const subject = await this.fetchSubjectById(params.subjectId);
    if (!subject) throw new Error("Subject not found");

    const [subjectPda] = this.pda.subject(params.subjectId);
    const [disputePda] = this.pda.dispute(params.subjectId);
    const [jurorPool] = this.pda.jurorPool(wallet.publicKey);
    const [jurorRecord] = this.pda.jurorRecord(
      params.subjectId,
      wallet.publicKey,
      subject.round
    );

    const methodBuilder = program.methods
      .voteOnRestore(
        params.choice,
        params.stakeAllocation,
        params.rationaleCid ?? ""
      )
      .accountsPartial({
        juror: wallet.publicKey,
        subject: subjectPda,
        dispute: disputePda,
        jurorPool,
        jurorRecord,
      });

    const signature = await this.rpcWithSimulation(methodBuilder, "voteOnRestore");

    return { signature, accounts: { jurorRecord } };
  }

  /**
   * Add stake to an existing vote
   * Increases voting power on an existing JurorRecord
   */
  async addToVote(params: {
    subjectId: PublicKey;
    round: number;
    additionalStake: BN;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();

    const [subjectPda] = this.pda.subject(params.subjectId);
    const [disputePda] = this.pda.dispute(params.subjectId);
    const [jurorPool] = this.pda.jurorPool(wallet.publicKey);
    const [jurorRecord] = this.pda.jurorRecord(
      params.subjectId,
      wallet.publicKey,
      params.round
    );

    const methodBuilder = program.methods
      .addToVote(params.round, params.additionalStake)
      .accountsPartial({
        juror: wallet.publicKey,
        subject: subjectPda,
        dispute: disputePda,
        jurorPool,
        jurorRecord,
      });

    const signature = await this.rpcWithSimulation(methodBuilder, "addToVote");

    return { signature, accounts: { jurorRecord } };
  }

  // ===========================================================================
  // Resolution
  // ===========================================================================

  /**
   * Resolve a dispute after voting period ends (permissionless)
   * Optionally auto-rebonds from creator's pool if available
   */
  async resolveDispute(params: {
    subjectId: PublicKey;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();

    const [subjectPda] = this.pda.subject(params.subjectId);
    const [disputePda] = this.pda.dispute(params.subjectId);
    const [escrowPda] = this.pda.escrow(params.subjectId);
    const [protocolConfigPda] = this.pda.protocolConfig();

    // Fetch protocol config to get treasury address
    const protocolConfig = await program.account.protocolConfig.fetch(protocolConfigPda);

    // Fetch subject to get creator and current round for auto-rebond
    const subject = await program.account.subject.fetch(subjectPda);
    const creator = subject.creator;
    const nextRound = subject.round + 1; // After reset_for_next_round, round will be incremented

    // Check if creator has a defender pool
    const [creatorDefenderPoolPda] = this.pda.defenderPool(creator);
    let creatorDefenderPool: PublicKey | null = null;
    let creatorDefenderRecord: PublicKey | null = null;

    try {
      const pool = await program.account.defenderPool.fetch(creatorDefenderPoolPda);
      if (pool && pool.balance.toNumber() > 0) {
        // Pool exists and has balance, include it for auto-rebond
        creatorDefenderPool = creatorDefenderPoolPda;
        [creatorDefenderRecord] = this.pda.defenderRecord(params.subjectId, creator, nextRound);
      }
    } catch {
      // Pool doesn't exist, proceed without auto-rebond
    }

    const methodBuilder = program.methods
      .resolveDispute(nextRound)
      .accountsPartial({
        resolver: wallet.publicKey,
        subject: subjectPda,
        dispute: disputePda,
        escrow: escrowPda,
        protocolConfig: protocolConfigPda,
        treasury: protocolConfig.treasury,
        creatorDefenderPool,
        creatorDefenderRecord,
      });

    const signature = await this.rpcWithSimulation(methodBuilder, "resolveDispute");

    return { signature };
  }

  /**
   * Claim juror reward for a specific round
   */
  async claimJuror(params: {
    subjectId: PublicKey;
    round: number;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const [jurorPool] = this.pda.jurorPool(wallet.publicKey);
    const [jurorRecord] = this.pda.jurorRecord(params.subjectId, wallet.publicKey, params.round);

    const method = program.methods.claimJuror(params.round);

    const signature = await this.rpcWithSimulation(method, "claimJuror", true);

    return { signature, accounts: { jurorPool, jurorRecord } };
  }

  /**
   * Unlock juror stake after 7 days post-resolution
   * Returns the locked stake back to the juror pool
   */
  async unlockJurorStake(params: {
    subjectId: PublicKey;
    round: number;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const [subjectPda] = this.pda.subject(params.subjectId);
    const [escrowPda] = this.pda.escrow(params.subjectId);
    const [jurorPool] = this.pda.jurorPool(wallet.publicKey);
    const [jurorRecord] = this.pda.jurorRecord(params.subjectId, wallet.publicKey, params.round);

    const method = program.methods
      .unlockJurorStake(params.round)
      .accountsPartial({
        juror: wallet.publicKey,
        subject: subjectPda,
        escrow: escrowPda,
        jurorRecord,
        jurorPool,
      });

    const signature = await this.rpcWithSimulation(method, "unlockJurorStake", true);

    return { signature, accounts: { jurorPool, jurorRecord } };
  }

  /**
   * Claim challenger reward for a specific round (if dispute upheld)
   */
  async claimChallenger(params: {
    subjectId: PublicKey;
    round: number;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const [challengerPool] = this.pda.challengerPool(wallet.publicKey);
    const [challengerRecord] = this.pda.challengerRecord(params.subjectId, wallet.publicKey, params.round);

    const method = program.methods.claimChallenger(params.round);

    const signature = await this.rpcWithSimulation(method, "claimChallenger", true);

    return { signature, accounts: { challengerPool, challengerRecord } };
  }

  /**
   * Claim defender reward for a specific round (if dispute dismissed)
   */
  async claimDefender(params: {
    subjectId: PublicKey;
    round: number;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const [defenderPool] = this.pda.defenderPool(wallet.publicKey);
    const [defenderRecord] = this.pda.defenderRecord(params.subjectId, wallet.publicKey, params.round);

    const method = program.methods.claimDefender(params.round);

    const signature = await this.rpcWithSimulation(method, "claimDefender", true);

    return { signature, accounts: { defenderPool, defenderRecord } };
  }

  /**
   * Batch claim all available rewards in a single transaction
   * Combines juror, challenger, and defender claims
   */
  async batchClaimRewards(params: {
    jurorClaims?: Array<{
      subjectId: PublicKey;
      round: number;
    }>;
    challengerClaims?: Array<{
      subjectId: PublicKey;
      round: number;
    }>;
    defenderClaims?: Array<{
      subjectId: PublicKey;
      round: number;
    }>;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const instructions: TransactionInstruction[] = [];

    // Build juror claim instructions
    if (params.jurorClaims && params.jurorClaims.length > 0) {
      for (const claim of params.jurorClaims) {
        const [subjectPda] = this.pda.subject(claim.subjectId);
        const [escrowPda] = this.pda.escrow(claim.subjectId);
        const [jurorRecord] = this.pda.jurorRecord(claim.subjectId, wallet.publicKey, claim.round);
        const [jurorPool] = this.pda.jurorPool(wallet.publicKey);

        const ix = await program.methods
          .claimJuror(claim.round)
          .accountsPartial({
            juror: wallet.publicKey,
            subject: subjectPda,
            escrow: escrowPda,
            jurorRecord,
            jurorPool,
          })
          .instruction();
        instructions.push(ix);
      }
    }

    // Build challenger claim instructions
    if (params.challengerClaims && params.challengerClaims.length > 0) {
      for (const claim of params.challengerClaims) {
        const [subjectPda] = this.pda.subject(claim.subjectId);
        const [escrowPda] = this.pda.escrow(claim.subjectId);
        const [challengerRecord] = this.pda.challengerRecord(claim.subjectId, wallet.publicKey, claim.round);
        const [challengerPool] = this.pda.challengerPool(wallet.publicKey);

        const ix = await program.methods
          .claimChallenger(claim.round)
          .accountsPartial({
            challenger: wallet.publicKey,
            subject: subjectPda,
            escrow: escrowPda,
            challengerRecord,
            challengerPool,
          })
          .instruction();
        instructions.push(ix);
      }
    }

    // Build defender claim instructions
    if (params.defenderClaims && params.defenderClaims.length > 0) {
      for (const claim of params.defenderClaims) {
        const [subjectPda] = this.pda.subject(claim.subjectId);
        const [escrowPda] = this.pda.escrow(claim.subjectId);
        const [defenderRecord] = this.pda.defenderRecord(claim.subjectId, wallet.publicKey, claim.round);
        const [defenderPool] = this.pda.defenderPool(wallet.publicKey);

        const ix = await program.methods
          .claimDefender(claim.round)
          .accountsPartial({
            defender: wallet.publicKey,
            subject: subjectPda,
            escrow: escrowPda,
            defenderRecord,
            defenderPool,
          })
          .instruction();
        instructions.push(ix);
      }
    }

    if (instructions.length === 0) {
      throw new Error("No claims provided");
    }

    // Build and send transaction
    const tx = new Transaction().add(...instructions);

    // Simulate if enabled
    if (this.simulateFirst) {
      console.log(`[SDK] Simulating batch claim with ${instructions.length} instructions`);
      try {
        const { blockhash } = await this.connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = wallet.publicKey;
        const simulation = await this.connection.simulateTransaction(tx);
        if (simulation.value.err) {
          const errorMessage = this.parseErrorFromLogs(simulation.value.logs || []);
          throw new Error(`Simulation failed: ${errorMessage.message}`);
        }
        console.log("[SDK] Simulation succeeded");
      } catch (err: any) {
        if (err.message.includes("Simulation failed")) {
          throw err;
        }
        console.warn("[SDK] Simulation warning:", err.message);
      }
    }

    const signature = await program.provider.sendAndConfirm!(tx, []);
    console.log(`[SDK] Batch claim completed: ${instructions.length} claims in tx ${signature}`);

    return { signature };
  }

  // ===========================================================================
  // Cleanup Instructions (close records to reclaim rent)
  // ===========================================================================

  /**
   * Close juror record and reclaim rent (after reward claimed)
   */
  async closeJurorRecord(params: {
    subjectId: PublicKey;
    round: number;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const [jurorRecord] = this.pda.jurorRecord(params.subjectId, wallet.publicKey, params.round);

    const signature = await program.methods
      .closeJurorRecord(params.round)
      .rpc();

    return { signature };
  }

  /**
   * Close challenger record and reclaim rent (after reward claimed)
   */
  async closeChallengerRecord(params: {
    subjectId: PublicKey;
    round: number;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const [challengerRecord] = this.pda.challengerRecord(params.subjectId, wallet.publicKey, params.round);

    const signature = await program.methods
      .closeChallengerRecord(params.round)
      .rpc();

    return { signature };
  }

  /**
   * Close defender record and reclaim rent (after reward claimed)
   */
  async closeDefenderRecord(params: {
    subjectId: PublicKey;
    round: number;
  }): Promise<TransactionResult> {
    const { wallet, program } = this.getWalletAndProgram();
    const [defenderRecord] = this.pda.defenderRecord(params.subjectId, wallet.publicKey, params.round);

    const signature = await program.methods
      .closeDefenderRecord(params.round)
      .rpc();

    return { signature };
  }

  /**
   * Batch close multiple records in a single transaction.
   * Useful for reclaiming rent after claiming rewards.
   */
  async batchCloseRecords(
    records: Array<{
      type: "juror" | "challenger" | "defender";
      subjectId: PublicKey;
      round: number;
    }>
  ): Promise<{ signature: string; closedCount: number }> {
    const { wallet, program } = this.getWalletAndProgram();
    const instructions: TransactionInstruction[] = [];

    for (const record of records) {
      const [subjectPda] = this.pda.subject(record.subjectId);
      const [escrowPda] = this.pda.escrow(record.subjectId);

      switch (record.type) {
        case "juror": {
          const [jurorRecord] = this.pda.jurorRecord(
            record.subjectId,
            wallet.publicKey,
            record.round
          );
          const ix = await program.methods
            .closeJurorRecord(record.round)
            .accountsPartial({
              juror: wallet.publicKey,
              subject: subjectPda,
              escrow: escrowPda,
              jurorRecord,
            })
            .instruction();
          instructions.push(ix);
          break;
        }
        case "challenger": {
          const [challengerRecord] = this.pda.challengerRecord(
            record.subjectId,
            wallet.publicKey,
            record.round
          );
          const ix = await program.methods
            .closeChallengerRecord(record.round)
            .accountsPartial({
              challenger: wallet.publicKey,
              subject: subjectPda,
              escrow: escrowPda,
              challengerRecord,
            })
            .instruction();
          instructions.push(ix);
          break;
        }
        case "defender": {
          const [defenderRecord] = this.pda.defenderRecord(
            record.subjectId,
            wallet.publicKey,
            record.round
          );
          const ix = await program.methods
            .closeDefenderRecord(record.round)
            .accountsPartial({
              defender: wallet.publicKey,
              subject: subjectPda,
              escrow: escrowPda,
              defenderRecord,
            })
            .instruction();
          instructions.push(ix);
          break;
        }
      }
    }

    if (instructions.length === 0) {
      throw new Error("No valid records to close");
    }

    const tx = new Transaction().add(...instructions);
    const signature = await program.provider.sendAndConfirm!(tx, []);

    console.log(`[SDK] Batch close completed: ${instructions.length} records in tx ${signature}`);
    return { signature, closedCount: instructions.length };
  }

  // ===========================================================================
  // Account Fetchers
  // ===========================================================================

  /**
   * Fetch protocol config
   */
  async fetchProtocolConfig(): Promise<ProtocolConfig | null> {
    const [address] = this.pda.protocolConfig();
    try {
      return (await this.anchorProgram.account.protocolConfig.fetch(
        address
      )) as ProtocolConfig;
    } catch {
      return null;
    }
  }

  /**
   * Fetch defender pool by address
   */
  async fetchDefenderPool(address: PublicKey): Promise<DefenderPool | null> {
    try {
      return (await this.anchorProgram.account.defenderPool.fetch(
        address
      )) as DefenderPool;
    } catch (err) {
      // Only log actual errors, not "account doesn't exist"
      if (err instanceof Error && !err.message.includes("Account does not exist")) {
        console.error("[SDK] fetchDefenderPool error:", err.message);
      }
      return null;
    }
  }

  /**
   * Fetch defender pool by owner
   */
  async fetchDefenderPoolByOwner(owner: PublicKey): Promise<DefenderPool | null> {
    const [address] = this.pda.defenderPool(owner);
    return this.fetchDefenderPool(address);
  }

  /**
   * Fetch subject by address
   */
  async fetchSubject(address: PublicKey): Promise<Subject | null> {
    try {
      return (await this.anchorProgram.account.subject.fetch(
        address
      )) as Subject | null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch subject by subject ID
   */
  async fetchSubjectById(subjectId: PublicKey): Promise<Subject | null> {
    const [address] = this.pda.subject(subjectId);
    return this.fetchSubject(address);
  }

  /**
   * Fetch dispute by address
   */
  async fetchDispute(address: PublicKey): Promise<Dispute | null> {
    try {
      return (await this.anchorProgram.account.dispute.fetch(
        address
      )) as Dispute | null;
    } catch {
      return null;
    }
  }

  // NOTE: fetchEscrow removed - no escrow in simplified model

  /**
   * Fetch juror pool by address
   */
  async fetchJurorPool(address: PublicKey): Promise<JurorPool | null> {
    try {
      return (await this.anchorProgram.account.jurorPool.fetch(
        address
      )) as JurorPool | null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch juror pool by owner pubkey
   */
  async fetchJurorPoolByOwner(owner: PublicKey): Promise<JurorPool | null> {
    const [address] = this.pda.jurorPool(owner);
    return this.fetchJurorPool(address);
  }

  /**
   * Fetch escrow by address
   */
  async fetchEscrow(address: PublicKey): Promise<Escrow | null> {
    try {
      return (await this.anchorProgram.account.escrow.fetch(
        address
      )) as Escrow | null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch escrow by subject ID
   */
  async fetchEscrowBySubjectId(subjectId: PublicKey): Promise<Escrow | null> {
    const [address] = this.pda.escrow(subjectId);
    return this.fetchEscrow(address);
  }

  /**
   * Fetch juror record by address
   */
  async fetchJurorRecord(address: PublicKey): Promise<JurorRecord | null> {
    try {
      return (await this.anchorProgram.account.jurorRecord.fetch(
        address
      )) as JurorRecord | null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch juror record for a subject, juror, and round
   */
  async fetchJurorRecordBySubjectAndJuror(
    subjectId: PublicKey,
    juror: PublicKey,
    round: number
  ): Promise<JurorRecord | null> {
    const [address] = this.pda.jurorRecord(subjectId, juror, round);
    return this.fetchJurorRecord(address);
  }

  /**
   * Fetch challenger pool by address
   */
  async fetchChallengerPool(address: PublicKey): Promise<ChallengerPool | null> {
    try {
      return (await this.anchorProgram.account.challengerPool.fetch(
        address
      )) as ChallengerPool | null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch challenger pool by owner pubkey
   */
  async fetchChallengerPoolByOwner(owner: PublicKey): Promise<ChallengerPool | null> {
    const [address] = this.pda.challengerPool(owner);
    return this.fetchChallengerPool(address);
  }

  /**
   * Fetch challenger record by address
   */
  async fetchChallengerRecord(
    address: PublicKey
  ): Promise<ChallengerRecord | null> {
    try {
      return (await this.anchorProgram.account.challengerRecord.fetch(
        address
      )) as ChallengerRecord | null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch challenger record by subject, challenger, and round
   */
  async fetchChallengerRecordBySubject(
    subjectId: PublicKey,
    challenger: PublicKey,
    round: number
  ): Promise<ChallengerRecord | null> {
    const [address] = this.pda.challengerRecord(subjectId, challenger, round);
    return this.fetchChallengerRecord(address);
  }

  /**
   * Fetch defender record by address
   */
  async fetchDefenderRecord(address: PublicKey): Promise<DefenderRecord | null> {
    try {
      return (await this.anchorProgram.account.defenderRecord.fetch(
        address
      )) as DefenderRecord | null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch defender record by subject, defender, and round
   */
  async fetchDefenderRecordBySubject(
    subjectId: PublicKey,
    defender: PublicKey,
    round: number
  ): Promise<DefenderRecord | null> {
    const [address] = this.pda.defenderRecord(subjectId, defender, round);
    return this.fetchDefenderRecord(address);
  }

  // ===========================================================================
  // Bulk Fetchers
  // ===========================================================================

  /**
   * Fetch all defender pools
   */
  async fetchAllDefenderPools(): Promise<
    Array<{ publicKey: PublicKey; account: DefenderPool }>
  > {
        const accounts = await this.anchorProgram.account.defenderPool.all();
    return accounts as Array<{ publicKey: PublicKey; account: DefenderPool }>;
  }

  /**
   * Fetch all subjects
   */
  async fetchAllSubjects(): Promise<
    Array<{ publicKey: PublicKey; account: Subject }>
  > {
        const accounts = await this.anchorProgram.account.subject.all();
    return accounts as Array<{ publicKey: PublicKey; account: Subject }>;
  }

  /**
   * Fetch all disputes (V2: one dispute per subject)
   */
  async fetchAllDisputes(): Promise<
    Array<{ publicKey: PublicKey; account: Dispute }>
  > {
    const accounts = await this.anchorProgram.account.dispute.all();
    return accounts as Array<{ publicKey: PublicKey; account: Dispute }>;
  }

  /**
   * Fetch all juror pools
   */
  async fetchAllJurorPools(): Promise<
    Array<{ publicKey: PublicKey; account: JurorPool }>
  > {
    const accounts = await this.anchorProgram.account.jurorPool.all();
    return accounts as Array<{ publicKey: PublicKey; account: JurorPool }>;
  }

  /**
   * Fetch all challenger pools
   */
  async fetchAllChallengerPools(): Promise<
    Array<{ publicKey: PublicKey; account: ChallengerPool }>
  > {
    const accounts = await this.anchorProgram.account.challengerPool.all();
    return accounts as Array<{ publicKey: PublicKey; account: ChallengerPool }>;
  }

  /**
   * Fetch all escrows
   */
  async fetchAllEscrows(): Promise<
    Array<{ publicKey: PublicKey; account: Escrow }>
  > {
    const accounts = await this.anchorProgram.account.escrow.all();
    return accounts as Array<{ publicKey: PublicKey; account: Escrow }>;
  }

  /**
   * Fetch all juror records
   * Note: Uses raw account fetching to handle old accounts missing new fields
   */
  async fetchAllJurorRecords(): Promise<
    Array<{ publicKey: PublicKey; account: JurorRecord }>
  > {
    try {
      const accounts = await this.anchorProgram.account.jurorRecord.all();
      return accounts as Array<{ publicKey: PublicKey; account: JurorRecord }>;
    } catch (err) {
      // Handle old accounts that may be missing new fields (e.g., stakeUnlocked)
      console.warn("[fetchAllJurorRecords] Bulk fetch failed, trying individual fetch:", err);

      const gpaResult = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          { memcmp: { offset: 0, bytes: this.anchorProgram.account.jurorRecord.coder.accounts.memcmp("JurorRecord") } },
        ],
      });

      const validAccounts: Array<{ publicKey: PublicKey; account: JurorRecord }> = [];

      for (const { pubkey, account } of gpaResult) {
        try {
          const decoded = this.anchorProgram.coder.accounts.decode<JurorRecord>(
            "JurorRecord",
            account.data
          );
          validAccounts.push({ publicKey: pubkey, account: decoded });
        } catch (decodeErr) {
          console.warn(`[fetchAllJurorRecords] Skipping account ${pubkey.toBase58()}: ${decodeErr}`);
        }
      }

      return validAccounts;
    }
  }

  /**
   * Fetch all challenger records
   */
  async fetchAllChallengerRecords(): Promise<
    Array<{ publicKey: PublicKey; account: ChallengerRecord }>
  > {
    const accounts = await this.anchorProgram.account.challengerRecord.all();
    return accounts as Array<{ publicKey: PublicKey; account: ChallengerRecord }>;
  }

  /**
   * Fetch all defender records
   */
  async fetchAllDefenderRecords(): Promise<
    Array<{ publicKey: PublicKey; account: DefenderRecord }>
  > {
    const accounts = await this.anchorProgram.account.defenderRecord.all();
    return accounts as Array<{ publicKey: PublicKey; account: DefenderRecord }>;
  }

  /**
   * Fetch dispute by subject ID
   */
  async fetchDisputeBySubjectId(subjectId: PublicKey): Promise<Dispute | null> {
    const [address] = this.pda.dispute(subjectId);
    return this.fetchDispute(address);
  }

  /**
   * Fetch juror records by subject
   * Note: Uses raw account fetching to handle old accounts missing new fields
   */
  async fetchJurorRecordsBySubject(
    subjectId: PublicKey
  ): Promise<Array<{ publicKey: PublicKey; account: JurorRecord }>> {
    // JurorRecord layout: discriminator(8) + subject_id(32)
    try {
      const accounts = await this.anchorProgram.account.jurorRecord.all([
        { memcmp: { offset: 8, bytes: subjectId.toBase58() } },
      ]);
      return accounts as Array<{ publicKey: PublicKey; account: JurorRecord }>;
    } catch (err) {
      // Handle old accounts that may be missing new fields (e.g., stakeUnlocked)
      // This can cause "Invalid bool: 255" errors when Anchor reads garbage data
      console.warn("[fetchJurorRecordsBySubject] Bulk fetch failed, trying individual fetch:", err);

      // Fall back to fetching account addresses and deserializing one by one
      const gpaResult = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          { memcmp: { offset: 0, bytes: this.anchorProgram.account.jurorRecord.coder.accounts.memcmp("JurorRecord") } },
          { memcmp: { offset: 8, bytes: subjectId.toBase58() } },
        ],
      });

      const validAccounts: Array<{ publicKey: PublicKey; account: JurorRecord }> = [];

      for (const { pubkey, account } of gpaResult) {
        try {
          const decoded = this.anchorProgram.coder.accounts.decode<JurorRecord>(
            "JurorRecord",
            account.data
          );
          validAccounts.push({ publicKey: pubkey, account: decoded });
        } catch (decodeErr) {
          // Skip accounts that can't be decoded (old format)
          console.warn(`[fetchJurorRecordsBySubject] Skipping account ${pubkey.toBase58()}: ${decodeErr}`);
        }
      }

      return validAccounts;
    }
  }

  /**
   * Fetch challengers by subject
   */
  async fetchChallengersBySubject(
    subjectId: PublicKey
  ): Promise<Array<{ publicKey: PublicKey; account: ChallengerRecord }>> {
    // ChallengerRecord layout: discriminator(8) + subject_id(32)
    const accounts = await this.anchorProgram.account.challengerRecord.all([
      { memcmp: { offset: 8, bytes: subjectId.toBase58() } },
    ]);
    return accounts as Array<{
      publicKey: PublicKey;
      account: ChallengerRecord;
    }>;
  }

  /**
   * Fetch defenders by subject
   */
  async fetchDefendersBySubject(
    subjectId: PublicKey
  ): Promise<Array<{ publicKey: PublicKey; account: DefenderRecord }>> {
    // DefenderRecord layout: discriminator(8) + subject_id(32)
    const accounts = await this.anchorProgram.account.defenderRecord.all([
      { memcmp: { offset: 8, bytes: subjectId.toBase58() } },
    ]);
    return accounts as Array<{ publicKey: PublicKey; account: DefenderRecord }>;
  }

  /**
   * Fetch challenger records by subject (alias for fetchChallengersBySubject)
   */
  async fetchChallengerRecordsBySubject(
    subjectId: PublicKey
  ): Promise<Array<{ publicKey: PublicKey; account: ChallengerRecord }>> {
    return this.fetchChallengersBySubject(subjectId);
  }

  /**
   * Fetch defender records by subject (alias for fetchDefendersBySubject)
   */
  async fetchDefenderRecordsBySubject(
    subjectId: PublicKey
  ): Promise<Array<{ publicKey: PublicKey; account: DefenderRecord }>> {
    return this.fetchDefendersBySubject(subjectId);
  }

  // ===========================================================================
  // User Record Fetchers (for Collect All)
  // ===========================================================================

  /**
   * Fetch all juror records for a juror
   * Note: Uses raw account fetching to handle old accounts missing new fields
   */
  async fetchJurorRecordsByJuror(
    juror: PublicKey
  ): Promise<Array<{ publicKey: PublicKey; account: JurorRecord }>> {
    // JurorRecord layout: discriminator(8) + subject_id(32) + juror(32)
    try {
      const accounts = await this.anchorProgram.account.jurorRecord.all([
        { memcmp: { offset: 40, bytes: juror.toBase58() } },
      ]);
      return accounts as Array<{ publicKey: PublicKey; account: JurorRecord }>;
    } catch (err) {
      // Handle old accounts that may be missing new fields (e.g., stakeUnlocked)
      console.warn("[fetchJurorRecordsByJuror] Bulk fetch failed, trying individual fetch:", err);

      const gpaResult = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          { memcmp: { offset: 0, bytes: this.anchorProgram.account.jurorRecord.coder.accounts.memcmp("JurorRecord") } },
          { memcmp: { offset: 40, bytes: juror.toBase58() } },
        ],
      });

      const validAccounts: Array<{ publicKey: PublicKey; account: JurorRecord }> = [];

      for (const { pubkey, account } of gpaResult) {
        try {
          const decoded = this.anchorProgram.coder.accounts.decode<JurorRecord>(
            "JurorRecord",
            account.data
          );
          validAccounts.push({ publicKey: pubkey, account: decoded });
        } catch (decodeErr) {
          console.warn(`[fetchJurorRecordsByJuror] Skipping account ${pubkey.toBase58()}: ${decodeErr}`);
        }
      }

      return validAccounts;
    }
  }

  /**
   * Fetch all challenger records for a challenger
   */
  async fetchChallengerRecordsByChallenger(
    challenger: PublicKey
  ): Promise<Array<{ publicKey: PublicKey; account: ChallengerRecord }>> {
    // ChallengerRecord layout: discriminator(8) + subject_id(32) + challenger(32)
    const accounts = await this.anchorProgram.account.challengerRecord.all([
      { memcmp: { offset: 40, bytes: challenger.toBase58() } },
    ]);
    return accounts as Array<{ publicKey: PublicKey; account: ChallengerRecord }>;
  }

  /**
   * Fetch all defender records for a defender
   */
  async fetchDefenderRecordsByDefender(
    defender: PublicKey
  ): Promise<Array<{ publicKey: PublicKey; account: DefenderRecord }>> {
    // DefenderRecord layout: discriminator(8) + subject_id(32) + defender(32)
    const accounts = await this.anchorProgram.account.defenderRecord.all([
      { memcmp: { offset: 40, bytes: defender.toBase58() } },
    ]);
    return accounts as Array<{ publicKey: PublicKey; account: DefenderRecord }>;
  }

  // ===========================================================================
  // Collect All - Batch claim, unlock, and close (V2)
  // ===========================================================================

  /**
   * Scan all user records and return what's eligible for collection
   * TODO: Implement for V2 round-based design
   */
  async scanCollectableRecords(): Promise<{
    claims: {
      juror: Array<{ subjectId: PublicKey; round: number; jurorRecord: PublicKey }>;
      challenger: Array<{ subjectId: PublicKey; round: number; challengerRecord: PublicKey }>;
      defender: Array<{ subjectId: PublicKey; round: number; defenderRecord: PublicKey }>;
    };
    closes: {
      juror: Array<{ subjectId: PublicKey; round: number }>;
      challenger: Array<{ subjectId: PublicKey; round: number }>;
      defender: Array<{ subjectId: PublicKey; round: number }>;
    };
    totals: {
      estimatedRewards: number;
      estimatedRent: number;
    };
  }> {
    const { wallet } = this.getWalletAndProgram();
    const user = wallet.publicKey;

    // Fetch all user's records
    const [jurorRecords, challengerRecords, defenderRecords] = await Promise.all([
      this.fetchJurorRecordsByJuror(user),
      this.fetchChallengerRecordsByChallenger(user),
      this.fetchDefenderRecordsByDefender(user),
    ]);

    console.log("[scanCollectableRecords] Found records:", {
      jurorRecords: jurorRecords.length,
      challengerRecords: challengerRecords.length,
      defenderRecords: defenderRecords.length,
    });

    // Collect unique subject IDs to fetch their disputes
    const subjectIds = new Set<string>();
    for (const jr of jurorRecords) subjectIds.add(jr.account.subjectId.toBase58());
    for (const cr of challengerRecords) subjectIds.add(cr.account.subjectId.toBase58());
    for (const dr of defenderRecords) subjectIds.add(dr.account.subjectId.toBase58());

    // Fetch disputes to check resolution status and round
    const disputeInfoMap = new Map<string, { isResolved: boolean; round: number }>(); // subjectId -> info
    for (const subjectIdStr of subjectIds) {
      try {
        const subjectId = new PublicKey(subjectIdStr);
        const [disputePda] = this.pda.dispute(subjectId);
        const dispute = await this.fetchDispute(disputePda);
        if (dispute) {
          disputeInfoMap.set(subjectIdStr, {
            isResolved: "resolved" in dispute.status,
            round: dispute.round,
          });
        } else {
          disputeInfoMap.set(subjectIdStr, { isResolved: false, round: -1 });
        }
      } catch {
        disputeInfoMap.set(subjectIdStr, { isResolved: false, round: -1 });
      }
    }

    // Build results
    const claims = {
      juror: [] as Array<{ subjectId: PublicKey; round: number; jurorRecord: PublicKey }>,
      challenger: [] as Array<{ subjectId: PublicKey; round: number; challengerRecord: PublicKey }>,
      defender: [] as Array<{ subjectId: PublicKey; round: number; defenderRecord: PublicKey }>,
    };
    const closes = {
      juror: [] as Array<{ subjectId: PublicKey; round: number }>,
      challenger: [] as Array<{ subjectId: PublicKey; round: number }>,
      defender: [] as Array<{ subjectId: PublicKey; round: number }>,
    };
    let estimatedRewards = 0;
    let estimatedRent = 0;

    const RENT_PER_RECORD = 0.002 * 1e9; // ~0.002 SOL in lamports

    // Process juror records - only claimable if dispute is resolved AND round matches
    for (const jr of jurorRecords) {
      const disputeInfo = disputeInfoMap.get(jr.account.subjectId.toBase58());
      const isResolved = disputeInfo?.isResolved ?? false;
      const disputeRound = disputeInfo?.round ?? -1;
      const roundMatches = jr.account.round === disputeRound;

      console.log("[scanCollectableRecords] Juror record:", {
        subjectId: jr.account.subjectId.toBase58(),
        recordRound: jr.account.round,
        disputeRound,
        rewardClaimed: jr.account.rewardClaimed,
        stakeUnlocked: jr.account.stakeUnlocked,
        stakeAllocation: jr.account.stakeAllocation.toString(),
        isResolved,
        roundMatches,
      });

      if (!jr.account.rewardClaimed && isResolved && roundMatches) {
        console.log("[scanCollectableRecords] → Added to CLAIMS");
        claims.juror.push({
          subjectId: jr.account.subjectId,
          round: jr.account.round,
          jurorRecord: jr.publicKey,
        });
        estimatedRewards += 0.001 * 1e9; // placeholder
      } else if (jr.account.rewardClaimed &&
                 (jr.account.stakeUnlocked || jr.account.stakeAllocation.toNumber() === 0)) {
        // Only closeable if reward claimed AND stake is unlocked (or no stake was allocated)
        console.log("[scanCollectableRecords] → Added to CLOSES");
        closes.juror.push({
          subjectId: jr.account.subjectId,
          round: jr.account.round,
        });
        estimatedRent += RENT_PER_RECORD;
      } else {
        console.log("[scanCollectableRecords] → SKIPPED (claimed but stake locked, round mismatch, or not resolved)");
      }
    }

    // Process challenger records - only claimable if dispute is resolved AND round matches
    for (const cr of challengerRecords) {
      const disputeInfo = disputeInfoMap.get(cr.account.subjectId.toBase58());
      const isResolved = disputeInfo?.isResolved ?? false;
      const disputeRound = disputeInfo?.round ?? -1;
      const roundMatches = cr.account.round === disputeRound;

      if (!cr.account.rewardClaimed && isResolved && roundMatches) {
        claims.challenger.push({
          subjectId: cr.account.subjectId,
          round: cr.account.round,
          challengerRecord: cr.publicKey,
        });
        estimatedRewards += 0.001 * 1e9; // placeholder
      } else if (cr.account.rewardClaimed) {
        closes.challenger.push({
          subjectId: cr.account.subjectId,
          round: cr.account.round,
        });
        estimatedRent += RENT_PER_RECORD;
      }
      // If not resolved, round mismatch, or not claimed, it's an active challenge - skip
    }

    // Process defender records - only claimable if dispute is resolved AND round matches
    for (const dr of defenderRecords) {
      const disputeInfo = disputeInfoMap.get(dr.account.subjectId.toBase58());
      const isResolved = disputeInfo?.isResolved ?? false;
      const disputeRound = disputeInfo?.round ?? -1;
      const roundMatches = dr.account.round === disputeRound;

      console.log("[scanCollectableRecords] Defender record:", {
        subjectId: dr.account.subjectId.toBase58(),
        recordRound: dr.account.round,
        disputeRound,
        rewardClaimed: dr.account.rewardClaimed,
        isResolved,
        roundMatches,
      });

      // Only claimable if dispute is resolved AND this record is for that resolved round
      if (!dr.account.rewardClaimed && isResolved && roundMatches) {
        console.log("[scanCollectableRecords] → Added to CLAIMS");
        claims.defender.push({
          subjectId: dr.account.subjectId,
          round: dr.account.round,
          defenderRecord: dr.publicKey,
        });
        estimatedRewards += 0.001 * 1e9; // placeholder
      } else if (dr.account.rewardClaimed) {
        console.log("[scanCollectableRecords] → Added to CLOSES");
        closes.defender.push({
          subjectId: dr.account.subjectId,
          round: dr.account.round,
        });
        estimatedRent += RENT_PER_RECORD;
      } else {
        console.log("[scanCollectableRecords] → SKIPPED (round mismatch, not resolved, or already claimed)");
      }
    }

    return {
      claims,
      closes,
      totals: {
        estimatedRewards,
        estimatedRent,
      },
    };
  }

  /**
   * Execute collect all - claims rewards and closes records
   * TODO: Implement for V2 round-based design with claim instructions
   */
  async collectAll(): Promise<{
    signatures: string[];
    summary: {
      claimCount: number;
      closeCount: number;
    };
  }> {
    // V2 implementation pending - need to use claim_defender, claim_challenger, claim_juror
    console.warn("[collectAll] V2 implementation pending");
    return {
      signatures: [],
      summary: { claimCount: 0, closeCount: 0 },
    };
  }

  // ===========================================================================
  // Transaction History (for closed records)
  // ===========================================================================

  /**
   * Activity types that can be parsed from transaction history
   */
  static readonly ACTIVITY_TYPES = {
    VOTE: "vote",
    CHALLENGE: "challenge",
    DEFEND: "defend",
    CLAIM_JUROR: "claim_juror",
    CLAIM_CHALLENGER: "claim_challenger",
    CLAIM_DEFENDER: "claim_defender",
    CLOSE_VOTE: "close_vote",
    CLOSE_CHALLENGER: "close_challenger",
    CLOSE_DEFENDER: "close_defender",
    UNLOCK_STAKE: "unlock_stake",
  } as const;

  /**
   * Instruction discriminators (first 8 bytes of sha256("global:<instruction_name>"))
   */
  private static readonly INSTRUCTION_DISCRIMINATORS: Record<string, string> = {
    vote_on_dispute: "07d560abfc3b3717",
    vote_on_restore: "7a7b5cf0fbcdbd20",
    submit_dispute: "d40f5c9c6f3c6d3c", // Will need to verify
    resolve_dispute: "e706ca0660670ce6",
  };

  /**
   * Fetch transaction history for a user and parse ScaleCraft activity
   * This allows showing historical activity even for closed records
   */
  async fetchUserActivity(
    user: PublicKey,
    options?: {
      limit?: number;
      before?: string;
    }
  ): Promise<Array<{
    type: string;
    signature: string;
    timestamp: number;
    slot: number;
    dispute?: string;
    subject?: string;
    accounts?: string[]; // All account keys in the transaction for matching
    amount?: number;
    rentReclaimed?: number;
    voteChoice?: "ForChallenger" | "ForDefender" | "ForRestoration" | "AgainstRestoration";
    outcome?: "ChallengerWins" | "DefenderWins" | "NoParticipation";
    rationaleCid?: string;
    success: boolean;
  }>> {
    const activities: Array<{
      type: string;
      signature: string;
      timestamp: number;
      slot: number;
      dispute?: string;
      subject?: string;
      accounts?: string[];
      amount?: number;
      rentReclaimed?: number;
      voteChoice?: "ForChallenger" | "ForDefender" | "ForRestoration" | "AgainstRestoration";
      outcome?: "ChallengerWins" | "DefenderWins" | "NoParticipation";
      rationaleCid?: string;
      success: boolean;
    }> = [];

    try {
      // Get transaction signatures for the user
      const signatures = await this.connection.getSignaturesForAddress(
        user,
        {
          limit: options?.limit || 100,
          before: options?.before,
        }
      );

      // Filter for successful transactions and fetch details
      for (const sigInfo of signatures) {
        if (sigInfo.err) continue; // Skip failed transactions

        try {
          const tx = await this.connection.getParsedTransaction(sigInfo.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || !tx.meta) continue;

          // Check if this transaction involves our program
          const programInvoked = tx.transaction.message.accountKeys.some(
            (key) => key.pubkey.equals(this.programId)
          );

          if (!programInvoked) continue;

          // Parse the transaction logs to identify the instruction type
          const logs = tx.meta.logMessages || [];
          const activity = this.parseActivityFromLogs(logs, sigInfo.signature, tx, user);

          if (activity) {
            activities.push({
              ...activity,
              timestamp: sigInfo.blockTime || 0,
              slot: sigInfo.slot,
              success: true,
            });
          }
        } catch (err) {
          // Skip transactions we can't parse
          console.warn(`[fetchUserActivity] Failed to parse tx ${sigInfo.signature}:`, err);
        }
      }
    } catch (err) {
      console.error("[fetchUserActivity] Failed to fetch signatures:", err);
    }

    return activities;
  }

  // Pre-computed event discriminators: sha256("event:<EventName>")[0..8]
  // These are constants and don't change, so we avoid runtime crypto usage
  private static readonly EVENT_DISCRIMINATORS: Record<string, string> = {
    VoteEvent: "c347fa697877ea86",
    RestoreVoteEvent: "36daf12c5af7d2ee",
    DisputeCreatedEvent: "59a2309e1e7491f7",
    ChallengerJoinedEvent: "a35f6083ed61e523",
    RewardClaimedEvent: "f62bd7e45231e638",
    RecordClosedEvent: "7fc441d571b25037",
    DefenderStakedEvent: "03ba63387dd7d992",
  };

  /**
   * Parse activity type from transaction logs and Anchor events
   */
  private parseActivityFromLogs(
    logs: string[],
    signature: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    userPubkey: PublicKey
  ): {
    type: string;
    signature: string;
    dispute?: string;
    subject?: string;
    amount?: number;
    rentReclaimed?: number;
    voteChoice?: "ForChallenger" | "ForDefender" | "ForRestoration" | "AgainstRestoration";
    outcome?: "ChallengerWins" | "DefenderWins" | "NoParticipation";
    rationaleCid?: string;
  } | null {
    // Check if our program was invoked
    const hasProgram = logs.some(log => log.includes(this.programId.toBase58()));
    if (!hasProgram) return null;

    // Try to parse Anchor events from "Program data:" logs
    const eventData = this.parseAnchorEventsFromLogs(logs, userPubkey);
    if (eventData) {
      return { signature, ...eventData };
    }

    // Fallback: Extract accounts and balance changes from transaction
    const { dispute, subject } = this.extractAccountsFromTx(tx);
    const { received, sent, rentReclaimed } = this.extractBalanceChanges(tx, userPubkey);
    const voteDetails = this.extractVoteDetailsFromTx(tx);
    const outcome = this.inferOutcomeFromLogs(logs);

    // Parse instruction type from logs as fallback
    for (const log of logs) {
      if (log.includes("Instruction: VoteOnDispute")) {
        return {
          type: "vote",
          signature,
          dispute,
          amount: sent,
          voteChoice: voteDetails?.choice as "ForChallenger" | "ForDefender",
          rationaleCid: voteDetails?.rationaleCid,
        };
      }
      if (log.includes("Instruction: VoteOnRestore")) {
        return {
          type: "vote_restore",
          signature,
          dispute,
          amount: sent,
          voteChoice: voteDetails?.choice as "ForRestoration" | "AgainstRestoration",
          rationaleCid: voteDetails?.rationaleCid,
        };
      }
      if (log.includes("Instruction: SubmitDispute")) {
        return { type: "challenge", signature, dispute, amount: sent };
      }
      if (log.includes("Instruction: AddToDispute")) {
        return { type: "add_challenge", signature, dispute, amount: sent };
      }
      if (log.includes("Instruction: AddToStake")) {
        return { type: "defend", signature, subject, amount: sent };
      }
      if (log.includes("Instruction: CreateLinkedSubject")) {
        return { type: "create_subject", signature, subject };
      }
      if (log.includes("Instruction: ClaimJurorReward")) {
        return { type: "claim_juror", signature, dispute, amount: received, outcome };
      }
      if (log.includes("Instruction: ClaimChallengerReward")) {
        return { type: "claim_challenger", signature, dispute, amount: received, outcome: "ChallengerWins" };
      }
      if (log.includes("Instruction: ClaimDefenderReward")) {
        return { type: "claim_defender", signature, dispute, amount: received, outcome: "DefenderWins" };
      }
      if (log.includes("Instruction: CloseVoteRecord")) {
        return { type: "close_vote", signature, dispute, rentReclaimed };
      }
      if (log.includes("Instruction: CloseChallengerRecord")) {
        return { type: "close_challenger", signature, dispute, rentReclaimed };
      }
      if (log.includes("Instruction: CloseDefenderRecord")) {
        return { type: "close_defender", signature, subject, rentReclaimed };
      }
      if (log.includes("Instruction: UnlockJurorStake")) {
        return { type: "unlock_stake", signature, dispute };
      }
      if (log.includes("Instruction: ResolveDispute")) {
        return { type: "resolve", signature, dispute, outcome };
      }
    }

    return null;
  }

  /**
   * Parse Anchor events from "Program data:" logs
   * Events contain reliable dispute/subject keys and amounts
   * Uses browser-compatible methods (no Node.js Buffer methods)
   */
  private parseAnchorEventsFromLogs(
    logs: string[],
    userPubkey: PublicKey
  ): {
    type: string;
    dispute?: string;
    subject?: string;
    amount?: number;
    rentReclaimed?: number;
    voteChoice?: "ForChallenger" | "ForDefender" | "ForRestoration" | "AgainstRestoration";
    outcome?: "ChallengerWins" | "DefenderWins" | "NoParticipation";
    rationaleCid?: string;
  } | null {
    // Helper functions for browser compatibility
    const base64ToBytes = (base64: string): Uint8Array => {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    };

    const bytesToHex = (bytes: Uint8Array): string => {
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const readU64LE = (data: Uint8Array, offset: number): number => {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      // Read as two 32-bit values to avoid BigInt for simplicity
      const lo = view.getUint32(offset, true);
      const hi = view.getUint32(offset + 4, true);
      return lo + hi * 0x100000000;
    };

    const readU32LE = (data: Uint8Array, offset: number): number => {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      return view.getUint32(offset, true);
    };

    const bytesToUtf8 = (bytes: Uint8Array): string => {
      return new TextDecoder().decode(bytes);
    };

    try {
      for (const log of logs) {
        // Anchor events are logged as "Program data: <base64>"
        if (!log.startsWith("Program data: ")) continue;

        const base64Data = log.slice("Program data: ".length);
        const data = base64ToBytes(base64Data);

        // Need at least 8 bytes for discriminator
        if (data.length < 8) continue;

        const discriminator = bytesToHex(data.slice(0, 8));

        // Parse based on event type
        // Event format: 8-byte discriminator + borsh-serialized fields

        // VoteEvent: dispute (32) + juror (32) + choice (1) + stake_allocated (8) + voting_power (8) + rationale_cid (4+str) + timestamp (8)
        if (this.matchesEventName(discriminator, "VoteEvent")) {
          const dispute = new PublicKey(data.slice(8, 40)).toBase58();
          const juror = new PublicKey(data.slice(40, 72)).toBase58();

          // Only include if user is the juror
          if (juror !== userPubkey.toBase58()) continue;

          const choiceByte = data[72];
          const voteChoice = choiceByte === 0 ? "ForChallenger" : "ForDefender";
          const stakeAllocated = readU64LE(data, 73);

          // Extract rationale CID
          let rationaleCid: string | undefined;
          if (data.length > 89) {
            const cidLength = readU32LE(data, 89);
            if (cidLength > 0 && cidLength < 200 && data.length >= 93 + cidLength) {
              rationaleCid = bytesToUtf8(data.slice(93, 93 + cidLength));
            }
          }

          return {
            type: "vote",
            dispute,
            amount: stakeAllocated,
            voteChoice: voteChoice as "ForChallenger" | "ForDefender",
            rationaleCid,
          };
        }

        // RestoreVoteEvent: dispute (32) + juror (32) + choice (1) + stake_allocated (8) + ...
        if (this.matchesEventName(discriminator, "RestoreVoteEvent")) {
          const dispute = new PublicKey(data.slice(8, 40)).toBase58();
          const juror = new PublicKey(data.slice(40, 72)).toBase58();

          if (juror !== userPubkey.toBase58()) continue;

          const choiceByte = data[72];
          const voteChoice = choiceByte === 0 ? "ForRestoration" : "AgainstRestoration";
          const stakeAllocated = readU64LE(data, 73);

          return {
            type: "vote_restore",
            dispute,
            amount: stakeAllocated,
            voteChoice: voteChoice as "ForRestoration" | "AgainstRestoration",
          };
        }

        // DisputeCreatedEvent: dispute (32) + subject (32) + challenger (32) + ...
        if (this.matchesEventName(discriminator, "DisputeCreatedEvent")) {
          const dispute = new PublicKey(data.slice(8, 40)).toBase58();
          const subject = new PublicKey(data.slice(40, 72)).toBase58();
          const challenger = new PublicKey(data.slice(72, 104)).toBase58();

          if (challenger !== userPubkey.toBase58()) continue;

          // Skip dispute_type enum (1 byte), read details_cid string, then bond (u64)
          // Format: dispute_type (1) + details_cid (4+str) + bond (8) + ...
          let offset = 104;
          offset += 1; // dispute_type enum

          const cidLength = readU32LE(data, offset);
          offset += 4 + cidLength;

          const bond = readU64LE(data, offset);

          return {
            type: "challenge",
            dispute,
            subject,
            amount: bond,
          };
        }

        // ChallengerJoinedEvent: dispute (32) + challenger (32) + bond (8) + ...
        if (this.matchesEventName(discriminator, "ChallengerJoinedEvent")) {
          const dispute = new PublicKey(data.slice(8, 40)).toBase58();
          const challenger = new PublicKey(data.slice(40, 72)).toBase58();

          if (challenger !== userPubkey.toBase58()) continue;

          const bond = readU64LE(data, 72);

          return {
            type: "add_challenge",
            dispute,
            amount: bond,
          };
        }

        // RewardClaimedEvent: dispute (32) + recipient (32) + reward_type (1) + amount (8) + ...
        if (this.matchesEventName(discriminator, "RewardClaimedEvent")) {
          const dispute = new PublicKey(data.slice(8, 40)).toBase58();
          const recipient = new PublicKey(data.slice(40, 72)).toBase58();

          if (recipient !== userPubkey.toBase58()) continue;

          const rewardType = data[72]; // 0=Juror, 1=Challenger, 2=Defender, 3=Restorer
          const amount = readU64LE(data, 73);

          const typeMap: Record<number, string> = {
            0: "claim_juror",
            1: "claim_challenger",
            2: "claim_defender",
            3: "claim_restorer",
          };

          return {
            type: typeMap[rewardType] || "claim_unknown",
            dispute,
            amount,
          };
        }

        // RecordClosedEvent: dispute (32) + record_owner (32) + record_type (1) + rent_returned (8) + ...
        if (this.matchesEventName(discriminator, "RecordClosedEvent")) {
          const dispute = new PublicKey(data.slice(8, 40)).toBase58();
          const recordOwner = new PublicKey(data.slice(40, 72)).toBase58();

          if (recordOwner !== userPubkey.toBase58()) continue;

          const recordType = data[72]; // 0=Vote, 1=Challenger, 2=Defender
          const rentReturned = readU64LE(data, 73);

          const typeMap: Record<number, string> = {
            0: "close_vote",
            1: "close_challenger",
            2: "close_defender",
          };

          return {
            type: typeMap[recordType] || "close_unknown",
            dispute,
            rentReclaimed: rentReturned,
          };
        }

        // DefenderStakedEvent: subject (32) + defender (32) + stake_amount (8) + ...
        if (this.matchesEventName(discriminator, "DefenderStakedEvent")) {
          const subject = new PublicKey(data.slice(8, 40)).toBase58();
          const defender = new PublicKey(data.slice(40, 72)).toBase58();

          if (defender !== userPubkey.toBase58()) continue;

          const stakeAmount = readU64LE(data, 72);

          return {
            type: "defend",
            subject,
            amount: stakeAmount,
          };
        }
      }
    } catch (err) {
      // Fall back to instruction-based parsing
      console.warn("[parseAnchorEventsFromLogs] Error parsing events:", err);
    }

    return null;
  }

  /**
   * Check if a discriminator matches an event name
   * Uses pre-computed EVENT_DISCRIMINATORS to avoid crypto dependency
   */
  private matchesEventName(discriminator: string, eventName: string): boolean {
    const expected = ScaleCraftClient.EVENT_DISCRIMINATORS[eventName];
    return expected ? discriminator === expected : false;
  }

  /**
   * Extract vote choice and rationale from instruction data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractVoteDetailsFromTx(tx: any): { choice?: string; rationaleCid?: string } | null {
    try {
      const instructions = tx.transaction.message.instructions;
      for (const ix of instructions) {
        // Check if this is our program's instruction
        const programId = tx.transaction.message.accountKeys[ix.programIdIndex];
        const programKey = programId?.pubkey?.toBase58?.() || programId?.toBase58?.();
        if (programKey !== this.programId.toBase58()) continue;

        // Decode the instruction data
        const data = Buffer.from(ix.data, "base64");
        if (data.length < 9) continue; // Need at least discriminator + 1 byte

        const discriminator = data.slice(0, 8).toString("hex");

        // Check if it's a vote instruction
        if (discriminator === "07d560abfc3b3717") {
          // vote_on_dispute: choice (1 byte enum) + stake_allocation (8 bytes) + rationale_cid (string)
          const choiceByte = data[8];
          const choice = choiceByte === 0 ? "ForChallenger" : "ForDefender";

          // Try to extract CID (after 8 byte discriminator + 1 byte choice + 8 byte stake)
          if (data.length > 17) {
            const cidLength = data.readUInt32LE(17);
            if (cidLength > 0 && cidLength < 100 && data.length >= 21 + cidLength) {
              const rationaleCid = data.slice(21, 21 + cidLength).toString("utf8");
              return { choice, rationaleCid };
            }
          }
          return { choice };
        }

        if (discriminator === "7a7b5cf0fbcdbd20") {
          // vote_on_restore: choice (1 byte enum) + stake_allocation (8 bytes) + rationale_cid (string)
          const choiceByte = data[8];
          const choice = choiceByte === 0 ? "ForRestoration" : "AgainstRestoration";

          if (data.length > 17) {
            const cidLength = data.readUInt32LE(17);
            if (cidLength > 0 && cidLength < 100 && data.length >= 21 + cidLength) {
              const rationaleCid = data.slice(21, 21 + cidLength).toString("utf8");
              return { choice, rationaleCid };
            }
          }
          return { choice };
        }
      }
    } catch (err) {
      // Ignore parsing errors
    }
    return null;
  }

  /**
   * Try to infer dispute outcome from transaction logs
   */
  private inferOutcomeFromLogs(logs: string[]): "ChallengerWins" | "DefenderWins" | "NoParticipation" | undefined {
    for (const log of logs) {
      if (log.includes("ChallengerWins") || log.includes("challenger wins") || log.includes("challenger_wins")) {
        return "ChallengerWins";
      }
      if (log.includes("DefenderWins") || log.includes("defender wins") || log.includes("defender_wins")) {
        return "DefenderWins";
      }
      if (log.includes("NoParticipation") || log.includes("no participation") || log.includes("no_participation")) {
        return "NoParticipation";
      }
    }
    return undefined;
  }

  /**
   * Extract dispute and subject pubkeys from transaction accounts
   *
   * Account layout for most ScaleCraft instructions:
   * [0] signer (user)
   * [1] user's main account (juror_account, challenger_account, etc.)
   * [2] dispute PDA
   * [3] record PDA (vote_record, challenger_record, etc.)
   * [4] subject PDA
   * [5+] other accounts (system_program, etc.)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractAccountsFromTx(tx: any): { dispute?: string; subject?: string } {
    try {
      const accounts = tx.transaction.message.accountKeys;
      const result: { dispute?: string; subject?: string } = {};

      // Known system accounts to skip
      const systemAccounts = new Set([
        "11111111111111111111111111111111", // System Program
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // Token Program
        "SysvarRent111111111111111111111111111111111", // Rent Sysvar
        "SysvarC1ock11111111111111111111111111111111", // Clock Sysvar
        this.programId.toBase58(),
      ]);

      // Get only writable accounts (PDAs are usually writable)
      const writableAccounts: string[] = [];

      for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i];
        const key = acc.pubkey?.toBase58?.() || acc.toBase58?.();
        if (!key) continue;

        // Skip system accounts
        if (systemAccounts.has(key)) continue;

        // Skip the signer (first account is usually the payer/user)
        if (acc.signer) continue;

        // Check if account balance changed (indicates it was written to)
        const preBalance = tx.meta?.preBalances?.[i] || 0;
        const postBalance = tx.meta?.postBalances?.[i] || 0;

        // Collect writable non-system accounts
        if (preBalance !== postBalance || acc.writable) {
          writableAccounts.push(key);
        }
      }

      // For most instructions:
      // - First writable non-signer account is user's main account (juror_account, etc.)
      // - Second is dispute PDA
      // - Third is record PDA (vote_record, etc.)
      // - Fourth might be subject PDA
      if (writableAccounts.length >= 2) {
        result.dispute = writableAccounts[1]; // Second writable is usually dispute
      }
      if (writableAccounts.length >= 4) {
        result.subject = writableAccounts[3]; // Fourth might be subject
      }

      // Fallback: if we didn't find enough writable accounts, use all non-system accounts
      if (!result.dispute) {
        const nonSystemAccounts: string[] = [];
        for (let i = 0; i < accounts.length; i++) {
          const acc = accounts[i];
          const key = acc.pubkey?.toBase58?.() || acc.toBase58?.();
          if (!key) continue;
          if (systemAccounts.has(key)) continue;
          if (acc.signer) continue;
          nonSystemAccounts.push(key);
        }

        // Skip first (user's account), take second (dispute)
        if (nonSystemAccounts.length >= 2) {
          result.dispute = nonSystemAccounts[1];
        }
        if (nonSystemAccounts.length >= 4) {
          result.subject = nonSystemAccounts[3];
        }
      }

      return result;
    } catch {
      return {};
    }
  }

  /**
   * Extract balance changes for the user from transaction
   */
  private extractBalanceChanges(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    userPubkey: PublicKey
  ): { received: number; sent: number; rentReclaimed: number } {
    try {
      const accounts = tx.transaction.message.accountKeys;
      const preBalances = tx.meta?.preBalances || [];
      const postBalances = tx.meta?.postBalances || [];

      let received = 0;
      let sent = 0;
      let rentReclaimed = 0;

      // Find user's account index
      for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i];
        const key = acc.pubkey?.toBase58?.() || acc.toBase58?.();
        if (key === userPubkey.toBase58()) {
          const pre = preBalances[i] || 0;
          const post = postBalances[i] || 0;
          const diff = post - pre;

          if (diff > 0) {
            received = diff;
          } else if (diff < 0) {
            sent = Math.abs(diff);
          }
          break;
        }
      }

      // Check for closed accounts (rent reclaimed)
      // Accounts that went from having balance to 0
      for (let i = 0; i < accounts.length; i++) {
        const pre = preBalances[i] || 0;
        const post = postBalances[i] || 0;
        if (pre > 0 && post === 0) {
          rentReclaimed += pre;
        }
      }

      return { received, sent, rentReclaimed };
    } catch {
      return { received: 0, sent: 0, rentReclaimed: 0 };
    }
  }

  // ===========================================================================
  // Batch Fetching - Single RPC call for multiple accounts
  // ===========================================================================

  /**
   * Account types that can be batch fetched
   */
  static readonly ACCOUNT_TYPES = [
    "dispute",
    "escrow",
    "jurorRecord",
    "challengerRecord",
    "defenderRecord",
    "jurorPool",
    "challengerPool",
    "defenderPool",
    "subject",
  ] as const;

  /**
   * Batch fetch multiple accounts in a single RPC call
   *
   * @example
   * ```ts
   * const results = await client.fetchMultiple([
   *   { address: disputePda, type: "dispute" },
   *   { address: escrowPda, type: "escrow" },
   *   { address: jurorRecordPda, type: "jurorRecord" },
   * ]);
   * // results[0] is Dispute | null
   * // results[1] is Escrow | null
   * // results[2] is JurorRecord | null
   * ```
   */
  async fetchMultiple<T extends { address: PublicKey; type: string }[]>(
    requests: T
  ): Promise<Array<any | null>> {
    if (requests.length === 0) return [];

    // Fetch all accounts in one RPC call
    const addresses = requests.map(r => r.address);
    const accountInfos = await this.connection.getMultipleAccountsInfo(addresses);

    // Decode each account based on its type
    return accountInfos.map((info, i) => {
      if (!info || !info.data) return null;

      const { type } = requests[i];
      try {
        // Map type string to Anchor account name (capitalize first letter)
        const anchorName = type.charAt(0).toUpperCase() + type.slice(1);
        return this.anchorProgram.coder.accounts.decode(anchorName, info.data);
      } catch (err) {
        // Account doesn't match expected type or decode failed
        return null;
      }
    });
  }

  /**
   * Batch fetch for modal - fetches all required data in minimal RPC calls
   *
   * This is optimized for the SubjectModal use case where we need:
   * - Dispute (current round)
   * - Escrow
   * - User's records (juror, challenger, defender) for current round
   *
   * @returns Object with all fetched data, nulls for missing accounts
   */
  async fetchModalData(
    subjectId: PublicKey,
    disputeRound: number,
    userPubkey?: PublicKey | null
  ): Promise<{
    dispute: Dispute | null;
    escrow: Escrow | null;
    jurorRecord: JurorRecord | null;
    challengerRecord: ChallengerRecord | null;
    defenderRecord: DefenderRecord | null;
  }> {
    // Calculate all PDAs upfront
    const [disputePda] = this.pda.dispute(subjectId);
    const [escrowPda] = this.pda.escrow(subjectId);

    // Build request list
    const requests: Array<{ address: PublicKey; type: string }> = [
      { address: disputePda, type: "dispute" },
      { address: escrowPda, type: "escrow" },
    ];

    // Add user record PDAs if wallet connected
    let jurorIdx = -1, challengerIdx = -1, defenderIdx = -1;
    if (userPubkey) {
      jurorIdx = requests.length;
      const [jurorPda] = this.pda.jurorRecord(subjectId, userPubkey, disputeRound);
      requests.push({ address: jurorPda, type: "jurorRecord" });

      challengerIdx = requests.length;
      const [challengerPda] = this.pda.challengerRecord(subjectId, userPubkey, disputeRound);
      requests.push({ address: challengerPda, type: "challengerRecord" });

      defenderIdx = requests.length;
      const [defenderPda] = this.pda.defenderRecord(subjectId, userPubkey, disputeRound);
      requests.push({ address: defenderPda, type: "defenderRecord" });
    }

    // Single RPC call for all accounts
    const results = await this.fetchMultiple(requests);

    return {
      dispute: results[0] as Dispute | null,
      escrow: results[1] as Escrow | null,
      jurorRecord: jurorIdx >= 0 ? (results[jurorIdx] as JurorRecord | null) : null,
      challengerRecord: challengerIdx >= 0 ? (results[challengerIdx] as ChallengerRecord | null) : null,
      defenderRecord: defenderIdx >= 0 ? (results[defenderIdx] as DefenderRecord | null) : null,
    };
  }
}
