# Proposal

## Why

EPWX is now listed on several community voting directories (CoinSniper, CoinMooner, CoinVote, FreshCoins, Coinboom, Top100Token, CoinCatapult). Rank on those sites is driven by one free vote per user per day, and higher rank brings organic visitors to `tasks.epowex.com`. Today nothing reminds the community to vote. The daily-draw announcement already reaches the most engaged users every day via the Telegram group relay, so appending a short "support EPWX" block with the vote links turns an existing, trusted message into a daily vote driver at zero cost — without automating votes themselves, which would violate every site's terms.

## What Changes

- Add an operator-configured list of listing vote links (label + HTTPS URL), disabled by default.
- When enabled, append a "Support EPWX" block with those links to the Telegram caption that relays each published daily-draw X post.
- Validate the configuration defensively: only HTTPS, no credentials in URLs, bounded label characters, bounded count; invalid entries are skipped and logged, never breaking the announcement.
- Never let the vote block push the Telegram caption past Telegram's limit; drop the block before shortening the base announcement.
- Leave the X post text unchanged (280-character budget is already fully used) and never automate votes.

## Capabilities

### New Capabilities

- `listing-vote-reminders`: Configurable vote-link block appended to the daily-draw Telegram relay.

### Modified Capabilities

None. `daily-draw-winner-announcements` behaviour is unchanged when the feature is disabled or misconfigured.

## Impact

- `backend/src/utils/listingVoteLinks.cjs` (new): config parsing, validation, Telegram HTML rendering.
- `backend/src/services/telegramNotifications.js`: `buildDailyDrawPublishedMessage` accepts optional vote links and enforces the caption limit.
- `backend/src/services/dailyDrawAnnouncements.js`: Telegram relay reads the config and passes links.
- `backend/.env.example`: `LISTING_VOTE_LINKS_ENABLED`, `LISTING_VOTE_LINKS`.
- Tests: new Jest unit tests for the utility; new assertions in the existing Node integration test for the relay.
- No database, contract, X-post, or frontend change.
