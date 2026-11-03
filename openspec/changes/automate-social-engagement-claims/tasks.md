# Tasks

## 1. Claim And Audit Persistence

- [x] 1.1 Add backward-compatible claim verification, approval, proof-hash, and payout fields plus the `approved` lifecycle state; verify migration up/down and model persistence tests cover legacy pending, rejected, and paid claims.
- [x] 1.2 Add `social_claim_verification_attempts` and manual-decision audit persistence with claim associations; verify tests preserve ordered attempts, structured signals, sanitized failures, and override history.
- [x] 1.3 Make the reward ledger source-aware with nullable merchant fields and a unique `(source_type, source_id)` identity; verify migration tests cover existing merchant rows and prevent duplicate social-claim ledger entries.

## 2. Proof Intake And Analysis

- [x] 2.1 Harden social screenshot upload validation with server-side file signature, decode, dimensions, pixel-count, and size checks using the existing image tooling; verify focused route tests reject malformed and oversized uploads before claim analysis.
- [x] 2.2 Normalize accepted images and calculate exact SHA-256 and perceptual fingerprints; verify tests detect identical, resized, and recompressed fixtures while keeping unrelated fixtures distinct.
- [x] 2.3 Define the provider-neutral analyzer contract, versioned task rubrics, strict result schema, and one configured multimodal provider adapter; verify mocked contract tests cover valid output, malformed output, timeout, quota, and adversarial screenshot text without using production credentials.
- [x] 2.4 Implement deterministic approve, reject, and manual-review policy evaluation with configurable thresholds and enabled task types; verify table-driven tests cover every required signal, boundary values, mismatches, duplicates, and manual-only task types.
- [x] 2.5 Document analyzer credentials, model/rubric versioning, threshold settings, proof-data handling, and disabled defaults in the backend environment example; verify no credential or provider response is exposed to the browser.

## 3. Durable Verification Processing

- [x] 3.1 Persist new social claims in a queued verification state while preserving the existing manual path when automation is disabled; verify submission tests cover campaign binding, active-claim deduplication, feature flags, and user-safe initial status.
- [x] 3.2 Add a leased verification worker with transactional row claiming, bounded retries, backoff, and expired-lease recovery; verify concurrency tests show that two workers cannot finalize the same attempt or conflicting decisions.
- [x] 3.3 Schedule verification scanning with the existing PostgreSQL advisory-lock pattern and expose structured run metrics; verify enabled, disabled, lock-contention, restart-recovery, and exhausted-attempt cases.
- [x] 3.4 Apply shadow versus enforce behavior without deleting analyzer evidence; verify shadow mode leaves the claim pending and enforce mode alone can advance it to approved or rejected.

## 4. Automatic EPWX Settlement

- [x] 4.1 Extract the signer-based EPWX transfer and fee-gross-up behavior into a shared service; verify existing daily claim and daily draw payout tests retain nine-decimal amounts, configured fees, confirmation handling, and transaction hashes.
- [x] 4.2 Add social-claim settlement for approved unpaid claims with a signer lock, per-claim lease, sequential transfer, and receipt reconciliation; verify focused tests cover success, revert, ambiguous receipt, retry, disabled automation, and continued processing after one claim fails.
- [x] 4.3 Atomically finalize confirmed social payouts and their source-aware ledger records; verify repeated and concurrent settlement runs produce one transfer-finalization path and one ledger entry per claim.
- [x] 4.4 Tighten externally signed manual payout reconciliation to verify token, recipient, amount, and receipt status before marking a social claim paid; verify mismatched and replayed transactions are rejected.
- [x] 4.5 Document signer funding, automatic-settlement flags, recovery of approved unpaid claims, and ambiguous-transaction reconciliation; verify the documented rollback leaves claims available for manual payout.

## 5. Claim And Admin Experiences

- [x] 5.1 Extend claimant-facing campaign and claim responses with user-safe processing, manual-review, approved, rejected, and paid states; verify API tests do not return provider prompts, detailed evidence, internal errors, or credentials.
- [x] 5.2 Update the social proof form and campaign board to require a usable social username for automatic eligibility and show processing, review, rejection, approval, payout-failure, and paid messages; verify frontend type-check and focused component behavior.
- [x] 5.3 Extend authorized admin APIs with latest evidence, attempt history, payout state, and recorded manual overrides; verify authorization and transition tests block unauthorized access, missing override reasons, invalid state changes, and paid-claim replay.
- [x] 5.4 Update the engagement-claims admin page with confidence, signals, reason codes, attempt history, duplicate indicators, override controls, and backend settlement actions; verify frontend type-check and that paid claims cannot trigger another payout.

## 6. Integration And Rollout Verification

- [x] 6.1 Run focused backend integration tests from upload through shadow decision, enforced approval, confirmed payout, and ledger insertion with analyzer and blockchain boundaries mocked; verify uncertain and failed analyses never transfer EPWX.
- [ ] 6.2 Run backend tests plus frontend type-check/build and validate the OpenSpec change strictly; verify all commands pass without changing legacy manual claim behavior.
- [ ] 6.3 Perform a staging shadow-mode evaluation on labeled screenshots for each enabled task type and record precision, manual-review rate, false positives, latency, and analyzer failures; verify enforcement remains disabled until the documented acceptance thresholds are met.

## Workflow follow-up

- Select the production analyzer and final thresholds from the shadow-mode evaluation and approved proof-retention terms.
- Enable enforcement for one validated task type before expanding coverage.
- Enable automatic settlement only after signer funding, ledger verification, and an approved rollback drill.
- Archive the change after production verification.
