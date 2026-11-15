# Spec Delta

## Purpose

Limit the total EPWX released by Daily Claims per UTC day to a fixed budget, so claim volume does not depend on EPWX price. Any eligible tier can claim until the budget is used up.

## ADDED Requirements

### Requirement: Daily EPWX budget
The system SHALL cap the total EPWX distributed by Daily Claims per UTC day at `DAILY_CLAIM_DAILY_CAP_EPWX` whole tokens, default 100,000,000.

#### Scenario: Budget not yet used
- **WHEN** no Daily Claims have been paid or reserved today
- **THEN** a claim of 100,000 EPWX is paid in full

#### Scenario: Day rollover
- **WHEN** the UTC day changes
- **THEN** the full daily budget is available again

### Requirement: Partial payment at the cap
The system SHALL pay the remaining budget when a claim exceeds it, and SHALL refuse the claim only when the remaining budget is zero.

#### Scenario: Partially covered claim
- **WHEN** 99,999,990 EPWX has been used today and a 2,000,000 EPWX claim is made
- **THEN** the claim is paid 10 EPWX and the response sets `dailyCapApplied` to true with `requestedAmount` of 2,000,000

#### Scenario: Budget exhausted
- **WHEN** today's usage equals the cap and a claim is made
- **THEN** the response is HTTP 409 with code `DAILY_CLAIM_CAP_REACHED`, no claim row is created, and the wallet's cooldown is not started

### Requirement: Any tier may claim until the cap is reached
The system SHALL NOT restrict claims by tier while the daily budget has remaining capacity. Tier thresholds, tier amounts, and Telegram non-member halving are unchanged.

#### Scenario: Higher tier before cap
- **WHEN** a wallet qualifies for the mega tier and budget remains
- **THEN** the claim is paid at the mega tier amount, capped only by the remaining budget

### Requirement: Usage counts paid and pending claims
The system SHALL count `paid` and `pending` claims toward today's usage and SHALL NOT count `failed` claims.

#### Scenario: Pending claim counts
- **WHEN** a claim for 2,000,000 EPWX is `pending` today
- **THEN** that amount is subtracted from the remaining budget

#### Scenario: Failed payout releases budget
- **WHEN** an on-chain payout fails after the claim row is created
- **THEN** the claim status is set to `failed` and its amount no longer counts toward today's usage

### Requirement: Concurrent claims cannot overspend
The system SHALL check usage and create the claim row inside one transaction that locks the platform stats row, so concurrent claims cannot exceed the budget together.

#### Scenario: Two claims at the last tokens
- **WHEN** two claims arrive at the same time and only 100,000 EPWX remains
- **THEN** the first is paid 100,000 EPWX and the second is refused with `DAILY_CLAIM_CAP_REACHED`, or is partially paid from any amount left after the first

### Requirement: Gross-up fee is outside the cap
The cap SHALL apply to the claim amount. The gross-up transfer fee (`EPWX_REWARD_TRANSFER_FEE_BPS`) SHALL NOT reduce the budget.

#### Scenario: Fee on a capped claim
- **WHEN** a claim of 1,000 EPWX is paid with a 6% gross-up
- **THEN** 1,000 EPWX is counted against the cap, and the on-chain transfer is grossed up as before

### Requirement: Invalid configuration fails fast
The system SHALL reject a `DAILY_CLAIM_DAILY_CAP_EPWX` value that is not a positive whole number when the backend starts.

#### Scenario: Non-numeric cap
- **WHEN** `DAILY_CLAIM_DAILY_CAP_EPWX` is set to `abc`
- **THEN** startup fails with a configuration error

### Requirement: Homepage messaging
The homepage SHALL tell the user when a claim was partially paid because of the daily cap, and SHALL show the cap message when a claim is refused for that reason.

#### Scenario: Partially paid
- **WHEN** a claim response has `dailyCapApplied` set to true
- **THEN** the success message includes a note that the daily cap limited the amount

#### Scenario: Refused
- **WHEN** a claim is refused with `DAILY_CLAIM_CAP_REACHED`
- **THEN** the homepage shows the server's message that today's daily claim limit has been reached

### Requirement: Preserve existing gates
The change SHALL preserve the 24-hour cooldown, eligibility checks, signature payload, tier amounts, and tier thresholds.

#### Scenario: Cooldown still applies
- **WHEN** a wallet claimed within the last 24 hours
- **THEN** no claim is paid, regardless of remaining budget
