# Environment Variables Configuration

## Backend (.env)

Create a `.env` file in the `/backend` directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/epwx_tasks

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here_for_oauth

# Blockchain
BASE_RPC_URL=https://mainnet.base.org
VERIFIER_PRIVATE_KEY=0x...  # Critical: Must be authorized as verifier in TaskManager contract
TASK_MANAGER_ADDRESS=0x792896b951380eBC7E52f370Ec6208c5D260A210
EPWX_TOKEN_ADDRESS=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
EPWX_WETH_PAIR=0x...  # PancakeSwap EPWX/WETH pair for price feed

# Twitter/X OAuth (v1.1 for now)
TWITTER_CONSUMER_KEY=your_twitter_api_key
TWITTER_CONSUMER_SECRET=your_twitter_api_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_v2
TWITTER_CALLBACK_URL=http://localhost:4000/api/twitter/callback

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:3000,https://tasks.epowex.com
```

## Frontend (.env.local)

Create a `.env.local` file in the `/frontend` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000

# Blockchain
NEXT_PUBLIC_TASK_MANAGER=0x792896b951380eBC7E52f370Ec6208c5D260A210
NEXT_PUBLIC_EPWX_TOKEN=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# App Metadata
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Twitter OAuth Setup

### Getting Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new App or use existing app
3. Navigate to App Settings → Keys and tokens
4. Generate:
   - **API Key** (Consumer Key) → `TWITTER_CONSUMER_KEY`
   - **API Secret** (Consumer Secret) → `TWITTER_CONSUMER_SECRET`
   - **Bearer Token** → `TWITTER_BEARER_TOKEN`

### Configure OAuth Settings

1. In Twitter Developer Portal, go to App Settings → Authentication settings
2. Enable **OAuth 1.0a**
3. Set Callback URL:
   - Development: `http://localhost:4000/api/twitter/callback`
   - Production: `https://api.epowex.com/api/twitter/callback`
4. Set Website URL: `http://localhost:3000` (or your production URL)
5. Request email permission (optional but recommended)

## Production Environment Variables

For production deployment, update:

```env
# Backend
NODE_ENV=production
FRONTEND_URL=https://tasks.epowex.com
TWITTER_CALLBACK_URL=https://api.epowex.com/api/twitter/callback
CORS_ORIGIN=https://tasks.epowex.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.epowex.com
NEXT_PUBLIC_APP_URL=https://tasks.epowex.com
```

## Security Notes

- **Never commit** `.env` files to version control
- **Rotate** `SESSION_SECRET` and `JWT_SECRET` regularly
- **Keep** `VERIFIER_PRIVATE_KEY` secure - it has spending power on contract
- **Use** environment-specific variables for different deployments
- **Enable** HTTPS in production for OAuth callbacks
