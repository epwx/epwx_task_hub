# Telegram Mini App Regression Checklist

Use this checklist after backend/frontend deployments to quickly validate Telegram Mini App flows, including Coinbase Smart Wallet and MetaMask fallback behavior.

## Preconditions

- Frontend is live on `https://tasks.epowex.com`.
- Backend is live and reachable through frontend `/api` rewrite.
- `TELEGRAM_BOT_TOKEN` is configured in backend.
- `BASE_RPC_URL` (or `RPC_URL`) is configured in backend for smart-wallet signature verification.
- Admin wallet is present in `ADMIN_WALLETS`.
- You have 2 Telegram accounts available:
  - Account A: Group owner/admin.
  - Account B: Group member/claimant.

## Quick Smoke Test (5-10 min)

### 1. Mini App Auth

1. Open Mini App from Telegram with Account A.
2. Confirm Telegram user is shown as verified in UI.
3. Expected: No auth error banners.

### 2. Wallet Link - Coinbase Smart Wallet

1. In Telegram WebView, click `Open In External Browser` or `Copy Mini App Link`.
2. Open the link in Coinbase Wallet browser.
3. Connect wallet and click `Update Linked Wallet` (or `Link Wallet`).
4. Sign the wallet-link message.
5. Expected: Wallet link succeeds (no `Invalid wallet signature`).

### 3. Wallet Link - MetaMask

1. In Telegram WebView, click `Open In MetaMask Browser`.
2. Connect MetaMask wallet and click `Update Linked Wallet`.
3. Sign the wallet-link message.
4. Expected: Wallet link succeeds (no URL-scheme or signature failure).

### 4. Daily Claim Signature Validation

1. With a linked wallet, click `Request Daily Claim`.
2. Sign the daily-claim message in wallet.
3. Expected: Claim is accepted.
4. Expected: No `Invalid signature` or `Signature does not match wallet` for valid signer.

### 5. Group Owner Registration

1. From group owner flow (Account A), register group using Mini App (`registerGroupId` flow).
2. Expected: Registration succeeds.
3. Expected: Group title is stored and later visible in admin rewards table.

### 6. Group-Member Claim Attribution

1. Use Account B (member of Account A's group) and complete daily claim via source group flow (`sourceGroupId`/group context).
2. Expected: Group owner reward record is created as `pending` (unless blocked by policy).

### 7. Admin Reward Payout

1. Open admin page: `https://tasks.epowex.com/admin/telegram-group-rewards`.
2. Locate pending reward and click `Distribute`.
3. Expected: Status changes to `Paid` with tx hash.
4. Expected: Ledger entry is created for telegram group owner reward payout.

## Negative Cases

### A. Signature Mismatch

1. Connect wallet X, but sign with wallet Y.
2. Expected: Request is rejected with signature mismatch error.

### B. Official Group Membership Gate

1. Use a user outside required official group.
2. Expected: Wallet connect or daily claim is blocked with membership-required error.

### C. Duplicate Daily Claim Window

1. Submit daily claim twice within 24h.
2. Expected: Second claim is rejected by cooldown logic.

### D. Owner Self-Attribution Block

1. Group owner attempts to claim in a way that attributes reward to self.
2. Expected: Group owner reward is blocked with reason explaining self-attribution policy.

## Release Sign-Off Criteria

Mark release as pass only if all are true:

- Coinbase wallet link works via external/wallet browser path.
- MetaMask wallet link works via MetaMask browser path.
- Daily claim succeeds with valid signatures for both EOA and smart-wallet users.
- Group title appears correctly in admin rewards table.
- Pending-to-paid admin reward transition works with tx hash persisted.
- No regression in Telegram auth and membership checks.

## Useful Endpoints for Debugging

- `POST /api/telegram-miniapp/auth`
- `POST /api/telegram-miniapp/wallet/nonce`
- `POST /api/telegram-miniapp/wallet/connect`
- `POST /api/epwx/daily-claim`
- `POST /api/telegram-miniapp/group-owner/register`
- `GET /api/telegram-miniapp/group-owner/rewards/admin`
- `POST /api/telegram-miniapp/group-owner/rewards/:rewardId/mark-paid`

## Trigger Smoke After Backend-Only Deploy

If you deploy only backend (for example `git pull` + `pm2 restart epwx-api`), run this command on the server to trigger the same GitHub smoke workflow automatically:

```bash
cd /path/to/epwx_task_hub && GITHUB_TOKEN=YOUR_GITHUB_TOKEN node scripts/trigger-post-deploy-smoke.mjs
```

Optional overrides:

- `POST_DEPLOY_SMOKE_REPO` (default `epwx/epwx_task_hub`)
- `POST_DEPLOY_SMOKE_EVENT` (default `post-deploy-smoke`)
- `POST_DEPLOY_SMOKE_FRONTEND_URL` (default `https://tasks.epowex.com`)
- `POST_DEPLOY_SMOKE_API_BASE_URL` (default `https://api.epowex.com`)
