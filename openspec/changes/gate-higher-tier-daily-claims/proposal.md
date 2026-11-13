# Proposal: Gate Higher-Tier Daily Claims on Verified Purchases

## Status

Draft. Not implemented. Open decisions are marked **TBD** in the spec delta.

## Why

Higher daily claim tiers (mid 2,000,000, bonus 5,000,000, mega 10,000,000 EPWX) are currently granted on balance alone. A wallet can reach a tier threshold without generating any fee income, and the payouts are funded from a finite fee-wallet pool with no minting. Tying the higher tiers to a recent verified purchase links rewards to fee-generating activity and reduces farming by one-off or dust swaps.

## What Changes

- Base daily claim (100,000 EPWX) stays open to any signed-in, eligible wallet. No purchase requirement.
- Mid, bonus, and mega claims additionally require a verified on-chain EPWX purchase within a recent window, of at least a minimum size.
- Balance threshold for each tier is still checked on the claim day.
- Optional hold period after the last qualifying purchase (TBD).

## Impact

- Backend: claim endpoint tier calculation and purchase verification source (on-chain Transfer events from the EPWX/WETH pair, not the existing buyer badge, until its logic is confirmed).
- Frontend: tier display and claim messaging on the homepage must show the purchase requirement when it is unmet.
- Existing gates (24-hour cooldown, email verification, terms acceptance, signature payload) are unchanged.

## Out of Scope

- Changing reward amounts or tier thresholds.
- Changing the token's buy or sell tax.
- Gating the base 100,000 claim.
