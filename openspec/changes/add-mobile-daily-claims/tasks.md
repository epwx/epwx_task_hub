# Tasks

## 1. Mobile application foundation
- [x] 1.1 Create an isolated Expo TypeScript project under `mobile/`.
- [x] 1.2 Add Expo Router navigation and Android safe-area handling.
- [x] 1.3 Configure development, preview, and production EAS build profiles.
- [x] 1.4 Link the EAS project and Android signing credentials.

## 2. Wallet authentication
- [x] 2.1 Add Reown/WalletConnect with Base as the supported network.
- [x] 2.2 Request and sign the existing backend login nonce.
- [x] 2.3 Store only the access token in Expo SecureStore.
- [x] 2.4 Restore authenticated sessions through `/api/auth/me`.
- [x] 2.5 Reset authenticated actions when the connected wallet changes.

## 3. Daily claim experience
- [x] 3.1 Load wallet claim history, email eligibility, and Telegram status.
- [x] 3.2 Display live 24-hour cooldown and local ready time.
- [x] 3.3 Display streak day, continuation window, and draw-entry benefit.
- [x] 3.4 Add explicit reversible per-claim eligibility confirmation.
- [x] 3.5 Sign and submit the existing daily-claim message and payload.
- [x] 3.6 Display paid, pending, and rejected outcomes.
- [x] 3.7 Display recent claims and BaseScan transaction links.

## 4. Email verification
- [x] 4.1 Add mobile email entry for unverified wallets.
- [x] 4.2 Sign the existing email-enrollment message.
- [x] 4.3 Submit enrollment to the existing backend endpoint.
- [x] 4.4 Add refreshable post-verification status.
- [x] 4.5 Reject duplicate normalized email enrollment and block later legacy linkages from claiming.

## 5. Validation
- [x] 5.1 Pass TypeScript checking.
- [x] 5.2 Pass Expo Doctor.
- [x] 5.3 Export the Android JavaScript bundle.
- [x] 5.4 Build a signed Android development APK with EAS.
- [x] 5.5 Verify a real production claim and BaseScan transaction on Android.

## 6. Release follow-up
- [ ] 6.1 Build a standalone preview APK without Metro dependency.
- [ ] 6.2 Complete internal Android device testing.
- [ ] 6.3 Review Google Play crypto and reward-distribution policy.
- [ ] 6.4 Approve and document an initial Play country allowlist.
- [ ] 6.5 Confirm Play Console and backend region controls match the approved allowlist.
- [ ] 6.6 Submit a production Android bundle after policy, legal, and QA approval.
- [ ] 6.7 Require a new regional review before enabling additional countries.
