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
- [ ] 3.4 Integration test of `POST /daily-claim` against Postgres: partial payment, 409 at zero budget, and failed-payout release
- [ ] 3.5 Concurrency check: parallel claims near the cap do not exceed the budget

## 4. Release

- [ ] 4.1 Commit only cap-related files
- [ ] 4.2 Push to `origin main`
- [ ] 4.3 Deploy on the droplet with `deployment/deploy.sh` and run the post-deploy smoke check
- [ ] 4.4 After deploy, check for `pending` DailyClaim rows older than a day and decide whether to mark them `failed`

## Follow-up (not in this change)

- Pre-existing `pending` claims still count toward today's cap. Decide whether a one-time update to `failed` is needed.
