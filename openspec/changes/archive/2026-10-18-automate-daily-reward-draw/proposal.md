# Proposal

## Why

EPWX Task Hub already schedules and records the daily reward draw, but selected winners remain pending until an administrator pays them. Reusing the existing EPWX reward-transfer helper will complete the current automation without introducing a second scheduler or payout system.

## What Changes

- Add an opt-in setting for automatic daily-draw winner payouts.
- After the existing scheduler selects and stores winners, pay pending winners with the existing EPWX reward-transfer helper.
- Store the confirmed transaction hash and payment time on the existing winner record.
- Continue processing other winners when one payout fails and leave failed winners pending for a later retry or manual payment.
- Retry pending winners when the scheduler finds that the draw for the target date already exists.
- Preserve the existing scheduler, selection algorithm, draw and winner tables, admin endpoints, and frontend.

## Capabilities

### New Capabilities

- `daily-reward-draw-automation`: Automatic settlement of pending winners produced by the existing scheduled daily draw.

### Modified Capabilities

None.

## Impact

- Existing daily-draw scheduler in `backend/src/index.js`.
- Existing draw and winner logic plus EPWX reward transfer helper in `backend/src/routes/epwx.js`.
- Backend environment example and focused payout-selection tests.
- No database migration, smart-contract change, new dependency, or frontend redesign.
