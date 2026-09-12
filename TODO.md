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
  Include:
  - Daily claim ready notification when the reward unlocks.
  - Reminder and last-chance emails only while the claim remains unclaimed.
  - Successful claim confirmation with EPWX earned, updated balance, and next claim time.
  - Claim failure email with the reason and a secure retry link.
  - Claim streak milestone and streak-at-risk notifications.
  - Bonus reward day announcements and eligibility-change notices.
  - Optional weekly summary covering claimed days, missed days, EPWX earned, and streaks.
  - Inactive-user re-engagement after several missed days instead of repeated daily emails.
  - Separate user preferences for daily reminders, streak alerts, and weekly summaries.
  - Automatic reminder suppression immediately after a successful claim.
  - Frequency limits, timezone-aware scheduling, unsubscribe support, and secure deep links.
