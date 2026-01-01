import { PublicKey } from "@solana/web3.js";

// Program ID
export const PROGRAM_ID = new PublicKey(
  "YxF3CEwUr5Nhk8FjzZDhKFcSHfgRHYA31Ccm3vd2Mrz"
);

// PDA Seeds
export const PROTOCOL_CONFIG_SEED = Buffer.from("protocol_config");
export const DEFENDER_POOL_SEED = Buffer.from("defender_pool");
export const CHALLENGER_POOL_SEED = Buffer.from("challenger_pool");
export const JUROR_POOL_SEED = Buffer.from("juror_pool");
export const SUBJECT_SEED = Buffer.from("subject");
export const DISPUTE_SEED = Buffer.from("dispute");
export const ESCROW_SEED = Buffer.from("escrow");
export const DEFENDER_RECORD_SEED = Buffer.from("defender_record");
export const CHALLENGER_RECORD_SEED = Buffer.from("challenger_record");
export const JUROR_RECORD_SEED = Buffer.from("juror_record");

// Fee Constants (basis points)
export const TOTAL_FEE_BPS = 2000; // 20% fee from total pool
export const PLATFORM_SHARE_BPS = 500; // 5% of fees -> platform (1% of total)
export const JUROR_SHARE_BPS = 9500; // 95% of fees -> jurors (19% of total)
export const WINNER_SHARE_BPS = 8000; // 80% of loser's contribution -> winner

// Sweep Constants
export const CLAIM_GRACE_PERIOD = 30 * 24 * 60 * 60; // 30 days in seconds
export const TREASURY_SWEEP_PERIOD = 90 * 24 * 60 * 60; // 90 days in seconds
export const BOT_REWARD_BPS = 100; // 1% bot reward for treasury sweep

// Stake Constants
export const MIN_JUROR_STAKE = 10_000_000; // 0.01 SOL in lamports
export const MIN_CHALLENGER_BOND = 10_000_000; // 0.01 SOL in lamports
export const MIN_DEFENDER_STAKE = 10_000_000; // 0.01 SOL in lamports
export const BASE_CHALLENGER_BOND = 10_000_000; // 0.01 SOL - base for reputation calculation

// Time Constants
export const STAKE_UNLOCK_BUFFER = 7 * 24 * 60 * 60; // 7 days in seconds
export const MIN_VOTING_PERIOD = 24 * 60 * 60; // 1 day in seconds
export const MAX_VOTING_PERIOD = 30 * 24 * 60 * 60; // 30 days in seconds

// Reputation Constants (6 decimals precision)
export const REP_PRECISION = 1_000_000;
export const REP_100_PERCENT = 100_000_000; // 100% = 100_000_000
export const INITIAL_REPUTATION = 50_000_000; // 50%
export const REPUTATION_GAIN_RATE = 1_000_000; // 1% gain rate
export const REPUTATION_LOSS_RATE = 2_000_000; // 2% loss rate (1:2 ratio)

/**
 * Integer square root using Newton's method
 * Mirrors the on-chain implementation
 */
export function integerSqrt(n: number): number {
  if (n === 0) return 0;
  let x = n;
  let y = Math.floor((x + 1) / 2);
  while (y < x) {
    x = y;
    y = Math.floor((x + Math.floor(n / x)) / 2);
  }
  return x;
}

/**
 * Calculate minimum bond based on challenger reputation
 * Mirrors the on-chain calculate_min_bond function
 *
 * Formula: min_bond = base_bond * sqrt(0.5 / reputation_pct)
 * - 50% rep = 1.0x multiplier (base bond)
 * - 25% rep = 1.41x multiplier
 * - 100% rep = 0.71x multiplier (minimum)
 * - 0% rep = 10x multiplier (maximum)
 *
 * @param reputation - Challenger's reputation (0 to REP_100_PERCENT)
 * @param baseBond - Base bond amount in lamports (default: BASE_CHALLENGER_BOND)
 * @returns Minimum bond required in lamports
 */
export function calculateMinBond(reputation: number, baseBond: number = BASE_CHALLENGER_BOND): number {
  if (reputation === 0) {
    // Prevent division by zero, use max multiplier
    return baseBond * 10;
  }

  // sqrt(0.5 / reputation_pct) = sqrt(50_000_000 / reputation)
  // min_bond = base_bond * sqrt(50_000_000) / sqrt(reputation)
  const sqrtHalf = 7071; // sqrt(50_000_000) ≈ 7071
  const sqrtRep = integerSqrt(reputation);

  if (sqrtRep === 0) {
    return baseBond * 10;
  }

  // (base_bond * sqrt_half) / sqrt_rep
  const result = Math.floor((baseBond * sqrtHalf) / sqrtRep);

  // Ensure minimum is at least base_bond * 0.7 for very high reputation
  return Math.max(result, Math.floor(baseBond * 7 / 10));
}

/**
 * Format reputation as percentage string
 * @param reputation - Reputation value (0 to REP_100_PERCENT)
 * @returns Formatted percentage string (e.g., "50.0%")
 */
export function formatReputation(reputation: number): string {
  return `${(reputation / REP_PRECISION).toFixed(1)}%`;
}
