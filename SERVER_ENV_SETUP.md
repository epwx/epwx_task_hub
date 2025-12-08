# Setting Up Server Environment Variables

## Option 1: PM2 Ecosystem File (Recommended for Production)

Your PM2 configuration is in `deployment/ecosystem.config.js`. Add environment variables there:

### Update `deployment/ecosystem.config.js`:

```javascript
{
  "apps": [
    {
      "name": "epwx-backend",
      "script": "src/index.js",
      "cwd": "/var/www/epwx-tasks/backend",
      "instances": 2,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 4000,
        
        // Twitter OAuth Keys - REPLACE WITH YOUR ACTUAL VALUES
        "TWITTER_CONSUMER_KEY": "your_api_key_here",
        "TWITTER_CONSUMER_SECRET": "your_api_key_secret_here",
        "TWITTER_BEARER_TOKEN": "your_bearer_token_here",
        "TWITTER_CALLBACK_URL": "https://api.epowex.com/api/twitter/callback",
        
        // Session & Security
        "SESSION_SECRET": "generate_random_secure_string_32_chars_min",
        "JWT_SECRET": "your_jwt_secret_here",
        
        // URLs
        "FRONTEND_URL": "https://tasks.epowex.com",
        "CORS_ORIGIN": "https://tasks.epowex.com",
        
        // Database (use your actual values)
        "DATABASE_URL": "postgresql://user:password@localhost:5432/epwx_tasks",
        "REDIS_URL": "redis://localhost:6379",
        
        // Blockchain
        "BASE_RPC_URL": "https://mainnet.base.org",
        "TASK_MANAGER_ADDRESS": "0x792896b951380eBC7E52f370Ec6208c5D260A210",
        "EPWX_TOKEN_ADDRESS": "0xef5f5751cf3eca6cc3572768298b7783d33d60eb",
        "VERIFIER_PRIVATE_KEY": "your_verifier_private_key"
      },
      "error_file": "/var/log/pm2/epwx-backend-error.log",
      "out_file": "/var/log/pm2/epwx-backend-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
}
```

### Deploy to Server:

```bash
# 1. Update the ecosystem.config.js file locally with your Twitter keys

# 2. Copy to server
scp deployment/ecosystem.config.js user@your-server:/var/www/epwx-tasks/deployment/

# 3. SSH into server
ssh user@your-server

# 4. Restart PM2 with new config
cd /var/www/epwx-tasks
pm2 delete epwx-backend
pm2 start deployment/ecosystem.config.js
pm2 save
```

---

## Option 2: Server Environment File (Alternative)

If you prefer using `.env` on the server:

### Create `.env` on Server:

```bash
# SSH into your server
ssh user@your-server

# Navigate to backend directory
cd /var/www/epwx-tasks/backend

# Create .env file
nano .env
```

### Add these variables to `.env`:

```env
NODE_ENV=production
PORT=4000

# Twitter OAuth - REPLACE WITH YOUR KEYS
TWITTER_CONSUMER_KEY=your_api_key_here
TWITTER_CONSUMER_SECRET=your_api_key_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_CALLBACK_URL=https://api.epowex.com/api/twitter/callback

# Session & Security
SESSION_SECRET=generate_random_32_char_string
JWT_SECRET=your_jwt_secret_here

# URLs
FRONTEND_URL=https://tasks.epowex.com
CORS_ORIGIN=https://tasks.epowex.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/epwx_tasks
REDIS_URL=redis://localhost:6379

# Blockchain
BASE_RPC_URL=https://mainnet.base.org
TASK_MANAGER_ADDRESS=0x792896b951380eBC7E52f370Ec6208c5D260A210
EPWX_TOKEN_ADDRESS=0xef5f5751cf3eca6cc3572768298b7783d33d60eb
VERIFIER_PRIVATE_KEY=your_verifier_private_key
```

### Secure the file:

```bash
# Set proper permissions (only owner can read)
chmod 600 .env
chown your-user:your-user .env

# Restart PM2
pm2 restart epwx-backend
```

---

## Option 3: GitHub Secrets (for CI/CD)

If you're using GitHub Actions for deployment:

1. Go to: https://github.com/epwx/epwx_task_hub/settings/secrets/actions
2. Click "New repository secret"
3. Add each variable:
   - Name: `TWITTER_CONSUMER_KEY`
   - Value: `your_api_key_here`
4. Repeat for all sensitive variables

---

## Security Best Practices

### ✅ DO:
- Store sensitive keys ONLY on the server (never in git)
- Use strong random strings for `SESSION_SECRET` and `JWT_SECRET`
- Set file permissions to 600 for `.env` files
- Use HTTPS URLs for production `TWITTER_CALLBACK_URL`
- Rotate keys regularly

### ❌ DON'T:
- Never commit `.env` files to git
- Never share API keys in chat, screenshots, or documentation
- Don't use development keys in production
- Don't store keys in plain text on local machine

---

## Generate Random Secrets

Use these commands to generate secure random strings:

```bash
# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl
openssl rand -hex 32
```

---

## Verify Setup

After setting environment variables, check if they're loaded:

```bash
# SSH into server
ssh user@your-server

# Check PM2 environment
pm2 show epwx-backend | grep TWITTER

# Or test startup
cd /var/www/epwx-tasks/backend
node -e "require('dotenv').config(); console.log('TWITTER_CONSUMER_KEY:', process.env.TWITTER_CONSUMER_KEY ? '✅ Set' : '❌ Missing')"
```

---

## Which Option Should You Use?

**For Production Server (Digital Ocean):** Use **Option 1** (PM2 ecosystem.config.js)
- ✅ Centralized configuration
- ✅ Easy to manage multiple environments
- ✅ PM2 handles environment injection
- ✅ Can be version controlled (just mask sensitive values)

**For Development (Local):** Create `/backend/.env` locally
- Only for local testing
- Never commit to git
- Copy from `.env.example`
