# Proposal

## Why

Daily claimers need a clear reason and time to return. The homepage currently hides the seven-day progress behind a disclosure and can show an expired streak or claim-ready state when history could not be loaded.

## What Changes

- Make the seven-day progress and daily draw-entry schedule visible without expanding anything.
- Preview the next successful claim's streak day and draw entries, including the new cycle after day seven.
- Show the live 24-hour cooldown, local return time, and remaining 48-hour streak window.
- Distinguish loading, unavailable history, new wallets, and expired streaks instead of implying that an unknown wallet is ready.
- Preserve the existing email-reminder opt-in and link users to its settings.

## Capabilities

### New Capabilities

- `daily-claim-progress`: Accurate homepage streak progress, next-claim benefits, and return timing.

### Modified Capabilities

None.

## Impact

- Homepage daily-claim card, mobile summary, account claim-window status, and claim-history loading.
- Focused frontend state calculations, regression tests, and user-guide documentation.
- No new dependencies, backend changes, migrations, reward changes, notification channels, or eligibility changes.
- Does not change the separate Telegram Mini App UI.
