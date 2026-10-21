# Tasks

## 1. X Publication Configuration

- [x] 1.1 Add `DAILY_DRAW_X_ENABLED=false` and the four dedicated credential keys from the design to backend configuration and the environment example using placeholders only; preserve existing `TWITTER_*` integrations and report missing credentials explicitly when enabled.
- [x] 1.2 Add or reuse a backend X API client that creates posts using official-account OAuth 1.0a authorization with Read and Write permission.

## 2. Durable Announcement State

- [x] 2.1 Add durable per-draw announcement status and X post ID storage with a uniqueness constraint preventing more than one announcement record per draw.
- [x] 2.2 Define status transitions for pending, sending, published, failed, and uncertain outcomes, including recovery behavior for each.

## 3. Draw Integration and Content

- [x] 3.1 Compose results with draw date, EPWX prize amounts, and shortened wallets; since there is no recorded mention-consent mechanism, never use linked usernames. Test caption weighted length and image layout.
- [x] 3.2 Dispatch only when explicitly enabled, after winner selection is stored, independently of payout results; skip draws without winners and avoid claiming unconfirmed prizes have been paid.
- [x] 3.3 Integrate retries with the existing scheduler while preserving its lock, and use atomic per-record claims across manual draws and minute-long retry sweeps so unpublished draws can be retried without reselection or duplicate successful posts.
- [x] 3.4 Ensure ambiguous API outcomes are not blindly resubmitted and posting errors do not affect draw or payout results.

## 4. Verification

- [x] 4.1 Add focused mocked tests for disabled dispatch (including retries), missing credentials, no-consent wallet identifiers, truthful payout wording, content rendering, official-account authorization configuration, success persistence, transient failure recovery, ambiguous outcomes, empty draws, duplicate prevention, migration shape, and operator recovery.
- [x] 4.2 Run focused backend tests and validate the OpenSpec change strictly.

### Initial Implementation Validation

- Four focused Jest suites passed: 43 tests covering announcements and existing draw selection, eligibility, and payout helpers.
- Ten Node integration tests passed with mocked HTTP/database modules, covering the actual announcement service, atomic storage adapter, migration interface, and recovery CLI.
- JavaScript syntax checks and `git diff --check` passed.
- OpenSpec strict validation passed.
- No production environment file was read or modified; no real X requests or database migrations were executed. A deployed-database migration and controlled live publication remain operational verification steps.

## 5. Celebratory Caption and Winner Cards

- [x] 5.1 Render a short celebratory caption, claim/results link, hashtags, and the configured next-draw time only when scheduling is enabled; validate X weighted length with `twitter-text`.
- [x] 5.2 Generate an original navy-and-green PNG using `sharp`, with ordered winner cards, shortened wallets, exact prizes, and truthful PAID/PENDING badges derived from stored status, transaction hash, and payment time.
- [x] 5.3 Upload PNG media using OAuth 1.0a signed for the media endpoint, attach the returned ID to the post, isolate pre-post upload failures from uncertain create-post outcomes, and never fall back silently to text-only posts.
- [x] 5.4 Preserve existing draw timing, duplicate protection, and published announcement records; explicitly disclose the subset when more than ten winners exist.
- [x] 5.5 Verify actual PNG dimensions and upload byte limit, caption/image payment consistency, per-endpoint authorization, media failures, and original draw regressions with mocked publication.

### Card Format Validation

- Five focused Jest suites passed: 57 tests, including actual PNG rendering and existing draw selection, eligibility, and payout helpers.
- Thirteen mocked Node integration tests passed, including upload-to-post attachment wiring, media failure isolation, and duplicate protection.
- A synthetic five-winner preview was generated and visually inspected; the standard million-EPWX caption including next-draw time is 268 weighted characters.
- No new production posts or deployment actions were performed for this format update. Deploy the updated backend dependencies and code before enabling the new format on production; no additional schema or environment keys are needed.

## Operational Follow-up

- Authorize publish-capable credentials for the official EPWX X account before enabling announcement dispatch.
- Keep `DAILY_DRAW_X_ENABLED=false` until deployment and mocked tests pass; verify current API access, costs, and public draw rules before any controlled public test or live dispatch.
- Monitor failed and uncertain announcement states and reconcile uncertain requests before retrying.

## Superseded Post Cleanup

- [x] 6.1 Add opt-in flag, DELETE signing, delete-tracking migration and model fields.
- [x] 6.2 Implement cleanup selection and retry flow, hooked after publish and the retry sweep.
- [x] 6.3 Add mocked tests and README docs; deployed and verified live (draw 126 post deleted).
