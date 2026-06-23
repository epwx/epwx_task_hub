# Partner Collaboration Implementation Guide

## Overview
The partner collaboration feature is now fully implemented in the EPWX Task Hub backend. This guide explains what was built, how it works, and how to test it.

## What Was Implemented

### 1. Database Schema
Created 3 new database tables:
- **Partners**: Stores partner information (name, wallet, status, contact info)
- **PartnerReferrals**: Maps partners to users and tracks referral links
- **PartnerEarnings**: Records earnings for each verified daily claim
- **Daily Claims**: Extended with `partnerId` and `partnerReferralId` fields

### 2. Sequelize Models
- `Partner.js`: Partner entity with associations
- `PartnerReferral.js`: Referral tracking with indexes for fast lookups
- `PartnerEarning.js`: Earnings ledger with status tracking

### 3. Backend API Routes (`/api/partners`)

#### POST `/api/partners/register`
Register a new partner
```json
{
  "name": "Partner A",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "telegramChannel": "@partner_channel",
  "xProfile": "@partner_x"
}
```

Response:
```json
{
  "success": true,
  "partner": {
    "id": "uuid",
    "name": "Partner A",
    "walletAddress": "0x...",
    "status": "active",
    "totalEarnings": "0"
  }
}
```

#### POST `/api/partners/:partnerId/generate-link`
Generate a unique referral link for a user
```json
{
  "userId": "user-uuid"
}
```

Response:
```json
{
  "success": true,
  "referral": {
    "id": "uuid",
    "referralCode": "ABCD1234",
    "referralLink": "http://localhost:3000/claim?partner=ABCD1234"
  }
}
```

#### GET `/api/partners/referral/:code`
Get referral info by code
```
GET /api/partners/referral/ABCD1234
```

Response:
```json
{
  "success": true,
  "referral": {
    "id": "uuid",
    "partnerId": "uuid",
    "partnerName": "Partner A",
    "userId": "uuid",
    "referralCode": "ABCD1234",
    "totalClaimsEarned": 5
  }
}
```

#### GET `/api/partners/:partnerId/stats`
Get partner dashboard statistics
```
GET /api/partners/partner-uuid/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "partner": { ... },
    "totalReferrals": 10,
    "totalEarnings": "1000000000000",
    "pendingEarnings": "100000000000",
    "completedEarnings": "900000000000",
    "totalVerifiedClaims": 100,
    "activeUsersLast30Days": 8
  }
}
```

#### GET `/api/partners/:partnerId/earnings`
Get earnings history
```
GET /api/partners/partner-uuid/earnings?limit=50&offset=0
```

#### GET `/api/partners`
Get all partners (admin only)

#### PATCH `/api/partners/:partnerId/status`
Update partner status (admin only)

### 4. Partner Service Functions

The `partnerService.js` exports these functions:

```javascript
// Register a new partner
registerPartner(partnerData)

// Create or retrieve a partner referral link
createPartnerReferral(partnerId, userId)

// Get referral by code
getReferralByCode(referralCode)

// Calculate which 30-day cycle a claim belongs to
calculateCycleNumber(firstClaimDate)

// Record a partner earning for a verified daily claim
recordPartnerEarning(partnerId, userId, referralId, claimDate)

// Get partner dashboard statistics
getPartnerStats(partnerId)

// Get earnings history
getPartnerEarningsHistory(partnerId, limit, offset)

// Update earning status (for settlement)
updatePartnerEarningStatus(earningId, status, transactionHash)

// Get pending earnings ready for settlement
getPendingEarningsForSettlement(hoursOld)

// Admin: Get all partners
getAllPartners(status)

// Admin: Update partner status
updatePartnerStatus(partnerId, status)
```

### 5. Daily Claim Integration

The daily claim endpoint (`POST /api/epwx/daily-claim`) now accepts an optional `referralCode` parameter:

```json
{
  "wallet": "0x...",
  "signature": "0x...",
  "referralCode": "ABCD1234"
}
```

When a daily claim is verified with a partner referral code:
1. Partner referral is looked up
2. Partner earning is recorded (100,000 EPWX)
3. Claim includes `partnerId` and `partnerReferralId` fields
4. Response includes partner reward info

Example response:
```json
{
  "success": true,
  "message": "Daily claim successful and paid!",
  "amount": "100000000000",
  "status": "paid",
  "partnerReward": {
    "partnerId": "uuid",
    "partnerName": "Partner A",
    "rewardAmount": "100000000000"
  }
}
```

## How It Works

### Partner Registration Flow
1. Partner submits registration via API with wallet address
2. Partner record created with status = 'active'
3. Partner receives unique ID

### Referral Link Generation
1. Partner requests referral link for a specific user
2. Unique referral code is generated (cryptographically random)
3. Referral link format: `{FRONTEND_URL}/claim?partner={referralCode}`
4. PartnerReferral record created to track the mapping

### Daily Claim with Partner Attribution
1. User visits partner's link and sees `?partner=ABCD1234` in URL
2. Frontend stores referralCode
3. When user makes a daily claim, sends referralCode in request
4. Backend verifies referral code matches an active partner
5. Partner earning is recorded: 100,000 EPWX with status='pending'
6. After 3-7 day verification hold, status changes to 'completed'
7. Settlement process transfers EPWX to partner wallet

### 30-Day Cycle Tracking
- Each referred user has their own 30-day cycles
- Cycle number calculated as: `floor((days_since_first_claim) / 30)`
- Same 100,000 EPWX reward per claim across all cycles
- Example:
  - Days 1-30: cycle 0, earns 100K per claim
  - Days 31-60: cycle 1, earns 100K per claim
  - No limits or resets, just cycle tracking for analytics

## Testing

### Test 1: Register a Partner
```bash
curl -X POST http://localhost:3000/api/partners/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Partner",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "telegramChannel": "@testpartner",
    "xProfile": "@testpartner"
  }'
```

### Test 2: Generate Referral Link
```bash
# First, get a user ID from your database or create one
# Then generate a link for that user
curl -X POST http://localhost:3000/api/partners/{PARTNER_UUID}/generate-link \
  -H "Content-Type: application/json" \
  -d '{"userId": "{USER_UUID}"}'
```

### Test 3: Make a Daily Claim with Partner Referral
```bash
# Use the referralCode from test 2
curl -X POST http://localhost:3000/api/epwx/daily-claim \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x...",
    "signature": "0x...",
    "referralCode": "ABCD1234"
  }'
```

### Test 4: Get Partner Stats
```bash
curl http://localhost:3000/api/partners/{PARTNER_UUID}/stats
```

### Test 5: Get Partner Earnings
```bash
curl "http://localhost:3000/api/partners/{PARTNER_UUID}/earnings?limit=10&offset=0"
```

## Database Migrations

Before running the application, execute the migrations:

```bash
npm run migrate
```

This will create all the necessary tables and columns:
- Partners table
- PartnerReferrals table
- PartnerEarnings table
- partnerReferralId and partnerId columns on daily_claims

## Configuration

Add to `.env` file if not present:

```env
FRONTEND_URL=http://localhost:3000
```

This is used to generate referral links with the correct base URL.

## Security Considerations

1. **Partner Status Check**: Only active partners can earn rewards
2. **Signature Verification**: Daily claims still require valid wallet signature
3. **Telegram Verification**: User must be Telegram verified to claim
4. **Fraud Checks**: Only verified claims generate partner earnings
5. **Wallet Validation**: Partner wallet address validated on registration

## Next Steps for Full Implementation

1. **Settlement Service**: Create a job that processes pending earnings and transfers EPWX:
   - Query earnings with status='pending' older than 7 days
   - Batch transfer EPWX to partner wallets
   - Update status to 'completed'
   - Record transaction hash

2. **Telegram Bot Integration**: Extend bot to notify partners of earnings:
   - Send daily/weekly earnings summary
   - Allow partners to claim available earnings

3. **Mini App Integration**: Build the frontend Mini App:
   - Display campaign info
   - Show task progress
   - Submit proofs
   - Display earnings status

4. **Partner Dashboard**: Create a frontend partner portal:
   - View all campaigns and referrals
   - See real-time earnings and stats
   - Download earnings reports
   - Manage campaign settings

5. **Payout Automation**: Implement automatic settlement:
   - Scheduled job to settle pending earnings
   - Email receipts and summaries
   - Tax reporting data generation

## Troubleshooting

### Partner earnings not recorded
- Check that partner status is 'active'
- Verify referralCode is valid
- Check that daily claim was verified and status='paid'
- Check logs for any errors in recordPartnerEarning()

### Referral code not found
- Ensure the code was generated and stored in PartnerReferral table
- Check that the code hasn't expired (no expiration implemented yet)

### Partner can't see earnings
- Verify Partner model associations are loaded
- Check that PartnerEarning records exist with correct partnerId
- Ensure timestamps are correct (claimDate should be valid)

## Files Created/Modified

### New Files
- `/backend/migrations/20260622-create-partners.js`
- `/backend/migrations/20260622-create-partner-referrals.js`
- `/backend/migrations/20260622-create-partner-earnings.js`
- `/backend/migrations/20260622-add-partner-columns-to-daily-claims.js`
- `/backend/src/models/Partner.js`
- `/backend/src/models/PartnerReferral.js`
- `/backend/src/models/PartnerEarning.js`
- `/backend/src/services/partnerService.js`
- `/backend/src/routes/partners.js`

### Modified Files
- `/backend/src/models/index.js` - Added partner model imports and associations
- `/backend/src/models/DailyClaim.js` - Added partnerId and partnerReferralId fields
- `/backend/src/routes/epwx.js` - Added partner referral code handling to daily-claim endpoint
- `/backend/src/index.js` - Added partners router

## Deployment Checklist

- [ ] Run database migrations
- [ ] Update .env with FRONTEND_URL
- [ ] Test partner registration endpoint
- [ ] Test referral link generation
- [ ] Test daily claim with referral code
- [ ] Verify partner earnings are recorded
- [ ] Check partner dashboard stats
- [ ] Set up settlement job (see Next Steps)
- [ ] Deploy to staging
- [ ] Test full flow in staging
- [ ] Deploy to production
- [ ] Monitor logs for errors
- [ ] Verify first partner earnings settlement
