import { PublicKey } from "@solana/web3.js";
import {
  PROGRAM_ID,
  PROTOCOL_CONFIG_SEED,
  DEFENDER_POOL_SEED,
  CHALLENGER_POOL_SEED,
  JUROR_POOL_SEED,
  SUBJECT_SEED,
  DISPUTE_SEED,
  ESCROW_SEED,
  DEFENDER_RECORD_SEED,
  CHALLENGER_RECORD_SEED,
  JUROR_RECORD_SEED,
} from "./constants";

/**
 * PDA derivation helpers for ScaleCraft accounts
 * Updated for V2 round-based design
 */
export class PDA {
  constructor(private programId: PublicKey = PROGRAM_ID) {}

  /**
   * Derive Protocol Config PDA
   */
  protocolConfig(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [PROTOCOL_CONFIG_SEED],
      this.programId
    );
  }

  // =========================================================================
  // Pool PDAs (persistent per user)
  // =========================================================================

  /**
   * Derive Defender Pool PDA for an owner
   * Seeds: [defender_pool, owner]
   */
  defenderPool(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [DEFENDER_POOL_SEED, owner.toBuffer()],
      this.programId
    );
  }

  /**
   * Derive Challenger Pool PDA for an owner
   * Seeds: [challenger_pool, owner]
   */
  challengerPool(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [CHALLENGER_POOL_SEED, owner.toBuffer()],
      this.programId
    );
  }

  /**
   * Derive Juror Pool PDA for a juror
   * Seeds: [juror_pool, owner]
   */
  jurorPool(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [JUROR_POOL_SEED, owner.toBuffer()],
      this.programId
    );
  }

  // =========================================================================
  // Subject PDAs (persistent per subject_id)
  // =========================================================================

  /**
   * Derive Subject PDA for a subject ID
   * Seeds: [subject, subject_id]
   */
  subject(subjectId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SUBJECT_SEED, subjectId.toBuffer()],
      this.programId
    );
  }

  /**
   * Derive Dispute PDA for a subject
   * Seeds: [dispute, subject_id]
   * Note: In V2, there's one Dispute per subject (persistent, reset per round)
   */
  dispute(subjectId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [DISPUTE_SEED, subjectId.toBuffer()],
      this.programId
    );
  }

  /**
   * Derive Escrow PDA for a subject
   * Seeds: [escrow, subject_id]
   * Holds funds and RoundResult history for claims
   */
  escrow(subjectId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [ESCROW_SEED, subjectId.toBuffer()],
      this.programId
    );
  }

  // =========================================================================
  // Round-specific Record PDAs
  // =========================================================================

  /**
   * Derive Defender Record PDA for a specific round
   * Seeds: [defender_record, subject_id, defender, round]
   */
  defenderRecord(
    subjectId: PublicKey,
    defender: PublicKey,
    round: number
  ): [PublicKey, number] {
    const roundBuffer = Buffer.alloc(4);
    roundBuffer.writeUInt32LE(round);
    return PublicKey.findProgramAddressSync(
      [DEFENDER_RECORD_SEED, subjectId.toBuffer(), defender.toBuffer(), roundBuffer],
      this.programId
    );
  }

  /**
   * Derive Challenger Record PDA for a specific round
   * Seeds: [challenger_record, subject_id, challenger, round]
   */
  challengerRecord(
    subjectId: PublicKey,
    challenger: PublicKey,
    round: number
  ): [PublicKey, number] {
    const roundBuffer = Buffer.alloc(4);
    roundBuffer.writeUInt32LE(round);
    return PublicKey.findProgramAddressSync(
      [CHALLENGER_RECORD_SEED, subjectId.toBuffer(), challenger.toBuffer(), roundBuffer],
      this.programId
    );
  }

  /**
   * Derive Juror Record PDA for a specific round
   * Seeds: [juror_record, subject_id, juror, round]
   */
  jurorRecord(
    subjectId: PublicKey,
    juror: PublicKey,
    round: number
  ): [PublicKey, number] {
    const roundBuffer = Buffer.alloc(4);
    roundBuffer.writeUInt32LE(round);
    return PublicKey.findProgramAddressSync(
      [JUROR_RECORD_SEED, subjectId.toBuffer(), juror.toBuffer(), roundBuffer],
      this.programId
    );
  }
}

// Export a default instance
export const pda = new PDA();
