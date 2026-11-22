# Mobile Daily Claims Specification

## Purpose

Provide a safe Android workflow for authenticated wallets to check daily claim
eligibility, satisfy verification requirements, submit the existing signed daily
claim request, and verify payout status without duplicating backend reward logic.

## ADDED Requirements

### Requirement: Isolated mobile application
The Android client SHALL live in a separate `mobile/` package with its own Expo
configuration, dependency lockfile, environment configuration, and EAS build
profiles. The mobile package SHALL reuse the deployed EPWX APIs and SHALL NOT
modify the existing web frontend, database schema, reward services, or smart
contracts as part of the daily-claim milestone.

#### Scenario: Mobile development
- **WHEN** dependencies are installed or the mobile application is built
- **THEN** existing `frontend/`, `backend/`, and `contracts/` package dependencies remain unchanged

#### Scenario: Public mobile configuration
- **WHEN** the Android bundle is created
- **THEN** only public `EXPO_PUBLIC_*` values are embedded and backend credentials or private keys are absent

### Requirement: Wallet connection and session authentication
The mobile application SHALL connect an EVM wallet on Base through
Reown/WalletConnect and SHALL authenticate the wallet by requesting an existing
one-time backend challenge, signing the server-provided login message, and
submitting the result to the existing connect endpoint.

The application SHALL store only the resulting access token in Expo SecureStore
and SHALL NOT store a private key, seed phrase, signature, or login challenge.
The token SHALL be restored on startup only when the existing `/api/auth/me`
endpoint accepts it.

#### Scenario: Successful mobile login
- **WHEN** a Base wallet connects and signs the one-time login message
- **THEN** the backend verifies the signature, the app receives an access token, and authenticated wallet state is restored securely

#### Scenario: Invalid or expired stored token
- **WHEN** session restoration receives an authentication failure
- **THEN** the stored token is removed and the app displays an unauthenticated state

#### Scenario: Wallet changes
- **WHEN** the connected wallet differs from the authenticated wallet
- **THEN** authenticated actions are disabled until the active wallet completes authentication

### Requirement: Base network requirement
The mobile Daily Claim screen SHALL require the active wallet connection to use
Base with chain ID `8453`.

#### Scenario: Wallet on another network
- **WHEN** the wallet connection reports a chain other than Base
- **THEN** claim signing and submission remain disabled and the screen explains that Base is required

### Requirement: Daily claim status loading
The Daily Claim screen SHALL load claim history, email eligibility, and Telegram
verification for the active wallet. It SHALL distinguish loading, valid empty,
authenticated, unavailable, and error states.

#### Scenario: New wallet
- **WHEN** valid history contains no daily claims
- **THEN** the screen shows an open claim window, zero completed streak days, and Day 1 with one reward-draw entry

#### Scenario: History unavailable
- **WHEN** the claim history request fails or returns invalid data
- **THEN** the screen displays an explicit error and does not infer claim readiness from missing history

#### Scenario: Obsolete wallet response
- **WHEN** the wallet changes while status is loading
- **THEN** the obsolete response SHALL NOT display or enable claims for the new wallet

### Requirement: Twenty-four-hour cooldown
The application SHALL derive cooldown state from the stored latest claim time
and SHALL enforce a 24-hour client-side display before enabling submission. The
screen SHALL show a live countdown and the local date and time when the next claim
opens.

#### Scenario: Claim within cooldown
- **WHEN** the latest stored claim is less than 24 hours old
- **THEN** the claim button is disabled and the remaining duration is displayed

#### Scenario: Cooldown elapsed
- **WHEN** 24 hours have elapsed after the latest stored claim
- **THEN** the screen becomes claim-ready only if all other backend eligibility requirements are also satisfied

#### Scenario: Backend cooldown protection
- **WHEN** a submitted request reaches the backend after another eligible claim has already occurred
- **THEN** the backend remains authoritative and rejects the duplicate or concurrent claim

### Requirement: Streak and draw-entry display
The Daily Claim screen SHALL use the existing backend streak data and existing
entry schedule `[1, 1, 2, 2, 3, 3, 5]`. It SHALL display completed streak days, the
next claim day, the next draw-entry benefit, and the remaining continuation
window.

#### Scenario: Active streak
- **WHEN** the latest stored claim is Day 1 and no more than 48 hours old
- **THEN** the screen shows Day 1 complete and previews Day 2 with one draw entry

#### Scenario: Expired streak
- **WHEN** more than 48 hours have elapsed after the latest stored claim
- **THEN** completed progress is reset for display and the next claim previews Day 1 with one draw entry

#### Scenario: Completed cycle
- **WHEN** the latest stored claim is Day 7 within the continuation window
- **THEN** the screen previews a new Day 1 cycle with one draw entry

### Requirement: Verified email enrollment
The Daily Claim screen SHALL display a native email enrollment form when the
active wallet is not verified. Enrollment SHALL require the user to enter a valid
email and sign the exact existing email-enrollment message with the connected
Base wallet.

After enrollment, the app SHALL display the backend message, explain that the
verification link must be opened in email, and provide a status refresh action.

#### Scenario: Missing verified email
- **WHEN** the active wallet has no verified email
- **THEN** claim submission remains disabled and email enrollment is displayed

#### Scenario: Enrollment signature rejected
- **WHEN** the wallet signature does not match the wallet, email, or UTC date
- **THEN** the backend rejects enrollment and the app displays the returned error

#### Scenario: Email verified after app enrollment
- **WHEN** the user opens the verification link and refreshes status
- **THEN** the verified-email requirement changes to ready

#### Scenario: Verification email not delivered
- **WHEN** enrollment is stored but the verification email fails to send
- **THEN** the app displays the backend delivery warning rather than reporting verified status

### Requirement: One email identity per wallet owner
The backend SHALL normalize email addresses to lowercase and SHALL prevent a new
wallet from enrolling an email already linked to a different wallet. The daily
claim and email eligibility checks SHALL treat only the earliest existing
linkage as the owner when legacy duplicate rows already exist.

#### Scenario: Duplicate enrollment
- **WHEN** a different wallet attempts to enroll an email already linked to another wallet
- **THEN** enrollment is rejected with `EMAIL_ALREADY_LINKED` and no verification email is sent

#### Scenario: Concurrent duplicate enrollment
- **WHEN** two wallets attempt to enroll the same normalized email concurrently
- **THEN** an email-specific database lock permits only one linkage to be saved

#### Scenario: Legacy duplicate claim
- **WHEN** later legacy wallet linkages share an email with an earlier owner
- **THEN** the earliest linkage remains eligible and later duplicate-linked wallets cannot claim with that email

#### Scenario: Duplicate wallet resolves email
- **WHEN** a blocked wallet enrolls a different unclaimed email and completes verification
- **THEN** that wallet can satisfy email eligibility again, subject to every existing claim rule

### Requirement: Telegram status is an optional reward factor
The mobile application SHALL display Telegram membership status without treating
it as a mandatory claim requirement when the backend permits claims without it.
The backend remains authoritative for any reduced or adjusted reward.

#### Scenario: Unverified Telegram wallet
- **WHEN** a wallet is otherwise eligible but Telegram membership is not verified
- **THEN** the app shows the optional bonus state and does not independently block an otherwise eligible claim

### Requirement: Explicit per-claim eligibility confirmation
The age and jurisdiction confirmation SHALL start unchecked. The user SHALL be
able to check and uncheck it. The confirmation SHALL reset when the active wallet
changes and after a successful claim.

The same confirmation SHALL map to both `ageConfirmed` and
`jurisdictionConfirmed` in the daily claim request, matching the existing web and
backend contract.

#### Scenario: Initial claim form
- **WHEN** a wallet opens the Daily Claim screen
- **THEN** the eligibility confirmation is unchecked by default

#### Scenario: User reverses confirmation
- **WHEN** the user taps a checked confirmation
- **THEN** it becomes unchecked and the claim button is disabled

#### Scenario: Successful claim
- **WHEN** a claim succeeds
- **THEN** the confirmation resets and cannot be reused for a later claim without explicit reconfirmation

### Requirement: Existing daily claim signature
The mobile application SHALL sign the same dated message used by the existing web
DApp:

```text
EPWX Daily Claim for <lowercase-wallet> on <UTC-YYYY-MM-DD>
Eligibility policy: daily-reward-draw-eligibility-v1
```

The application SHALL submit the signature, wallet, `ageConfirmed`, and
`jurisdictionConfirmed` to `POST /api/epwx/daily-claim`.

#### Scenario: Successful signature
- **WHEN** the connected wallet signs the current UTC daily claim message
- **THEN** the backend verifies ownership and evaluates all remaining claim rules

#### Scenario: Rejected or cancelled signature
- **WHEN** the user rejects the wallet signature or the request fails
- **THEN** no claim request is treated as successful and the screen displays a recoverable error

### Requirement: Backend-authoritative claim result
The app SHALL show a claim as paid only when the backend response or refreshed
stored claim records identify it as paid. It SHALL NOT fabricate transaction
success from a signature approval or from a successful HTTP transport alone.

#### Scenario: Immediate paid result
- **WHEN** the backend responds with `success` and `status: paid`
- **THEN** the app displays the paid amount and refreshes history

#### Scenario: Pending payout
- **WHEN** the backend accepts the claim but reports pending status
- **THEN** the app displays queued-for-payout state and does not claim that funds are confirmed on Base

#### Scenario: Backend validation error
- **WHEN** the backend rejects the claim for age, jurisdiction, email, cooldown, signature, blocked country, or another eligibility rule
- **THEN** the app displays the backend error and does not update claim history as successful

### Requirement: Recent claim history and BaseScan links
The Daily Claim screen SHALL show recent claims with amount, claimed time, and
status. A claim with a transaction hash SHALL open that exact transaction on
BaseScan.

#### Scenario: Paid claim with transaction hash
- **WHEN** the user taps a paid claim containing a transaction hash
- **THEN** the app opens the corresponding `basescan.org/tx/<hash>` URL

#### Scenario: Pending or missing transaction hash
- **WHEN** no transaction hash is available
- **THEN** the app does not create or open an invented transaction URL

### Requirement: Safe navigation and responsive Android layout
Bottom navigation SHALL respect Android safe-area and gesture-navigation insets.
The tab bar SHALL display one label per destination and SHALL remain usable
without being covered by the system navigation area.

#### Scenario: Gesture-navigation device
- **WHEN** the app runs on a device with a bottom gesture bar
- **THEN** Home, Tasks, Draw, and Wallet labels render above the system navigation area

### Requirement: No client-side secrets or reward authority
The mobile client SHALL NOT contain reward payout private keys, backend JWT
secrets, database credentials, SMTP credentials, admin signatures, or token
distribution logic. Reward amounts, eligibility, cooldown, and payout results
SHALL continue to originate from the backend.

#### Scenario: Source inspection
- **WHEN** the Android JavaScript bundle is inspected
- **THEN** only public URLs, public Reown project metadata, app configuration, and client behavior are present
