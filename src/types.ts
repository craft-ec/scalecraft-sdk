import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// =============================================================================
// Activity Types (from transaction history)
// =============================================================================

export interface UserActivity {
  type: string;
  signature: string;
  timestamp: number;
  slot: number;
  dispute?: string;
  subject?: string;
  round?: number;
  amount?: number;        // SOL amount in lamports (for stakes, claims)
  rentReclaimed?: number; // Rent reclaimed in lamports (for closes)
  voteChoice?: "ForChallenger" | "ForDefender" | "ForRestoration" | "AgainstRestoration";
  outcome?: "ChallengerWins" | "DefenderWins" | "NoParticipation";
  rationaleCid?: string;  // IPFS CID for vote rationale
  success: boolean;
}

// =============================================================================
// Account Types (V2 Design)
// =============================================================================

export interface ProtocolConfig {
  authority: PublicKey;
  treasury: PublicKey;
  bump: number;
}

// Pool Accounts (persistent per user)

export interface DefenderPool {
  owner: PublicKey;
  balance: BN;
  maxBond: BN;
  bump: number;
  createdAt: BN;
  updatedAt: BN;
}

export interface ChallengerPool {
  owner: PublicKey;
  balance: BN;
  reputation: BN;
  bump: number;
  createdAt: BN;
}

export interface JurorPool {
  owner: PublicKey;
  balance: BN;
  reputation: BN;
  bump: number;
  createdAt: BN;
}

// Subject PDAs (persistent per subject_id)

export interface Subject {
  subjectId: PublicKey;
  creator: PublicKey;
  detailsCid: string;
  round: number;
  availableBond: BN;
  defenderCount: number;
  status: SubjectStatus;
  matchMode: boolean;
  votingPeriod: BN;
  dispute: PublicKey;
  bump: number;
  createdAt: BN;
  updatedAt: BN;
  lastDisputeTotal: BN;
  lastVotingPeriod: BN;
}

export interface Dispute {
  subjectId: PublicKey;
  round: number;
  status: DisputeStatus;
  disputeType: DisputeType;
  totalStake: BN;
  challengerCount: number;
  bondAtRisk: BN;
  defenderCount: number;
  votesForChallenger: BN;
  votesForDefender: BN;
  voteCount: number;
  votingStartsAt: BN;
  votingEndsAt: BN;
  outcome: ResolutionOutcome;
  resolvedAt: BN;
  isRestore: boolean;
  restoreStake: BN;
  restorer: PublicKey;
  detailsCid: string;
  bump: number;
  createdAt: BN;
}

export interface Escrow {
  subjectId: PublicKey;
  balance: BN;
  rounds: RoundResult[];
  bump: number;
}

export interface RoundResult {
  round: number;
  creator: PublicKey;
  resolvedAt: BN;
  outcome: ResolutionOutcome;
  totalStake: BN;
  bondAtRisk: BN;
  safeBond: BN;
  totalVoteWeight: BN;
  winnerPool: BN;
  jurorPool: BN;
  defenderCount: number;
  challengerCount: number;
  jurorCount: number;
  defenderClaims: number;
  challengerClaims: number;
  jurorClaims: number;
}

// Round-specific Record PDAs

export interface DefenderRecord {
  subjectId: PublicKey;
  defender: PublicKey;
  round: number;
  bond: BN;
  source: BondSource;
  rewardClaimed: boolean;
  bump: number;
  bondedAt: BN;
}

export interface ChallengerRecord {
  subjectId: PublicKey;
  challenger: PublicKey;
  round: number;
  stake: BN;
  detailsCid: string;
  rewardClaimed: boolean;
  bump: number;
  challengedAt: BN;
}

export interface JurorRecord {
  subjectId: PublicKey;
  juror: PublicKey;
  round: number;
  choice: VoteChoice;
  restoreChoice: RestoreVoteChoice;
  isRestoreVote: boolean;
  votingPower: BN;
  stakeAllocation: BN;
  rewardClaimed: boolean;
  stakeUnlocked: boolean;
  bump: number;
  votedAt: BN;
  rationaleCid: string;
}

// =============================================================================
// Enum Types
// =============================================================================

export type SubjectStatus =
  | { dormant: Record<string, never> }
  | { valid: Record<string, never> }
  | { disputed: Record<string, never> }
  | { invalid: Record<string, never> }
  | { restoring: Record<string, never> };

export type DisputeStatus =
  | { none: Record<string, never> }
  | { pending: Record<string, never> }
  | { resolved: Record<string, never> };

export type ResolutionOutcome =
  | { none: Record<string, never> }
  | { challengerWins: Record<string, never> }
  | { defenderWins: Record<string, never> }
  | { noParticipation: Record<string, never> };

export type DisputeType =
  | { other: Record<string, never> }
  | { breach: Record<string, never> }
  | { fraud: Record<string, never> }
  | { qualityDispute: Record<string, never> }
  | { nonDelivery: Record<string, never> }
  | { misrepresentation: Record<string, never> }
  | { policyViolation: Record<string, never> }
  | { damagesClaim: Record<string, never> };

export type VoteChoice =
  | { forChallenger: Record<string, never> }
  | { forDefender: Record<string, never> };

export type RestoreVoteChoice =
  | { forRestoration: Record<string, never> }
  | { againstRestoration: Record<string, never> };

export type BondSource =
  | { direct: Record<string, never> }
  | { pool: Record<string, never> };

// =============================================================================
// Enum Helpers
// =============================================================================

export const SubjectStatusEnum = {
  Dormant: { dormant: {} } as SubjectStatus,
  Valid: { valid: {} } as SubjectStatus,
  Disputed: { disputed: {} } as SubjectStatus,
  Invalid: { invalid: {} } as SubjectStatus,
  Restoring: { restoring: {} } as SubjectStatus,
};

export const DisputeStatusEnum = {
  None: { none: {} } as DisputeStatus,
  Pending: { pending: {} } as DisputeStatus,
  Resolved: { resolved: {} } as DisputeStatus,
};

export const ResolutionOutcomeEnum = {
  None: { none: {} } as ResolutionOutcome,
  ChallengerWins: { challengerWins: {} } as ResolutionOutcome,
  DefenderWins: { defenderWins: {} } as ResolutionOutcome,
  NoParticipation: { noParticipation: {} } as ResolutionOutcome,
};

export const DisputeTypeEnum = {
  Other: { other: {} } as DisputeType,
  Breach: { breach: {} } as DisputeType,
  Fraud: { fraud: {} } as DisputeType,
  QualityDispute: { qualityDispute: {} } as DisputeType,
  NonDelivery: { nonDelivery: {} } as DisputeType,
  Misrepresentation: { misrepresentation: {} } as DisputeType,
  PolicyViolation: { policyViolation: {} } as DisputeType,
  DamagesClaim: { damagesClaim: {} } as DisputeType,
};

export const VoteChoiceEnum = {
  ForChallenger: { forChallenger: {} } as VoteChoice,
  ForDefender: { forDefender: {} } as VoteChoice,
};

export const RestoreVoteChoiceEnum = {
  ForRestoration: { forRestoration: {} } as RestoreVoteChoice,
  AgainstRestoration: { againstRestoration: {} } as RestoreVoteChoice,
};

export const BondSourceEnum = {
  Direct: { direct: {} } as BondSource,
  Pool: { pool: {} } as BondSource,
};

// =============================================================================
// Helper Functions
// =============================================================================

export function isSubjectDormant(status: SubjectStatus): boolean {
  return "dormant" in status;
}

export function isSubjectValid(status: SubjectStatus): boolean {
  return "valid" in status;
}

export function isSubjectDisputed(status: SubjectStatus): boolean {
  return "disputed" in status;
}

export function isSubjectInvalid(status: SubjectStatus): boolean {
  return "invalid" in status;
}

export function isSubjectRestoring(status: SubjectStatus): boolean {
  return "restoring" in status;
}

export function isDisputeNone(status: DisputeStatus): boolean {
  return "none" in status;
}

export function isDisputePending(status: DisputeStatus): boolean {
  return "pending" in status;
}

export function isDisputeResolved(status: DisputeStatus): boolean {
  return "resolved" in status;
}

export function isChallengerWins(outcome: ResolutionOutcome): boolean {
  return "challengerWins" in outcome;
}

export function isDefenderWins(outcome: ResolutionOutcome): boolean {
  return "defenderWins" in outcome;
}

export function isNoParticipation(outcome: ResolutionOutcome): boolean {
  return "noParticipation" in outcome;
}

export function getDisputeTypeName(disputeType: DisputeType): string {
  if ("other" in disputeType) return "Other";
  if ("breach" in disputeType) return "Breach";
  if ("fraud" in disputeType) return "Fraud";
  if ("qualityDispute" in disputeType) return "Quality Dispute";
  if ("nonDelivery" in disputeType) return "Non-Delivery";
  if ("misrepresentation" in disputeType) return "Misrepresentation";
  if ("policyViolation" in disputeType) return "Policy Violation";
  if ("damagesClaim" in disputeType) return "Damages Claim";
  return "Unknown";
}

export function getOutcomeName(outcome: ResolutionOutcome): string {
  if ("none" in outcome) return "None";
  if ("challengerWins" in outcome) return "Challenger Wins";
  if ("defenderWins" in outcome) return "Defender Wins";
  if ("noParticipation" in outcome) return "No Participation";
  return "Unknown";
}

export function getBondSourceName(source: BondSource): string {
  if ("direct" in source) return "Direct";
  if ("pool" in source) return "Pool";
  return "Unknown";
}
