# Proposal

## Why

Task submissions currently trust an arbitrary wallet and immediately approve an on-chain reward without verifying the caller or the required social action. Administrative claim approval and settlement similarly trust a public wallet-address string as proof of authority. Bots can exploit these paths to consume campaign capacity, drain reward balances, exhaust signer gas, and prevent legitimate users from being served.

## What Changes

- Require fresh wallet signatures for task submissions and privileged claim actions.
- Bind each signature to the exact wallet, campaign or claim, action, decision data, timestamp, and nonce.
- Persist a one-time authorization identity so signed requests cannot be replayed across processes or backend instances.
- Verify that a task submitter owns the requested wallet, uses the X account linked to that wallet, and completed the on-chain campaign's actual task before the verifier submits or approves a completion.
- Resolve administrative authority from the recovered signer rather than request-provided identity.
- Add narrow rate limits around signer-backed and administrative operations.
- Update all affected frontend flows to request an explicit wallet signature.

## Capabilities

### New Capabilities

- `privileged-reward-action-security`: Signed, replay-resistant authorization and verified task rewards for signer-backed operations.

### Modified Capabilities

None.

## Impact

- Task and claim routes, wallet-signature utilities, user identity fields, and a durable authorization table.
- Task submission and claim-administration frontend flows.
- Focused authorization tests and deployment migration requirements.
- Existing campaign contracts and token decimals remain unchanged.
