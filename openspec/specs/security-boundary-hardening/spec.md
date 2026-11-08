# security-boundary-hardening Specification

## Purpose
Defines authenticated administrative operations, referral consent, trusted client-address handling, private evidence access, and verified wallet login.

## Requirements

### Requirement: Administrative requests prove wallet control
The system SHALL require a recent action-bound signature from an allow-listed administrator for every privileged API mutation or sensitive listing.

#### Scenario: Public admin address is supplied without a signature
- **WHEN** a caller supplies an allow-listed address without a valid matching request signature
- **THEN** the administrative request is rejected

### Requirement: Referral registration requires consent
The system SHALL create a wallet referral only after the referred wallet signs the exact relationship.

#### Scenario: Attacker attempts to register a victim
- **WHEN** a caller submits a victim wallet without that wallet's valid signature
- **THEN** no referral is created

### Requirement: Financial IP controls use trusted proxy data
The system SHALL discard client-provided forwarding values at the edge and derive the request address from the configured trusted proxy chain.

#### Scenario: Caller spoofs X-Forwarded-For
- **WHEN** a caller supplies an arbitrary forwarding header
- **THEN** the application records the edge-observed client address instead

### Requirement: Daily Claims enforce wallet cooldowns and trusted-IP rate controls
The system SHALL accept a Daily Claim only when the claimant proves control of the wallet, has a verified email, and the wallet has not completed another Daily Claim during the preceding 24 hours. Trusted client addresses SHALL be recorded and rate-limited, but SHALL NOT be used as a person-level eligibility identity because unrelated users can share a public address.

#### Scenario: Wallet repeats a claim during the cooldown
- **WHEN** a wallet that completed a Daily Claim during the preceding 24 hours submits another claim
- **THEN** the request is rejected with HTTP 429

#### Scenario: Different verified wallets share a public address
- **WHEN** an otherwise eligible wallet submits a Daily Claim from a trusted client address previously used by another wallet
- **THEN** the earlier claim alone does not make the new wallet ineligible

#### Scenario: One address generates excessive attempts
- **WHEN** a trusted client address exceeds the configured Daily Claim request rate
- **THEN** further attempts are temporarily rejected with HTTP 429

#### Scenario: Wallet has no verified email
- **WHEN** a wallet without a verified email submits a Daily Claim
- **THEN** the request is rejected without creating or paying a claim

### Requirement: Evidence files are private
The system SHALL not expose uploaded receipts or verification evidence through a public static directory.

#### Scenario: Authorized administrator requests evidence
- **WHEN** an authorized listing contains evidence
- **THEN** it returns a short-lived signed URL restricted to that evidence path

#### Scenario: Link is expired or path escapes uploads
- **WHEN** an evidence request is expired, tampered, or resolves outside the uploads directory
- **THEN** access is denied

### Requirement: JWT login verifies wallet ownership
The system SHALL issue a login JWT only after successful verification and one-time consumption of a server-issued wallet challenge.

#### Scenario: Caller submits an arbitrary signature
- **WHEN** the signature does not recover the challenged wallet
- **THEN** no JWT is issued
