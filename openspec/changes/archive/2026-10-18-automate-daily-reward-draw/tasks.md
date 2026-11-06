# Tasks

## 1. Pending Winner Selection

- [x] 1.1 Add a small reusable helper that filters only pending winners and verify unit tests exclude paid winners.

## 2. Existing Reward Transfer Integration

- [x] 2.1 Export an automatic settlement function beside the existing draw logic that loads pending winners and reuses `distributeEpwxReward()`; verify successful payouts store paid status, transaction hash, and payment time.
- [x] 2.2 Isolate each winner payout failure so failed winners remain pending and later winners continue; verify focused tests cover mixed success and failure results.

## 3. Existing Scheduler Integration

- [x] 3.1 Add an automatic-payout environment flag defaulting to false and document it in `.env.example`.
- [x] 3.2 Invoke settlement after the existing scheduled draw and retry pending winners from the existing draw returned by `DRAW_ALREADY_EXISTS`; verify scheduler logic covers enabled, disabled, new-draw, and existing-draw paths.

## 4. Verification

- [x] 4.1 Run focused daily-draw backend tests and JavaScript syntax checks, then validate the OpenSpec change strictly.

## Workflow follow-up

- Enable automatic payouts only after confirming signer configuration and treasury funding.
- Archive the change after deployment verification.
