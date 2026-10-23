# Design

## Context

The backend already schedules daily draws and stores each draw and its winner records. It also has X/Twitter OAuth integration for individual users, but those credentials belong to users and are not suitable for publishing official announcements. The announcement must use credentials authorized for the official EPWX account.

## Goals / Non-Goals

**Goals:**

- Announce completed draws from the official EPWX X account.
- Publish after winner selection, whether or not payouts have completed.
- Ensure each draw has at most one successfully recorded announcement and recover from posting failures.
- Keep the posting credentials and draw execution on the backend.

**Non-Goals:**

- Posting from a winner's or administrator's personal X account.
- Changing draw selection, payout, or eligibility behavior.
- Announcing a draw with no selected winners.
- Building a general-purpose social-media publishing system.

## Decisions

### Use official-account user-context credentials

The backend will create posts through `POST https://api.x.com/2/tweets` using OAuth 1.0a user-context credentials authorized to publish as the official EPWX account with Read and Write permission. App-only bearer credentials and OAuth 2.0 Client ID/Secret alone are not sufficient for this implementation. Credentials must be supplied through server-side environment configuration and must never be returned to clients or written to logs. Existing per-user OAuth tokens will not be used.

### Use dedicated, opt-in configuration

The implementation will read these backend-only settings:

| Setting | Purpose |
| --- | --- |
| `DAILY_DRAW_X_ENABLED` | Enable dispatch only when explicitly set to `true`; default to `false`. |
| `DAILY_DRAW_X_API_KEY` | Official announcement app's API / Consumer Key. |
| `DAILY_DRAW_X_API_SECRET` | Official announcement app's API / Consumer Secret. |
| `DAILY_DRAW_X_ACCESS_TOKEN` | Official EPWX account's OAuth 1.0a Access Token. |
| `DAILY_DRAW_X_ACCESS_TOKEN_SECRET` | Corresponding OAuth 1.0a Access Token Secret. |

Preserve all existing `TWITTER_*` settings and integrations. Disabled dispatch makes no announcement-related X API requests, including retries. Missing required credentials while enabled must produce an explicit, sanitized configuration error without preventing draw selection or payouts. Document placeholders only in the backend environment example; never copy deployment secrets into the specification or repository.

### Publish when selection completes, independently of payouts

The announcement is about selected winners, so it will be attempted once the draw and winners are durably stored and dispatch is enabled. Pending or failed EPWX transfers will not block the post. Wording must describe selection and must not claim prizes have been paid unless payment is confirmed. A draw with no winners will not produce a post.

### Render concise, privacy-aware results

Use a celebratory caption with the recorded draw date, congratulations, winner count, prize amount, claim/results link, and hashtags. Include the configured next-draw UTC time only when automatic draws are enabled. Validate the caption with `twitter-text` against X's 280-character weighted limit, including emoji and t.co URL weighting; if needed, shorten the caption without dropping the date, winner count, payment caveat, or results link. Every post links to the existing `/#latest-winners` board based on `FRONTEND_URL`, where visitors can browse by draw date. A missing valid link is a terminal content failure.

Default to shortened wallet addresses in the image. No recorded mention-consent mechanism exists, so never use linked usernames or add a consent UI as part of this change. Never publish full wallets or other profile data.

### Attach a generated winner-card image

Render an original navy-and-green SVG layout to PNG on the backend using `sharp`. Show the draw date, Base Network, ranked winners, shortened wallets, exact formatted EPWX prizes, and payment badges. Use a shared presentation model for caption and image to prevent conflicting payment claims. A winner is shown as PAID only with stored paid status, a valid transaction hash, and valid payment time; otherwise PENDING. Only say all payouts are confirmed when every winner meets that condition. Status reflects the stored records at publication and is not updated after the post is sent.

Use a 1000-pixel-wide image with height determined by the winner rows, capped at ten rows and 5 MiB. For larger draws, explicitly label the visible subset and link to the full results board. Refuse unreadable or clipped amounts rather than silently truncating them. Generation or upload failure must not fall back to a text-only post.

Upload PNG content as base64 JSON to `POST https://api.x.com/2/media/upload` with `media_category=tweet_image`, signed with OAuth 1.0a for that exact endpoint. Require a valid returned media ID and attach it through `media.media_ids` in `POST /2/tweets`. Each endpoint has its own timeout and sanitized failure boundary. Upload-only failures cannot publish a post, so transient or unknown upload failures can safely retry within the three-attempt budget; permanent media-access errors require operator recovery. Final post timeouts remain uncertain and must never automatically repost.

### Persist per-draw publication state

Use the `daily_draw_announcements` table with a unique foreign key per draw. Store status, attempt count, post ID, publication time, next attempt time, and a sanitized error code. Atomically compare-and-set pending/due failed records to `sending` before the HTTP request; this protects manual draws and concurrent retry sweeps as well as the draw scheduler. Mark a draw as published only after X confirms creation and the post ID is persisted. Skip already published records. A stale `sending` record becomes `uncertain` after five minutes and never automatically returns to pending.

Posting failures must not fail or roll back a completed draw. Retry definitive HTTP 429 rejections with exponential backoff starting at one minute, respecting Retry-After and rate-limit-reset headers, up to three total attempts. Other definitive 4xx errors are terminal until corrected and explicitly reset. Network errors, 408s, server errors, invalid success payloads, and lost responses are conservatively uncertain because they do not prove that X did not create a post. Never blindly resubmit uncertain outcomes. A CLI supports recording a verified existing post ID or resetting only after the operator confirms no post exists, with dispatch disabled on all instances.

### Reuse the existing scheduler

Integrate dispatch in `runDailyDraw()` after commit so both manual and scheduled draws use the same completion path, and in the scheduler's existing-draw path. Preserve the existing draw scheduler and lock. A non-overlapping minute-long retry sweep processes up to 20 stored pending/due announcements per pass so a failed draw remains recoverable after the daily target date advances. The per-record atomic claim is the duplicate-prevention boundary across all paths; retries do not select or pay winners. Disabled dispatch performs no storage or X operations. Do not bulk backfill historical draws.

## Risks / Trade-offs

- **X API credentials or access change** -> Leave the draw intact, record the posting failure, and alert through backend logs; recover the announcement after configuration is fixed.
- **X accepts a post but the response is lost** -> Prevent automatic duplicate creation and require reconciliation of the uncertain result.
- **Long winner list exceeds post limit** -> Use a concise summary and public results link rather than truncating or omitting winners silently.
- **Media access or PNG rendering fails** -> Record the stage-specific failure and do not publish a text-only substitute; image upload may require separate API access/credits.
- **Payments complete after publication** -> Preserve the original status snapshot and do not edit or repost the announcement automatically.
- **Official-account credentials are compromised** -> Keep them server-side, restrict access, and rotate them through deployment configuration.

## Migration Plan

1. Configure the four dedicated OAuth 1.0a credential settings for the official EPWX X account and keep `DAILY_DRAW_X_ENABLED=false`.
2. Deploy the schema and backend changes; verify formatting and failure behavior with mocked X responses before any live test. Check current API access, billing, public draw rules, and applicable promotion requirements before enabling publication. A live test on the official account is public even if the console environment is labeled Development.
3. Monitor publication status and X API failures.
4. Set `DAILY_DRAW_X_ENABLED=false` and reload backend configuration to roll back publishing without affecting draw selection or payouts; retain recorded post IDs and statuses.

For the card format update, install the updated backend dependencies before restarting the API. No new configuration or migration is required, and existing published announcement records remain untouched.

### Delete superseded announcements

Opt-in via DAILY_DRAW_X_DELETE_PREVIOUS. After a newer announcement is published, older tracked posts are removed with an OAuth 1.0a signed DELETE /2/tweets/:id. Delete state lives in separate columns so the publication status stays published. 404 counts as deleted, 401/403 are terminal, and 429/5xx/network errors retry up to three times. Manual untracked posts are never touched.

### Relay published links to the daily-claim Telegram group

Reuse `sendTelegramGroupMessage` with `TELEGRAM_BOT_TOKEN` and `TELEGRAM_GROUP_ID`.
Only after persisting confirmed X publication, build a short HTML message containing
the draw date and `https://x.com/i/status/<postId>`. Validate the post ID and escape
the date. The existing Telegram sender now uses a ten-second timeout, disallows
redirects, and requires Telegram's `ok: true` response.

An atomic transition from null to `sending` in `telegramStatus` prevents concurrent
delivery. Save `sent` with `telegramNotifiedAt`, or `failed` with a safe reason code
in `telegramErrorCode`. A five-minute stale-send check marks interrupted sends
`uncertain`; neither failed nor uncertain deliveries are automatically resent.
Telegram has no send-message idempotency key, so delivery is best effort rather
than exactly once. Operators must inspect the group before recovery.

The existing sweep picks up published, undeleted records with unclaimed delivery.
Missing Telegram configuration leaves them pending with an explicit log.
The migration marks existing published announcements `skipped` to avoid historical
spam; pause dispatch during migration. Telegram failures are isolated from draw
completion, X publication, X cleanup, and payouts. X cleanup does not remove
Telegram messages, so historical links may stop resolving.

For an explicitly authorized one-time share of a skipped announcement, use a
compare-and-set update scoped to its ID, `status=published`, `deleteStatus=null`,
and `telegramStatus=skipped`, resetting only its Telegram status to null and
clearing its Telegram error code. Invoke `relayDailyDrawToTelegram(drawId)` and
verify the stored delivery is `sent`. Do not reset sent, failed, sending, or
uncertain deliveries through this procedure. This is an operator procedure, not
a new public endpoint or recovery CLI command, and does not create a new X post.

### Attach the original X image to Telegram

Persist the rendered PNG in the nullable `winnerImage` BLOB column before uploading
it to X. PostgreSQL stores this as binary data; retaining the exact bytes avoids
rerendering a card with changed payout statuses during delayed delivery. Failure
to save the snapshot stops that dispatch before any X request.

The relay uses `sendTelegramGroupPhoto`, uploading the saved bytes as a PNG via
multipart `sendPhoto` and using the existing HTML draw-date/X-link message as its
caption. Native Node FormData and Blob are available in the supported Node 20
runtime. The request has the same timeout, confirmation check, and no-automatic-
resend policy as text delivery. Daily-claim messages continue using `sendMessage`.

Missing snapshots fail explicitly with `TELEGRAM_WINNER_IMAGE_MISSING`; do not
regenerate older cards or silently fall back to text. The additive migration
does not change existing delivery statuses or resend old notifications. Retain
snapshots (at most 5 MiB each) in database backups; list/sweep queries exclude the
binary column to avoid loading images unnecessarily.
