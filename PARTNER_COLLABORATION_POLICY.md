# Partner Collaboration Policy

## Overview
Partners can bring users to EPWX via tracked referral links. Users complete daily claims and partners earn EPWX rewards based on verified claim activity.

## Partner Reward Model

### Basic Rule
- **Partner earns 100,000 EPWX per user daily claim**
- Earning window: 30 days from first user claim
- After 30 days: earning resets and partner can earn another 100,000 EPWX per daily claim for the next 30 days
- No other rules or caps

### Eligibility
1. User must join via partner's tracked link
2. User must complete a verified daily claim
3. Partner attribution must be recorded in the system

### Payout Trigger
- Partner receives 100,000 EPWX immediately after user's daily claim is verified

### 30-Day Cycle
- Day 1-30: Partner earns 100,000 EPWX per verified daily claim
- Day 31+: Earning window resets, partner can earn another 100,000 EPWX per claim for days 31-60
- Continues indefinitely in 30-day cycles

### Example Flow
```
Day 1: User claims → Partner gets 100,000 EPWX
Day 2: User claims → Partner gets 100,000 EPWX
...
Day 30: User claims → Partner gets 100,000 EPWX
Day 31: User claims → Cycle resets, Partner gets 100,000 EPWX
...
Day 60: User claims → Partner gets 100,000 EPWX
Day 61: User claims → Next cycle resets, Partner gets 100,000 EPWX
```

## Database Schema Requirements

### Partners Table
```
- partner_id (primary key)
- partner_name
- created_at
- wallet_address
- status (active/inactive)
```

### Partner Referrals Table
```
- referral_id (primary key)
- partner_id (foreign key)
- user_id (foreign key)
- first_claim_date
- referral_link (unique tracking link)
```

### Partner Earnings Table
```
- earning_id (primary key)
- partner_id (foreign key)
- user_id (foreign key)
- referral_id (foreign key)
- claim_date
- cycle_number (which 30-day cycle: 0, 1, 2...)
- amount (100,000)
- status (pending/completed)
- created_at
```

## Implementation Algorithm

1. User visits partner link → system records `partner_id` in session
2. User completes daily claim → system verifies claim
3. On verified claim:
   - Check if partner attribution exists
   - Calculate cycle_number based on days since `first_claim_date`
   - Create earning record with amount = 100,000
   - Mark as pending
4. After 3-7 day verification hold, mark earning as completed
5. Transfer 100,000 EPWX to partner wallet
6. Log transaction in reward distribution ledger

## Partner Reporting
- Dashboard shows: total earnings, active users, earnings by cycle, payout history
- Weekly settlement report with breakdown by user and cycle

## Notes
- No maximum earnings cap per partner
- No fraud checks or quality gates beyond basic claim verification
- All payouts are unconditional once claim is verified
- Simple model prioritizes growth and partner acquisition
