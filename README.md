# EPWX Task Platform

A decentralized platform for completing social media tasks and earning EPWX tokens on Base network.

## 🌟 Features

- **For Users:**
  - Complete social media tasks (like, repost, comment, follow)
  - Earn EPWX tokens instantly
  - Claim-based reward system
  - Track earnings and task history
  
- **For Advertisers:**
  - Create campaigns with custom tasks
  - Set rewards and target audience
  - Real-time campaign analytics
  - Automatic escrow and refunds

- **Platform:**
  - Base network integration (low fees)
  - PancakeSwap V2 price feeds
  - Twitter API verification
  - 0% platform fees

## 🏗️ Architecture

```
epwx_task_hub/
├── contracts/          # Smart contracts (Solidity + Hardhat)
├── backend/           # Node.js/Express API
├── frontend/          # Next.js web application
└── deployment/        # Deployment scripts and configs
```

## 📋 Prerequisites

### Development
- Node.js 20+
- PostgreSQL 15+
- Redis
- MetaMask wallet with Base network
- Twitter Developer Account

### Production (Digital Ocean)
- Ubuntu 22.04 Droplet (4GB RAM, 2 vCPUs)
- Domain: epowex.com
- Subdomains: tasks.epowex.com, api.epowex.com

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/epwx/epwx_task_hub.git
cd epwx_task_hub
```

### 2. Smart Contracts

```bash
cd contracts
npm install
cp .env.example .env
# Edit .env with your keys

# Deploy to Base Sepolia (testnet)
npm run deploy:testnet

# Deploy to Base Mainnet
npm run deploy:mainnet
```

### 3. Backend API

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with database and API keys

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with API URL and contract addresses

# Start development server
npm run dev
```

Visit http://localhost:3000

## 🔧 Configuration

### Smart Contract Configuration

`contracts/.env`:
```env
DEPLOYER_PRIVATE_KEY=your_private_key
BASE_RPC_URL=https://mainnet.base.org
EPWX_TOKEN_ADDRESS=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
```

### Backend Configuration

`backend/.env`:
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/epwx_tasks
REDIS_URL=redis://localhost:6379
BASE_RPC_URL=https://mainnet.base.org
EPWX_TOKEN_ADDRESS=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
TASK_MANAGER_CONTRACT=your_deployed_contract_address
TWITTER_API_KEY=your_twitter_api_key
TWITTER_BEARER_TOKEN=your_bearer_token
JWT_SECRET=your_jwt_secret
```

### Frontend Configuration

`frontend/.env`:
```env
NEXT_PUBLIC_API_URL=https://api.epowex.com
NEXT_PUBLIC_EPWX_TOKEN=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
NEXT_PUBLIC_TASK_MANAGER=your_deployed_contract_address
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 🌐 Deployment to Digital Ocean

### Initial Server Setup

```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Run setup script
chmod +x deployment/setup-server.sh
./deployment/setup-server.sh
```

### Configure DNS

Add these A records to epowex.com:
```
A    tasks    your_droplet_ip
A    api      your_droplet_ip
```

### Setup SSL

```bash
sudo certbot --nginx -d tasks.epowex.com -d api.epowex.com
```

### Deploy Application

```bash
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

### Monitor Services

```bash
# View logs
pm2 logs

# Check status
pm2 status

# Restart services
pm2 restart all
```

## 📊 Database Schema

### Users
- `id`: UUID
- `walletAddress`: Ethereum address
- `twitterId`, `twitterUsername`: Twitter integration
- `totalEarned`, `tasksCompleted`: Statistics
- `reputationScore`: User reputation

### Campaigns
- `id`: UUID
- `campaignId`: On-chain campaign ID
- `advertiserId`: User ID of advertiser
- `taskType`: like/repost/comment/follow
- `rewardPerTask`: EPWX amount
- `maxCompletions`: Total slots
- `status`: pending/active/completed/cancelled

### TaskSubmissions
- `id`: UUID
- `campaignId`, `userId`: Foreign keys
- `proofUrl`: Twitter post URL
- `status`: pending/verifying/approved/rejected
- `rewardAmount`: EPWX earned

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/connect` - Connect wallet
- `GET /api/auth/me` - Get current user

### Campaigns
- `GET /api/campaigns` - List active campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create campaign (authenticated)

### Tasks
- `POST /api/tasks/submit` - Submit task completion
- `GET /api/tasks/user` - Get user submissions
- `GET /api/tasks/pending` - Get pending verifications (admin)

### Price
- `GET /api/price/epwx` - Get EPWX price from PancakeSwap

## 🔐 Security

- JWT authentication
- Rate limiting (100 req/15min)
- Helmet.js security headers
- CORS configured for subdomains
- PostgreSQL connection pooling
- Input validation with express-validator

## 📈 Monitoring

- PM2 process management
- Log files in `/var/log/pm2/`
- Health check endpoint: `/health`

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Smart contract tests
cd contracts
npm test
```

## 🔄 Updating

```bash
# Pull latest changes
git pull origin main

# Redeploy
./deployment/deploy.sh
```

## 📱 Contract Addresses

### Base Mainnet
- **EPWX Token:** `0xef5f5751cf3eca6cc3572768298b7783d33d60eb`
- **EPWX/WETH Pair:** `0x9793d47dd47024ac4e1f17988d2e92da53a94541`
- **PancakeSwap V2 Router:** `0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb`
- **TaskManager:** Deploy your own

## 🔗 Links

- Main Site: https://epowex.com
- Task Platform: https://tasks.epowex.com
- API: https://api.epowex.com
- PancakeSwap: https://pancakeswap.finance/swap?chain=base&outputCurrency=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
- BaseScan: https://basescan.org/token/0xef5f5751cf3eca6cc3572768298b7783d33d60eb

## 💡 Support

For issues and questions:
- GitHub Issues: https://github.com/epwx/epwx_task_hub/issues
- Email: support@epowex.com

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- Base Network
- PancakeSwap
- OpenZeppelin
- Next.js
- wagmi

---

Built with ❤️ for the EPWX community