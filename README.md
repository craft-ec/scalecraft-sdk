# @craftec/scalecraft-sdk

SDK for integrating with ScaleCraft - a multi-tenant decentralized arbitration protocol on Solana.

## Installation

```bash
npm install @craftec/scalecraft-sdk
```

## Platform Integration Guide

ScaleCraft uses a **namespace-based multi-tenant architecture**. Each platform gets its own isolated namespace with independent protocol configuration, subjects, and disputes.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ScaleCraft Program                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Namespace A │  │  Namespace B │  │  Namespace C │          │
│  │  (Platform)  │  │  (Platform)  │  │  (Platform)  │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ • Config     │  │ • Config     │  │ • Config     │          │
│  │ • Subjects   │  │ • Subjects   │  │ • Subjects   │          │
│  │ • Disputes   │  │ • Disputes   │  │ • Disputes   │          │
│  │ • Escrows    │  │ • Escrows    │  │ • Escrows    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│  Shared Pools (Global)                                          │
│  ┌────────────────┐ ┌─────────────────┐ ┌────────────────┐     │
│  │ Defender Pools │ │ Challenger Pools│ │  Juror Pools   │     │
│  └────────────────┘ └─────────────────┘ └────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Namespace** | Unique identifier for your platform (e.g., "myplatform"). First-come-first-served, globally unique. |
| **Protocol Config** | Per-namespace configuration with authority, treasury, and min participation threshold. |
| **Subject** | An entity that can be disputed (e.g., a listing, user, content). Tied to a specific namespace. **Only namespace authority can create subjects.** |
| **Dispute** | A challenge against a subject. Goes through voting and resolution phases. |
| **Pools** | User stake pools (Defender, Challenger, Juror) are global and can participate across namespaces. |

### Access Control

| Action | Who Can Do It |
|--------|---------------|
| Create Subject | **Namespace authority only** |
| Add Defender Bond | Anyone |
| Create Dispute / Join Challengers | Anyone |
| Vote | Anyone with Juror Pool |
| Claim Rewards | Participants only |

---

## Step 1: Initialize Your Namespace

Each platform must initialize their own namespace before creating subjects.

```typescript
import { ScaleCraftClient } from "@craftec/scalecraft-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { Wallet, BN } from "@coral-xyz/anchor";

// Setup connection and wallet
const connection = new Connection("https://api.devnet.solana.com");
const platformKeypair = Keypair.fromSecretKey(/* your platform keypair */);
const wallet = new Wallet(platformKeypair);

const client = new ScaleCraftClient({ connection, wallet });

// Initialize your namespace (one-time setup)
const NAMESPACE = "myplatform"; // Choose a unique namespace
const MIN_PARTICIPATION = new BN(0); // Minimum stake required (0 = no minimum)

const result = await client.initializeConfig(NAMESPACE, MIN_PARTICIPATION);
console.log("Config PDA:", result.accounts.protocolConfig.toBase58());
```

**Important**: Namespaces are globally unique. Once claimed, no other platform can use the same namespace.

---

## Step 2: Create Subjects

Subjects are entities that can be disputed. They're tied to your namespace.

**Important**: Only the namespace authority can create subjects. This should be done from your backend server that holds the authority keypair.

```typescript
import { Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// Must be signed by namespace authority wallet
// Generate a unique subject ID (or use your own identifier)
const subjectId = Keypair.generate().publicKey;

// Create a subject with defender bond
await client.createSubject({
  namespace: NAMESPACE,
  subjectId,
  detailsCid: "QmYourIPFSHash", // IPFS hash with subject metadata
  maxBond: new BN(10_000_000_000), // 10 SOL max bond
  matchMode: true, // Challengers must match defender bond
  votingPeriod: new BN(7 * 24 * 60 * 60), // 7 days voting period
  bond: new BN(100_000_000), // 0.1 SOL initial bond
});
```

### Subject with Pool Bond

Defenders can also bond from their pool instead of directly:

```typescript
// First, create a defender pool
await client.createDefenderPool(new BN(1_000_000_000)); // 1 SOL

// Create subject using pool bond
await client.createSubjectFromPool({
  namespace: NAMESPACE,
  subjectId,
  detailsCid: "QmYourIPFSHash",
  maxBond: new BN(10_000_000_000),
  matchMode: true,
  votingPeriod: new BN(7 * 24 * 60 * 60),
  bond: new BN(100_000_000),
});
```

---

## Step 3: Dispute Flow

### 3.1 Create a Dispute

Any user can challenge a subject by creating a dispute:

```typescript
// Fetch the subject first
const subject = await client.fetchSubjectById(subjectId);

await client.createDispute({
  subjectId,
  disputeType: DisputeTypeEnum.Fraud, // See DisputeTypeEnum for options
  detailsCid: "QmDisputeEvidenceHash",
  stake: new BN(100_000_000), // Stake amount
});
```

### 3.2 Join as Additional Challenger

Other users can join an existing dispute:

```typescript
await client.joinChallengers({
  subjectId,
  stake: new BN(50_000_000),
  detailsCid: "QmAdditionalEvidenceHash",
});
```

### 3.3 Defenders Add Bond

Defenders can add more bond to protect the subject:

```typescript
// Direct bond
await client.addBondDirect({
  subjectId,
  bond: new BN(100_000_000),
});

// Or from pool
await client.addBondFromPool({
  subjectId,
  bond: new BN(100_000_000),
});
```

### 3.4 Juror Voting

Jurors stake and vote on disputes:

```typescript
// First, create a juror pool
await client.createJurorPool(new BN(500_000_000)); // 0.5 SOL

// Vote on the dispute
await client.vote({
  subjectId,
  choice: VoteChoiceEnum.ForChallenger, // or ForDefender
  stakeAllocation: new BN(100_000_000),
  rationaleCid: "QmVoteRationaleHash",
});
```

### 3.5 Resolve Dispute

After the voting period ends:

```typescript
await client.resolveDispute({ subjectId });
```

---

## Step 4: Claim Rewards

After resolution, participants claim their rewards:

```typescript
// Claim juror reward (winning side only)
await client.claimJurorReward({ subjectId, round: 1 });

// Claim challenger reward (if challenger wins)
await client.claimChallengerReward({ subjectId, round: 1 });

// Claim defender reward (if defender wins)
await client.claimDefenderReward({ subjectId, round: 1 });
```

---

## Step 5: Restoration (Re-validating Invalid Subjects)

If a subject was marked invalid, it can be restored:

```typescript
// Initiate restoration
await client.initiateRestore({
  subjectId,
  stake: new BN(200_000_000),
  detailsCid: "QmRestorationEvidenceHash",
});

// Jurors vote on restoration
await client.voteRestore({
  subjectId,
  choice: RestoreVoteChoiceEnum.ForRestoration,
  stakeAllocation: new BN(100_000_000),
  rationaleCid: "QmRestoreVoteRationale",
});

// Resolve restoration
await client.resolveDispute({ subjectId });
```

---

## Fetching Data

### Fetch Protocol Config

```typescript
const config = await client.fetchProtocolConfig(NAMESPACE);
console.log("Authority:", config.authority.toBase58());
console.log("Treasury:", config.treasury.toBase58());
console.log("Min Participation:", config.minParticipation.toString());
```

### Fetch Subjects

```typescript
// By subject ID
const subject = await client.fetchSubjectById(subjectId);

// All subjects (filter by config in your app)
const allSubjects = await client.fetchAllSubjects();
const mySubjects = allSubjects.filter(s =>
  s.account.config.equals(myConfigPda)
);
```

### Fetch Disputes and Records

```typescript
// Fetch dispute for a subject
const dispute = await client.fetchDisputeBySubjectId(subjectId);

// Fetch user records
const defenderRecord = await client.fetchDefenderRecord(subjectId, walletPubkey, round);
const challengerRecord = await client.fetchChallengerRecord(subjectId, walletPubkey, round);
const jurorRecord = await client.fetchJurorRecord(subjectId, walletPubkey, round);
```

### Fetch Pools

```typescript
const defenderPool = await client.fetchDefenderPool(walletPubkey);
const challengerPool = await client.fetchChallengerPool(walletPubkey);
const jurorPool = await client.fetchJurorPool(walletPubkey);
```

---

## PDA Derivation

Use the PDA helper for address derivation:

```typescript
import { pda } from "@craftec/scalecraft-sdk";

// Protocol Config PDA (includes namespace)
const [configPda] = pda.protocolConfig("myplatform");

// Pool PDAs (global, per user)
const [defenderPool] = pda.defenderPool(walletPubkey);
const [challengerPool] = pda.challengerPool(walletPubkey);
const [jurorPool] = pda.jurorPool(walletPubkey);

// Subject PDAs
const [subjectPda] = pda.subject(subjectId);
const [disputePda] = pda.dispute(subjectId);
const [escrowPda] = pda.escrow(subjectId);

// Round-specific Record PDAs
const [defenderRecord] = pda.defenderRecord(subjectId, walletPubkey, round);
const [challengerRecord] = pda.challengerRecord(subjectId, walletPubkey, round);
const [jurorRecord] = pda.jurorRecord(subjectId, walletPubkey, round);
```

---

## Type Helpers

```typescript
import {
  // Status checks
  isSubjectDormant,
  isSubjectValid,
  isSubjectDisputed,
  isSubjectInvalid,
  isSubjectRestoring,
  isDisputePending,
  isDisputeResolved,
  isChallengerWins,
  isDefenderWins,
  isNoParticipation,

  // Display names
  getDisputeTypeName,
  getOutcomeName,
  getBondSourceName,
} from "@craftec/scalecraft-sdk";

// Example usage
if (isSubjectDisputed(subject.status)) {
  const dispute = await client.fetchDisputeBySubjectId(subjectId);
  if (isDisputeResolved(dispute.status)) {
    console.log("Outcome:", getOutcomeName(dispute.outcome));
  }
}
```

---

## Enums

```typescript
import {
  DisputeTypeEnum,
  VoteChoiceEnum,
  RestoreVoteChoiceEnum,
  BondSourceEnum,
  SubjectStatusEnum,
  DisputeStatusEnum,
  ResolutionOutcomeEnum,
} from "@craftec/scalecraft-sdk";

// Dispute types
DisputeTypeEnum.Other
DisputeTypeEnum.Breach
DisputeTypeEnum.Fraud
DisputeTypeEnum.QualityDispute
DisputeTypeEnum.NonDelivery
DisputeTypeEnum.Misrepresentation
DisputeTypeEnum.PolicyViolation
DisputeTypeEnum.DamagesClaim

// Vote choices
VoteChoiceEnum.ForChallenger
VoteChoiceEnum.ForDefender

// Restore vote choices
RestoreVoteChoiceEnum.ForRestoration
RestoreVoteChoiceEnum.AgainstRestoration
```

---

## Constants

```typescript
import { PROGRAM_ID } from "@craftec/scalecraft-sdk";

console.log("Program ID:", PROGRAM_ID.toBase58());
// Devnet: YxF3CEwUr5Nhk8FjzZDhKFcSHfgRHYA31Ccm3vd2Mrz
```

---

## Complete Integration Example

```typescript
import { ScaleCraftClient, DisputeTypeEnum, VoteChoiceEnum } from "@craftec/scalecraft-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { Wallet, BN } from "@coral-xyz/anchor";

async function main() {
  // 1. Setup
  const connection = new Connection("https://api.devnet.solana.com");
  const wallet = new Wallet(Keypair.generate());
  const client = new ScaleCraftClient({ connection, wallet });

  const NAMESPACE = "myplatform";

  // 2. Initialize namespace (one-time)
  await client.initializeConfig(NAMESPACE, new BN(0));

  // 3. Create a subject
  const subjectId = Keypair.generate().publicKey;
  await client.createSubject({
    namespace: NAMESPACE,
    subjectId,
    detailsCid: "QmSubjectDetails",
    maxBond: new BN(10_000_000_000),
    matchMode: true,
    votingPeriod: new BN(604800), // 7 days
    bond: new BN(100_000_000),
  });

  // 4. Someone disputes the subject
  await client.createDispute({
    subjectId,
    disputeType: DisputeTypeEnum.Fraud,
    detailsCid: "QmDisputeEvidence",
    stake: new BN(100_000_000),
  });

  // 5. Jurors vote
  await client.createJurorPool(new BN(500_000_000));
  await client.vote({
    subjectId,
    choice: VoteChoiceEnum.ForChallenger,
    stakeAllocation: new BN(100_000_000),
    rationaleCid: "QmVoteRationale",
  });

  // 6. After voting period, resolve
  await client.resolveDispute({ subjectId });

  // 7. Claim rewards
  await client.claimJurorReward({ subjectId, round: 1 });
}
```

---

## Requirements

- Node.js >= 18.0.0
- @solana/web3.js >= 1.90.0
- @coral-xyz/anchor >= 0.30.0

## Networks

| Network | Program ID |
|---------|------------|
| Devnet | `YxF3CEwUr5Nhk8FjzZDhKFcSHfgRHYA31Ccm3vd2Mrz` |
| Mainnet | TBD |

## License

MIT
