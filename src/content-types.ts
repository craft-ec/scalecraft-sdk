/**
 * ScaleCraft Content Types
 *
 * These types define the JSON structure stored at CIDs on IPFS.
 * The protocol only stores CIDs - content interpretation is platform-specific.
 */

/**
 * Subject Content - stored at subject CID
 * Defines what is being staked on and can be disputed
 */
export interface SubjectContent {
  // Schema version for future compatibility
  version: 1;

  // Basic info
  title: string;
  description: string;

  // Category for filtering/organization
  category: SubjectCategory;

  // Terms & conditions that parties agree to
  terms: {
    // Human-readable terms
    text: string;
    // Optional: hash of legal document CID
    documentCid?: string;
  };

  // Evidence/supporting materials
  evidence?: Evidence[];

  // Parties involved (optional - for contracts between specific parties)
  parties?: Party[];

  // Metadata
  createdAt: string; // ISO timestamp

  // Platform-specific data (extensible)
  platformData?: Record<string, unknown>;
}

/**
 * Subject categories - extensible by platform
 */
export type SubjectCategory =
  | "contract"      // Agreements between parties
  | "claim"         // Public claims/statements
  | "deliverable"   // Work to be delivered
  | "service"       // Service agreement
  | "listing"       // Marketplace listing
  | "proposal"      // DAO/governance proposal
  | "other";

/**
 * Evidence item - supporting materials for subjects or disputes
 */
export interface Evidence {
  // Type of evidence
  type: "document" | "image" | "video" | "link" | "text";

  // Title/label
  title: string;

  // CID of the evidence file (for uploaded files)
  cid?: string;

  // URL (for external links)
  url?: string;

  // Text content (for inline text evidence)
  text?: string;

  // Description of relevance
  description?: string;
}

/**
 * Party in an agreement
 */
export interface Party {
  // Solana wallet address
  wallet: string;

  // Display name (optional)
  name?: string;

  // Role in the agreement
  role: string;
}

/**
 * Dispute Content - stored at dispute reason CID
 * Explains why a subject is being challenged
 */
export interface DisputeContent {
  // Schema version
  version: 1;

  // Dispute type
  type: ContentDisputeType;

  // Title/summary
  title: string;

  // Detailed explanation of the dispute
  reason: string;

  // Evidence supporting the dispute
  evidence: Evidence[];

  // What outcome the challenger seeks
  requestedOutcome: string;

  // Metadata
  createdAt: string; // ISO timestamp

  // Reference to the subject being disputed
  subjectCid: string;

  // Platform-specific data
  platformData?: Record<string, unknown>;
}

/**
 * Dispute types for content (separate from on-chain DisputeType enum)
 */
export type ContentDisputeType =
  | "breach"        // Contract/terms violation
  | "fraud"         // Misrepresentation
  | "non_delivery"  // Failed to deliver
  | "quality"       // Quality issues
  | "refund"        // Refund request
  | "other";

/**
 * Vote Rationale Content - stored at vote rationale CID
 * Explains why a juror voted a certain way
 */
export interface VoteRationaleContent {
  // Schema version
  version: 1;

  // The juror's reasoning
  rationale: string;

  // Evidence supporting their decision
  evidence?: Evidence[];

  // Metadata
  createdAt: string; // ISO timestamp

  // Platform-specific data
  platformData?: Record<string, unknown>;
}

/**
 * Helper to create empty subject content
 */
export function createSubjectContent(
  partial: Partial<SubjectContent> & Pick<SubjectContent, "title" | "description" | "category" | "terms">
): SubjectContent {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

/**
 * Helper to create empty dispute content
 */
export function createDisputeContent(
  partial: Partial<DisputeContent> & Pick<DisputeContent, "title" | "reason" | "type" | "subjectCid" | "requestedOutcome">
): DisputeContent {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    evidence: [],
    ...partial,
  };
}

/**
 * Helper to create vote rationale content
 */
export function createVoteRationaleContent(
  partial: Partial<VoteRationaleContent> & Pick<VoteRationaleContent, "rationale">
): VoteRationaleContent {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

/**
 * Validate subject content
 */
export function validateSubjectContent(content: unknown): content is SubjectContent {
  if (!content || typeof content !== "object") return false;
  const c = content as Record<string, unknown>;

  return (
    c.version === 1 &&
    typeof c.title === "string" &&
    typeof c.description === "string" &&
    typeof c.category === "string" &&
    typeof c.terms === "object" &&
    c.terms !== null &&
    typeof (c.terms as Record<string, unknown>).text === "string"
  );
}

/**
 * Validate dispute content
 */
export function validateDisputeContent(content: unknown): content is DisputeContent {
  if (!content || typeof content !== "object") return false;
  const c = content as Record<string, unknown>;

  return (
    c.version === 1 &&
    typeof c.title === "string" &&
    typeof c.reason === "string" &&
    typeof c.type === "string" &&
    typeof c.subjectCid === "string" &&
    typeof c.requestedOutcome === "string" &&
    Array.isArray(c.evidence)
  );
}

/**
 * Validate vote rationale content
 */
export function validateVoteRationaleContent(content: unknown): content is VoteRationaleContent {
  if (!content || typeof content !== "object") return false;
  const c = content as Record<string, unknown>;

  return (
    c.version === 1 &&
    typeof c.rationale === "string"
  );
}
