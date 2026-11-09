# Design

## Context

`announceDailyDraw` publishes a winners image and text to X, then `relayDailyDrawToTelegram` sends the same image to the daily-claim Telegram group with an HTML caption built by `buildDailyDrawPublishedMessage` (draw date + link to the X post). Delivery state is tracked per announcement (`telegramStatus`) with a stale-send sweep, so the relay is already idempotent and recoverable. This change only alters the caption text.

Telegram `sendPhoto` captions are limited to 1,024 characters. The current caption is roughly 160 characters. X posts are limited to 280 weighted characters and the current text already uses a fallback when it overflows, so X is out of scope.

## Goals / Non-Goals

**Goals:**

- Drive daily community votes on listing sites using a message that already reaches engaged users.
- Keep the feature off by default and harmless when misconfigured.
- Keep the announcement path free of new network calls and new failure modes.

**Non-Goals:**

- Automating votes, boosts, or any action on the listing sites.
- Changing the X post, the winners image, or the announcement state machine.
- A UI for managing links; environment configuration is sufficient for a short, rarely changing list.

## Decisions

### Environment-driven list, flag-gated

`LISTING_VOTE_LINKS_ENABLED=true` plus `LISTING_VOTE_LINKS="Label|https://url,Label|https://url"`. This mirrors the existing `DAILY_DRAW_X_*` pattern (explicit `'true'` string, disabled otherwise) so rollout and rollback are a config change and a PM2 restart. A database table or admin UI was rejected: the list changes a few times a year and the operators already manage `.env`.

### Strict parsing, lenient failure

Each entry must have a label of 1–32 characters from `[A-Za-z0-9 ._-]` and an `https:` URL with a hostname, no userinfo, no quotes or angle brackets, and at most 200 characters. At most 8 links are kept; duplicates by URL are dropped. Invalid entries are returned separately and logged with their index, but never throw: a typo in a vote link must not stop the winners announcement.

### Telegram only, caption-limit safe

The block is rendered as HTML lines (`<b>Support EPWX</b>` header + `• <a href="…">Label</a>` per link) and appended after the existing caption. `buildDailyDrawPublishedMessage` enforces the 1,024-character limit: if the combined caption would exceed it, the vote block is dropped and the base caption is sent unchanged. The base caption is never truncated.

### Escaping

Labels and URLs are passed through the module's existing `escapeHtml` before interpolation. Validation already excludes `<`, `>`, `"` and `&` from labels and URLs, so escaping is defence in depth rather than the primary control.

## Risks / Trade-offs

- **Message fatigue.** A daily block of links could feel spammy. Mitigation: a single header line and short labels; operators can trim the list or disable the flag.
- **Stale links.** A listing can move or be removed. Mitigation: links are config, not code; the listing registry in `establish-token-listing-presence` is the source of truth and is updated when a listing changes.
- **Perceived vote solicitation.** Asking the community to vote is permitted by all targeted sites; automating votes is not and is explicitly excluded.

## Rollout

1. Deploy with `LISTING_VOTE_LINKS_ENABLED=false` (default). Behaviour is identical to today.
2. Set `LISTING_VOTE_LINKS` to the live listing URLs from the registry and flip the flag; restart `epwx-api`.
3. Check the next 00:05 UTC relay in the Telegram group; confirm links render and the caption is intact.
4. Rollback: set the flag to `false` and restart.

Initial production value (from the listing registry as of 2026-11-09):

```
LISTING_VOTE_LINKS=CoinSniper|https://coinsniper.net/coin/95195,CoinMooner|https://coinmooner.com/coins/epowerx-on-base-epwx,Coinboom|https://coinboom.net/base/0xef5f5751cf3eca6cc3572768298b7783d33d60eb,Top100Token|https://top100token.com/base/0xef5f5751cf3eca6cc3572768298b7783d33d60eb,CoinCatapult|https://www.coincatapult.com/coin/epowerx-epwx-ef5f57,CoinVote|https://coinvote.cc/coin/ePowerX-On-Base
```

CoinVote was approved and added 2026-11-09. Add FreshCoins once its listing is approved and its public URL is known.
