# daily-reward-draw-automation Specification

## Purpose

Defines automatic EPWX payment of pending winners selected by the existing scheduled Daily Reward Draw.

## Requirements

### Requirement: Existing draw workflow is reused
The system SHALL use the existing daily-draw scheduler, winner-selection function, draw records, and winner records for automatic draws.

#### Scenario: Scheduled draw runs
- **WHEN** the existing configured daily-draw time arrives
- **THEN** the existing scheduler selects and stores winners using the existing draw workflow

### Requirement: Automatic payout is opt-in
The system SHALL automatically pay draw winners only when both automatic draws and automatic draw payouts are enabled.

#### Scenario: Automatic payout is disabled
- **WHEN** a scheduled draw completes while automatic draw payouts are disabled
- **THEN** winners remain pending for the existing manual payout workflow

#### Scenario: Automatic payout is enabled
- **WHEN** a scheduled draw completes while automatic draw payouts are enabled
- **THEN** the system attempts to pay each pending winner

### Requirement: Existing reward transfer is reused
The system SHALL pay each pending winner with the existing EPWX reward-transfer helper and its existing token-decimal and transfer-fee behavior.

#### Scenario: Winner payment confirms
- **WHEN** the existing reward-transfer helper returns a confirmed successful transaction
- **THEN** the winner is marked paid with the transaction hash and payment time

### Requirement: Failed winners remain recoverable
The system SHALL leave a winner pending when automatic transfer fails and SHALL continue attempting the remaining pending winners.

#### Scenario: One winner payment fails
- **WHEN** one automatic winner transfer throws or does not confirm successfully
- **THEN** that winner remains pending and the system proceeds to the next pending winner

### Requirement: Existing draws retry pending winners
The scheduler SHALL retry pending winners for its target date when the draw already exists and automatic payouts are enabled.

#### Scenario: Scheduler encounters an existing draw
- **WHEN** the scheduled target date already has a draw with pending winners
- **THEN** the system skips winner reselection and attempts payment only for those pending winners

### Requirement: Paid winners are not paid again
The system SHALL exclude winners already marked paid from automatic payout attempts.

#### Scenario: Existing draw has paid and pending winners
- **WHEN** automatic settlement runs for the existing draw
- **THEN** only pending winners are passed to the reward-transfer helper
