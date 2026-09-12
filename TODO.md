# TODO

## Growth Features

- [ ] Telegram group owner referral reward via Mini App flow:
  Implement attribution so when a user launches the Mini App from a partner group and completes a valid daily claim, the registered group owner receives a fixed 10,000 EPWX reward.
  Include:
  - Group owner registration and ownership verification.
  - Group-source attribution token passed into Mini App.
  - Reward ledger entry with anti-duplication rules.
  - Abuse protections (initData verification, cooldown/rate limits, anti-sybil checks).

## Daily Claim Notifications

- [ ] Add email notifications for recurring user Daily Claims (not merchant claims):
  Implemented and production-tested:
  - [x] Wallet-signed email enrollment for existing wallet-only users.
  - [x] Verification email with expiring, hashed verification tokens.
  - [x] SendGrid delivery through SMTP port 2525 with authenticated domain sending.
  - [x] Successful paid-claim confirmation with EPWX earned and next claim time.
  - [x] Support confirmations for automatic payouts and claims marked paid by an administrator.
  - [x] Secure unsubscribe flow that disables reminder and success emails.
  - [x] Enrollment rate limiting and duplicate success-email protection.
  Implemented, awaiting production timing validation:
  - [ ] Daily claim-ready reminder after the 24-hour claim cooldown.
  - [ ] Confirm scheduler delivery occurs within the configured 15-minute interval after eligibility.
  Future enhancements:
  - [ ] Last-chance emails only while the claim remains unclaimed.
  - [ ] Claim failure email with the reason and a secure retry link.
  - [ ] Claim streak milestone and streak-at-risk notifications.
  - [ ] Bonus reward day announcements and eligibility-change notices.
  - [ ] Optional weekly summary covering claimed days, missed days, EPWX earned, and streaks.
  - [ ] Inactive-user re-engagement after several missed days instead of repeated daily emails.
  - [ ] Separate user preferences for daily reminders, streak alerts, and weekly summaries.
  - [ ] User-facing email preference management and timezone-aware scheduling controls.
  - [ ] Email delivery audit log, bounce handling, and suppression monitoring.
