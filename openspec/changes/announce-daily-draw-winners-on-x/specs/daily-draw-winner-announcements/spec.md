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
The system SHALL publish a celebratory caption with draw date, winner count, claim/results link, and hashtags within X's 280-character weighted limit. Winner prizes SHALL appear in the attached image. It SHALL use shortened wallets and SHALL NOT publish full wallets or automated mentions until explicit mention consent is supported; linking an account or accepting a privacy policy SHALL NOT imply that consent.

#### Scenario: No explicit mention-consent mechanism exists
- **WHEN** a selected winner has a linked X username but the system has no recorded mention-consent mechanism
- **THEN** the announcement uses a shortened wallet identifier and does not mention the linked username

#### Scenario: Winner has no linked X username or no recorded mention consent
- **WHEN** a selected winner has no linked X username or no recorded explicit consent for automated winner mentions
- **THEN** the announcement identifies that winner using a shortened wallet address

#### Scenario: Celebratory caption exceeds the post limit
- **WHEN** prize amounts or other caption details would exceed the X weighted post limit
- **THEN** the system uses a shorter caption retaining draw date, winner count, payment caveat, hashtags, and the public results link, with detailed prizes shown in the image or full results board

#### Scenario: No valid public results link
- **WHEN** no valid results link is configured through `FRONTEND_URL`
- **THEN** the system records and reports a terminal content failure without posting or silently dropping winners

### Requirement: Announcement includes a winner-card image
The system SHALL generate and attach a navy-and-green PNG displaying the EPWX site logo, recorded draw date, ranked winners, shortened wallets, EPWX prize amounts, and payment-status badges. The PNG SHALL be no larger than 5 MiB, and image rendering or upload failure SHALL NOT result in text-only publication.

#### Scenario: Branded image is rendered
- **WHEN** the system generates an announcement image
- **THEN** it embeds the existing EPWX site logo in the header without covering the title or winner cards

#### Scenario: Five selected winners have pending payouts
- **WHEN** a completed draw has five winners without confirmed stored payment evidence
- **THEN** the image displays all five ranked cards with PENDING badges and makes no claim that payments are complete

#### Scenario: Stored winner payout is confirmed
- **WHEN** a winner has paid status, a valid stored transaction hash, and valid payment time
- **THEN** that winner's card displays PAID, while other winners without those fields remain PENDING

#### Scenario: All payouts have stored confirmation
- **WHEN** every winner has stored paid status, transaction hash, and valid payment time at publication
- **THEN** the caption and image may state that all payouts are confirmed

#### Scenario: More than ten winners
- **WHEN** the draw contains more than ten selected winners
- **THEN** the image displays the first ten by rank, explicitly labels the subset, and directs readers to complete results by draw date on the public board

#### Scenario: PNG is uploaded successfully
- **WHEN** the official-account media upload returns a valid ready media ID
- **THEN** the create-post request attaches that media ID to the celebratory caption

#### Scenario: Media upload fails transiently before posting
- **WHEN** an image upload fails or its outcome is unknown before any create-post request
- **THEN** the system records a retryable media failure within the three-attempt budget without posting text alone

#### Scenario: Format is updated after a draw was announced
- **WHEN** a draw already has a successful stored announcement
- **THEN** the system does not edit or repost it in the new image format

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

### Requirement: Superseded announcements can be deleted automatically
When `DAILY_DRAW_X_DELETE_PREVIOUS=true`, the system SHALL delete older tracked announcement posts after a newer announcement is published, and SHALL NOT delete posts it did not publish.

#### Scenario: Newer announcement is published
- **WHEN** a newer draw announcement is published and an older tracked announcement is still live
- **THEN** the older post is deleted from X and marked deleted, while its announcement record stays published so it is never reposted

#### Scenario: Deletion fails
- **WHEN** deletion fails with a transient error
- **THEN** it is retried with backoff up to three attempts, and an already-missing post counts as deleted

#### Scenario: Feature disabled
- **WHEN** the flag is not `true`
- **THEN** no posts are deleted

### Requirement: Share confirmed X announcement links in Telegram
After a new draw announcement is confirmed published on X, the system SHALL share
its draw date and X post link in the existing daily-claim notification group using
the existing Telegram bot credentials. Telegram delivery SHALL be tracked separately
and SHALL NOT alter X publication, winner selection, or payout state.

#### Scenario: X publication succeeds
- **WHEN** X returns a valid post ID and publication is persisted
- **THEN** the bot sends the draw date and a link to that exact post to `TELEGRAM_GROUP_ID`
- **AND** concurrent workers cannot claim the same Telegram delivery twice

#### Scenario: X publication fails or is uncertain
- **WHEN** an announcement has not been confirmed published
- **THEN** no Telegram link is sent

#### Scenario: Telegram is not configured or delivery was not started before restart
- **WHEN** a live published announcement has no claimed Telegram delivery
- **THEN** the existing minute-long sweep attempts delivery once configuration is available

#### Scenario: Telegram delivery fails or is interrupted
- **WHEN** sending fails, cannot be confirmed, or the sending process is interrupted
- **THEN** the failure is logged and stored without changing X publication or payouts
- **AND** the send is not automatically repeated, to avoid duplicate messages

#### Scenario: Feature is deployed with existing announcements
- **WHEN** the Telegram delivery migration runs
- **THEN** already published announcements are marked skipped rather than shared retroactively

#### Scenario: An older X announcement is deleted
- **WHEN** automatic X cleanup deletes an older post
- **THEN** the existing Telegram message is retained, although its X link may no longer resolve
