import { PublicKey, Connection, ParsedTransactionWithMeta } from "@solana/web3.js";
import { BorshCoder, EventParser, Program } from "@coral-xyz/anchor";
import type { Scalecraft } from "./idl-types";
import IDL from "./idl.json";
import { PROGRAM_ID } from "./constants";

// =============================================================================
// Event Types
// =============================================================================

/** Claim role enum matching on-chain ClaimRole */
export type ClaimRole = "Defender" | "Challenger" | "Juror";

/** Parsed RewardClaimedEvent */
export interface RewardClaimedEvent {
  subjectId: PublicKey;
  round: number;
  claimer: PublicKey;
  role: ClaimRole;
  amount: number; // lamports
  timestamp: number;
}

/** Parsed RecordClosedEvent */
export interface RecordClosedEvent {
  subjectId: PublicKey;
  round: number;
  owner: PublicKey;
  role: ClaimRole;
  rentReturned: number;
  timestamp: number;
}

/** Parsed StakeUnlockedEvent */
export interface StakeUnlockedEvent {
  subjectId: PublicKey;
  round: number;
  juror: PublicKey;
  amount: number;
  timestamp: number;
}

/** Parsed DisputeResolvedEvent */
export interface DisputeResolvedEvent {
  subjectId: PublicKey;
  round: number;
  outcome: string;
  totalStake: number;
  bondAtRisk: number;
  winnerPool: number;
  jurorPool: number;
  resolvedAt: number;
  timestamp: number;
}

/** Union of all parsed events */
export type ScaleCraftEvent =
  | { type: "RewardClaimed"; data: RewardClaimedEvent }
  | { type: "RecordClosed"; data: RecordClosedEvent }
  | { type: "StakeUnlocked"; data: StakeUnlockedEvent }
  | { type: "DisputeResolved"; data: DisputeResolvedEvent };

// =============================================================================
// Event Parsing
// =============================================================================

/**
 * Parse ClaimRole from anchor event data
 */
function parseClaimRole(role: Record<string, unknown>): ClaimRole {
  if ("defender" in role) return "Defender";
  if ("challenger" in role) return "Challenger";
  if ("juror" in role) return "Juror";
  return "Defender"; // fallback
}

/**
 * Parse outcome enum to string
 */
function parseOutcome(outcome: Record<string, unknown>): string {
  if ("challengerWins" in outcome) return "ChallengerWins";
  if ("defenderWins" in outcome) return "DefenderWins";
  if ("noParticipation" in outcome) return "NoParticipation";
  return "None";
}

/**
 * Create an event parser for ScaleCraft events
 */
export function createEventParser(): EventParser {
  const coder = new BorshCoder(IDL as Scalecraft);
  return new EventParser(new PublicKey(PROGRAM_ID), coder);
}

/**
 * Parse events from transaction logs
 */
export function parseEventsFromLogs(logs: string[]): ScaleCraftEvent[] {
  const parser = createEventParser();
  const events: ScaleCraftEvent[] = [];

  for (const event of parser.parseLogs(logs)) {
    switch (event.name) {
      case "RewardClaimedEvent":
        events.push({
          type: "RewardClaimed",
          data: {
            subjectId: event.data.subjectId as PublicKey,
            round: (event.data.round as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.round),
            claimer: event.data.claimer as PublicKey,
            role: parseClaimRole(event.data.role as Record<string, unknown>),
            amount: (event.data.amount as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.amount),
            timestamp: (event.data.timestamp as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.timestamp),
          },
        });
        break;

      case "RecordClosedEvent":
        events.push({
          type: "RecordClosed",
          data: {
            subjectId: event.data.subjectId as PublicKey,
            round: (event.data.round as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.round),
            owner: event.data.owner as PublicKey,
            role: parseClaimRole(event.data.role as Record<string, unknown>),
            rentReturned: (event.data.rentReturned as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.rentReturned),
            timestamp: (event.data.timestamp as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.timestamp),
          },
        });
        break;

      case "StakeUnlockedEvent":
        events.push({
          type: "StakeUnlocked",
          data: {
            subjectId: event.data.subjectId as PublicKey,
            round: (event.data.round as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.round),
            juror: event.data.juror as PublicKey,
            amount: (event.data.amount as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.amount),
            timestamp: (event.data.timestamp as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.timestamp),
          },
        });
        break;

      case "DisputeResolvedEvent":
        events.push({
          type: "DisputeResolved",
          data: {
            subjectId: event.data.subjectId as PublicKey,
            round: (event.data.round as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.round),
            outcome: parseOutcome(event.data.outcome as Record<string, unknown>),
            totalStake: (event.data.totalStake as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.totalStake),
            bondAtRisk: (event.data.bondAtRisk as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.bondAtRisk),
            winnerPool: (event.data.winnerPool as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.winnerPool),
            jurorPool: (event.data.jurorPool as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.jurorPool),
            resolvedAt: (event.data.resolvedAt as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.resolvedAt),
            timestamp: (event.data.timestamp as { toNumber?: () => number })?.toNumber?.() ?? Number(event.data.timestamp),
          },
        });
        break;
    }
  }

  return events;
}

// =============================================================================
// Transaction History Fetching
// =============================================================================

/**
 * Fetch claim history for a user from transaction signatures
 * Returns all RewardClaimedEvents for the given claimer
 */
export async function fetchClaimHistory(
  connection: Connection,
  claimer: PublicKey,
  options?: {
    limit?: number;
    before?: string;
  }
): Promise<RewardClaimedEvent[]> {
  const claims: RewardClaimedEvent[] = [];

  console.log("[SDK:fetchClaimHistory] Fetching signatures for:", claimer.toBase58());

  // Get transaction signatures for the user
  const signatures = await connection.getSignaturesForAddress(claimer, {
    limit: options?.limit ?? 100,
    before: options?.before,
  });

  console.log("[SDK:fetchClaimHistory] Found signatures:", signatures.length);

  // Fetch and parse each transaction
  let scaleTxCount = 0;
  for (const sig of signatures) {
    try {
      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx?.meta?.logMessages) continue;

      // Check if this transaction involves our program
      const programIdStr = PROGRAM_ID.toString();
      const involvesScale = tx.meta.logMessages.some(
        (log) => log.includes(programIdStr)
      );
      if (!involvesScale) continue;

      scaleTxCount++;

      // Parse events from logs
      const events = parseEventsFromLogs(tx.meta.logMessages);
      if (events.length > 0) {
        console.log("[SDK:fetchClaimHistory] Tx", sig.signature.slice(0, 8), "events:", events.map(e => e.type));
      }

      // Filter for RewardClaimed events from this claimer
      for (const event of events) {
        if (event.type === "RewardClaimed") {
          console.log("[SDK:fetchClaimHistory] Found RewardClaimed:", {
            claimer: event.data.claimer.toBase58(),
            expectedClaimer: claimer.toBase58(),
            matches: event.data.claimer.equals(claimer),
            subjectId: event.data.subjectId.toBase58(),
            round: event.data.round,
            amount: event.data.amount,
          });
          if (event.data.claimer.equals(claimer)) {
            claims.push(event.data);
          }
        }
      }
    } catch (error) {
      // Skip failed transactions
      console.warn(`Failed to parse transaction ${sig.signature}:`, error);
    }
  }

  console.log("[SDK:fetchClaimHistory] Scale txs:", scaleTxCount, "claims found:", claims.length);
  return claims;
}

/**
 * Fetch claim history for a specific subject
 */
export async function fetchClaimHistoryForSubject(
  connection: Connection,
  subjectId: PublicKey,
  escrowAddress: PublicKey,
  options?: {
    limit?: number;
  }
): Promise<RewardClaimedEvent[]> {
  const claims: RewardClaimedEvent[] = [];

  // Get transaction signatures for the escrow account
  const signatures = await connection.getSignaturesForAddress(escrowAddress, {
    limit: options?.limit ?? 100,
  });

  for (const sig of signatures) {
    try {
      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx?.meta?.logMessages) continue;

      const events = parseEventsFromLogs(tx.meta.logMessages);

      for (const event of events) {
        if (
          event.type === "RewardClaimed" &&
          event.data.subjectId.equals(subjectId)
        ) {
          claims.push(event.data);
        }
      }
    } catch (error) {
      console.warn(`Failed to parse transaction ${sig.signature}:`, error);
    }
  }

  return claims;
}

/**
 * Get claim summary for a user on a specific subject/round
 * Uses escrow address for efficient querying (only fetches txs for that subject)
 */
export async function getClaimSummaryFromHistory(
  connection: Connection,
  claimer: PublicKey,
  subjectId: PublicKey,
  round: number,
  escrowAddress?: PublicKey
): Promise<{
  defender?: RewardClaimedEvent;
  challenger?: RewardClaimedEvent;
  juror?: RewardClaimedEvent;
  total: number;
}> {
  console.log("[SDK:getClaimSummaryFromHistory] Fetching claims for:", {
    claimer: claimer.toBase58(),
    subjectId: subjectId.toBase58(),
    round,
    escrowAddress: escrowAddress?.toBase58(),
  });

  // Use escrow-based query if available (much more efficient)
  let claims: RewardClaimedEvent[];
  if (escrowAddress) {
    const allClaims = await fetchClaimHistoryForSubject(connection, subjectId, escrowAddress, { limit: 50 });
    // Filter to this claimer
    claims = allClaims.filter(c => c.claimer.equals(claimer));
    console.log("[SDK:getClaimSummaryFromHistory] Escrow query: found", allClaims.length, "claims,", claims.length, "for this user");
  } else {
    // Fallback to user-based query (slower)
    claims = await fetchClaimHistory(connection, claimer, { limit: 50 });
    console.log("[SDK:getClaimSummaryFromHistory] User query: found", claims.length, "claims");
  }

  const summary: {
    defender?: RewardClaimedEvent;
    challenger?: RewardClaimedEvent;
    juror?: RewardClaimedEvent;
    total: number;
  } = { total: 0 };

  for (const claim of claims) {
    if (claim.subjectId.equals(subjectId) && claim.round === round) {
      console.log("[SDK:getClaimSummaryFromHistory] Match:", claim.role, claim.amount);
      switch (claim.role) {
        case "Defender":
          summary.defender = claim;
          break;
        case "Challenger":
          summary.challenger = claim;
          break;
        case "Juror":
          summary.juror = claim;
          break;
      }
      summary.total += claim.amount;
    }
  }

  console.log("[SDK:getClaimSummaryFromHistory] Summary total:", summary.total);
  return summary;
}

/**
 * Parse events from a single transaction
 */
export async function parseEventsFromTransaction(
  connection: Connection,
  signature: string
): Promise<ScaleCraftEvent[]> {
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx?.meta?.logMessages) {
    return [];
  }

  return parseEventsFromLogs(tx.meta.logMessages);
}
