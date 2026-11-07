# Design

## Context

The backend controls verifier and payout signers. Any route that reaches those signers is a privileged boundary even when the eventual reward is recorded on-chain. Public wallet addresses identify accounts but do not authenticate callers.

## Goals / Non-Goals

**Goals:**

- Prevent callers from claiming another wallet or administrator identity.
- Prevent reuse of captured signed requests.
- Bind approvals and payouts to the exact action the administrator reviewed.
- Verify social task completion before consuming campaign capacity or signer gas.
- Keep authorization correct across restarts and multiple PM2 workers.

**Non-Goals:**

- Replacing X OAuth.
- Changing the TaskManager contract or reward economics.
- Securing unrelated legacy administrative endpoints in this change.

## Decisions

### Use action-bound EIP-191 wallet signatures

The browser signs a human-readable message containing the wallet, resource identifier, action, decision fields, issuance time, and a random nonce. The backend reconstructs the message and recovers the signer. It never trusts a wallet string by itself.

### Persist consumed authorizations

The backend hashes the purpose and signature into `security_authorizations`, which has a unique constraint. Consumption happens after cryptographic verification and before privileged work. This makes replay rejection durable and shared across backend instances.

### Treat on-chain campaign data as authoritative

The task route loads task type, target URL, capacity, deadline, and prior completion state from TaskManager. Client-provided task metadata is not used for verification. The linked X account must match the submitted username, and the existing verification service must positively verify the required action before either blockchain transaction is sent.

### Apply route-specific throttles

Signer-backed task submissions and claim administration receive narrower limits in addition to the global API limiter. Signatures provide authorization; throttles reduce resource-exhaustion pressure.

## Rollout

Run the database migration before deploying backend and frontend changes. Existing unsigned clients will receive an authorization error and must reload the updated frontend. Monitor authorization failures, signer transactions, campaign completion rates, and settlement errors after deployment.
