# EPWX Task Hub 🚀

A decentralized social media task platform built on Base Network. Advertisers create campaigns, users complete Twitter/X tasks, and smart contracts automatically distribute EPWX token rewards.

## 🌟 Features

- **Twitter OAuth Security**: Users must verify their Twitter account before submitting tasks
- **Smart Contract Automation**: Automatic EPWX distribution upon task completion
- **Multi-Task Support**: Like, Follow, Retweet, Comment campaigns
- **Base Network**: Built on Coinbase's Layer 2 for low fees and fast transactions
- **Modern UI**: Responsive design with Tailwind CSS gradients and animations
- **Wallet Integration**: ConnectKit + Wagmi for seamless Web3 experience
- **Real-time Stats**: Live EPWX price feed from PancakeSwap DEX
- **Fraud Prevention**: Twitter API v2 verification ensures genuine task completion

## 🏗️ Tech Stack

### Frontend
- **Next.js 14.1.0** - React framework with App Router
- **Wagmi 2.5.7** - React hooks for Ethereum
- **ConnectKit 1.9.1** - Wallet connection UI
- **Viem 2.7.13** - TypeScript Ethereum library
- **Tailwind CSS 3.4.18** - Utility-first CSS framework
- **React Hot Toast** - Notification system

### Backend
- **Express.js** - REST API server
- **PostgreSQL + Sequelize** - Database and ORM
- **Passport.js** - Twitter OAuth authentication
- **Twitter API v2** - Social media task verification
- **Redis** - Caching and session storage
- **Ethers.js** - Smart contract interactions

### Smart Contracts
- **Solidity** - Contract language
- **TaskManager Contract**: Handles campaign creation, task verification, and reward distribution
- **EPWX Token**: ERC-20 token (9 decimals) at `0xef5f5751cf3eca6cc3572768298b7783d33d60eb`

### Infrastructure
- **PM2** - Process manager for production
- **Nginx** - Reverse proxy
- **Digital Ocean** - Cloud hosting
- **GitHub Actions** - CI/CD (optional)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Git

### Clone Repository
```bash
git clone https://github.com/epwx/epwx_task_hub.git
cd epwx_task_hub
```

### Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Server Configuration
NODE_ENV=production
PORT=4000
API_URL=https://api.epowex.com
FRONTEND_URL=https://tasks.epowex.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/epwx_tasks
DB_HOST=localhost
DB_PORT=5432
DB_NAME=epwx_tasks
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain
BASE_RPC_URL=https://mainnet.base.org
EPWX_TOKEN_ADDRESS=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
TASK_MANAGER_ADDRESS=0x792896b951380eBC7E52f370Ec6208c5D260A210
VERIFIER_PRIVATE_KEY=your_verifier_wallet_private_key

# Twitter OAuth (Required)
TWITTER_CONSUMER_KEY=your_twitter_consumer_key
TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_CALLBACK_URL=https://api.epowex.com/api/twitter/callback

# Session
SESSION_SECRET=your_session_secret_key

# CORS
CORS_ORIGIN=https://tasks.epowex.com,http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.epowex.com
NEXT_PUBLIC_TASK_MANAGER=0x792896b951380eBC7E52f370Ec6208c5D260A210
NEXT_PUBLIC_EPWX_TOKEN=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
NEXT_PUBLIC_CHAIN_ID=8453
```

## 📦 Quick Start

### Development Mode
```bash
# Clone repository
git clone https://github.com/epwx/epwx_task_hub.git
cd epwx_task_hub

# Start all services (backend + frontend)
./start-dev.sh
```

This will start:
- Backend API on `http://localhost:4000`
- Frontend on `http://localhost:3000`

### Backend Only
```bash
cd backend
npm install

# Create and configure .env file
cp .env.example .env
# Edit .env with your credentials

# Sync database schema
node scripts/syncDatabase.js

# Start development server
npm run dev
```

### Frontend Only
```bash
cd frontend
npm install

# Create and configure .env.local
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

## 🚀 Production Deployment

### Using PM2 Process Manager
```bash
# Backend
cd backend
npm install --production
node scripts/syncDatabase.js  # Sync database schema
pm2 start src/index.js --name epwx-api

# Frontend
cd frontend
npm install
npm run build
pm2 start npm --name epwx-frontend -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name tasks.epowex.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 Smart Contract

### TaskManager Contract
**Address**: `0x792896b951380eBC7E52f370Ec6208c5D260A210` (Base Mainnet)

#### Key Functions:
- `createCampaign(taskType, targetUrl, rewardPerTask, maxCompletions, durationInDays)` - Create new campaign
- `submitCompletion(campaignId, userAddress)` - Submit task completion (verifier only)
- `verifyCompletion(completionId, approved)` - Approve/reject submission
- `claimRewards()` - User claims accumulated rewards
- `withdrawEscrow(campaignId)` - Advertiser withdraws unused funds after expiry

#### Campaign Structure:
```solidity
struct Campaign {
    address advertiser;
    string taskType;        // "like", "follow", "retweet", "comment"
    string targetUrl;
    uint256 rewardPerTask;
    uint256 maxCompletions;
    uint256 completedCount;
    uint256 escrowedAmount;
    uint256 deadline;
    bool active;
}
```

## 🎯 How It Works

### For Advertisers:
1. Connect wallet to platform
2. Approve EPWX tokens for contract
3. Create campaign with task details and reward amount
4. Contract locks EPWX in escrow
5. Campaign goes live automatically

### For Users:
1. Connect wallet to platform
2. **Connect Twitter account via OAuth** (one-time verification)
3. Browse available campaigns
4. Complete social media task (like, follow, retweet, or comment)
5. Submit completion with your verified Twitter username
6. Backend verifies task via Twitter API v2
7. Smart contract sends EPWX directly to wallet ✨

## 🔐 Security & Fraud Prevention

### Twitter OAuth Flow
- Users must authenticate their Twitter account before submitting tasks
- OAuth tokens stored securely in database, linked to wallet address
- Task submissions verified against authenticated Twitter username
- Prevents users from claiming rewards for other people's Twitter activity

### Backend Verification
- Twitter API v2 validates all task completions in real-time
- Verifies likes, follows, retweets, and comments programmatically
- Rate limiting prevents API abuse
- Authorized verifier wallet submits approvals to blockchain

### Smart Contract Security
- All funds held in escrow by immutable smart contract
- Only authorized verifier can approve task completions
- Advertisers can withdraw unused funds after campaign expires
- No manual intervention needed for reward distribution

## 📊 Current Status

✅ **Completed:**
- Smart contract deployment on Base Mainnet
- Campaign creation interface with real-time blockchain sync
- Task browsing with live campaign data
- Wallet integration (ConnectKit + Wagmi)
- Modern responsive UI with Tailwind CSS
- EPWX price display from PancakeSwap
- **Twitter OAuth authentication** 
- **Task verification system with Twitter API v2**
- **Automated reward distribution via smart contract**
- PostgreSQL database with Sequelize ORM
- PM2 production deployment
- Nginx reverse proxy configuration

🚧 **In Progress:**
- User dashboard with submission history
- Campaign analytics for advertisers

📋 **Planned:**
- Admin panel for platform management
- Advanced analytics and reporting
- Leaderboard system
- Multi-language support
- Mobile app (React Native)

## 🌐 Live Platform

**Frontend**: [https://tasks.epowex.com](https://tasks.epowex.com)  
**API**: [https://api.epowex.com](https://api.epowex.com)

### API Endpoints
- `GET /health` - Health check
- `GET /api/twitter/status/:walletAddress` - Check Twitter connection status
- `POST /api/twitter/connect/start` - Initiate OAuth flow
- `GET /api/twitter/callback` - OAuth callback handler
- `POST /api/twitter/disconnect` - Disconnect Twitter account
- `POST /api/tasks/submit` - Submit task completion (requires Twitter auth)
- `GET /api/campaigns` - List active campaigns
- `GET /api/price/epwx` - Get current EPWX price

## 📱 Frontend Components

### Key Components
- **TwitterConnect** - OAuth authentication UI
- **TaskSubmissionModal** - Task submission with Twitter verification
- **TaskList** - Browse and filter active campaigns
- **MyCampaigns** - Advertiser dashboard
- **EPWXStats** - Real-time token statistics
- **Header** - Wallet connection and navigation

## 🗄️ Database Schema

### Users Table
```sql
- id (UUID, PK)
- walletAddress (STRING, UNIQUE) - Ethereum wallet
- twitterId (STRING, UNIQUE) - Twitter user ID
- twitterUsername (STRING) - Twitter handle
- twitterAccessToken (TEXT) - OAuth token (encrypted)
- twitterRefreshToken (TEXT) - OAuth refresh token
- email (STRING, optional)
- createdAt, updatedAt (TIMESTAMP)
```

### Campaigns Table
```sql
- id (UUID, PK)
- campaignId (INTEGER) - On-chain campaign ID
- advertiserId (UUID, FK -> Users)
- title (STRING)
- description (TEXT)
- taskType (ENUM: like, follow, retweet, comment)
- targetUrl (STRING) - Twitter URL
- rewardPerTask (DECIMAL) - EPWX amount
- maxCompletions (INTEGER)
- status (ENUM: pending, active, completed, cancelled, expired)
- createdAt, updatedAt (TIMESTAMP)
```

### TaskSubmissions Table
```sql
- id (UUID, PK)
- campaignId (UUID, FK -> Campaigns)
- userId (UUID, FK -> Users)
- twitterUsername (STRING)
- status (ENUM: pending, verified, rejected)
- verificationData (JSON) - Twitter API response
- txHash (STRING) - Blockchain transaction hash
- createdAt, updatedAt (TIMESTAMP)
```

## 📄 License

MIT License - see LICENSE file for details

## 👥 Team

EPOWEX Development Team

## 🔗 Links

- **Main Site**: [https://epowex.com](https://epowex.com)
- **EPWX Token**: [View on BaseScan](https://basescan.org/token/0xef5f5751cf3eca6cc3572768298b7783d33d60eb)
- **TaskManager Contract**: [View on BaseScan](https://basescan.org/address/0x792896b951380eBC7E52f370Ec6208c5D260A210)
- **Buy EPWX**: [PancakeSwap](https://pancakeswap.finance/swap?chain=base&outputCurrency=0xef5f5751cf3eca6cc3572768298b7783d33d60eb)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Write meaningful commit messages
- Test thoroughly before submitting PR
- Update documentation for new features
- Never commit sensitive data (API keys, private keys, passwords)

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (browser, OS, etc.)

## 💬 Support

- **Documentation**: See this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/epwx/epwx_task_hub/issues)
- **Email**: support@epowex.com

---

**Built with ❤️ on Base Network**
