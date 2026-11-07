# Tasks

## 1. Authorization

- [x] 1.1 Add shared method, path, and body-bound administrator authorization middleware.
- [x] 1.2 Apply it to merchant, partner, campaign, draw, claim, and Telegram reward administration.
- [x] 1.3 Update every affected frontend caller.

## 2. Financial Abuse Controls

- [x] 2.1 Require referred-wallet authorization for referral registration.
- [x] 2.2 Use trusted proxy-derived client addresses.
- [x] 2.3 Replace attacker-preserving Nginx forwarding configuration.

## 3. Privacy And Login

- [x] 3.1 Remove public upload serving and sanitize public partner responses.
- [x] 3.2 Add short-lived, path-contained evidence URLs to authorized responses.
- [x] 3.3 Require a server-issued, one-time wallet challenge before JWT issuance.

## 4. Verification

- [x] 4.1 Add focused authorization and evidence-link regression tests.
- [x] 4.2 Run backend syntax checks and the frontend production build.
- [x] 4.3 Validate the OpenSpec change strictly.
- [ ] 4.4 Deploy and verify production security guards.
