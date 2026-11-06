# Design

## Context

The backend already schedules `runDailyDraw()` at a configurable UTC time, prevents duplicate draw dates, records selected winners as pending, and provides `distributeEpwxReward()` for confirmed EPWX transfers with nine token decimals and transfer-fee gross-up.

## Goals / Non-Goals

**Goals:**

- Connect the existing scheduled draw to the existing reward-transfer helper.
- Persist successful payout details on existing winner records.
- Keep failures isolated per winner and retryable through the existing draw date.
- Keep automatic payout separately configurable and disabled by default.

**Non-Goals:**

- Adding a scheduler, worker queue, payout outbox, health subsystem, or database table.
- Changing winner selection, draw randomness, eligibility, smart contracts, or frontend design.
- Replacing the existing manual payout endpoint.

## Decisions

### Reuse the route service

Export a focused settlement function beside `runDailyDraw()` in `epwx.js`. It loads only pending winners, calls `distributeEpwxReward()` sequentially, and updates a winner only after the transfer receipt succeeds. Sequential processing follows existing payout behavior and avoids nonce contention within a run.

### Keep payout opt-in

Add `AUTO_DAILY_DRAW_PAYOUT_ENABLED=false`. The scheduler always retains its existing selection behavior; it calls settlement only when this flag is enabled.

### Retry through the existing duplicate result

`runDailyDraw()` already returns a structured `DRAW_ALREADY_EXISTS` error containing the existing draw. The scheduler will use that draw ID to retry pending winners without selecting replacements.

### Isolate payout failures

Each winner transfer has its own error boundary. Failures are logged with winner and draw identifiers, the winner remains pending, and later pending winners still run.

## Risks / Trade-offs

- **Process exits after an on-chain transfer but before saving the winner** -> Existing behavior cannot fully close this narrow window; operators must reconcile the transaction before retrying. A durable payout outbox is intentionally out of scope.
- **Treasury balance is insufficient** -> Affected winners remain pending and can be retried after funding.
- **Automatic and manual payment run simultaneously** -> Operational guidance should avoid manual payout during the scheduled automatic run.

## Migration Plan

1. Deploy code with automatic draw payouts disabled.
2. Confirm existing scheduled draws and manual payouts behave unchanged.
3. Fund and verify the existing backend signer.
4. Enable `AUTO_DAILY_DRAW_PAYOUT_ENABLED=true`.
5. Disable that flag to roll back to manual payout without reverting data or code.
