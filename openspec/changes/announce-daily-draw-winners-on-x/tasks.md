# Tasks

## 1. X Publication Configuration

- [x] 1.1 Add `DAILY_DRAW_X_ENABLED=false` and the four dedicated credential keys from the design to backend configuration and the environment example using placeholders only; preserve existing `TWITTER_*` integrations and report missing credentials explicitly when enabled.
- [x] 1.2 Add or reuse a backend X API client that creates posts using official-account OAuth 1.0a authorization with Read and Write permission.

## 2. Durable Announcement State

- [x] 2.1 Add durable per-draw announcement status and X post ID storage with a uniqueness constraint preventing more than one announcement record per draw.
- [x] 2.2 Define status transitions for pending, sending, published, failed, and uncertain outcomes, including recovery behavior for each.

## 3. Draw Integration and Content

- [x] 3.1 Compose results with draw date, EPWX prize amounts, and shortened wallets; since there is no recorded mention-consent mechanism, never use linked usernames. Test detailed and summary post-length handling.
- [x] 3.2 Dispatch only when explicitly enabled, after winner selection is stored, independently of payout results; skip draws without winners and avoid claiming unconfirmed prizes have been paid.
- [x] 3.3 Integrate retries with the existing scheduler while preserving its lock, and use atomic per-record claims across manual draws and minute-long retry sweeps so unpublished draws can be retried without reselection or duplicate successful posts.
- [x] 3.4 Ensure ambiguous API outcomes are not blindly resubmitted and posting errors do not affect draw or payout results.

## 4. Verification

- [x] 4.1 Add focused mocked tests for disabled dispatch (including retries), missing credentials, no-consent wallet identifiers, truthful payout wording, content rendering, official-account authorization configuration, success persistence, transient failure recovery, ambiguous outcomes, empty draws, duplicate prevention, migration shape, and operator recovery.
- [x] 4.2 Run focused backend tests and validate the OpenSpec change strictly.

### Validation Results

- Four focused Jest suites passed: 43 tests covering announcements and existing draw selection, eligibility, and payout helpers.
- Ten Node integration tests passed with mocked HTTP/database modules, covering the actual announcement service, atomic storage adapter, migration interface, and recovery CLI.
- JavaScript syntax checks and `git diff --check` passed.
- OpenSpec strict validation passed.
- No production environment file was read or modified; no real X requests or database migrations were executed. A deployed-database migration and controlled live publication remain operational verification steps.

## Operational Follow-up

- Authorize publish-capable credentials for the official EPWX X account before enabling announcement dispatch.
- Keep `DAILY_DRAW_X_ENABLED=false` until deployment and mocked tests pass; verify current API access, costs, and public draw rules before any controlled public test or live dispatch.
- Monitor failed and uncertain announcement states and reconcile uncertain requests before retrying.
