# EPWX Task Hub - AI Coding Agent Instructions

## Project Overview
Decentralized social media task platform on Base Network (L2). Users complete Twitter tasks (like, follow, repost, comment) and receive EPWX token rewards via smart contracts. Three-tier architecture: Next.js frontend, Express backend, Solidity smart contracts.

## Critical Architecture Decisions

### Hybrid On-Chain + Off-Chain Model
- **Smart contracts** (`TaskManager.sol`) handle escrow, reward distribution, and campaign state
- **Backend API** verifies Twitter tasks via Twitter API v2, then submits to blockchain
- **Database** (PostgreSQL) stores metadata, but blockchain is source of truth for campaigns/rewards
- Flow: User submits → Backend verifies → Backend calls `submitCompletion()` → Contract distributes EPWX

### Twitter/X OAuth Verification (Security Critical)
- Users **must** connect X/Twitter account via OAuth before submitting tasks
- Backend validates submitted username matches user's verified X account in database
- Prevents fraud: users can only claim rewards for their own X account actions
- OAuth flow: `/api/twitter/connect/start` → Twitter auth → `/api/twitter/callback` → Store username in DB
- Task submission checks: `user.twitterUsername === submittedUsername` before API verification

### Token Decimals: 9 (NOT 18)
EPWX uses 9 decimals (uncommon). Always use `formatUnits(amount, 9)` and `parseUnits(amount, 9)`. Hardcoded in contract at `0xef5f5751cf3eca6cc3572768298b7783d33d60eb`.

### Verifier Pattern
Backend has a private key (`VERIFIER_PRIVATE_KEY`) authorized in `TaskManager` contract to submit/approve tasks. Only verifiers can call `submitCompletion()` and `verifyCompletion()`.

## Key Development Commands

```bash
# Local development (runs both servers)
./start-dev.sh

# Backend only
cd backend && npm run dev  # Port 4000

# Frontend only  
cd frontend && npm run dev  # Port 3000

# Smart contract deployment
cd contracts && npx hardhat run scripts/deploy.js --network base

# Production with PM2
pm2 start deployment/ecosystem.config.js
pm2 restart epwx-backend
pm2 restart epwx-frontend
```

## Critical Files & Patterns

### Backend Service Layer (`backend/src/services/`)
- **blockchain.js**: Ethers.js provider, contract instances, verifier wallet signer
- **twitterVerification.js**: Twitter API v2 client with methods like `verifyLike()`, `verifyFollow()`
- **price.js**: Fetches EPWX price from PancakeSwap pair reserves

### Task Submission Flow (`backend/src/routes/tasks.js`)
1. User calls `POST /api/tasks/submit` with `{campaignId, twitterUsername}`
2. Backend fetches campaign from contract: `taskManagerWithSigner.campaigns(campaignId)`
3. Verify via Twitter API: `twitterVerification.verifyTask(taskType, username, targetUrl)`
4. Submit to blockchain: `taskManagerWithSigner.submitCompletion(campaignId, userAddress)`
5. Auto-approve: `taskManagerWithSigner.verifyCompletion(completionId, true)`
6. Reward sent automatically by contract

### Frontend Wagmi Patterns (`frontend/src/`)
- **Providers.tsx**: WagmiProvider + ConnectKit setup, Base network only
- **useReadContract**: Read contract state (campaigns, completion status)
- **useWriteContract**: User-initiated transactions (create campaign, approve tokens)
- Task cards read directly from blockchain, not API

### Campaign Model Sync
`Campaign` model in `backend/src/models/Campaign.js` mirrors contract struct but adds metadata (title, description). The `campaignId` field links DB record to on-chain campaign ID.

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
VERIFIER_PRIVATE_KEY=0x...  # Critical: authorized in contract
BASE_RPC_URL=https://mainnet.base.org
TASK_MANAGER_ADDRESS=0x792896b951380eBC7E52f370Ec6208c5D260A210
EPWX_TOKEN_ADDRESS=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
TWITTER_BEARER_TOKEN=...  # Twitter API v2
TWITTER_CONSUMER_KEY=...  # For OAuth
TWITTER_CONSUMER_SECRET=...  # For OAuth
TWITTER_CALLBACK_URL=http://localhost:4000/api/twitter/callback
SESSION_SECRET=...  # For OAuth sessions
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_TASK_MANAGER=0x792896b951380eBC7E52f370Ec6208c5D260A210
NEXT_PUBLIC_EPWX_TOKEN=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
NEXT_PUBLIC_CHAIN_ID=8453  # Base Mainnet
```

## Common Gotchas

1. **BigInt Serialization**: Use `.toString()` when storing contract values in DB (Sequelize doesn't handle BigInt)
2. **Twitter URL Formats**: Support both `twitter.com` and `x.com` URLs in verification logic
3. **Wallet Connection**: Frontend uses ConnectKit, not RainbowKit (despite package being installed)
4. **PM2 in Dev Containers**: PM2 not in PATH by default, use `npm` to start frontend in production
5. **Campaign Status**: Contract has `active` boolean, DB has `status` enum (pending/active/completed/cancelled/expired)
6. **Task Types**: Contract uses strings ("like", "repost", "comment", "follow"), DB uses ENUM

## Testing Workflow

- **Testnet**: Base Sepolia (chainId 84532), deploy via `hardhat.config.js` networks
- **Local Blockchain**: `npx hardhat node` for Hardhat network (chainId 1337)
- No automated tests currently - manual testing via frontend + API

## Deployment

- **Production Server**: Digital Ocean droplet, Nginx reverse proxy
- **Backend**: PM2 cluster mode (2 instances), logs in `/var/log/pm2/`
- **Frontend**: PM2 fork mode (1 instance), Next.js production build
- **Scripts**: `deployment/setup-server.sh` for fresh Ubuntu setup, `deploy-to-droplet.sh` for updates

## Integration Points

- **PancakeSwap**: Price feed from EPWX/WETH pair at `0x...` (see `.env`)
- **Base Network RPC**: Primary `https://mainnet.base.org`, configurable
- **Twitter API v2**: Rate limits apply, cache verification results when possible
- **Smart Contract Events**: Listen for `CampaignCreated`, `TaskCompleted`, `TaskVerified` to sync DB

## Code Style Patterns

- Backend: CommonJS (`require`), Express middleware pattern, Sequelize ORM
- Frontend: TypeScript, React Server Components + Client Components (`'use client'`), Tailwind utility classes
- Contracts: Solidity 0.8.20, OpenZeppelin imports, ReentrancyGuard on payout functions
- Error handling: Try-catch in routes, return `{success: boolean, error?: string, data?: any}`
