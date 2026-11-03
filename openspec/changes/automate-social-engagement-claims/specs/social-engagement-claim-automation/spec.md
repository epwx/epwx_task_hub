# Spec Delta

## Purpose

Defines auditable screenshot verification and safe automatic EPWX settlement for social engagement claims while preserving manual review for uncertain evidence.

## ADDED Requirements

### Requirement: Submitted proof is bound to campaign context
The system SHALL evaluate an uploaded screenshot against the claim's campaign, task type, target social post, wallet, and submitted social username rather than treating generic engagement evidence as sufficient.

#### Scenario: Proof matches the selected campaign
- **WHEN** a user submits readable proof showing the required action on the selected campaign post from the submitted social account
- **THEN** the verification result records the matching campaign, task, post, and account signals

#### Scenario: Proof belongs to another campaign
- **WHEN** a readable screenshot shows a different post, account, or task than the selected campaign requires
- **THEN** the claim is not automatically approved

### Requirement: Verification produces structured evidence
The system SHALL store a structured verification result containing the decision, confidence, observed signals, reason codes, analyzer identity and version, and analysis timestamps.

#### Scenario: Analysis completes
- **WHEN** the screenshot analyzer returns a valid result
- **THEN** the result is saved with enough evidence and version metadata for an administrator to audit the decision

#### Scenario: Analyzer output is malformed
- **WHEN** analyzer output is missing required fields or fails schema validation
- **THEN** the system records a failed analysis attempt and does not approve the claim

### Requirement: Automatic approval is confidence gated
The system SHALL automatically approve a claim only when every required task signal is present, confidence meets the configured approval threshold, and no fraud or mismatch rule is triggered.

#### Scenario: High-confidence proof passes all rules
- **WHEN** all required campaign and task signals pass at or above the automatic-approval threshold and no risk signal is present
- **THEN** the claim is marked approved and eligible for automatic settlement

#### Scenario: One required signal is missing
- **WHEN** analysis cannot confirm any required campaign, account, post, or task signal
- **THEN** the claim is not automatically approved regardless of the aggregate confidence

### Requirement: Clear invalid proof can be rejected automatically
The system SHALL automatically reject only proof that meets a configured high-confidence invalid condition and SHALL record a user-safe rejection reason.

#### Scenario: Uploaded image is not usable proof
- **WHEN** the image is blank, unreadable, not a social engagement screenshot, or clearly does not contain the required task
- **THEN** the claim is rejected with a reason that tells the user what proof is required

#### Scenario: Invalidity is uncertain
- **WHEN** evidence suggests a mismatch but does not meet the automatic-rejection threshold
- **THEN** the claim remains pending for manual review

### Requirement: Uncertain or unavailable analysis falls back safely
The system SHALL send inconclusive claims and claims affected by analyzer timeout, quota, or service failure to the existing manual review workflow without issuing a reward.

#### Scenario: Confidence falls between decision thresholds
- **WHEN** a result meets neither the automatic-approval nor automatic-rejection threshold
- **THEN** the claim is marked as requiring manual review and remains visible in the admin queue

#### Scenario: Analyzer is unavailable
- **WHEN** screenshot analysis times out or returns a retryable service error
- **THEN** the claim remains unpaid, the failure is recorded, and the system retries or exposes it for manual review

### Requirement: Duplicate proof cannot earn multiple rewards
The system SHALL check exact and near-duplicate screenshot fingerprints across social engagement claims and SHALL not automatically approve reused proof.

#### Scenario: Exact screenshot is submitted again
- **WHEN** an uploaded screenshot has the same content fingerprint as proof on another claim
- **THEN** the new claim is flagged as duplicate and is not automatically paid

#### Scenario: Screenshot is trivially altered
- **WHEN** perceptual matching finds that a cropped, resized, or recompressed image is materially the same as prior proof
- **THEN** the claim is routed to rejection or manual review according to the configured duplicate-confidence rule

### Requirement: Verification processing is idempotent
The system SHALL prevent concurrent or repeated processing from creating conflicting final decisions or more than one payout for a claim.

#### Scenario: Claim is processed concurrently
- **WHEN** multiple workers attempt to verify or settle the same claim
- **THEN** only one worker can advance the claim from its current durable state

#### Scenario: Finalized claim is encountered again
- **WHEN** a worker receives a claim that is already rejected or paid
- **THEN** it performs no new decision or transfer

### Requirement: Approved claims use backend automatic settlement
The system SHALL settle automatically approved claims through the existing backend EPWX transfer behavior, including nine token decimals and configured transfer-fee handling.

#### Scenario: Approved claim transfer confirms
- **WHEN** the backend transfer confirms successfully for an automatically approved claim
- **THEN** the claim is marked paid with its transaction hash and payment time

#### Scenario: Automatic settlement is disabled
- **WHEN** verification approves a claim while automatic social-claim settlement is disabled
- **THEN** the approved claim remains unpaid and available to the existing manual payout workflow

### Requirement: Failed payouts remain recoverable
The system SHALL retain approved status when payout fails, record the failure, and allow a later automatic or manual retry without rerunning successful verification.

#### Scenario: Token transfer fails
- **WHEN** an approved claim transfer throws, reverts, or does not confirm successfully
- **THEN** the claim remains approved and unpaid with a recorded payout failure

#### Scenario: Settlement retries a claim
- **WHEN** a later settlement run finds an approved unpaid claim
- **THEN** it retries that claim without changing the verification evidence

### Requirement: Successful payouts are recorded once
The system SHALL create one reward-ledger record for each confirmed social engagement payout and SHALL exclude paid claims from later settlement attempts.

#### Scenario: Settlement succeeds
- **WHEN** an approved claim is paid successfully
- **THEN** one ledger entry records the claim, wallet, campaign, EPWX amount, and transaction hash

#### Scenario: Paid claim is scanned again
- **WHEN** settlement later encounters a claim already marked paid
- **THEN** no transfer or additional ledger entry is created

### Requirement: Automation is independently configurable
The system SHALL provide separate controls for screenshot verification and automatic settlement, with both controls disabled by default.

#### Scenario: Verification automation is disabled
- **WHEN** a screenshot is submitted while automatic verification is disabled
- **THEN** the claim enters the existing manual review queue without invoking the analyzer

#### Scenario: Verification enabled and settlement disabled
- **WHEN** valid proof is automatically approved while automatic settlement is disabled
- **THEN** the claim waits for manual payout

### Requirement: Users and administrators can see processing outcomes
The system SHALL expose a user-safe claim state and decision reason to the claimant and detailed evidence, attempts, and payout state to authorized administrators.

#### Scenario: Claim is being analyzed
- **WHEN** verification has not reached a decision
- **THEN** the claimant sees a processing state and cannot create another active claim for the same campaign

#### Scenario: Administrator reviews an automated decision
- **WHEN** an authorized administrator opens a social engagement claim
- **THEN** the interface shows the screenshot, analyzer signals, confidence, reason codes, attempt history, and payout status

### Requirement: Manual controls remain available
The system SHALL preserve authorized manual approval, rejection, and payout for claims that require review or operational recovery.

#### Scenario: Administrator overrides an automated decision
- **WHEN** an authorized administrator changes an unpaid automated decision and supplies a reason
- **THEN** the system records the administrator, previous decision, new decision, reason, and timestamp

#### Scenario: Paid claim is opened for review
- **WHEN** an administrator views a claim whose payout has confirmed
- **THEN** decision controls cannot trigger another payout

### Requirement: Proof data is handled securely
The system SHALL validate uploaded image type and size, keep analyzer credentials server-side, restrict detailed verification evidence to administrators, and apply the repository's proof-retention policy.

#### Scenario: Unsupported upload is submitted
- **WHEN** a file fails server-side image type, decode, dimension, or size validation
- **THEN** the submission is rejected before analysis and no reward decision is made

#### Scenario: Screenshot contains adversarial text
- **WHEN** screenshot content attempts to instruct or manipulate the analyzer
- **THEN** the content is treated only as untrusted evidence and cannot alter verification rules or output schema
