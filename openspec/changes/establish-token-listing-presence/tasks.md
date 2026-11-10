# Tasks

## 1. Canonical Metadata And Registry

- [x] 1.1 Record the canonical token metadata, markets, descriptions, and supply distribution facts in `design.md`; verify every value against Basescan, GeckoTerminal, GoPlus, and the live supply APIs.
- [x] 1.2 Record the listing registry with channel, account, submission date, status, public URL, and next action for every site attempted; verify each row reflects the last confirmed response from that site.
- [ ] 1.3 Rotate both shared listing-account passwords (2026-11-05 set and 2026-11-08 set) and store them only in the team password manager; verify no credential appears in the repository or OpenSpec artifacts.

## 2. Tracker And Directory Submissions

- [x] 2.1 Submit the Task Hub to the Base Ecosystem page via Coinbase's form as "EPWX Task Hub (ePowerX On Base)", category Consumer → Payments; verify the form confirmation.
- [x] 2.2 Submit to Coinranking, CoinCodex, and LiveCoinWatch with supply APIs; verify each site's confirmation message.
- [x] 2.3 Create `info@epowex.com` accounts on FreshCoins, CoinSniper, CoinMooner, and CoinVote and submit listings; verify CoinMooner is live and the others are in review.
- [x] 2.4 Resubmit to Coinranking and CoinCodex with the final canonical name, website, and whitepaper and a note superseding earlier entries; verify confirmations.
- [x] 2.5 File update requests for the pre-existing CoinSniper entry and the live CoinMooner entry correcting name, website, Telegram, whitepaper, and description; verify "Update Request Submitted" and "feedback received" confirmations.
- [x] 2.6 Resubmit to FreshCoins with a description that preempts the three denial reasons; verify the "under verification" confirmation.
- [ ] 2.7 Submit the corrected LiveCoinWatch request manually from a standard browser using the canonical record (website `tasks.epowex.com`, whitepaper in description, correction note); verify the "Success!" confirmation and update the registry.
- [x] 2.8 After CoinVote and FreshCoins decisions arrive, file website/whitepaper corrections through each site's update channel; verify the public pages show `tasks.epowex.com`. CoinVote approved and already shows `tasks.epowex.com` (2026-11-09); FreshCoins still pending.
- [x] 2.9 Triage the 14 additional discovery sites from the 2026-11-08 listing pitch; verify each is recorded in the registry as submitted, blocked, dead, or unsupported-chain.
- [x] 2.10 File metadata updates for the pre-indexed Coinboom and Top100Token entries (name, website, Telegram, X, post-burn supply in description); verify "Update sent successfully" on both.
- [x] 2.11 Create a CoinCatapult account and send the ownership claim for the crawler-indexed entry with the canonical record; verify "Message received".
- [ ] 2.12 After CoinCatapult transfers ownership, edit the listing from the dashboard to the canonical record; verify the public page shows `tasks.epowex.com` and the whitepaper link.
- [ ] 2.13 A team member signs in to Coinscope with the project Google or `@epowex` X account and submits using the canonical record; verify the confirmation and update the registry.
- [x] 2.14 Bring the MintMe token profile to the canonical record (description, website `tasks.epowex.com` with domain verification via `/mintme.html`); verify "Changes saved" and "Website confirmed" and that the public page shows the new description.
- [ ] 2.15 Publish MintMe posts mirroring Task Hub activity (campaign launches, daily-draw winners, cashback, transparency facts) on a recurring cadence using the templates in `design.md`; verify each post links to `tasks.epowex.com`. First post published 2026-11-09 (Daily Reward Draw #146).
- [ ] 2.16 Decide on and, if approved, fund a small MintMe airdrop or bounty campaign whose tasks are "join `t.me/ePowerX_On_Base`" and "visit `tasks.epowex.com`"; verify the campaign terms and EPWX amount are recorded in the registry before funding.

## 3. Token Transparency Section

- [x] 3.1 Add a Token Transparency section to the Task Hub frontend listing the contract, burn address, Biconomy custody address, markets, holder count, and links to `/api/supply`, `/api/circulating`, and `/api/burned`; verify it is reachable from the footer or main navigation without login and passes frontend type-check and build. Implemented as `/transparency` (`frontend/src/app/transparency/page.tsx` + `TransparencySupplyFigures`), linked from the footer and the Stats menu.
- [x] 3.2 Link the Token Transparency section from the whitepaper page; verify the link resolves on production. Added to the "Supply transparency" card in `WhitepaperDocument`.
- [x] 3.3 Bring `epowex.com` (WordPress) in line with the canonical record: Telegram link, whitepaper button, tokenomics supply and contract-features text, distribution figures, and redirect `/whitepaper` to `tasks.epowex.com/whitepaper`; verify the public pages after clearing Elementor and LiteSpeed caches. Done 2026-11-09.
- [ ] 3.4 Replace the `/whitepaper` meta-refresh with a true 301 (Redirection plugin or Hostinger hPanel rule); verify with a HEAD request.

## 4. Aggregator Reapplication

- [ ] 4.1 Consolidate or document the decision on the secondary Uniswap v2 pool and track DEX liquidity and 24h volume weekly for at least three weeks; verify the figures are recorded in `design.md` before reapplying.
- [ ] 4.2 Reapply to CoinGecko citing both markets, all three supply APIs, burn and custody disclosures, and holder count, and post the verification message from `@epowex`; verify the new request ID is recorded in the registry.
- [ ] 4.3 After CoinGecko approval, retry the CoinPaprika free tier citing the CoinGecko and CoinMarketCap pages; verify confirmations and update the registry. (CoinMarketCap is already listed — UCID 38657 — so no application is needed there.)

## Workflow follow-up

- Update the registry the same day any site responds.
- Do not submit to a site that has an unresolved submission.
- Do not purchase fast-track or premium listings.
- Archive the change after the Token Transparency section ships and the CoinGecko reapplication is filed.
