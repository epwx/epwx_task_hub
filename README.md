
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
