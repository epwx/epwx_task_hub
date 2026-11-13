# Spec Delta

## Purpose

Require a recent verified EPWX purchase before higher daily claim tiers are paid, while keeping the base daily claim open to all eligible wallets.

## ADDED Requirements

### Requirement: Base claim remains ungated
The system SHALL pay the base daily claim (100,000 EPWX) to any eligible wallet that meets the existing requirements, without a purchase condition.

#### Scenario: Holder below mid threshold
- **WHEN** a wallet holds less than 10,000,000,000 EPWX and passes existing eligibility checks
- **THEN** the claim is paid at 100,000 EPWX with no purchase check

### Requirement: Higher tiers require a recent qualifying purchase
The system SHALL pay mid (2,000,000), bonus (5,000,000), or mega (10,000,000) EPWX only when the wallet also has a verified qualifying purchase within the purchase window.

A qualifying purchase is a transfer of EPWX from the EPWX/WETH liquidity pair to the wallet, verified on-chain, with a net amount at least the minimum purchase size.

- Purchase window: **TBD** (proposed 30 days).
- Minimum purchase size: **TBD** (proposed 10% of the tier's balance threshold).

#### Scenario: Qualifying purchase within window
- **WHEN** a wallet holds at least the mid threshold and has a verified purchase within the window of at least the minimum size
- **THEN** the mid claim is paid at 2,000,000 EPWX

#### Scenario: Balance without purchase
- **WHEN** a wallet holds at least the mid threshold but has no verified purchase within the window
- **THEN** the claim is paid at the base 100,000 EPWX and the response states that the higher tier requires a recent purchase

#### Scenario: Dust purchase
- **WHEN** the only purchase within the window is below the minimum size
- **THEN** the wallet does not qualify for the higher tier

#### Scenario: Purchase outside window
- **WHEN** the last qualifying purchase is older than the window
- **THEN** the wallet does not qualify for the higher tier until a new purchase is verified

### Requirement: Balance threshold still applies on claim day
The system SHALL check the wallet's balance against the tier threshold on the day of the claim, in addition to the purchase requirement.

#### Scenario: Purchase but sold below threshold
- **WHEN** a wallet made a qualifying purchase but its balance is below the mid threshold on the claim day
- **THEN** the claim is paid at the tier matching its current balance, with the purchase requirement applied to that tier

### Requirement: Optional hold period after purchase
The system MAY require the balance to be held for a minimum period after the last qualifying purchase before a higher tier is paid.

- Hold period: **TBD** (proposed 7 days). Not in effect until decided.

#### Scenario: Hold period not met
- **WHEN** the hold period is enabled and the last qualifying purchase is more recent than the hold period
- **THEN** the higher tier is not paid and the response shows the date the hold period completes

### Requirement: Clear user messaging
The homepage SHALL show, for each higher tier, whether the purchase requirement is met, the purchase window, and the minimum size, and SHALL NOT show a higher-tier claim as ready while the requirement is unmet.

#### Scenario: Requirement unmet
- **WHEN** the wallet's balance qualifies for a higher tier but the purchase requirement is unmet
- **THEN** the homepage shows the base claim as available and the higher tier as locked with the requirement described

### Requirement: Preserve existing gates
The change SHALL preserve the 24-hour cooldown, eligibility checks, signature payload, reward amounts, and tier thresholds.

#### Scenario: Cooldown still applies
- **WHEN** a wallet claimed within the last 24 hours
- **THEN** no claim is paid regardless of purchase status
