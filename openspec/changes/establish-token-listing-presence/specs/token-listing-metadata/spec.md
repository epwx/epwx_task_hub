# Spec Delta

## Purpose

Defines the canonical EPWX listing metadata, the public transparency disclosure, and the rules for submitting and tracking external directory and aggregator listings.

## ADDED Requirements

### Requirement: External submissions use canonical token metadata
Every external directory, aggregator, or ecosystem submission SHALL use the canonical metadata recorded in the change design: display name `ePowerX On Base`, ticker `EPWX`, contract `0xef5f5751cf3eca6cc3572768298b7783d33d60eb` on Base, 9 decimals, website `https://tasks.epowex.com`, whitepaper `https://tasks.epowex.com/whitepaper`, X `https://x.com/epowex`, Telegram `https://t.me/ePowerX_On_Base`, and contact `info@epowex.com`.

#### Scenario: New listing form is completed
- **WHEN** a team member fills any listing or update form
- **THEN** name, website, whitepaper, socials, and contract match the canonical record exactly

#### Scenario: Existing listing has stale values
- **WHEN** a live or pending listing shows `epowex.com`, the legacy GitBook whitepaper, the legacy Telegram handle, or the bare name `ePowerX`
- **THEN** an update request is filed through that site's own update channel and the registry is annotated with the request date

### Requirement: Supply figures come from the public supply APIs
Submissions SHALL report total and circulating supply from `https://api.epowex.com/api/supply` and `https://api.epowex.com/api/circulating`, SHALL provide those URLs wherever a form accepts supply APIs, and SHALL report max supply as equal to circulating supply rather than the 500T raw minted figure.

#### Scenario: Form asks for max supply
- **WHEN** a listing form has a max-supply field
- **THEN** the value entered equals the current circulating supply, and the burned amount is referenced via `https://api.epowex.com/api/burned` in notes

#### Scenario: Form asks for locked or team wallets
- **WHEN** a form asks for team, locked, or vested addresses
- **THEN** no address is supplied as team-held, and the Biconomy custody wallet is described as a third-party exchange wallet, not excluded

### Requirement: Distribution facts are disclosed proactively
Submissions SHALL state, in the description or notes, that 93.67% of raw supply is held by the burn address, that the largest live holder `0xfdb836cdcdcfeb34b309a7bd5dc1adfaa63690d3` is the Biconomy exchange custody wallet, and that EPWX trades on both Biconomy (EPWX/USDT) and PancakeSwap v2 on Base (EPWX/WETH).

#### Scenario: Reviewer flags holder concentration
- **WHEN** a listing is denied or questioned on "supply distribution" or "holding patterns"
- **THEN** the resubmission cites the burn address, identifies the Biconomy custody wallet, and links the Token Transparency section

### Requirement: Task Hub publishes a Token Transparency section
The Task Hub website SHALL publish a Token Transparency section listing the contract address, burn address, Biconomy custody address, exchange markets, holder count, and the three supply API endpoints.

#### Scenario: Reviewer visits the website
- **WHEN** a listing reviewer opens `https://tasks.epowex.com`
- **THEN** the transparency content is reachable from the main navigation or footer without login

#### Scenario: Supply figures change
- **WHEN** supply or burned amounts change
- **THEN** the section links to the live APIs rather than restating numbers that go stale

### Requirement: Listing registry is maintained
The team SHALL keep the listing registry in the change design current, recording for each site the channel, account email, submission date, status, public URL, and next action.

#### Scenario: Submission or decision occurs
- **WHEN** a listing is submitted, approved, denied, updated, or goes live
- **THEN** the registry row is updated the same day

#### Scenario: Site has already received a pending submission
- **WHEN** a site has an unresolved submission
- **THEN** no further submission is made to that site until a decision arrives

### Requirement: Listing account credentials are never committed
Credentials for listing-site accounts SHALL be stored only in the team password manager and SHALL NOT appear in the repository, OpenSpec artifacts, or chat transcripts; a password transmitted through any other channel SHALL be rotated.

#### Scenario: Account is created during a listing session
- **WHEN** a new listing-site account is registered
- **THEN** the registry records only the account email, and the password is stored in the password manager

### Requirement: Paid fast-track listings are not purchased
The team SHALL NOT purchase fast-track, premium, or priority listing products in response to a free-tier rejection unless the rejection reason is confirmed to be unfixable.

#### Scenario: Free submission is rejected with an upsell
- **WHEN** a site rejects a free submission and offers a paid path
- **THEN** the stated deficiency is addressed and the free path is reattempted first

### Requirement: Aggregator reapplication is evidence-based
A CoinGecko reapplication SHALL be filed only after measurable DEX liquidity and volume improvement and SHALL cite both markets, all three supply APIs, the burn address, the Biconomy custody wallet, and holder count; CoinMarketCap and CoinPaprika free-tier applications SHALL follow a CoinGecko approval.

#### Scenario: Reapplying to CoinGecko
- **WHEN** the team submits a new CoinGecko request
- **THEN** the verification message is posted from `@epowex`, both exchange markets are listed, and the request ID is recorded in the registry

#### Scenario: CAPTCHA fails in automation
- **WHEN** a listing form's CAPTCHA does not render after one reload in an automated browser
- **THEN** the form is completed manually in a standard browser using the canonical record
