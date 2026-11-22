# Proposal: Add Android Mobile Daily Claims

## Status

Implemented as the first complete feature milestone in the isolated `mobile/` Expo
application. The feature is ready for ongoing device testing and a preview release.

## Why

EPWX users need a native Android flow for connecting a wallet, confirming daily
claim eligibility, submitting the existing signed claim request, and verifying the
result on Base. The first mobile release must reuse the production backend as the
single authority and must not duplicate reward, eligibility, payout, or fraud
prevention logic.

## What Changes

- Add an Expo React Native Android application with Daily Claim and Wallet
  navigation.
- Authenticate a Base wallet through Reown/WalletConnect and the existing
  nonce-based backend authentication endpoints.
- Store only the resulting access token in Expo SecureStore.
- Add a Daily Claim screen that displays:
  - Connected and authenticated wallet state
  - Base network status
  - Email verification state
  - Optional Telegram membership benefit
  - 24-hour cooldown countdown
  - Seven-day streak progress and next draw-entry benefit
  - Required age and jurisdiction confirmation
  - Recent claim history and payment status
  - BaseScan links for paid claims
- Add native email enrollment for wallets that are not yet verified.
- Enforce one normalized email identity per wallet owner. Future duplicate
  enrollment is rejected, while the earliest existing linkage owns legacy
  duplicate records and later wallets are blocked from claiming with that email.
- Submit the exact wallet message and payload already accepted by the web DApp.
- Keep social campaigns, draw participation/winner promotion, token purchases or
  swaps, and administration out of the Play-review mobile build.

## Safety and Compatibility

- No existing frontend, backend, database, or smart-contract behavior is replaced.
- No private key, seed phrase, backend secret, or unapproved transaction request
  is stored by or entered into the mobile application.
- The Play-review client does not guarantee rewards, token value, investment
  returns, lifetime availability, or payout timing.
- The backend remains authoritative for signature verification, email status,
  eligibility policy, rate limits, cooldown, rewards, payout, and transaction status.
- Public configuration uses `EXPO_PUBLIC_*`; secrets remain backend-only.
- The mobile app does not send a claim until all required client checks pass, but
  backend validation remains mandatory even when client checks indicate readiness.

## Impact

- Mobile: Expo Router screens, Reown/WalletConnect integration, SecureStore session
  handling, claim state, email enrollment, and EAS Android builds.
- Backend: no endpoint or schema changes are required for this milestone; existing
  public and authentication APIs are reused.
- Existing web DApp: no intended behavior changes.

## Out of Scope

- Mobile campaign proof uploads
- Mobile referrals
- Push notifications
- Token purchases, swaps, bridges, or on-ramps
- Admin claim management
- New reward tiers, cooldown rules, payout rules, or smart contracts
- iOS and Play Store production submission
