# Spec Delta

## Purpose

Defines authenticated, replay-resistant authorization for signer-backed task rewards and administrative claim payouts.

## ADDED Requirements

### Requirement: Wallet ownership is proven for task submissions
The system SHALL require a recent wallet signature bound to the submitting wallet, campaign, linked social username, timestamp, and one-time nonce.

#### Scenario: Caller owns the reward wallet
- **WHEN** a caller signs the exact task-submission message with the requested wallet
- **THEN** the system may continue to identity and task verification

#### Scenario: Caller supplies another wallet
- **WHEN** the recovered signer differs from the requested reward wallet
- **THEN** the request is rejected before social verification or blockchain writes

### Requirement: Task rewards require verified completion
The system SHALL use authoritative campaign data and positively verify the linked user's required social action before submitting or approving an on-chain completion.

#### Scenario: Linked account completed the required action
- **WHEN** wallet ownership, linked-account identity, campaign state, and social verification all pass
- **THEN** the verifier may submit and approve the completion

#### Scenario: Task cannot be verified
- **WHEN** the social verification service does not positively confirm the campaign's required action
- **THEN** no completion or approval transaction is sent

### Requirement: Administrative identity is cryptographically authenticated
The system SHALL authorize claim decisions and settlement using the recovered signer of an action-bound message and a server-configured administrator allow-list.

#### Scenario: Allow-listed administrator signs a decision
- **WHEN** an allow-listed wallet signs the exact claim, status, reason, timestamp, and nonce
- **THEN** the system may apply that decision and records the recovered wallet as actor

#### Scenario: Public admin address is supplied without proof
- **WHEN** a request contains an administrator address but no valid matching signature
- **THEN** the request is rejected

### Requirement: Signed privileged actions cannot be replayed
The system SHALL durably consume each accepted signed authorization once across restarts and backend instances.

#### Scenario: Authorization is reused
- **WHEN** a previously consumed signature is submitted again
- **THEN** the duplicate request is rejected before privileged work

#### Scenario: Authorization is stale
- **WHEN** a signature's issuance time falls outside the accepted authorization window
- **THEN** the request is rejected

### Requirement: Privileged routes resist request floods
The system SHALL apply route-specific rate limits in addition to global API limits for task submission and administrative claim actions.

#### Scenario: Client exceeds the task submission limit
- **WHEN** a client sends more task submissions than the configured route limit
- **THEN** subsequent requests are throttled without reaching social verification or blockchain signers
