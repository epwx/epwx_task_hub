# Design: Daily Claim Cap

## Context

`POST /daily-claim` in [epwx.js](/C:/Users/veesa/NARESH_PROJECTS/GITHUB/EPWX-TASK-HUB/epwx_task_hub/backend/src/routes/epwx.js) creates a `DailyClaim` row and then calls `distributeEpwxReward`, which transfers whole EPWX (9 decimals). Before this change, nothing limited the total released per day.

## Decisions

### Cap unit and window
- The cap is in whole EPWX, default `100000000`, read from `DAILY_CLAIM_DAILY_CAP_EPWX`. Invalid values throw at startup.
- The window is the current UTC day, starting at 00:00 UTC.
- Usage is the sum of `amount` for `DailyClaim` rows with `status` in (`paid`, `pending`) and `claimedAt >= startOfTodayUtc`.

### Counting rules
- `paid` and `pending` count toward the cap. `pending` is counted because the transfer runs after the claim row is committed, so counting only `paid` would let concurrent claims overspend.
- `failed` does not count. A payout error marks the claim `failed` (the catch block in the handler), which releases its amount.
- Pre-existing `pending` rows from before this change still count until updated. A one-time data update is tracked in tasks.md.

### Partial payment
- `calculateCappedDailyClaimAmount` returns `min(requested, remaining)`, computed with BigInt on whole tokens.
- If the remaining budget is 0, the handler returns 409 `DAILY_CLAIM_CAP_REACHED` and creates no claim, and the cooldown is not started.
- Otherwise the claim is created with the capped amount, and the response includes `requestedAmount` and `dailyCapApplied`.

### Concurrency
- The handler runs in a Sequelize transaction. It calls `getOrCreateDailyClaimStats()` and locks that row with `LOCK.UPDATE`, sums today's usage, and creates the claim before commit. Concurrent claims queue on the lock.
- The transfer runs after commit and is not inside the lock, so one slow transfer does not block other claims for long.

### Gross-up fee
- The cap counts the claim amount. `distributeEpwxReward` then grosses up the transfer by `EPWX_REWARD_TRANSFER_FEE_BPS` (default 600 bps, 6%). The actual on-chain transfer can therefore be larger than the cap by that fee. This was accepted by the user.

### Overshoot
- The cap is a budget, not a hard ledger. Failed-then-retried races and the gross-up can cause a small overshoot. The user confirmed this is acceptable.

### Frontend
- `HomeTest.tsx` appends a note to the success message when `dailyCapApplied` is true. The 409 error is shown through the existing `data.error` path.

## Risks

- If `pending` claims never resolve (no retry or reconciliation exists), they keep counting until the UTC day rolls over. Check for stuck `pending` rows after deploy.
- Telegram non-member claims pay half the tier amount. They use the same cap.
