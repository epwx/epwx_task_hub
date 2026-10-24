# Proposal

## Why

EPWX Task Hub selects winners for a daily reward draw but does not announce the results publicly. Posting the results from the official EPWX X account makes each completed draw visible to the community without requiring an administrator to compose a post manually.

## What Changes

- Publish one results post from the official EPWX X account after a daily draw completes.
- Include the draw date and each winner's prize; use shortened wallet addresses unless explicit consent for automated X mentions is recorded.
- Track announcement state per draw so retries do not create duplicate posts.
- Keep posting failures independent from draw selection and winner payouts, and make failed announcements recoverable.
- Configure official-account posting credentials on the backend; do not use a winner's or other user's connected account.
- Use dedicated `DAILY_DRAW_X_*` settings and keep publishing disabled by default, without changing existing `TWITTER_*` integrations.
- Describe selected winners without implying that pending prizes have been paid.
- Match the existing celebratory announcement style with a short caption, claim/results link, hashtags, and a generated navy-and-green winner-card PNG.
- Upload the image using the official account before creating the post; preserve duplicate prevention and do not repost already-published draws.

## Capabilities

### New Capabilities

- `daily-draw-winner-announcements`: Posting and tracking daily draw winner announcements on X.

### Modified Capabilities

None.

## Impact

- Existing daily draw scheduler and winner selection flow in the backend.
- X API client configuration and backend environment example.
- Durable announcement state associated with each draw.
- Focused tests for rendering, publication, retry, and duplicate prevention.
- Backend `sharp` PNG rendering and `twitter-text` weighted-length validation dependencies; no frontend rebuild or new database migration for the image format.
- No change to winner selection, eligibility, or reward payout behavior.
