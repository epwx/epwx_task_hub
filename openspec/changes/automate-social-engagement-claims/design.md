# Design

## Context

See `proposal.md` for motivation. Social engagement campaigns and screenshot claims already exist. A submission stores the campaign, task type, optional social username, wallet, reward amount, and uploaded image on `Claim`; the claim remains `pending` until an administrator rejects it or transfers EPWX from the browser and marks it paid.

The backend already has signer-based `distributeEpwxReward()` behavior for daily claims and other automated rewards. It applies the required nine EPWX decimals, transfer-fee gross-up, waits for confirmation, and returns the transaction hash. The current reward ledger is shaped around merchant claims and does not provide an idempotent source key suitable for social claims.

Screenshot interpretation is probabilistic and cannot independently prove social-account ownership. The automation therefore needs strict evidence rules, conservative thresholds, durable manual fallback, and an audit trail. Uploaded content and analyzer output are untrusted.

## Goals / Non-Goals

**Goals:**

- Make verification and payout recoverable across process restarts and multiple backend instances.
- Keep the image-analysis provider replaceable and its output schema stable.
- Separate analysis confidence from deterministic policy decisions.
- Reuse one backend EPWX transfer implementation for daily and social rewards.
- Preserve current claim routes, campaign records, manual review, and manual payout during rollout.
- Make every automated decision and transfer attributable and auditable.

**Non-Goals:**

- Proving account ownership from a screenshot alone.
- Replacing X OAuth or future first-party social API verification.
- Training or fine-tuning a custom computer-vision model.
- Automatically approving video, animated, multi-page, or unsupported proof.
- Changing reward amounts, campaign types, token contracts, or token decimals.
- Removing an administrator's ability to recover an approved unpaid claim.

## Decisions

### Use a provider-neutral screenshot analyzer

Add a server-side analyzer interface that accepts the decoded image plus normalized campaign context and returns schema-validated JSON. The context includes task type, canonical target URL and post ID, expected social username when supplied, campaign title, and a versioned task rubric.

The response contains individual signals rather than only a yes/no answer: image readability, platform, visible post identity, visible account, required action state, mismatch indicators, and confidence per signal. It also returns provider, model, rubric version, and reason codes.

This keeps business policy outside the model and permits provider changes without rewriting claim processing. Directly accepting a model's approve/reject answer was rejected because it would couple payment authority to non-deterministic free-form output.

### Treat analysis as evidence and deterministic policy as the decision maker

A policy evaluator maps validated signals to `approve`, `reject`, or `manual_review`.

- Approval requires every task-specific signal, no mismatch or duplicate signal, a usable submitted username, and confidence at or above the approval threshold.
- Rejection requires a narrow configured invalid condition at or above the rejection threshold, such as unreadable/non-proof content, confirmed target mismatch, or confirmed duplicate.
- All other results go to manual review.

Thresholds and enabled task types are configuration, but production starts conservatively in shadow mode. Poll and rating tasks can remain manual-only until their rubrics have enough labeled examples. This is safer than one aggregate confidence score or a permissive default.

### Keep business status separate from processing status

Retain `Claim.status` as the user-visible business lifecycle and add `approved` to its accepted values:

`pending -> approved -> paid`

`pending -> rejected`

Add summary fields to `claims`: `verificationStatus`, `verificationDecision`, `verificationConfidence`, `verificationCompletedAt`, `approvedAt`, `approvedBy`, `paidAt`, `txHash`, `payoutLastError`, `proofSha256`, and `proofPerceptualHash`.

Store every analyzer call in a new `social_claim_verification_attempts` table with claim ID, attempt number, status, provider/model, rubric version, structured signals, confidence, reason codes, sanitized error code, and timing. This keeps retries and admin overrides auditable without overloading the claim row.

An alternative that encoded processing, review, and payment into one status column was rejected because failures such as "approved but payout failed" cannot be represented safely.

### Use durable database scanning rather than an in-memory-only queue

Submission validates and persists the image and claim before any analyzer call. A backend worker claims eligible rows with transactional locking, marks them processing, and analyzes them. A periodic recovery scan picks up queued work and processing leases that expired after a crash.

The worker uses the repository's PostgreSQL advisory-lock pattern so only one scheduler owner scans a batch at a time; row-level state transitions still provide correctness. This avoids adding queue infrastructure while preventing work from being lost on restart. Immediate post-submission processing can reduce latency, but correctness does not depend on it.

### Fingerprint proof before external analysis

After server-side image decoding and normalization, calculate:

- SHA-256 over normalized bytes for exact duplicates.
- A perceptual hash for resized, recompressed, and lightly cropped duplicates.

Exact matches are deterministic duplicate signals. Perceptual matches use a configurable distance and are routed conservatively when similarity is not conclusive. Hashes are indexed for lookup; the full screenshot remains subject to the existing proof-retention policy.

Filename, MIME header, and client-side compression are not trusted. The server validates magic bytes, decode success, dimensions, pixel count, and size before hashing or analysis.

### Extract EPWX transfer behavior into a shared backend service

Move the existing signer-based reward transfer logic from the EPWX route module into a shared service and keep its current semantics: configured signer, nine decimals, transfer-fee gross-up, confirmed receipt, and explicit failure. Daily claims, daily draw settlement, partner settlement where applicable, and the new social settlement path call this service.

Social settlement scans only `approved` claims with no confirmed transaction. It leases one claim, submits one transfer, waits for confirmation, then atomically records `paid`, `txHash`, `paidAt`, and the ledger record. Claims are processed sequentially per signer to avoid nonce contention.

The browser-wallet transfer path remains available during rollout, but automatic settlement never asks an admin browser to sign.

### Make the reward ledger source-aware and idempotent

Extend the reward ledger with `source_type` and `source_id`, and enforce a unique index over that pair. Permit merchant-specific fields to be null for non-merchant rewards. Social payouts use `source_type = social_engagement_claim` and the claim ID, while notes include the campaign code and task type.

Writing payment state and the ledger row occurs in one database transaction after on-chain confirmation. A worker that finds a successful transaction but crashes before persistence is the remaining hard case; it must stop automatic retry and surface the claim for reconciliation when a transaction hash is known but finalization is incomplete.

### Use explicit feature gates and a staged rollout

Use independent configuration:

- `SOCIAL_CLAIM_AUTO_VERIFICATION_ENABLED=false`
- `SOCIAL_CLAIM_AUTO_SETTLEMENT_ENABLED=false`
- `SOCIAL_CLAIM_VERIFICATION_MODE=shadow|enforce`
- Approval/rejection thresholds, attempt limits, lease duration, batch size, and enabled task types

Shadow mode stores the proposed decision but leaves the business status pending. Enforce mode can change claim status. Settlement cannot run unless its own flag is enabled, regardless of verification mode.

### Preserve manual review with recorded overrides

The admin API returns the latest structured result and attempt history. Manual approval or rejection requires an admin wallet and an override reason when changing an automated decision. It appends an audit event rather than deleting analyzer evidence.

Manual payout uses the same idempotent backend settlement service when possible. The existing externally signed transaction reconciliation endpoint remains for already-submitted admin-wallet transfers and verifies that the transfer recipient, token, and amount match the claim before marking it paid.

## Risks / Trade-offs

- **False positive screenshot approval could send an irreversible reward** -> Start in shadow mode, require all signals, use high thresholds, initially enable only well-performing task types, and sample approved claims.
- **A screenshot can be fabricated or borrowed** -> Require a matching submitted username, use exact/perceptual duplicate checks, retain rate limits, and prefer linked OAuth or social API verification when available. Screenshot-only verification is explicitly lower assurance.
- **Prompt injection or adversarial text appears inside an image** -> Treat image text only as data, use a fixed server prompt, require schema output, validate every field, and make deterministic code the only payment authority.
- **Provider outage or quota exhaustion delays claims** -> Persist attempts, apply bounded retries with backoff, and route exhausted claims to manual review.
- **Provider retention could expose user proof** -> Select a provider/configuration with acceptable data controls, send only necessary campaign context, keep credentials server-side, and document retention.
- **Process exits after transfer but before database finalization** -> Persist the submitted hash as early as safely possible, reconcile receipts before retries, and require manual reconciliation when transfer outcome is ambiguous.
- **Multiple backend instances contend for the signer nonce** -> Use a settlement advisory lock and sequential transfers; retain row leases as a second guard.
- **Existing ledger requires merchant data** -> Migrate it to source-aware nullable merchant fields before enabling social settlement.
- **Analyzer cost grows with submissions** -> Reject malformed and duplicate uploads before external analysis, cap retry counts, batch conservatively, and expose usage metrics.

## Migration Plan

1. Add verification-attempt and audit persistence plus backward-compatible nullable claim fields.
2. Add source identity to the reward ledger, backfill stable source keys where possible, permit non-merchant entries, and create the unique source index.
3. Extract the shared EPWX transfer service and verify existing daily-claim and daily-draw behavior is unchanged.
4. Deploy analyzer integration with both automation flags disabled.
5. Enable verification in shadow mode for one task type and compare proposed decisions with admin decisions on a representative sample.
6. Tune thresholds and rubrics; keep unsupported or weak task types manual-only.
7. Enable verification enforcement while automatic settlement remains disabled and monitor overrides, false positives, latency, and provider errors.
8. Fund and verify the backend signer, then enable automatic settlement for approved claims.
9. Roll back by disabling settlement first and verification second. Existing approved unpaid claims remain available for manual recovery; no data rollback is required.

## Open Questions

- Select the production image-analysis provider based on accuracy, cost, latency, regional availability, and proof-retention terms; the adapter keeps this choice implementation-local.
- Set final approval and rejection thresholds from shadow-mode results rather than choosing them without production evidence.
- Define the repository-wide screenshot retention duration if no current proof-retention policy is documented.
