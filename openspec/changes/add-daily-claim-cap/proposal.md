# Proposal: Cap Daily Claim Distribution by Total EPWX per Day

## Status

Implemented in the working tree. Not yet committed or deployed.

## Why

Daily claim rewards are paid in fixed EPWX amounts per tier. The payout is not tied to price, so a rise in the EPWX price makes each claim more expensive in USD terms. Claimers who expect a rising price may sell claimed tokens, which adds sell pressure. A fixed daily token budget bounds how much EPWX the daily claim can release, regardless of price or the number of claimers.

## What Changes

- Add a daily cap on total EPWX distributed by Daily Claims, counted per UTC day, default 100,000,000 EPWX.
- Claims that would exceed the remaining budget are paid partially (the remaining amount). When the budget is zero, the claim is refused with HTTP 409 and code `DAILY_CLAIM_CAP_REACHED`.
- Any eligible tier can claim until the cap is reached. The cap does not change tier amounts or eligibility.
- Failed on-chain payouts release their amount back to the day's budget.
- Make the cap configurable with `DAILY_CLAIM_DAILY_CAP_EPWX`.
- The homepage shows a note when a claim was partially paid because the cap applied.

## Impact

- Backend: `POST /daily-claim` runs in a transaction that locks the platform stats row, sums today's `paid` and `pending` claims, and creates the claim for the capped amount.
- Backend: failed payouts are marked `failed` so they no longer count toward the cap.
- Frontend: the claim success message appends a cap note when `dailyCapApplied` is true.
- Config: `backend/.env.example` documents `DAILY_CLAIM_DAILY_CAP_EPWX`.
- Existing gates (24-hour cooldown, eligibility, signature payload, tier amounts, Telegram half-amount rule) are unchanged.

## Out of Scope

- Pricing, USD-pegged rewards, or any use of the Biconomy or on-chain price.
- Lifetime or pooled caps across days.
- Vesting or lock-up of claimed tokens.
- Changing the 6% gross-up transfer fee (`EPWX_REWARD_TRANSFER_FEE_BPS`). The cap counts the claim amount, not the grossed-up on-chain transfer.
- Hard enforcement to the exact token. A small overshoot is accepted, as noted in the design.
- Releasing claims that were left `pending` before this change. A one-time data update is a follow-up task, see tasks.md.
