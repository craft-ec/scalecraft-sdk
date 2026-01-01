// Main Client
export { ScaleCraftClient } from "./client";
export type { ScaleCraftClientConfig, TransactionResult, SimulationResult } from "./client";

// PDA Helpers
export { PDA, pda } from "./pda";

// Types
export type {
  UserActivity,
  ProtocolConfig,
  // Pool Types
  DefenderPool,
  ChallengerPool,
  JurorPool,
  // Subject PDAs
  Subject,
  Dispute,
  Escrow,
  RoundResult,
  // Record Types
  DefenderRecord,
  ChallengerRecord,
  JurorRecord,
  // Enum Types
  SubjectStatus,
  DisputeStatus,
  ResolutionOutcome,
  DisputeType,
  VoteChoice,
  RestoreVoteChoice,
  BondSource,
} from "./types";

// Enum Helpers
export {
  SubjectStatusEnum,
  DisputeStatusEnum,
  ResolutionOutcomeEnum,
  DisputeTypeEnum,
  VoteChoiceEnum,
  RestoreVoteChoiceEnum,
  BondSourceEnum,
  // Type Guards
  isSubjectDormant,
  isSubjectValid,
  isSubjectDisputed,
  isSubjectInvalid,
  isSubjectRestoring,
  isDisputeNone,
  isDisputePending,
  isDisputeResolved,
  isChallengerWins,
  isDefenderWins,
  isNoParticipation,
  // Name Getters
  getDisputeTypeName,
  getOutcomeName,
  getBondSourceName,
} from "./types";

// Constants
export {
  PROGRAM_ID,
  // PDA Seeds
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
  // Fee Constants
  TOTAL_FEE_BPS,
  PLATFORM_SHARE_BPS,
  JUROR_SHARE_BPS,
  WINNER_SHARE_BPS,
  // Sweep Constants
  CLAIM_GRACE_PERIOD,
  TREASURY_SWEEP_PERIOD,
  BOT_REWARD_BPS,
  // Stake Constants
  MIN_JUROR_STAKE,
  MIN_CHALLENGER_BOND,
  MIN_DEFENDER_STAKE,
  BASE_CHALLENGER_BOND,
  // Time Constants
  STAKE_UNLOCK_BUFFER,
  MIN_VOTING_PERIOD,
  MAX_VOTING_PERIOD,
  // Reputation Constants
  REP_PRECISION,
  REP_100_PERCENT,
  INITIAL_REPUTATION,
  REPUTATION_GAIN_RATE,
  REPUTATION_LOSS_RATE,
  // Reputation Helpers
  integerSqrt,
  calculateMinBond,
  formatReputation,
} from "./constants";

// Reward Calculations
export {
  calculateJurorReward,
  calculateChallengerReward,
  calculateDefenderReward,
  calculateUserRewards,
  isJurorRewardClaimable,
  isChallengerRewardClaimable,
  isDefenderRewardClaimable,
  lamportsToSol,
} from "./rewards";
export type {
  JurorRecordInput,
  ChallengerRecordInput,
  DefenderRecordInput,
  JurorRewardBreakdown,
  ChallengerRewardBreakdown,
  DefenderRewardBreakdown,
  UserRewardSummary,
} from "./rewards";

// Event Parsing
export {
  createEventParser,
  parseEventsFromLogs,
  parseEventsFromTransaction,
  fetchClaimHistory,
  fetchClaimHistoryForSubject,
  getClaimSummaryFromHistory,
} from "./events";
export type {
  ClaimRole,
  RewardClaimedEvent,
  RecordClosedEvent,
  StakeUnlockedEvent,
  DisputeResolvedEvent,
  ScaleCraftEvent,
} from "./events";

// Error Handling
export {
  parseTransactionError,
  parseSimulationError,
  simulateTransaction,
  ScaleCraftError,
  withErrorHandling,
  getProgramErrors,
  getErrorByCode,
  getErrorByName,
} from "./errors";
export type {
  TransactionError,
  SimulationResult as ErrorSimulationResult,
} from "./errors";

// Content Types (IPFS schemas)
export {
  createSubjectContent,
  createDisputeContent,
  createVoteRationaleContent,
  validateSubjectContent,
  validateDisputeContent,
  validateVoteRationaleContent,
} from "./content-types";
export type {
  SubjectContent,
  SubjectCategory,
  Evidence,
  Party,
  DisputeContent,
  ContentDisputeType,
  VoteRationaleContent,
} from "./content-types";

// IDL (for advanced usage)
export { default as IDL } from "./idl.json";
export type { Scalecraft } from "./idl-types";
