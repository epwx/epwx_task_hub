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

Include the draw date and each winner's prize amount in EPWX. Default to a shortened wallet address. Use a linked X username as an automated mention only when explicit participant consent for that use is recorded; account linking or acceptance of a privacy policy alone is not consent. No recorded consent mechanism exists, so this implementation uses shortened wallets for all winners rather than introducing a new consent UI. Do not publish full wallet addresses or other user profile data. Keep the composed post within the X post length limit. If the list cannot fit, use a summary with the winner count, exact total prizes, and a link to the existing `/#latest-winners` board based on `FRONTEND_URL`; visitors can browse by draw date. If a valid link is unavailable or even the summary exceeds the limit, record a terminal content failure instead of silently omitting results.

### Persist per-draw publication state

Use the `daily_draw_announcements` table with a unique foreign key per draw. Store status, attempt count, post ID, publication time, next attempt time, and a sanitized error code. Atomically compare-and-set pending/due failed records to `sending` before the HTTP request; this protects manual draws and concurrent retry sweeps as well as the draw scheduler. Mark a draw as published only after X confirms creation and the post ID is persisted. Skip already published records. A stale `sending` record becomes `uncertain` after five minutes and never automatically returns to pending.

Posting failures must not fail or roll back a completed draw. Retry definitive HTTP 429 rejections with exponential backoff starting at one minute, respecting Retry-After and rate-limit-reset headers, up to three total attempts. Other definitive 4xx errors are terminal until corrected and explicitly reset. Network errors, 408s, server errors, invalid success payloads, and lost responses are conservatively uncertain because they do not prove that X did not create a post. Never blindly resubmit uncertain outcomes. A CLI supports recording a verified existing post ID or resetting only after the operator confirms no post exists, with dispatch disabled on all instances.

### Reuse the existing scheduler

Integrate dispatch in `runDailyDraw()` after commit so both manual and scheduled draws use the same completion path, and in the scheduler's existing-draw path. Preserve the existing draw scheduler and lock. A non-overlapping minute-long retry sweep processes up to 20 stored pending/due announcements per pass so a failed draw remains recoverable after the daily target date advances. The per-record atomic claim is the duplicate-prevention boundary across all paths; retries do not select or pay winners. Disabled dispatch performs no storage or X operations. Do not bulk backfill historical draws.

## Risks / Trade-offs

- **X API credentials or access change** -> Leave the draw intact, record the posting failure, and alert through backend logs; recover the announcement after configuration is fixed.
- **X accepts a post but the response is lost** -> Prevent automatic duplicate creation and require reconciliation of the uncertain result.
- **Long winner list exceeds post limit** -> Use a concise summary and public results link rather than truncating or omitting winners silently.
- **Official-account credentials are compromised** -> Keep them server-side, restrict access, and rotate them through deployment configuration.

## Migration Plan

1. Configure the four dedicated OAuth 1.0a credential settings for the official EPWX X account and keep `DAILY_DRAW_X_ENABLED=false`.
2. Deploy the schema and backend changes; verify formatting and failure behavior with mocked X responses before any live test. Check current API access, billing, public draw rules, and applicable promotion requirements before enabling publication. A live test on the official account is public even if the console environment is labeled Development.
3. Monitor publication status and X API failures.
4. Set `DAILY_DRAW_X_ENABLED=false` and reload backend configuration to roll back publishing without affecting draw selection or payouts; retain recorded post IDs and statuses.
