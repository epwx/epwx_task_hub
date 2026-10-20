# daily-draw-winner-announcements Specification

## Purpose

Define how completed daily reward draws are announced on X using the official EPWX account.

## ADDED Requirements

### Requirement: Official account publishes completed draw results
When announcement dispatch is enabled, the system SHALL publish one results post for each completed daily draw with winners using credentials authorized for the official EPWX X account. It SHALL NOT publish using a winner's or another user's connected account.

#### Scenario: Draw completes with winners
- **WHEN** dispatch is enabled and a daily draw has completed and its winner records have been stored
- **THEN** the system attempts to publish the results from the official EPWX X account

#### Scenario: Draw has no winners
- **WHEN** a daily draw completes without selected winners
- **THEN** the system does not create an X post

### Requirement: Announcement is independent of payout status
When dispatch is enabled, the system SHALL attempt the announcement after winner selection and SHALL NOT require winner payouts to succeed first. Announcement wording SHALL NOT imply prizes have been paid when payment is unconfirmed.

#### Scenario: Winners are pending payment
- **WHEN** a completed draw has winners whose payouts are pending or failed
- **THEN** the system can publish the selected results without changing payout status or claiming payment is complete

### Requirement: Announcement dispatch is explicitly enabled
The system SHALL dispatch announcements only when `DAILY_DRAW_X_ENABLED` is explicitly set to `true`, and SHALL default to disabled. Disabling announcements SHALL NOT disable draw selection or payouts.

#### Scenario: Dispatch is disabled
- **WHEN** `DAILY_DRAW_X_ENABLED` is absent or not set to `true`
- **THEN** the system makes no announcement-related X API requests, including retries, and preserves existing draw and payout behavior

### Requirement: Post contains bounded and privacy-aware results
The system SHALL include the draw date and each winner's prize amount in EPWX in detailed announcements. It SHALL default to shortened wallet identifiers and SHALL NOT include a full wallet address. It SHALL NOT use a linked X username as an automated mention without recorded explicit participant consent for automated winner mentions; account linking or policy acceptance alone SHALL NOT qualify as that consent. Until a consent mechanism exists, all announcements SHALL use shortened wallets.

#### Scenario: No explicit mention-consent mechanism exists
- **WHEN** a selected winner has a linked X username but the system has no recorded mention-consent mechanism
- **THEN** the announcement uses a shortened wallet identifier and does not mention the linked username

#### Scenario: Winner has no linked X username or no recorded mention consent
- **WHEN** a selected winner has no linked X username or no recorded explicit consent for automated winner mentions
- **THEN** the announcement identifies that winner using a shortened wallet address

#### Scenario: Results do not fit in one post
- **WHEN** all winner details exceed the X post length limit
- **THEN** the system uses a bounded summary with winner count, exact total EPWX prizes, and a link to the public results board where visitors can browse by draw date

#### Scenario: Oversized results have no valid public results link
- **WHEN** the details exceed the post limit and no valid results link is configured through `FRONTEND_URL`
- **THEN** the system records and reports a terminal content failure without posting or silently dropping winners

### Requirement: Publication is tracked once per draw
The system SHALL durably associate publication status and the confirmed X post ID with the draw, and SHALL NOT create another post for a draw already marked published.

#### Scenario: Scheduler revisits a published draw
- **WHEN** the scheduler encounters a draw with a recorded successful announcement
- **THEN** it skips publication for that draw

#### Scenario: X confirms publication
- **WHEN** X confirms creation and returns a post ID
- **THEN** the system records the post ID and marks the draw published

#### Scenario: Multiple backend instances dispatch the same draw
- **WHEN** competing dispatch paths attempt to publish the same stored draw
- **THEN** only one may atomically transition the announcement to sending and call X

### Requirement: Posting errors do not invalidate draws
The system SHALL preserve completed draws and winners when publication fails, record the failure, and permit recovery without reselecting winners.

#### Scenario: Rate-limited request is definitively rejected
- **WHEN** X rejects a post request with HTTP 429
- **THEN** the system records the failure and retries with exponential backoff of at least one minute, honors rate-limit headers, and stops after three total attempts

#### Scenario: Ambiguous post outcome
- **WHEN** the request outcome is unknown because the response was lost or timed out after submission
- **THEN** the system records an uncertain state and does not blindly submit a duplicate post

#### Scenario: Sending process is interrupted
- **WHEN** a sending record remains unresolved for more than five minutes
- **THEN** the retry sweep marks it uncertain and requires operator reconciliation without automatically reposting

#### Scenario: Draw is retried
- **WHEN** a recoverable unpublished draw is processed again
- **THEN** the system retries publication using the stored draw and winner records without rerunning winner selection

#### Scenario: Operator reconciles an uncertain announcement
- **WHEN** dispatch is disabled on all instances and the operator verifies the existing X post or confirms no post exists
- **THEN** the recovery command can record the verified post ID or reset the announcement for retry without changing winners or making an X request

### Requirement: Posting credentials remain server-side
The system SHALL use OAuth 1.0a credentials with Read and Write permission for the official EPWX X account, configured through `DAILY_DRAW_X_API_KEY`, `DAILY_DRAW_X_API_SECRET`, `DAILY_DRAW_X_ACCESS_TOKEN`, and `DAILY_DRAW_X_ACCESS_TOKEN_SECRET`. It SHALL keep those credentials on the backend, SHALL NOT expose or log credential values, and SHALL preserve existing `TWITTER_*` integrations.

#### Scenario: Posting credentials are unavailable
- **WHEN** dispatch is enabled and required official-account credentials are missing or invalid
- **THEN** the system records and reports the publication failure without affecting draw completion or payouts
