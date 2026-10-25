# Design

## Context

The backend enforces a rolling 24-hour cooldown and advances a seven-day streak if the next successful claim is no later than 48 hours after the previous one. Draw entry weights are `[1, 1, 2, 2, 3, 3, 5]`; day seven is followed by day one. The homepage already requests the latest claim and offers email reminder settings.

## Goals / Non-Goals

**Goals:**
- Explain the next return's benefit without hiding the schedule.
- Keep cooldown, progress, and deadline synchronized as time passes.
- Avoid showing another wallet's history or treating request failures as an empty history.
- Preserve reward tiers, eligibility checks, signature payloads, and opt-in choices.

**Non-Goals:**
- New financial incentives, guaranteed winnings, additional reminders, or notification defaults.
- Changes to backend streak rules, payouts, draw selection, or Mini App layout.

## Decisions

### Derive progress from the latest claim and the current clock

A typed frontend utility validates the history response and derives completed days, next day, next entries, ready time, and streak deadline. A single one-second homepage clock also refreshes on focus. Exactly 24 hours is ready; exactly 48 hours still continues the streak; greater than 48 hours starts day one. Missing legacy streak fields mean day one and one entry, matching existing behavior; invalid supplied values are reported as unavailable history.

### Keep wallet-scoped history and cancel obsolete requests

History state includes the requesting wallet and explicit loading/ready/error status. Abort obsolete requests and ignore their results after cleanup. Treat only a successful response with an empty claims array as no history. Show a retry action on errors and withhold claim-ready messaging and submission until history is known. Refresh history after a successful claim, not every status-message change.

### Replace the disclosure with an always-visible progress panel

Show all seven days with entry weights, completed-day styling, and a distinct next-day highlight. Show the next successful claim's benefit, cooldown, local ready time, and continuation deadline. Explain expired streaks and cycle rollover without implying guaranteed winnings or a token payout increase. Link to the existing reminder settings without changing preferences.

### Keep scope on the homepage

Mobile summary, account window, reward heading, and submission button use the same derived state. The separate Mini App retains its existing behavior. Add dependency-free Node tests using the existing TypeScript source-stripping support in Node 22.23+.

## Risks / Trade-offs

- Frontend schedule constants mirror backend policy. Regression tests compare them with the backend utility to detect drift.
- Local device time can differ from server time; the backend remains authoritative for eligibility and submission.
- Unknown history now temporarily blocks submission instead of looking ready; explicit retry explains and recovers this state.
- A countdown updates each second, but is not an assertive live region so assistive technology is not flooded.
