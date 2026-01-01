# @craftec/scalecraft-sdk

Framework-agnostic SDK for interacting with the ScaleCraft Solana program - a decentralized arbitration protocol.

## Installation

```bash
npm install @craftec/scalecraft-sdk
# or
yarn add @craftec/scalecraft-sdk
# or
pnpm add @craftec/scalecraft-sdk
```

## Quick Start

```typescript
import { ScaleCraftClient, VoteChoiceEnum, DisputeTypeEnum } from "@craftec/scalecraft-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";

// Initialize client
const connection = new Connection("https://api.devnet.solana.com");
const keypair = Keypair.fromSecretKey(/* your secret key */);
const wallet = new Wallet(keypair);

const client = new ScaleCraftClient({ connection, wallet });

// Register as a juror with 0.1 SOL stake
const result = await client.registerJuror(new BN(100_000_000));
console.log("Signature:", result.signature);
console.log("Juror Account:", result.accounts?.jurorAccount.toBase58());
```

## Usage Examples

### Defender Pool Operations

```typescript
// Create a defender pool with 1 SOL
await client.createPool(new BN(1_000_000_000));

// Add stake to pool
await client.stakePool(new BN(500_000_000));

// Withdraw from pool
await client.withdrawPool(new BN(200_000_000));
```

### Subject Management

```typescript
import { Keypair } from "@solana/web3.js";

const subjectId = Keypair.generate().publicKey;

// Create a subject with stake
await client.createSubject({
  subjectId,
  detailsCid: "QmYourIPFSHash",
  maxStake: new BN(10_000_000_000), // 10 SOL max
  matchMode: true,
  votingPeriod: new BN(7 * 24 * 60 * 60), // 7 days
  stake: new BN(100_000_000), // 0.1 SOL
});

// Create a free subject (no stake required)
await client.createFreeSubject({
  subjectId,
  detailsCid: "QmYourIPFSHash",
  votingPeriod: new BN(7 * 24 * 60 * 60),
});
```

### Dispute Flow

```typescript
// Submit a dispute
const subject = /* subject public key */;
const subjectData = await client.fetchSubject(subject);

await client.submitDispute({
  subject,
  disputeCount: subjectData.disputeCount,
  disputeType: DisputeTypeEnum.Fraud,
  detailsCid: "QmDisputeEvidenceHash",
  bond: new BN(100_000_000),
});

// Vote on dispute
await client.voteOnDispute({
  dispute: disputePubkey,
  choice: VoteChoiceEnum.ForChallenger,
  stakeAllocation: new BN(50_000_000),
  rationaleCid: "QmVoteRationaleHash",
});

// Resolve dispute (after voting period)
await client.resolveDispute({
  dispute: disputePubkey,
  subject,
});

// Claim juror reward
await client.claimJurorReward({
  dispute: disputePubkey,
  subject,
  voteRecord: voteRecordPubkey,
});

// Unlock stake (after 7-day buffer)
await client.unlockJurorStake({
  dispute: disputePubkey,
  voteRecord: voteRecordPubkey,
});
```

### Fetching Data

```typescript
// Fetch single accounts
const juror = await client.fetchJurorByPubkey(walletPubkey);
const subject = await client.fetchSubjectById(subjectId);
const dispute = await client.fetchDispute(disputePubkey);

// Fetch all accounts
const allSubjects = await client.fetchAllSubjects();
const allDisputes = await client.fetchAllDisputes();
const allJurors = await client.fetchAllJurors();

// Fetch filtered
const disputesForSubject = await client.fetchDisputesBySubject(subjectPubkey);
const votesForDispute = await client.fetchVotesByDispute(disputePubkey);
```

### PDA Derivation

```typescript
import { pda } from "@craftec/scalecraft-sdk";

// Get PDA addresses
const [jurorAccount, bump] = pda.jurorAccount(walletPubkey);
const [subjectPda] = pda.subject(subjectId);
const [disputePda] = pda.dispute(subjectPda, disputeCount);
const [voteRecord] = pda.voteRecord(disputePda, jurorPubkey);
```

## Type Helpers

```typescript
import {
  isSubjectActive,
  isDisputeResolved,
  isChallengerWins,
  getDisputeTypeName,
  getOutcomeName,
} from "@craftec/scalecraft-sdk";

// Check status
if (isSubjectActive(subject.status)) {
  console.log("Subject is active");
}

if (isDisputeResolved(dispute.status)) {
  console.log("Outcome:", getOutcomeName(dispute.outcome));
}

// Get display names
console.log(getDisputeTypeName(dispute.disputeType)); // "Fraud", "Breach", etc.
```

## Constants

```typescript
import {
  PROGRAM_ID,
  MIN_JUROR_STAKE,
  STAKE_UNLOCK_BUFFER,
  TOTAL_FEE_BPS,
} from "@craftec/scalecraft-sdk";

console.log("Program ID:", PROGRAM_ID.toBase58());
console.log("Min juror stake:", MIN_JUROR_STAKE, "lamports");
console.log("Stake unlock buffer:", STAKE_UNLOCK_BUFFER, "seconds");
console.log("Total fee:", TOTAL_FEE_BPS / 100, "%");
```

## API Reference

### ScaleCraftClient

| Method | Description |
|--------|-------------|
| `initializeConfig()` | Initialize protocol config (admin) |
| `updateTreasury(newTreasury)` | Update treasury address (admin) |
| `createPool(initialStake)` | Create defender pool |
| `stakePool(amount)` | Add stake to pool |
| `withdrawPool(amount)` | Withdraw from pool |
| `createSubject(params)` | Create subject with stake |
| `createLinkedSubject(params)` | Create subject linked to pool |
| `createFreeSubject(params)` | Create free subject |
| `addToStake(subject, stake)` | Add stake to subject |
| `registerJuror(stakeAmount)` | Register as juror |
| `addJurorStake(amount)` | Add juror stake |
| `withdrawJurorStake(amount)` | Withdraw juror stake |
| `unregisterJuror()` | Unregister juror |
| `submitDispute(params)` | Submit dispute |
| `submitFreeDispute(params)` | Submit free dispute |
| `addToDispute(params)` | Join existing dispute |
| `submitAppeal(params)` | Submit appeal |
| `voteOnDispute(params)` | Vote on dispute |
| `voteOnAppeal(params)` | Vote on appeal |
| `addToVote(params)` | Add to existing vote |
| `resolveDispute(params)` | Resolve dispute |
| `unlockJurorStake(params)` | Unlock stake after 7 days |
| `claimJurorReward(params)` | Claim juror reward |
| `claimChallengerReward(params)` | Claim challenger reward |
| `claimDefenderReward(params)` | Claim defender reward |
| `closeEscrow(dispute)` | Close escrow |

## Requirements

- Node.js >= 18.0.0
- @solana/web3.js >= 1.90.0
- @coral-xyz/anchor >= 0.30.0

## License

MIT
