# Partner Portal Frontend Implementation

## Overview
Complete React/Next.js frontend for the partner admin portal. Partners can register, view stats, and track earnings.

## Files Created

### 1. Page
- **`/src/app/partner/page.tsx`** - Main partner portal page
  - Wallet connection check
  - Auto-detect registered partner
  - Switch between registration and dashboard views

### 2. Components
- **`/src/components/PartnerRegistrationForm.tsx`** - Partner registration form
  - Collects: name, Telegram channel, X/Twitter profile
  - Validates inputs
  - Calls `/api/partners/register` endpoint
  - Success redirects to dashboard

- **`/src/components/PartnerDashboard.tsx`** - Partner dashboard
  - Displays 6 stat cards:
    - Total Earnings
    - Pending Earnings
    - Completed Earnings
    - Total Referrals
    - Total Verified Claims
    - Active Users (last 30 days)
  - Shows partner wallet info
  - Includes earnings table component

- **`/src/components/PartnerEarningsTable.tsx`** - Earnings history table
  - Responsive design (desktop table + mobile cards)
  - Shows: Date, Cycle, Amount, Status, User
  - Pagination (20 items per page)
  - Status badges with color coding (pending/completed/reversed)
  - Calls `/api/partners/:partnerId/earnings` endpoint

### 3. Navigation Update
- Modified `/src/components/Header.tsx`
  - Added "Partner Portal" link in header
  - Shows when user is connected but not admin/merchant
  - Mobile-friendly navigation

## Features

### Partner Registration
1. User clicks "Partner Portal" in header
2. Connects wallet via ConnectKitButton
3. Form asks for:
   - Partner name (required)
   - Telegram channel (optional)
   - X/Twitter profile (optional)
4. On submit:
   - Calls backend `/api/partners/register`
   - Shows success toast
   - Redirects to dashboard

### Partner Dashboard
Shows real-time stats:
- **Total Earnings**: All earned EPWX (BigInt formatted)
- **Pending Earnings**: Awaiting 7-day settlement
- **Completed Earnings**: Ready for claim
- **Total Referrals**: Number of users referred
- **Verified Claims**: Total verified daily claims
- **Active Last 30 Days**: Users claiming in last month

### Earnings Table
- **Desktop**: Full table view
- **Mobile**: Card-based view
- **Pagination**: 20 items per page
- **Status Colors**:
  - Green: Completed ✓
  - Amber: Pending ⏳
  - Red: Reversed ✗

## UI/UX

### Design System
- Tailwind CSS with dark mode support
- Gradient backgrounds and borders
- Rounded corners and modern spacing
- Responsive grid layouts (sm, lg breakpoints)
- Color-coded status badges

### Color Coding
- **Cyan**: Primary action buttons and highlights
- **Green**: Success/completed states
- **Amber**: Warning/pending states
- **Blue**: Info badges
- **Purple**: Secondary stats

## API Calls

### Endpoints Used
```
POST   /api/partners/register           - Register new partner
GET    /api/partners                    - Check if user has partner
GET    /api/partners/:partnerId/stats   - Get dashboard stats
GET    /api/partners/:partnerId/earnings - Get earnings history
```

## State Management
- React `useState` for local component state
- `useEffect` for data fetching on mount
- `react-hot-toast` for user feedback

## Key Functions

### formatEpwx(value)
Converts BigInt EPWX (9 decimals) to human-readable format
```
100000000000 → 100,000 EPWX
```

### formatDate(dateString)
Formats ISO date to readable format
```
2026-06-22T10:30:00Z → Jun 22, 2026 10:30 AM
```

### getStatusColor(status)
Returns Tailwind classes for status badge colors

## Responsive Design

### Desktop (md+)
- 3-column stats grid
- Full table with pagination
- Horizontal layout

### Tablet (sm-md)
- 2-column stats grid
- Full table view

### Mobile (<sm)
- 1-column stats grid
- Card-based earnings view
- Stacked layout

## Error Handling
- Toast notifications for success/error
- Try-catch blocks for API calls
- Graceful fallbacks for missing data
- Loading states with spinner

## Performance
- Lazy load partner data on page visit
- Paginated earnings (20 per page)
- Debounced refresh button
- Efficient BigInt arithmetic

## Testing Checklist
- [ ] Register as partner
- [ ] View dashboard immediately after registration
- [ ] Check all stat cards display correctly
- [ ] Verify earnings table loads data
- [ ] Test pagination (next/previous)
- [ ] Check responsive design on mobile
- [ ] Verify dark mode works
- [ ] Test error handling (invalid wallet, network error)

## Future Enhancements
1. **Referral Link Generator**
   - Generate unique links per user
   - Copy-to-clipboard functionality
   - QR code generation

2. **Advanced Analytics**
   - Charts showing earnings over time
   - Conversion funnel visualization
   - User retention metrics

3. **Claim Management**
   - Button to claim completed earnings
   - Withdrawal history
   - Tax report generation

4. **Settings**
   - Update partner info
   - Change payout wallet
   - Notification preferences

## Dependencies
- React 18.2.0
- Next.js 14.2.35
- wagmi (for wallet connection)
- connectkit (for wallet UI)
- react-hot-toast (for notifications)
- TailwindCSS (for styling)

## File Structure
```
frontend/
├── src/
│   ├── app/
│   │   └── partner/
│   │       └── page.tsx                    (Partner portal page)
│   └── components/
│       ├── PartnerRegistrationForm.tsx     (Registration form)
│       ├── PartnerDashboard.tsx            (Dashboard with stats)
│       ├── PartnerEarningsTable.tsx        (Earnings table)
│       └── Header.tsx                      (Modified: added partner link)
```
