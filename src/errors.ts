import {
  Connection,
  Transaction,
  VersionedTransaction,
  SendTransactionError,
} from "@solana/web3.js";
import { AnchorError, ProgramError } from "@coral-xyz/anchor";

// Program error codes from IDL (must match programs/scalecraft/src/errors/mod.rs)
const PROGRAM_ERRORS: Record<number, { name: string; message: string }> = {
  6000: { name: "Unauthorized", message: "You are not authorized to perform this action" },
  6001: { name: "InvalidConfig", message: "Invalid configuration parameter" },
  // Stake errors
  6002: { name: "StakeBelowMinimum", message: "Stake amount is below the minimum required" },
  6003: { name: "InsufficientAvailableStake", message: "You don't have enough available stake" },
  6004: { name: "InsufficientHeldStake", message: "Insufficient held stake for this operation" },
  6005: { name: "StakeStillLocked", message: "Your stake is still locked (7 days after resolution)" },
  6006: { name: "StakeAlreadyUnlocked", message: "This stake has already been unlocked" },
  // Bond errors
  6007: { name: "BondBelowMinimum", message: "Bond amount is below the minimum required" },
  6008: { name: "BondExceedsAvailable", message: "Bond amount exceeds your available stake" },
  // Subject errors
  6009: { name: "SubjectCannotBeStaked", message: "This subject cannot accept additional stakes" },
  6010: { name: "SubjectCannotBeDisputed", message: "This subject cannot be disputed at this time" },
  6011: { name: "SubjectCannotBeRestored", message: "This subject cannot be restored at this time" },
  // Restoration errors
  6012: { name: "RestoreStakeBelowMinimum", message: "Restore stake must match previous dispute total" },
  6013: { name: "NotARestore", message: "This dispute is not a restoration request" },
  // Dispute errors
  6014: { name: "CannotSelfDispute", message: "You cannot dispute your own subject" },
  6015: { name: "DisputeAlreadyExists", message: "A dispute already exists for this subject" },
  6016: { name: "DisputeNotFound", message: "The dispute was not found" },
  6017: { name: "DisputeAlreadyResolved", message: "This dispute has already been resolved" },
  6018: { name: "VotingNotEnded", message: "The voting period has not ended yet" },
  6019: { name: "VotingEnded", message: "The voting period has already ended" },
  // Vote errors
  6020: { name: "CannotVoteOnOwnDispute", message: "You cannot vote on your own dispute" },
  6021: { name: "AlreadyVoted", message: "You have already voted on this dispute" },
  6022: { name: "VoteAllocationBelowMinimum", message: "Vote stake allocation is below the minimum" },
  6023: { name: "InvalidVoteChoice", message: "Invalid vote choice" },
  // Juror errors
  6024: { name: "JurorNotActive", message: "You must be an active juror to perform this action" },
  6025: { name: "JurorAlreadyRegistered", message: "You are already registered as a juror" },
  // Challenger errors
  6026: { name: "ChallengerNotFound", message: "Challenger record not found" },
  // Reward errors
  6027: { name: "RewardAlreadyClaimed", message: "This reward has already been claimed" },
  6028: { name: "RewardNotClaimed", message: "You must claim your reward first" },
  6029: { name: "NotEligibleForReward", message: "You are not eligible for this reward" },
  6030: { name: "ReputationAlreadyProcessed", message: "Reputation has already been processed for this vote" },
  // Math errors
  6031: { name: "ArithmeticOverflow", message: "Calculation error: arithmetic overflow" },
  6032: { name: "DivisionByZero", message: "Calculation error: division by zero" },
  // Escrow errors
  6033: { name: "ClaimsNotComplete", message: "Not all claims have been processed" },
};

// Common Solana/Anchor errors with user-friendly messages
const ANCHOR_ERRORS: Record<string, string> = {
  "AccountNotInitialized": "Protocol not initialized. Please contact the administrator.",
  "AccountDidNotDeserialize": "Invalid account data. The account may be corrupted.",
  "AccountDidNotSerialize": "Failed to save account data.",
  "AccountOwnedByWrongProgram": "Account belongs to a different program.",
  "InvalidProgramId": "Invalid program ID.",
  "InvalidProgramExecutable": "Program is not executable.",
  "AccountMismatch": "Account does not match expected address.",
  "expected this account to be already initialized": "Protocol not initialized. Please contact the administrator.",
  "ConstraintMut": "Account is not mutable.",
  "ConstraintHasOne": "Account constraint violated.",
  "ConstraintSigner": "Missing required signature.",
  "ConstraintRaw": "Constraint check failed.",
  "ConstraintOwner": "Account owner mismatch.",
  "ConstraintSeeds": "PDA seeds mismatch.",
};

// Common Solana errors
const SOLANA_ERRORS: Record<string, string> = {
  "Blockhash not found": "Transaction expired. Please try again.",
  "insufficient lamports": "Insufficient SOL balance to complete this transaction",
  "insufficient funds": "Insufficient SOL balance to complete this transaction",
  "Transaction simulation failed": "Transaction simulation failed",
  "Account not found": "Required account not found on chain",
  "Account does not exist": "Required account not found on chain",
  "custom program error": "Program execution error",
  "already in use": "This account is already in use",
  "Transaction was not confirmed": "Transaction was not confirmed. Please try again.",
  "block height exceeded": "Transaction expired. Please try again.",
  "Wallet not connected": "Please connect your wallet to continue",
  "Wallet disconnected": "Wallet disconnected. Please reconnect to continue",
  "User rejected": "Transaction was cancelled",
};

export interface TransactionError {
  code: number | null;
  name: string;
  message: string;
  raw?: string;
  logs?: string[];
}

export interface SimulationResult {
  success: boolean;
  error?: TransactionError;
  logs?: string[];
  unitsConsumed?: number;
}

/**
 * Parse error code from various error formats
 */
function extractErrorCode(input: string | object): number | null {
  if (typeof input === "string") {
    // Try hex format: 0x1770 (6000 in decimal)
    const hexMatch = input.match(/0x([0-9a-fA-F]+)/);
    if (hexMatch) {
      const code = parseInt(hexMatch[1], 16);
      if (code >= 6000 && code <= 6100) return code;
    }

    // Try decimal format
    const decMatch = input.match(/\b(6\d{3})\b/);
    if (decMatch) {
      return parseInt(decMatch[1], 10);
    }

    // Try "custom program error: 0x..." format
    const customMatch = input.match(/custom program error: 0x([0-9a-fA-F]+)/i);
    if (customMatch) {
      return parseInt(customMatch[1], 16);
    }
  }

  if (typeof input === "object" && input !== null) {
    // Handle { InstructionError: [index, { Custom: code }] }
    if ("InstructionError" in input) {
      const [, instructionError] = (input as any).InstructionError;
      if (typeof instructionError === "object" && "Custom" in instructionError) {
        return instructionError.Custom;
      }
    }
  }

  return null;
}

/**
 * Parse an error from transaction simulation or execution
 */
export function parseTransactionError(error: unknown): TransactionError {
  // Handle Anchor errors
  if (error instanceof AnchorError) {
    const errorCode = error.error.errorCode.number;
    const programError = PROGRAM_ERRORS[errorCode];
    if (programError) {
      return {
        code: errorCode,
        name: programError.name,
        message: programError.message,
        raw: error.message,
        logs: error.logs,
      };
    }
    return {
      code: errorCode,
      name: error.error.errorCode.code,
      message: error.error.errorMessage || error.message,
      raw: error.message,
      logs: error.logs,
    };
  }

  // Handle ProgramError
  if (error instanceof ProgramError) {
    const programError = PROGRAM_ERRORS[error.code];
    if (programError) {
      return {
        code: error.code,
        name: programError.name,
        message: programError.message,
        raw: error.message,
      };
    }
    return {
      code: error.code,
      name: "ProgramError",
      message: error.msg || error.message,
      raw: error.message,
    };
  }

  // Handle SendTransactionError
  if (error instanceof SendTransactionError) {
    const errorMsg = error.message;
    const logs = (error as any).logs as string[] | undefined;

    // Try to extract error code
    const errorCode = extractErrorCode(errorMsg);
    if (errorCode !== null) {
      const programError = PROGRAM_ERRORS[errorCode];
      if (programError) {
        return {
          code: errorCode,
          name: programError.name,
          message: programError.message,
          raw: errorMsg,
          logs,
        };
      }
    }

    // Check logs for error code
    if (logs) {
      for (const log of logs) {
        const logErrorCode = extractErrorCode(log);
        if (logErrorCode !== null) {
          const programError = PROGRAM_ERRORS[logErrorCode];
          if (programError) {
            return {
              code: logErrorCode,
              name: programError.name,
              message: programError.message,
              raw: errorMsg,
              logs,
            };
          }
        }

        // Check for "Error Code:" format in logs
        const errorCodeMatch = log.match(/Error Code: (\w+)/);
        if (errorCodeMatch) {
          const errorName = errorCodeMatch[1];
          for (const [code, err] of Object.entries(PROGRAM_ERRORS)) {
            if (err.name === errorName) {
              return {
                code: parseInt(code),
                name: err.name,
                message: err.message,
                raw: errorMsg,
                logs,
              };
            }
          }
        }
      }
    }

    // Check for known Solana errors
    for (const [key, message] of Object.entries(SOLANA_ERRORS)) {
      if (errorMsg.toLowerCase().includes(key.toLowerCase())) {
        return {
          code: null,
          name: key,
          message,
          raw: errorMsg,
          logs,
        };
      }
    }

    return {
      code: null,
      name: "TransactionError",
      message: errorMsg,
      raw: errorMsg,
      logs,
    };
  }

  // Handle generic Error
  if (error instanceof Error) {
    const errorMsg = error.message;
    const logs = (error as any).logs as string[] | undefined;

    // Try to extract error code from message
    const errorCode = extractErrorCode(errorMsg);
    if (errorCode !== null) {
      const programError = PROGRAM_ERRORS[errorCode];
      if (programError) {
        return {
          code: errorCode,
          name: programError.name,
          message: programError.message,
          raw: errorMsg,
          logs,
        };
      }
    }

    // Check logs for error code
    if (logs) {
      for (const log of logs) {
        const logErrorCode = extractErrorCode(log);
        if (logErrorCode !== null) {
          const programError = PROGRAM_ERRORS[logErrorCode];
          if (programError) {
            return {
              code: logErrorCode,
              name: programError.name,
              message: programError.message,
              raw: errorMsg,
              logs,
            };
          }
        }
      }
    }

    // Try to match by error name in message
    for (const [code, err] of Object.entries(PROGRAM_ERRORS)) {
      if (errorMsg.includes(err.name)) {
        return {
          code: parseInt(code),
          name: err.name,
          message: err.message,
          raw: errorMsg,
          logs,
        };
      }
    }

    // Check for known Solana errors
    for (const [key, message] of Object.entries(SOLANA_ERRORS)) {
      if (errorMsg.toLowerCase().includes(key.toLowerCase())) {
        return {
          code: null,
          name: key,
          message,
          raw: errorMsg,
          logs,
        };
      }
    }

    // Check for insufficient balance
    if (errorMsg.includes("0x1") || errorMsg.includes("insufficient")) {
      return {
        code: null,
        name: "InsufficientFunds",
        message: "Insufficient SOL balance to complete this transaction",
        raw: errorMsg,
        logs,
      };
    }

    return {
      code: null,
      name: "Error",
      message: errorMsg,
      raw: errorMsg,
      logs,
    };
  }

  // Unknown error type
  return {
    code: null,
    name: "UnknownError",
    message: String(error),
    raw: String(error),
  };
}

/**
 * Parse simulation response error
 */
export function parseSimulationError(
  err: any,
  logs?: string[]
): TransactionError {
  // Handle InstructionError format
  if (typeof err === "object" && err !== null) {
    const errorCode = extractErrorCode(err);
    if (errorCode !== null) {
      const programError = PROGRAM_ERRORS[errorCode];
      if (programError) {
        return {
          code: errorCode,
          name: programError.name,
          message: programError.message,
          raw: JSON.stringify(err),
          logs,
        };
      }
    }
  }

  // Check logs for error info
  if (logs) {
    for (const log of logs) {
      // Check for program error codes first
      const errorCode = extractErrorCode(log);
      if (errorCode !== null) {
        const programError = PROGRAM_ERRORS[errorCode];
        if (programError) {
          return {
            code: errorCode,
            name: programError.name,
            message: programError.message,
            raw: log,
            logs,
          };
        }
      }

      // Check for "Error Code:" format (custom program errors)
      const errorCodeMatch = log.match(/Error Code: (\w+)/);
      if (errorCodeMatch) {
        const errorName = errorCodeMatch[1];

        // Check program errors
        for (const [code, errDef] of Object.entries(PROGRAM_ERRORS)) {
          if (errDef.name === errorName) {
            return {
              code: parseInt(code),
              name: errDef.name,
              message: errDef.message,
              raw: log,
              logs,
            };
          }
        }

        // Check Anchor errors
        const anchorMsg = ANCHOR_ERRORS[errorName];
        if (anchorMsg) {
          return {
            code: null,
            name: errorName,
            message: anchorMsg,
            raw: log,
            logs,
          };
        }
      }

      // Check for known Anchor error patterns in log message
      for (const [pattern, message] of Object.entries(ANCHOR_ERRORS)) {
        if (log.includes(pattern)) {
          return {
            code: null,
            name: pattern.replace(/\s+/g, ""),
            message,
            raw: log,
            logs,
          };
        }
      }

      // Check for "Error Message:" format
      const errorMsgMatch = log.match(/Error Message: (.+)/);
      if (errorMsgMatch) {
        const errorMsg = errorMsgMatch[1];

        // Check if this matches any known Anchor error
        for (const [pattern, message] of Object.entries(ANCHOR_ERRORS)) {
          if (errorMsg.includes(pattern)) {
            return {
              code: null,
              name: pattern.replace(/\s+/g, ""),
              message,
              raw: log,
              logs,
            };
          }
        }

        return {
          code: null,
          name: "ProgramError",
          message: errorMsg,
          raw: log,
          logs,
        };
      }
    }
  }

  return {
    code: null,
    name: "SimulationFailed",
    message: "Transaction simulation failed",
    raw: JSON.stringify(err),
    logs,
  };
}

/**
 * Simulate a transaction before sending
 */
export async function simulateTransaction(
  connection: Connection,
  transaction: Transaction | VersionedTransaction
): Promise<SimulationResult> {
  try {
    let simulation;

    if (transaction instanceof VersionedTransaction) {
      simulation = await connection.simulateTransaction(transaction, {
        sigVerify: false,
        replaceRecentBlockhash: true,
      });
    } else {
      simulation = await connection.simulateTransaction(transaction, undefined, true);
    }

    if (simulation.value.err) {
      return {
        success: false,
        error: parseSimulationError(
          simulation.value.err,
          simulation.value.logs || undefined
        ),
        logs: simulation.value.logs || undefined,
        unitsConsumed: simulation.value.unitsConsumed || undefined,
      };
    }

    return {
      success: true,
      logs: simulation.value.logs || undefined,
      unitsConsumed: simulation.value.unitsConsumed || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: parseTransactionError(error),
    };
  }
}

/**
 * Custom error class with parsed error info
 */
export class ScaleCraftError extends Error {
  code: number | null;
  errorName: string;
  raw?: string;
  logs?: string[];

  constructor(error: TransactionError) {
    super(error.message);
    this.name = "ScaleCraftError";
    this.code = error.code;
    this.errorName = error.name;
    this.raw = error.raw;
    this.logs = error.logs;
  }
}

/**
 * Wrap a function that may throw and convert errors to ScaleCraftError
 */
export async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const parsed = parseTransactionError(error);
    throw new ScaleCraftError(parsed);
  }
}

/**
 * Get all program error codes
 */
export function getProgramErrors(): Record<number, { name: string; message: string }> {
  return { ...PROGRAM_ERRORS };
}

/**
 * Get error info by code
 */
export function getErrorByCode(code: number): { name: string; message: string } | undefined {
  return PROGRAM_ERRORS[code];
}

/**
 * Get error info by name
 */
export function getErrorByName(name: string): { code: number; name: string; message: string } | undefined {
  for (const [code, err] of Object.entries(PROGRAM_ERRORS)) {
    if (err.name === name) {
      return { code: parseInt(code), ...err };
    }
  }
  return undefined;
}
