# daily-claim-progress Specification

## Purpose
Help homepage users understand daily claim streak benefits and return timing accurately without changing rewards or eligibility rules.

## Requirements

### Requirement: Visible streak progress and next benefit
The homepage SHALL show all seven streak days and their draw-entry weights without requiring expansion. It SHALL distinguish completed days from the next successful claim's day and state that entries do not guarantee a win.

#### Scenario: New wallet
- **WHEN** a successful history response contains no claims
- **THEN** zero days are completed and the next successful claim starts day one with one draw entry

#### Scenario: Active streak
- **WHEN** the latest successful claim is day four within the continuation window
- **THEN** days one through four are completed and the next successful claim is day five with three draw entries

#### Scenario: Completed cycle
- **WHEN** the latest claim is day seven within the continuation window
- **THEN** all seven days are completed and the panel explains that the next claim starts a new day-one cycle with one entry

### Requirement: Live and consistent return timing
The homepage SHALL derive its claim-window summary, submission availability, and streak panel from the same history and clock. It SHALL show the cooldown countdown, local ready time, and remaining continuation window, and update after tab focus or time boundaries without a reload.

#### Scenario: Cooldown ends
- **WHEN** the clock reaches exactly 24 hours after the last claim
- **THEN** the cooldown ends and the next successful claim can advance the streak, subject to existing eligibility checks

#### Scenario: Continuation boundary
- **WHEN** the clock is exactly 48 hours after the last claim
- **THEN** the next claim still continues the streak

#### Scenario: Expired streak
- **WHEN** more than 48 hours have elapsed after the last claim
- **THEN** the panel clears completed progress, explains the restart, and previews day one with one entry

### Requirement: Reliable history states
The homepage SHALL distinguish unknown or unavailable history from a valid empty history. It SHALL NOT display claim-ready messaging or allow submission while history is loading or unavailable.

#### Scenario: History failure
- **WHEN** the history request fails, returns a non-success HTTP status, or contains malformed claim data
- **THEN** the homepage shows unavailable history with a retry action rather than a new streak or claim-ready state

#### Scenario: Wallet changes during a request
- **WHEN** the connected wallet changes or disconnects before history finishes loading
- **THEN** obsolete responses cannot update the current wallet's progress or cooldown

#### Scenario: Successful claim
- **WHEN** a daily claim succeeds
- **THEN** history is refreshed and the panel reflects the stored claim's cooldown and progress

### Requirement: Preserve existing incentives and consent
The change SHALL preserve the 24-hour cooldown, 48-hour continuation window, entry schedule `[1, 1, 2, 2, 3, 3, 5]`, reward tiers, eligibility checks, signature payload, and email notification preferences.

#### Scenario: User wants a reminder
- **WHEN** a user follows the panel's reminder-settings link
- **THEN** the existing email settings are reached without enabling reminders or sending a new notification

#### Scenario: Wallet is not eligible
- **WHEN** claim history is ready but required email verification or terms acceptance is missing
- **THEN** the claim remains blocked by the existing requirements

### Requirement: Personalized claim-ready email
The existing opted-in claim-ready email SHALL state the next successful claim's streak day and draw-entry benefit using the backend streak policy and the reminder run time. Plain-text and HTML versions SHALL include the claim link, eligibility and no-guaranteed-win caveats, and unsubscribe links. Personalization SHALL NOT change reminder scheduling, consent checks, delivery deduplication, or retry behavior.

#### Scenario: Active streak reminder
- **WHEN** the 24-hour cooldown has elapsed for a day-four claim within the continuation window
- **THEN** the reminder previews Day 5 with three draw entries and states the continuation deadline in UTC

#### Scenario: Delayed reminder after expiry
- **WHEN** more than 48 hours have elapsed since the previous claim
- **THEN** the reminder previews Day 1 with one entry and describes starting a fresh streak rather than retaining the expired benefit

#### Scenario: Reminder after day seven
- **WHEN** an eligible reminder follows a day-seven claim within the continuation window
- **THEN** it explains that the next successful claim begins a new cycle at Day 1 with one entry

#### Scenario: Disabled or already delivered reminder
- **WHEN** reminders are disabled, the email is unverified, the user unsubscribed, or the latest claim's reminder was already delivered
- **THEN** no reminder is sent

#### Scenario: Delivery fails
- **WHEN** SMTP delivery fails
- **THEN** the failure is reported and the claim is not marked as reminded, permitting an existing scheduler retry

### Requirement: Post-claim return invitation
After a successful homepage daily claim, the homepage SHALL use refreshed stored history to show the completed streak day, next eligible local date and time, and next claim's entry benefit. It SHALL link to existing reminder settings without changing notification preferences.

#### Scenario: Successful claim and refreshed history
- **WHEN** a day-four claim succeeds and its history refresh completes
- **THEN** the invitation states that Day 4 is complete and gives the local return time for Day 5 with three draw entries

#### Scenario: New cycle invitation
- **WHEN** the refreshed successful claim completed day seven
- **THEN** the invitation describes starting a new cycle at Day 1 with one entry

#### Scenario: History is unavailable
- **WHEN** the refreshed history is loading or cannot be retrieved
- **THEN** no return time or benefit is invented from a client-side success timestamp

#### Scenario: Return time reached or wallet changed
- **WHEN** the next eligible time is reached or a different wallet is connected
- **THEN** the prior wallet's post-claim return invitation is hidden
