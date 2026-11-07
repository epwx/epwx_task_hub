# Tasks

## 1. Durable Authorization

- [x] 1.1 Add a durable, uniquely indexed consumed-authorization table and model.
- [x] 1.2 Add canonical task and admin action messages with timestamp, signer recovery, allow-list checks, and replay rejection.
- [x] 1.3 Add focused tests for valid signatures, signer mismatch, and replay.

## 2. Task Reward Security

- [x] 2.1 Require a signed task request tied to wallet, campaign, linked X username, timestamp, and nonce.
- [x] 2.2 Load authoritative campaign data and reject inactive, expired, full, or already-completed campaigns before external or on-chain writes.
- [x] 2.3 Require the linked X identity and positive task verification before submitting and approving completion.
- [x] 2.4 Store the actual user ID, campaign reward, and both transaction identities in the task audit record.

## 3. Administrative Claim Security

- [x] 3.1 Replace request-body admin identity checks with recovered, allow-listed wallet signatures.
- [x] 3.2 Bind status decisions to status and reason, and bind settlement signatures to the exact claim.
- [x] 3.3 Update every frontend caller of the affected routes to request the corresponding signature.

## 4. Availability Controls And Verification

- [x] 4.1 Add route-specific rate limits for signer-backed task submissions and claim administration.
- [x] 4.2 Run focused backend tests and frontend type-check/build.
- [x] 4.3 Validate this OpenSpec change strictly.
- [ ] 4.4 Deploy the migration before the application update and monitor signer activity.
