# Tasks

## 1. Progress state

- [x] 1.1 Add typed history validation and deterministic progress calculations covering cooldown, streak expiry, and cycle rollover.
- [x] 1.2 Integrate wallet-scoped history loading, cancellation, retry, success refresh, and one live clock into the homepage.

## 2. Homepage experience

- [x] 2.1 Replace the collapsed streak details with a visible seven-day entry schedule, next-claim benefit, return time, continuation window, and existing reminder-settings link.
- [x] 2.2 Keep mobile summary, account claim window, reward heading, and claim button consistent for loading, error, cooldown, and ready states.
- [x] 2.3 Update the daily-claim user guide without changing reward or notification policy.

## 3. Validation

- [x] 3.1 Add and run focused tests for history validation, timing boundaries, schedule parity, expired streaks, and cycle rollover.
- [x] 3.2 Run frontend type checking and focused linting; verify responsive presentation and error/retry behavior.
- [x] 3.3 Validate the OpenSpec change and record implementation and verification completion.

## Verification

- `npm run test:daily-claim` in `frontend`: 27 tests passed.
- Frontend TypeScript check and focused ESLint check: passed.
- `npm run build` in `frontend`: production compilation, lint, types, and all 37 static pages passed.
- Existing backend streak and draw-selection suites: 13 tests passed.
- Integrated-browser checks with a mocked wallet and API: visible schedule, new-wallet state, HTTP error and retry, loading submission guard, cooldown return time, terms gating, live expiry, day-seven rollover, obsolete wallet response protection, and successful claim refresh passed. No real claims or payouts were submitted.
- Responsive checks: no page overflow at 320px, 375px, and 1440px; all entry labels fit their cells after wrapping the small-screen schedule into two rows.
- `openspec validate improve-daily-claim-progress --strict`: passed.
- Existing unrelated backend and OpenSpec worktree changes were preserved.
