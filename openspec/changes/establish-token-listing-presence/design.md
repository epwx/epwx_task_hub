# Design

## Context

See `proposal.md` for motivation. This change is primarily an operational record plus one small frontend content addition. The numbers below were captured on 2026-11-05 from GeckoTerminal, GoPlus, Blockscout, Biconomy's public ticker API, and the project's own supply endpoints; refresh them before any new aggregator application.

## Goals / Non-Goals

**Goals:**

- One canonical, copy-paste-ready record for every external listing form.
- A single registry that answers "where are we listed, under which account, and what happens next".
- Public disclosure of the supply distribution facts that reviewers flag.
- A re-application plan for CoinGecko/CMC/CoinPaprika grounded in what actually blocked the first attempts.

**Non-Goals:**

- Paying for fast-track or premium listings (CoinPaprika $1,000, CoinGecko Fast Pass, FreshCoins Premium). Every rejection so far was fixable for free.
- Changing circulating-supply math. The Biconomy custody wallet is a third party and correctly counts as circulating.
- Renaming the on-chain token.

## Canonical Token Metadata

Use these values verbatim on every form. Where a form offers no field, put the value in the description or notes.

| Field | Value |
| --- | --- |
| Display name | `ePowerX On Base` |
| On-chain name | `ePowerX` (contract metadata; do not change) |
| Ticker | `EPWX` |
| Chain | Base (chain ID 8453) |
| Contract | `0xef5f5751cf3eca6cc3572768298b7783d33d60eb` |
| Decimals | `9` |
| Token standard | ERC-20 |
| Launch / first pool | 2025-06-25 (PancakeSwap v2 EPWX/WETH pool created 2025-06-25T02:50Z) |
| Website | `https://tasks.epowex.com` |
| Token Transparency page | `https://tasks.epowex.com/transparency` — contract facts, live supply, burn, largest holders, markets, supply APIs, canonical links. Paste this on any form that asks about distribution or supply. |
| Whitepaper | `https://tasks.epowex.com/whitepaper` |
| Terms / Privacy | `https://tasks.epowex.com/terms`, `https://tasks.epowex.com/privacy` |
| Logo (source) | `https://tasks.epowex.com/logo.webp` (1000x1000; convert to PNG with `sharp` for forms that reject WebP) |
| X / Twitter | `https://x.com/epowex` (`@epowex`) |
| Telegram | `https://t.me/ePowerX_On_Base` (`@ePowerX_On_Base`) |
| Contact email | `info@epowex.com` |
| Block explorer | `https://basescan.org/token/0xef5f5751cf3eca6cc3572768298b7783d33d60eb` |
| GeckoTerminal | `https://www.geckoterminal.com/base/tokens/0xef5f5751cf3eca6cc3572768298b7783d33d60eb` |
| Total supply API | `https://api.epowex.com/api/supply` (plain number) |
| Circulating supply API | `https://api.epowex.com/api/circulating` (plain number) |
| Burned supply API | `https://api.epowex.com/api/burned` (plain number) |
| Total supply (2026-11-05) | `31634877433144` |
| Circulating supply (2026-11-05) | `31533270199522` |
| Max supply | Report as equal to circulating supply (no further minting; contract is not mintable) |
| Raw minted supply | 500,000,000,000,000 (of which ~468T is burned; do not report this as max supply) |
| Categories | Utility Token, Rewards Token, Payment System; ERC-20; Base Ecosystem; Deflationary |

### Markets

| Venue | Pair | Notes |
| --- | --- | --- |
| Biconomy (CEX) | `EPWX_USDT` | Primary volume venue. ~$28K / 24h on 2026-11-05. Public ticker: `https://www.biconomy.com/api/v1/tickers`. Listed via paid listing + marketing package. Tracked by CoinGecko and CoinMarketCap. |
| PancakeSwap v2 (Base) | EPWX/WETH | Main DEX pool, ~$8K liquidity, low organic volume. Trade URL: `https://pancakeswap.finance/swap?chain=base&outputCurrency=0xef5f5751cf3eca6cc3572768298b7783d33d60eb` |
| Uniswap v2 (Base) | EPWX/WETH | Secondary pool, ~$735 liquidity. Candidate for consolidation into the PancakeSwap pool. |

### Short description (≤ 200 characters)

> Base-native utility token powering the EPWX Task Hub: verified community rewards, X campaigns, Telegram-gated participation, cashback, and merchant promotions.

### Standard description

> ePowerX On Base (EPWX) is a utility token on the Base blockchain powering the EPWX Task Hub (https://tasks.epowex.com), a live rewards platform. Users earn EPWX through verified daily claims, Twitter/X campaign participation, Telegram-gated community engagement, cashback on qualifying purchases, and merchant-linked promotions. The project publishes public REST APIs for total, circulating, and burned supply. EPWX trades on PancakeSwap v2 on Base (EPWX/WETH) and on Biconomy CEX (EPWX/USDT).

## Supply Distribution Facts

Captured from GoPlus token security on 2026-11-05. These are the facts reviewers trip over; state them proactively.

| Holder | Share of raw supply | Identity |
| --- | --- | --- |
| `0x0000000000000000000000000000000000000000` | 93.67% | Permanent burn. Excluded from `/api/supply` and `/api/circulating`. |
| `0xfdb836cdcdcfeb34b309a7bd5dc1adfaa63690d3` | 3.76% (~59% of live circulating) | **Biconomy exchange custody wallet.** First EPWX inbound 2025-10-16. Holds listing/marketing fee payment plus user deposits. Third party; counted as circulating. |
| Remaining | ~2.6% | 12,000+ holders. |

Other security facts: contract verified/open-source, ownership renounced (owner = zero address), not mintable, not a honeypot, buy tax 6.0%, sell tax 5.91%.

## Listing Registry

Status as of 2026-11-08 08:00 ET. Update this table whenever a submission, response, or correction happens.

### Already indexed (no action)

| Site | Status |
| --- | --- |
| Basescan | Token info verified |
| GeckoTerminal | Indexed, logo present |
| DEXTools | Indexed |
| DexScreener | Indexed |
| DexPaprika | Indexed |
| Moontok | DEX tracker; `moontok.io/en/base/0xef5f…d60eb` auto-indexed. No free submission or update form (paid Advertise only). |

### Submitted / in review

| Site | Channel | Account | Submitted | Status | Public URL / Notes |
| --- | --- | --- | --- | --- | --- |
| Base Ecosystem page | Coinbase Google Form (`forms.gle/hJhc2PqfAsQp86YL8`; the old `base-org/web` PR route is archived) | none | 2026-11-05 | Awaiting review, no SLA | Submitted as "EPWX Task Hub (ePowerX On Base)", category Consumer → Payments, website `tasks.epowex.com` |
| Coinranking | `coinranking.com/coin-listing/list-coin` | none | 2026-11-05 (3 submissions; last is authoritative) | Review 1–3 working days | Tracks PancakeSwap v2 (Base) — best aggregator odds. Final submission has corrected name/website/whitepaper. |
| CoinCodex | Google Form via `coincodex.com/page/contact-us` | none | 2026-11-05 (3 submissions; last is authoritative) | Review ~3 working days | Final submission has corrected name/website/whitepaper. |
| LiveCoinWatch | `livecoinwatch.com/requests/coin` | none | 2026-11-05 (2 submissions) | Submitted | Latest accepted submission has name "ePowerX On Base" but website `epowex.com` and no whitepaper. A third corrected submission was prepared but reCAPTCHA would not render in the automation browser; submit it manually (see tasks). |
| CoinSniper | Account dashboard | `info@epowex.com` | Listing pre-existed; update request 2026-11-05 | Listing under review; update pending | `https://coinsniper.net/coin/95195`. A legacy "ePowerX" entry with old Telegram and GitBook whitepaper existed; update request changes name, website, Telegram, whitepaper, description. |
| CoinMooner | Account dashboard | `info@epowex.com` | 2026-11-05 | **Live**; update request sent via contact form | `https://coinmooner.com/coins/epowerx-on-base-epwx`. Live entry still shows website `epowex.com`; website/whitepaper correction requested. |
| CoinVote | Account dashboard | `info@epowex.com` | 2026-11-05 | **Live** (approved by 2026-11-09) | `https://coinvote.cc/coin/ePowerX-On-Base`. Public page already shows `tasks.epowex.com`. Added to `LISTING_VOTE_LINKS` in production 2026-11-09. |
| FreshCoins | Account dashboard | `info@epowex.com` | 2026-11-05 (denied), resubmitted 2026-11-05 with rebuttal | Under verification | First denial cited contract verification, website, and supply distribution. Resubmission description preempts all three (verified contract, burn + Biconomy custody explanation, website/whitepaper/APIs) and uses `tasks.epowex.com/whitepaper`. Website field still `epowex.com`; correct after review. Do not resubmit again until a decision arrives. |
| Coinboom | `coinboom.net/submit` → "Submit Token Information Update" | none | Update 2026-11-08 | "Update sent successfully" | `coinboom.net/base/0xef5f…d60eb`. Pre-existed via auto-indexing with stale data (name `ePowerX`, `epowex.com`, Telegram `ePowerX_EPWX`, **500T raw supply shown**). Update sets name, description with post-burn supply, website, Telegram, X. Supply figure is derived on-chain by the site; description notes the burn. |
| Top100Token | `top100token.com/submit` (same platform as Coinboom) | none | Update 2026-11-08 | "Update sent successfully" | Same stale pre-indexed entry and same update as Coinboom. |
| CoinCatapult | Account dashboard + contact form | `info@epowex.com` | Claim request 2026-11-08 | "Message received", reply within 24h | `coincatapult.com/coin/epowerx-epwx-ef5f57` pre-existed via crawler with no owner. New-listing form rejected as `duplicate_claim`. Ownership claim sent via contact form (category "Listing my coin") with contract, network, account email, and the corrected name/website/whitepaper/socials to apply after transfer. Account created without email verification. |
| MintMe | Token settings dashboard | `info@epowex.com` (owner) | Listed ~2026-10-30; profile updated 2026-11-09 | **Live**, profile canonical | `mintme.com/token/ePowerX-On-Base`. Description replaced with canonical structured copy (Task Hub features, burn/supply facts, APIs, markets, links, roadmap). Website changed `epowex.com` → `tasks.epowex.com` and **domain-verified** via `/mintme.html` (token `efd6dfce-…`, served from `frontend/public/mintme.html`, commit `f65f205`). X and Telegram already correct. No market opened — see Decisions. |

### Blocked / not viable

| Site | Reason | Next action |
| --- | --- | --- |
| CoinGecko | Request `CL0211260004` rejected 2026-11-02; no reason given. DEX volume ~$22/day at the time. Biconomy market was already live (since 2025-10) so it is not "new evidence". | Reapply after ~3–4 weeks of improved DEX liquidity/volume. Cite both markets, all three supply APIs, burn address, Biconomy custody wallet, and 12K+ holders. Post the verification message from `@epowex` as required. |
| CoinPaprika | Free-tier form auto-rejects on volume/liquidity; only the $1,000 Fast Track is offered. | Retry free tier after CoinGecko approval; do not pay. |
| CoinMarketCap | Same volume gate as CoinGecko. | Apply after CoinGecko approval, citing the CoinGecko page. |
| DappRadar | Platform shut down November 2025. | None. |
| CryptoRank | No public submission form. | Low priority; contact only if a listing manager is identified. |
| Coinscope | Signup is Google or X OAuth only; no email/password path, so automation cannot create the account. | A team member signs in with the project Google or `@epowex` X account and submits using the canonical record. |
| Gemfinder | Chain list has no Base (BSC, ETH, Polygon, Solana, TRON, KCC, Fantom, Harmony, ADA, AVAX, WAX, Arbitrum). Account `info@epowex.com` created 2026-11-08 without email verification. | Re-check periodically; submit if Base is added. Do not list under another chain. |
| CoinTopList | Open form, but networks are ETH/BSC/SOL only. | None unless Base is added. |
| CoinsGem / CoinGem | Solana-only. | None. |
| mycoinvote.com | Cloudflare 403 to automation. | Optional manual attempt from a normal browser; low value. |
| cryptonextgem.com | Cloudflare challenge to automation. | Optional manual attempt; low value. |
| coindiscovery.app | Loads blank, no form found. | None. |
| coinxhigh.com | Domain repurposed as a casino site. | None. Treat any pitch listing it as stale. |
| coinbusters.cc | Domain does not resolve. | None. |
| gemsradar.com | Connection refused. | None. |

### Note on third-party "listing service" pitches

A Telegram pitch received 2026-11-08 offered paid submission to 17 sites. Of the 14 not already handled, 3 were dead or hijacked, 3 do not support Base, 3 block automation or have no form, 1 needs OAuth, and the 4 viable ones already had EPWX auto-indexed and only needed free updates. Every working site on such lists has a free self-serve path; do not pay for them.

## Decisions

### Standardize on the Task Hub as the public website

`tasks.epowex.com` is the live product, hosts the whitepaper, terms, and privacy pages, and is the Base-specific landing page the Base Ecosystem review requires. `epowex.com` remains valid but is no longer the primary URL on listing forms.

### Keep the Biconomy custody wallet in circulating supply

It is a third-party exchange wallet holding user deposits and fee payments, not a team or treasury wallet. Excluding it would understate circulating supply and would not survive reviewer scrutiny. The correct fix is disclosure, not arithmetic.

### Disclose rather than restructure

A public Token Transparency section lists the burn address, the Biconomy custody address, both markets, holder count, and the three supply APIs. This directly answers the FreshCoins objection and is the strongest single input to a CoinGecko reapplication.

### Never submit from automation when a CAPTCHA fails to render

Repeated reloads to force Google reCAPTCHA triggered rate-limiting. If the widget does not render after one reload, hand the form to a human in a normal browser using the canonical data pack.

### Use MintMe as a community channel, not a trading venue (for now)

MintMe is a small custodial exchange with community tooling (posts to followers, airdrop and bounty campaigns, polls, token shop). Its order-book volume carries little weight with aggregators. Opening an EPWX market there requires seeding liquidity from project-held EPWX into MintMe custody and paying a MINTME fee; with PancakeSwap depth already thin, a third, custodial venue with an empty book would hurt the CoinGecko reapplication. Use MintMe for posts mirroring Task Hub campaigns and for small airdrop/bounty campaigns whose tasks funnel users to `t.me/ePowerX_On_Base` and `tasks.epowex.com`. Revisit opening the ETH or MINTME market once DEX liquidity improves, and only with the Automatic Order Maker enabled.

### MintMe posts are manual; the public API has no posts endpoint

MintMe's API v2 (`/dev/api/v2/*`) covers markets, order books, orders, and wallet operations only. There is no endpoint to create a post, so draw and campaign announcements cannot be automated from the backend the way the X announcement is. Posts are published from the token page composer by a logged-in owner (`info@epowex.com`), either by a team member or by an assistant driving the browser on request.

## MintMe Posting Guide

Composer: token page → "Latest News" → Title + Content → Post. Owner login required.

Rules learned 2026-11-09:

- Content limit is 1,000 characters and the validator counts HTML, so keep plain text under ~750 characters.
- Do not use apostrophes or curly quotes. MintMe renders them as `&#039;` and turns `#039` into a hashtag link. Write "the previous day of claims", not "yesterday's".
- Leave "Use Bonus Tokens as Reward" and the reward fields at zero unless the team decides to pay MintMe users to engage.
- The sticky transaction ticker overlaps the Post button in a small viewport; scroll it clear or widen the window before clicking.
- Every post links to `https://tasks.epowex.com` and, where relevant, `https://tasks.epowex.com/#latest-winners`.

Cadence: draw results two or three times a week (not daily), plus one post per campaign launch, cashback promotion, or merchant addition.

### Template — Daily Reward Draw

Data: `GET https://api.epowex.com/api/epwx/daily-draws/latest` (`draw.id`, `draw.drawDate`, `draw.winnerCount`, `draw.prizeAmount`, `draw.entropyBlockNumber`, `winners[].wallet`, `pagination.totalDraws`). Rules: `GET https://api.epowex.com/api/epwx/daily-draws/rules`.

```
Title: Daily Reward Draw #<draw.id> — <winnerCount> winners paid <prizeAmount formatted> EPWX each

The free Daily Reward Draw for <drawDate> is settled: <winnerCount> winners, each paid <prizeAmount> EPWX on-chain within 30 seconds of the draw.

Winners:
1. 0x<first 4>…<last 4>
2. …

How it works
• Runs daily at 00:05 UTC for the previous day of claims
• Provably fair: winners derived from Base block <entropyBlockNumber> hash + a published pool hash — anyone can audit
• Streak boosts odds: 1 entry on days 1–2, 2 on days 3–4, 3 on days 5–6, 5 on day 7
• No purchase, no holding, no gas required

<totalDraws> draws since launch — every one settled on-chain.

Join the next draw: connect your wallet at https://tasks.epowex.com and claim your free 100,000 EPWX. Winner board: https://tasks.epowex.com/#latest-winners
```

### Template — Campaign launch

```
Title: New campaign: <campaign title> — earn <reward> EPWX

<One sentence on what the campaign rewards and who can join.>

How to take part
• Connect your wallet at https://tasks.epowex.com
• <Task 1, e.g. follow @epowex on X and verify>
• <Task 2>
• Rewards are paid in EPWX on Base after verification

Runs <start> to <end> (UTC). Community: https://t.me/ePowerX_On_Base
```

### Template — Transparency / token facts

```
Title: EPWX token facts: burn, supply and where it trades

• 93.67% of the original supply is permanently burned; post-burn total supply is 31,634,877,433,144 EPWX
• Live supply APIs: https://api.epowex.com/api/supply · /api/circulating · /api/burned
• Contract on Base: 0xef5f5751cf3eca6cc3572768298b7783d33d60eb — verified, ownership renounced, not mintable
• Largest non-burn holder is the Biconomy exchange custody wallet
• Trades on Biconomy (EPWX/USDT) and PancakeSwap v2 on Base (EPWX/WETH)

Whitepaper: https://tasks.epowex.com/whitepaper
```

Posts published: 2026-11-09 "Daily Reward Draw #146 — 5 winners paid 1,000,000 EPWX each".

## Risks / Trade-offs

- **Name mismatch.** Forms say "ePowerX On Base"; the contract says "ePowerX". Some aggregators normalize to the contract name. Accept this; if challenged, point to `@epowex`, `@ePowerX_On_Base`, and the CoinGecko request history.
- **Duplicate submissions.** Coinranking and CoinCodex received three submissions each in one day, each marked as replacing the prior. Reviewers may still see noise. Do not submit again to any site until it responds.
- **Volume quality.** Biconomy volume on a paid listing is discounted by aggregators as partially market-maker driven. It helps, but the CoinGecko reapplication should also show organic DEX growth.
- **Tax flags.** 6% buy / 5.9% sell tax is flagged by some scanners. Not a blocker for the sites targeted here, but mention it honestly if a form asks.

## Follow-ups

- Add the Token Transparency section (tracked in `tasks.md`).
- Consider consolidating the Uniswap v2 pool into PancakeSwap v2 to concentrate liquidity before the CoinGecko reapplication.
- Rotate the shared listing-account passwords and store them only in the team password manager; they were transmitted in a chat session during account creation. Two credential sets exist: one for FreshCoins, CoinSniper, CoinMooner, CoinVote (2026-11-05) and one for Gemfinder, CoinCatapult (2026-11-08).
- Discovery sites that auto-index from DEX data (Coinboom, Top100Token, CoinCatapult, Moontok) all surfaced the 500T raw supply and the legacy `epowex.com`/`ePowerX_EPWX` links. The Token Transparency section and consistent on-site metadata are the only way to correct this at the source for future indexers.
