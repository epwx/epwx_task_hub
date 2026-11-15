# Tasks

## 1. Backend cap

- [x] 1.1 Add `backend/src/utils/dailyClaimCap.cjs` with default, parsing, and capped-amount calculation
- [x] 1.2 Enforce the cap in `POST /daily-claim` inside a transaction that locks the platform stats row
- [x] 1.3 Return HTTP 409 `DAILY_CLAIM_CAP_REACHED` when the budget is zero, without creating a claim
- [x] 1.4 Mark claims `failed` when the payout throws, so they release budget
- [x] 1.5 Add `requestedAmount` and `dailyCapApplied` to the success response
- [x] 1.6 Document `DAILY_CLAIM_DAILY_CAP_EPWX` in `backend/.env.example`
- [x] 1.7 Update the `DailyClaim` status comment to include `failed`

## 2. Frontend

- [x] 2.1 Show a cap note in the `HomeTest.tsx` success message when `dailyCapApplied` is true

## 3. Verification

- [x] 3.1 Unit tests for cap parsing and capped-amount math in `backend/test/dailyClaimCap.test.js`
- [x] 3.2 `node --check` on `backend/src/routes/epwx.js`
- [x] 3.3 Frontend `tsc --noEmit`
- [x] 3.4 Integration check against Postgres (local copy of production schema): partial payment, 409 at zero budget, and failed-payout release. It runs the route's reservation steps directly, not over HTTP.
- [x] 3.5 Concurrency check: 6 parallel claims near the cap grant exactly the remaining budget and never exceed it

## 4. Release

- [x] 4.1 Commit only cap-related files (`fbc232a`)
- [x] 4.2 Push to `origin main`
- [x] 4.3 Deploy to the droplet (backend and frontend narrow commands, merge commit `0e29915`) and pass the post-deploy smoke check (6/6)
- [x] 4.4 Checked production `daily_claims`: no `pending` rows, 5 `failed` rows, 8842 `paid`

## Follow-up (not in this change)

- No production `pending` claims remain, so no one-time cleanup is needed.
