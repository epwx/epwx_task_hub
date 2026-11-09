# Tasks

## 1. Configuration And Rendering

- [x] 1.1 Add `backend/src/utils/listingVoteLinks.cjs` with `readVoteLinks(env)` (flag, parsing, validation, max 8, dedupe, invalid report) and `renderTelegramVoteBlock(links, escapeHtml)`; verify Jest tests cover disabled flag variants, each invalid-URL and invalid-label case, the cap, deduplication, and HTML escaping.
- [x] 1.2 Extend `buildDailyDrawPublishedMessage` to accept `voteLinks` and enforce the 1,024-character Telegram caption limit by dropping the block; verify tests cover fit, overflow, and that the base caption is byte-identical when links are absent.

## 2. Relay Integration

- [x] 2.1 Read vote links in `relayDailyDrawToTelegram`, pass them to the message builder, and log invalid entries; verify the integration test shows the links in the caption when enabled, an unchanged caption when disabled, an unchanged X request body in both cases, and no HTTP request to any vote URL.
- [x] 2.2 Document `LISTING_VOTE_LINKS_ENABLED` and `LISTING_VOTE_LINKS` in `backend/.env.example` with the format and the initial production value; verify the example parses to five valid links.

## 3. Verification And Rollout

- [x] 3.1 Run the backend Jest suite and the daily-draw integration test; verify all pass with the feature disabled and enabled.
- [ ] 3.2 Deploy with the flag disabled, then set the production link list and enable; verify the next 00:05 UTC Telegram relay renders the block and the caption is intact. Record the outcome in `establish-token-listing-presence/design.md`.
