
# EPWX Task Hub (2026)

Decentralized social media task platform on Base Network. Users complete Twitter/X tasks, verify via Telegram, and claim EPWX token rewards. Admins manage special claims and campaigns. All logic is automated via smart contracts and robust backend verification.

## Key Features

- Twitter OAuth: Secure, required for all task submissions
- Telegram Verification: Users must verify via Telegram bot for daily/special claims
- Daily Claim: Users can claim daily EPWX rewards (with wallet + Telegram verification)
- Special Claim: Admins can enable/disable special claims for users; users see "Claim Special Reward" button if eligible
- Admin Panel: Admins manage special claims, campaigns, and user eligibility
- Smart Contract Automation: All rewards distributed on-chain (Base Mainnet)
- Multi-task Campaigns: Like, Follow, Retweet, Comment (Twitter/X)
- Wallet Integration: ConnectKit + Wagmi (Ethereum wallets)
- Real-time Stats: Live EPWX price, campaign stats
- Fraud Prevention: Twitter API v2, Telegram, and backend checks

## Tech Stack

- Frontend: Next.js 14, TypeScript, Tailwind CSS, ConnectKit, Wagmi
- Backend: Node.js, Express, PostgreSQL, Sequelize, Passport.js, Twitter API v2, Redis
- Smart Contracts: Solidity, Hardhat, Ethers.js
- Infra: PM2, Nginx, Digital Ocean

## Setup & Deployment

See ENV_SETUP.md and SERVER_ENV_SETUP.md for full environment/config instructions.

Quick Start:

```bash
git clone https://github.com/epwx/epwx_task_hub.git
cd epwx_task_hub
./start-dev.sh # Starts backend and frontend in dev mode
```

Production: Use PM2 for backend/frontend, see deployment/ for scripts and nginx.conf example.

### Daily draw announcements on X

Announcements are opt-in and use the official EPWX account, independently of existing
user Twitter connections. Configure these backend-only settings (see
[backend/.env.example](backend/.env.example)):

```dotenv
DAILY_DRAW_X_ENABLED=false
DAILY_DRAW_X_API_KEY=your_official_app_consumer_key
DAILY_DRAW_X_API_SECRET=your_official_app_consumer_secret
DAILY_DRAW_X_ACCESS_TOKEN=your_official_account_access_token
DAILY_DRAW_X_ACCESS_TOKEN_SECRET=your_official_account_access_token_secret
# Optional: delete older tracked announcements once a newer one is published
DAILY_DRAW_X_DELETE_PREVIOUS=false
```

With `DAILY_DRAW_X_DELETE_PREVIOUS=true`, after a newer announcement is published the
service permanently deletes older announcements it tracked (`DELETE /2/tweets/:id`).
Already-missing posts count as deleted, transient failures retry up to 3 times, and
manually posted tweets are never touched. Run `npm run migrate` first to add the
delete-tracking columns.

Use OAuth 1.0a credentials generated with **Read and Write** permission. Do not use
OAuth 2.0 Client ID/Secret or an app-only Bearer Token for this feature. Store actual
values in backend deployment secrets, not Git or frontend variables. Leave existing
`TWITTER_*` settings unchanged.

Deployment:

1. Keep `DAILY_DRAW_X_ENABLED=false`, install backend dependencies with `npm ci`,
   and run `npm run migrate` from the backend directory before enabling. This
   creates `daily_draw_announcements`. The card renderer uses `sharp` (Node
   18.17+ or 20.3+); the production Node 20 runtime is supported.
2. Set `FRONTEND_URL` to the public frontend origin, such as
   `https://tasks.epowex.com`. Every announcement links to its `/#latest-winners` board,
   where visitors can browse results by date.
3. Run the mocked tests below and verify X API access/billing for both
   `POST /2/media/upload` and `POST /2/tweets`, draw rules, and
   eligibility restrictions. No test below contacts X or a database.
4. Set `DAILY_DRAW_X_ENABLED=true` and restart/reload the backend when ready for
   public announcements. A test post from the official account is public, even
   under an X console Development environment.

New manual and scheduled draws are announced after winner records commit and before
automatic payouts. A short celebratory caption includes the recorded draw date,
winner count, prize amount, a claim/results link, and hashtags. The configured
`AUTO_DAILY_DRAW_TIME_UTC` is advertised only when automatic draws are enabled.
Captions are validated against X's 280-character weighted limit using `twitter-text`;
a shorter caption directs readers to the image and results board when needed.
All identifiers use shortened wallets: no explicit automated-mention consent is
currently recorded, so linked usernames are never used.

After confirmed X publication, the backend shares the draw date and
`https://x.com/i/status/<postId>` link in the same Telegram group used for daily-claim
notifications, using the existing `TELEGRAM_BOT_TOKEN` and `TELEGRAM_GROUP_ID`.
No new environment settings are needed. Run `npm run migrate` before restarting
the backend to add the Telegram delivery columns. The migration marks already
published announcements as skipped, so deployment does not flood the group with
historical links.

Telegram delivery is tracked separately (`telegramStatus`, `telegramNotifiedAt`,
`telegramErrorCode`). An atomic claim prevents concurrent duplicate messages.
The minute-long sweep picks up published, not-deleted announcements not yet claimed,
including when Telegram configuration becomes available later. Telegram requests
time out after ten seconds. Failed or interrupted sends are logged and are not
automatically retried because Telegram may have accepted the message; inspect the
group and stored delivery state before operator recovery. Telegram failures never
change the published X record, draw results, or payout state. Telegram messages are
not deleted when an older X post is removed; their links can subsequently expire.

Each post attaches a generated navy-and-green PNG with winner ranks, shortened
wallets, EPWX prize amounts, and payment badges. The image uses `PAID` only when
the stored winner status is paid with a transaction hash and valid payment time;
otherwise it uses `PENDING`. "All payouts confirmed" appears only when every
winner meets those checks. Payment status is a snapshot at publication, not a live
image updated after subsequent payments. No existing published announcements are
edited or reposted by a format change.
The header embeds the existing EPWX site logo from `frontend/public/logo.webp`,
resolved relative to the renderer rather than the process working directory.
Keep that asset available in backend deployments; a missing logo fails rendering
explicitly rather than publishing an unbranded substitute.

Images show up to ten winners to keep text readable. Larger draws explicitly say
"Showing 10 of N" and direct readers to the full results board. Images are capped
at 5 MiB. Invalid content, an unreadable prize amount, or a missing required public
URL is reported instead of silently clipping results. Rendering/upload failure
does not fall back to a text-only post.

A unique record per draw and an atomic `sending` transition prevent competing backend
instances from posting the same draw. A minute-long retry sweep processes only
stored pending/due announcements, including earlier draw dates. HTTP 429 rejections
retry at most three total attempts, respecting rate-limit headers and exponential
backoff. Other definitive 4xx failures require operator recovery. Timeouts, 408s,
server errors, and malformed success responses from the final create-post request
are uncertain, as are interrupted sends:
they are **not automatically reposted**. Sending records older than five minutes
are marked uncertain by the retry sweep. Disabling the flag stops both initial
dispatch and retries; reload every backend instance for the change to take effect.
There is no bulk historical backfill, although the existing-draw scheduler path
can announce its current target draw if it has no announcement yet.
Media is uploaded before the create-post request, signed separately using the same
official-account credentials. Transient upload failures can safely retry within
the same three-attempt limit because uploading an image alone does not publish a
post. Failed attempts can leave unused media uploads, but cannot create text-only
announcements. No new environment variables or migration are needed for the card
format update; install the updated backend dependencies before restarting the API.

Inspect and recover announcements from the backend directory:

```powershell
node .\scripts\dailyDrawAnnouncements.js list
```

Before recovery, disable dispatch and stop/reload **all** backend instances, then
inspect the official X timeline. If the post already exists, record its actual ID:

```powershell
node .\scripts\dailyDrawAnnouncements.js published 123 987654321
```

Replace `123` with the draw ID and `987654321` with the verified X post ID.
Only after confirming that no post exists, correct credentials/content as needed
and reset a recoverable announcement:

```powershell
node .\scripts\dailyDrawAnnouncements.js retry 123 --confirmed-no-post
```

The recovery commands do not contact X, alter winners, or overwrite published
records. Re-enable/reload dispatch to send the reset announcement.

Mocked validation (from the backend directory):

```powershell
node .\node_modules\jest\bin\jest.js --runInBand --runTestsByPath .\test\dailyDrawX.test.js .\test\dailyDrawWinnerImage.test.js .\test\dailyDrawPayout.test.js .\test\dailyDrawSelection.test.js .\test\dailyDrawEligibility.test.js
# Integration tests use Node 22.3+ module mocking; validated on Node 22.23.
node --experimental-test-module-mocks --test .\test\dailyDrawAnnouncements.integration.mjs
```

## Smart Contracts

- TaskManager: 0x792896b951380eBC7E52f370Ec6208c5D260A210 (Base Mainnet)
- EPWX Token: 0xef5f5751cf3eca6cc3572768298b7783d33d60eb

## API Highlights

- /api/epwx/special-claim/status?wallet=... — Check special claim eligibility
- /api/epwx/special-claim/claim — POST to claim special reward
- /api/epwx/daily-claim — POST to claim daily reward
- /api/epwx/telegram-verified?wallet=... — Check Telegram verification
- /api/twitter/connect/start — Start Twitter OAuth
- /api/campaigns — List campaigns

## Admin Features

- View/manage all special claims (filter, enable/disable, mark as claimed)
- See user eligibility and claim status
- Manage campaigns and user rewards

## User Flow

1. Connect wallet
2. Connect Twitter (OAuth)
3. Verify Telegram (for daily/special claims)
4. Browse/join campaigns, submit tasks
5. Claim daily/special rewards if eligible

## Security

- All claims require wallet + Twitter + Telegram verification
- Backend verifies all submissions via Twitter API v2 and Telegram bot
- Admin-only endpoints protected
- All funds distributed via smart contract

## Live

- Frontend: https://tasks.epowex.com
- API: https://api.epowex.com

## Contact & Support

- Issues: https://github.com/epwx/epwx_task_hub/issues
- Email: support@epowex.com

---
Built with ❤️ by the EPOWEX Team on Base Network
