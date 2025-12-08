# EPWX Task Hub 🚀

A decentralized social media task platform built on Base Network. Advertisers create campaigns, users complete social tasks, and smart contracts automatically distribute EPWX token rewards.

## 🌟 Features

- **Smart Contract Automation**: Automatic EPWX distribution upon task completion
- **Multi-Task Support**: Like, Follow, Retweet, Comment campaigns
- **Base Network**: Built on Coinbase's Layer 2 for low fees and fast transactions
- **Modern UI**: Responsive design with Tailwind CSS gradients and animations
- **Wallet Integration**: ConnectKit + Wagmi for seamless Web3 experience
- **Real-time Stats**: Live EPWX price feed from PancakeSwap DEX

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
- **Redis** - Caching layer
- **Twitter API v2** - Social media verification (planned)
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
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/epwx_tasks
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
TWITTER_BEARER_TOKEN=your_twitter_api_token
PRIVATE_KEY=your_wallet_private_key
RPC_URL=https://mainnet.base.org
TASK_MANAGER_ADDRESS=0x792896b951380eBC7E52f370Ec6208c5D260A210
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_TASK_MANAGER=0x792896b951380eBC7E52f370Ec6208c5D260A210
NEXT_PUBLIC_EPWX_TOKEN=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
NEXT_PUBLIC_CHAIN_ID=8453
```

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build
pm2 start npm --name epwx-frontend -- start

# Backend
cd backend
npm run build
pm2 start src/server.js --name epwx-api
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
2. Browse available campaigns
3. Complete social media task
4. Submit proof (Twitter username)
5. System verifies automatically via Twitter API
6. Smart contract sends EPWX directly to wallet ✨

## 🔐 Security

- Smart contracts handle all fund custody
- No manual reward distribution (fully automated)
- Twitter API verification prevents fraud
- Rate limiting on API endpoints
- Helmet.js security headers
- JWT authentication for protected routes

## 📊 Current Status

✅ **Completed:**
- Smart contract deployment
- Campaign creation interface
- Task browsing with live data
- Wallet integration
- Modern responsive UI
- EPWX price display
- Base Network integration

🚧 **In Progress:**
- Task submission with Twitter verification
- Automatic reward distribution
- User dashboard

📋 **Planned:**
- Reward claiming interface (if needed)
- Admin panel
- Campaign analytics
- Leaderboard system
- Multi-chain support

## 🌐 Live Site

**URL**: [https://tasks.epowex.com](https://tasks.epowex.com)

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

Contributions are welcome! Please open an issue or submit a pull request.

---

**Built with ❤️ on Base Network**
