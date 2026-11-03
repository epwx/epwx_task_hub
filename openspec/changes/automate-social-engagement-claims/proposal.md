# Proposal

## Why

Social engagement claims currently require an administrator to inspect every uploaded screenshot and manually send the reward. The system can reduce this operational workload by analyzing proof automatically, routing uncertain submissions to the existing review queue, and reusing the existing backend EPWX transfer process for approved claims.

## What Changes

- Analyze each uploaded social engagement screenshot against the selected campaign, task type, target post, and submitted social username.
- Record structured verification evidence, confidence, provider/model metadata, and decision reasons for audit and admin review.
- Automatically reject unreadable, mismatched, duplicate, or clearly invalid proof; automatically approve only proof that passes configurable high-confidence and anti-fraud rules.
- Keep ambiguous, unsupported, or failed analyses pending for manual review rather than treating them as successful.
- Queue automatically approved claims for backend settlement using the existing EPWX reward-transfer helper, nine-decimal behavior, and reward ledger.
- Make automated verification and automated settlement independently configurable, idempotent, retryable, and disabled by default for rollout.
- Update the user and admin experiences to show processing state, automated decisions, reasons, and manual-review fallbacks.

## Capabilities

### New Capabilities

- `social-engagement-claim-automation`: Screenshot-based verification, confidence-gated claim decisions, fraud controls, manual-review fallback, and automatic EPWX settlement for social engagement campaigns.

### Modified Capabilities

None.

## Impact

- Claim submission and status APIs in `backend/src/routes/claims.js`.
- Existing EPWX backend transfer helper and reward ledger integration in `backend/src/routes/epwx.js`.
- Claim persistence, verification-attempt persistence, migrations, and duplicate-proof indexes.
- Social engagement claim form and admin engagement-claims interface.
- New image-analysis provider configuration and credentials, with no credential exposed to the browser.
- Focused backend tests for verification decisions, idempotency, duplicate detection, payout retries, and failure isolation.
- No smart-contract change and no removal of the existing manual review or manual payout paths.
