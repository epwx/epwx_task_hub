# Proposal

## Why

Several legacy API surfaces still trust public wallet-address strings as authorization, accept unsigned referral relationships, trust attacker-controlled forwarding headers for financial anti-abuse rules, expose uploaded evidence publicly, or issue JWTs without verifying wallet signatures.

## What Changes

- Require action-bound, replay-resistant administrator signatures across all identified administrative routes.
- Require the referred wallet to sign each referral relationship before it can become payout-eligible.
- Derive client addresses from the trusted Express proxy chain and make Nginx discard inbound forwarding headers.
- Replace public upload serving with short-lived signed evidence URLs returned only by authorized APIs.
- Require a server-issued, single-use wallet challenge before issuing login JWTs.
- Update affected administrative and referral frontend flows.

## Capabilities

### New Capabilities

- `security-boundary-hardening`: Authenticated administrative operations, referral consent, trusted proxy identity, private evidence, and verified wallet login.

### Modified Capabilities

None.
