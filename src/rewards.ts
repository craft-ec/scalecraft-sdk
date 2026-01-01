import { BN } from "@coral-xyz/anchor";
import type { RoundResult, ResolutionOutcome } from "./types";
import { isChallengerWins, isDefenderWins, isNoParticipation } from "./types";

// =============================================================================
// Input Types (relaxed for flexibility)
// =============================================================================

/** Minimal juror record fields needed for reward calculation */
export interface JurorRecordInput {
  votingPower: BN | number;
  // Other fields are optional for calculation
}

/** Minimal challenger record fields needed for reward calculation */
export interface ChallengerRecordInput {
  stake: BN | number;
  // Other fields are optional for calculation
}

/** Minimal defender record fields needed for reward calculation */
export interface DefenderRecordInput {
  bond: BN | number;
  // Other fields are optional for calculation
}

// =============================================================================
// Reward Calculation Types
// =============================================================================

export interface JurorRewardBreakdown {
  /** Total reward amount in lamports */
  total: number;
  /** Share of juror pool based on voting power */
  jurorPoolShare: number;
  /** Juror's voting power */
  votingPower: number;
  /** Total voting power in the round */
  totalVoteWeight: number;
  /** Percentage of total votes */
  votePercentage: number;
}

export interface ChallengerRewardBreakdown {
  /** Total reward amount in lamports */
  total: number;
  /** Share of winner pool (only if challenger wins) */
  winnerPoolShare: number;
  /** Challenger's stake */
  stake: number;
  /** Total challenger stake in the round */
  totalStake: number;
  /** Percentage of winner pool */
  poolPercentage: number;
}

export interface DefenderRewardBreakdown {
  /** Total reward amount in lamports */
  total: number;
  /** Share of safe bond returned (always returned regardless of outcome) */
  safeBondShare: number;
  /** Share of winner pool (only if defender wins) */
  winnerPoolShare: number;
  /** Defender's bond */
  bond: number;
  /** Total defender bond (bond at risk) */
  totalBondAtRisk: number;
  /** Safe bond amount */
  safeBond: number;
  /** Percentage of winner pool (if applicable) */
  poolPercentage: number;
}

export interface UserRewardSummary {
  /** Total claimable reward across all roles */
  total: number;
  /** Juror reward breakdown (if user voted) */
  juror?: JurorRewardBreakdown;
  /** Challenger reward breakdown (if user challenged) */
  challenger?: ChallengerRewardBreakdown;
  /** Defender reward breakdown (if user defended) */
  defender?: DefenderRewardBreakdown;
  /** Whether challenger won this round */
  challengerWins: boolean;
  /** Whether defender won this round */
  defenderWins: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Safely convert BN to number
 */
function safeToNumber(value: BN | number | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}

// =============================================================================
// Reward Calculation Functions
// =============================================================================

/**
 * Calculate juror reward for a specific round
 * All jurors share the juror pool proportionally by voting power
 */
export function calculateJurorReward(
  roundResult: RoundResult,
  jurorRecord: JurorRecordInput
): JurorRewardBreakdown {
  const jurorPool = safeToNumber(roundResult.jurorPool);
  const totalVoteWeight = safeToNumber(roundResult.totalVoteWeight);
  const votingPower = safeToNumber(jurorRecord.votingPower);

  const jurorPoolShare =
    totalVoteWeight > 0 ? (votingPower / totalVoteWeight) * jurorPool : 0;
  const votePercentage =
    totalVoteWeight > 0 ? (votingPower / totalVoteWeight) * 100 : 0;

  return {
    total: jurorPoolShare,
    jurorPoolShare,
    votingPower,
    totalVoteWeight,
    votePercentage,
  };
}

/**
 * Calculate challenger reward for a specific round
 * - ChallengerWins: Share of winner pool proportional to stake
 * - NoParticipation: 99% refund proportional to stake (1% treasury fee)
 * - DefenderWins: Nothing (stake lost to winner pool)
 */
export function calculateChallengerReward(
  roundResult: RoundResult,
  challengerRecord: ChallengerRecordInput
): ChallengerRewardBreakdown {
  const outcome = roundResult.outcome;
  const challengerWins = isChallengerWins(outcome);
  const noParticipation = isNoParticipation(outcome);

  const winnerPool = safeToNumber(roundResult.winnerPool);
  const totalStake = safeToNumber(roundResult.totalStake);
  const bondAtRisk = safeToNumber(roundResult.bondAtRisk);
  const stake = safeToNumber(challengerRecord.stake);

  let winnerPoolShare = 0;

  if (challengerWins && totalStake > 0) {
    // Challenger wins: share of winner pool proportional to stake
    winnerPoolShare = (stake / totalStake) * winnerPool;
  } else if (noParticipation) {
    // NoParticipation: 99% refund proportional to contribution to total pool
    const totalPool = totalStake + bondAtRisk;
    if (totalPool > 0) {
      winnerPoolShare = (stake / totalPool) * winnerPool;
    }
  }

  const poolPercentage = totalStake > 0 ? (stake / totalStake) * 100 : 0;

  return {
    total: winnerPoolShare,
    winnerPoolShare,
    stake,
    totalStake,
    poolPercentage,
  };
}

/**
 * Calculate defender reward for a specific round
 * - Safe bond: Always returned regardless of outcome
 * - Winner pool: Only if defender wins or NoParticipation
 * - NoParticipation: 99% refund proportional to at-risk contribution
 */
export function calculateDefenderReward(
  roundResult: RoundResult,
  defenderRecord: DefenderRecordInput
): DefenderRewardBreakdown {
  const outcome = roundResult.outcome;
  const defenderWins = isDefenderWins(outcome);
  const noParticipation = isNoParticipation(outcome);

  const winnerPool = safeToNumber(roundResult.winnerPool);
  const bondAtRisk = safeToNumber(roundResult.bondAtRisk);
  const safeBond = safeToNumber(roundResult.safeBond);
  const totalStake = safeToNumber(roundResult.totalStake);
  const bond = safeToNumber(defenderRecord.bond);

  // Available bond = bond at risk + safe bond (total defender contribution)
  const availableBond = bondAtRisk + safeBond;

  // Safe bond share: proportional to defender's bond contribution
  const safeBondShare =
    availableBond > 0 ? (safeBond * bond) / availableBond : 0;

  // Defender's at-risk portion
  const defenderAtRisk =
    availableBond > 0 ? (bondAtRisk * bond) / availableBond : 0;

  let winnerPoolShare = 0;

  if (defenderWins && bondAtRisk > 0) {
    // Defender wins: share of winner pool proportional to at-risk
    winnerPoolShare = (defenderAtRisk / bondAtRisk) * winnerPool;
  } else if (noParticipation) {
    // NoParticipation: 99% refund proportional to contribution to total pool
    const totalPool = totalStake + bondAtRisk;
    if (totalPool > 0) {
      winnerPoolShare = (defenderAtRisk / totalPool) * winnerPool;
    }
  }

  const poolPercentage = availableBond > 0 ? (bond / availableBond) * 100 : 0;

  return {
    total: winnerPoolShare + safeBondShare,
    safeBondShare,
    winnerPoolShare,
    bond,
    totalBondAtRisk: bondAtRisk,
    safeBond,
    poolPercentage,
  };
}

/**
 * Calculate total user rewards for a round
 * Combines juror, challenger, and defender rewards if applicable
 */
export function calculateUserRewards(
  roundResult: RoundResult,
  records: {
    jurorRecord?: JurorRecordInput;
    challengerRecord?: ChallengerRecordInput;
    defenderRecord?: DefenderRecordInput;
  }
): UserRewardSummary {
  const outcome = roundResult.outcome;
  const challengerWins = isChallengerWins(outcome);
  const defenderWins = isDefenderWins(outcome);

  let total = 0;
  let juror: JurorRewardBreakdown | undefined;
  let challenger: ChallengerRewardBreakdown | undefined;
  let defender: DefenderRewardBreakdown | undefined;

  if (records.jurorRecord) {
    juror = calculateJurorReward(roundResult, records.jurorRecord);
    total += juror.total;
  }

  if (records.challengerRecord) {
    challenger = calculateChallengerReward(roundResult, records.challengerRecord);
    total += challenger.total;
  }

  if (records.defenderRecord) {
    defender = calculateDefenderReward(roundResult, records.defenderRecord);
    total += defender.total;
  }

  return {
    total,
    juror,
    challenger,
    defender,
    challengerWins,
    defenderWins,
  };
}

/** Record with claim status */
interface ClaimableRecord {
  rewardClaimed: boolean;
}

/**
 * Check if a juror reward is claimable
 */
export function isJurorRewardClaimable(jurorRecord: ClaimableRecord): boolean {
  return !jurorRecord.rewardClaimed;
}

/**
 * Check if a challenger reward is claimable
 */
export function isChallengerRewardClaimable(
  challengerRecord: ClaimableRecord,
  outcome: ResolutionOutcome
): boolean {
  return !challengerRecord.rewardClaimed && isChallengerWins(outcome);
}

/**
 * Check if a defender reward is claimable
 * Defenders can always claim (safe bond) regardless of outcome
 */
export function isDefenderRewardClaimable(defenderRecord: ClaimableRecord): boolean {
  return !defenderRecord.rewardClaimed;
}

/**
 * Format lamports to SOL with specified decimals
 */
export function lamportsToSol(lamports: number, decimals: number = 6): string {
  return (lamports / 1_000_000_000).toFixed(decimals);
}
