# Proposal

## Why

EPWX is indexed by on-chain trackers (Basescan, GeckoTerminal, DEXTools, DexScreener, DexPaprika) but has no presence on market-data aggregators or discovery directories. A CoinGecko application (request `CL0211260004`) was rejected and a CoinPaprika free-tier submission was auto-blocked, both on volume/liquidity grounds measured against DEX activity only. A FreshCoins submission was denied citing "token supply distribution and holding patterns".

Investigation showed the underlying facts are defensible but undocumented: 93.67% of raw supply is permanently burned, the largest live holder is the Biconomy exchange custody wallet (EPWX/USDT trades there with ~$28K daily volume), and the project already publishes public supply APIs. Listing reviewers cannot see this context because the project never states it in one place, and earlier submissions used inconsistent names, websites, and whitepaper links.

## What Changes

- Define one canonical token metadata record (name, ticker, chain, contract, decimals, supply figures and APIs, official links, logo, markets, launch date) that every external submission MUST use.
- Standardize the public identity as **ePowerX On Base**, website `https://tasks.epowex.com`, whitepaper `https://tasks.epowex.com/whitepaper`.
- Maintain a listing registry recording every directory/aggregator, submission date, account used, status, public URL, and the next action.
- Publish a Token Transparency section on the Task Hub documenting the burn address, the Biconomy custody wallet, exchange markets, and supply API endpoints so distribution questions are answered before a reviewer asks.
- Record the aggregator re-application plan (CoinGecko first, then CoinMarketCap and CoinPaprika) with the evidence each application must cite.

## Capabilities

### New Capabilities

- `token-listing-metadata`: Canonical EPWX listing data, the listing registry, the public transparency disclosure, and the rules for external directory and aggregator submissions.

### Modified Capabilities

None.

## Impact

- New `openspec/changes/establish-token-listing-presence/design.md` holding the canonical data pack and listing registry (operational record, not code).
- Frontend: a Token Transparency section on `tasks.epowex.com` (new content, no API change).
- Backend: no change required; `/api/supply`, `/api/circulating`, and `/api/burned` are already public and are referenced as the supply source of truth.
- External accounts created on FreshCoins, CoinSniper, CoinMooner, and CoinVote under `info@epowex.com`; credentials live in the team password manager and MUST NOT be committed.
- No smart-contract change. The on-chain token name remains `ePowerX`; the "On Base" suffix is a display/branding name only and reviewers may ask about the difference.
