# Partner Verification & Approval System

## Overview

Complete partner application and verification workflow with file upload, admin review, and approval/rejection process.

## User Flow

### Partner Side

1. **Application Submission**
   - Partner connects wallet
   - Fills registration form with:
     - Partner name (required)
     - Twitter followers screenshot (required)
     - Telegram channel (optional)
     - X/Twitter profile (optional)
   - Clicks "Submit Application"

2. **Pending Status**
   - Application marked as `status='pending'`
   - Partner sees "Awaiting Admin Verification" message
   - Can check status by visiting `/partner` page

3. **Approval/Rejection Notification**
   - Once admin reviews, status changes to `approved` or `rejected`
   - Partner can see dashboard once approved
   - If rejected, sees rejection reason

4. **Start Earning**
   - Once approved, partner can create referral links
   - Users clicking partner links and completing daily claims generate earnings
   - Partner can view stats and earnings history

### Admin Side

1. **View Pending Applications**
   - Go to `/admin/partners` page
   - See all pending partner applications with:
     - Partner name
     - Wallet address
     - Applied date/time
     - Telegram/X profiles
     - Twitter followers screenshot

2. **Review Screenshot**
   - Click on screenshot to view full image
   - Verify Twitter follower count is real
   - Check for fraudulent accounts

3. **Approve or Reject**
   - Click "✓ Approve" to approve application
   - Click "✕ Reject" to show rejection form
   - For rejection, provide reason (required)
   - Confirm action

4. **Partner Status Updates**
   - Approved: `status='approved'`, `approvedAt=now`, `approvedBy=admin_wallet`
   - Rejected: `status='rejected'`, `rejectionReason=text`, `approvedAt=now`, `approvedBy=admin_wallet`

## Database Changes

### Partners Table Updates

```sql
ALTER TABLE Partners ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE Partners ADD COLUMN verificationImagePath VARCHAR(255);
ALTER TABLE Partners ADD COLUMN rejectionReason TEXT;
ALTER TABLE Partners ADD COLUMN approvedAt DATETIME;
ALTER TABLE Partners ADD COLUMN approvedBy VARCHAR(255);
```

### Status Fields Explanation

- **status**: Application status (pending/approved/rejected)
- **verificationImagePath**: Path to uploaded Twitter screenshot
- **rejectionReason**: Text explanation if rejected
- **approvedAt**: Timestamp when decision was made
- **approvedBy**: Admin wallet who made the decision

## Backend Changes

### Migrations

- **20260623-add-verification-to-partners.js**: Adds all verification fields

### Models

- **Partner.js**: Updated with new fields and indexes

### Services

- **partnerService.js**: New functions:
  - `getPendingPartners()`: Get all pending applications
  - `approvePartner(partnerId, adminWallet)`: Approve application
  - `rejectPartner(partnerId, adminWallet, reason)`: Reject with reason
  - `isPartnerApproved(partnerId)`: Check if approved
  - Updated `registerPartner()`: Requires verification image, starts as pending
  - Updated `recordPartnerEarning()`: Checks partner approved status

### Routes

- **partners.js**: Updated and new endpoints:
  - `POST /partners/register` (multipart form-data)
    - Accepts: name, walletAddress, telegramChannel, xProfile, verificationImage (file)
    - Returns: Partner with status='pending'
  - `GET /api/partners/admin/pending` (admin only)
    - Returns: List of all pending partners with screenshots
    - Requires: x-admin-wallet header
  - `PATCH /partners/:partnerId/status` (admin only)
    - Body: { status: 'approved' | 'rejected', reason?: string }
    - Updates partner and returns updated record

### Upload Handling

- **Directory**: `uploads/partner-verification/`
- **File Naming**: `{timestamp}-{random}-{originalname}`
- **File Types**: PNG, JPG, GIF, WEBP only
- **Max Size**: 5MB
- **Storage**: Disk storage (multer)

## Frontend Changes

### Pages

- **`/admin/partners`**: Partner verification admin dashboard
  - Lists all pending partners
  - Shows screenshots
  - Approve/reject buttons
  - Rejection form with reason input

### Components

- **PartnerRegistrationForm.tsx**
  - File input with preview
  - Drag-and-drop area
  - File validation (type, size)
  - Form submission with FormData

- **PartnerDashboard.tsx**
  - Shows "Pending Approval" state
  - Only shows full dashboard if approved

### Updates to Existing Components

- **Header.tsx**: Added "Partner Verification" link for admins

### Pages Updated

- **`/partner/page.tsx**
  - Shows different UI for different statuses:
    - `pending`: "Awaiting Admin Verification" message
    - `rejected`: Shows rejection reason
    - `approved`: Full dashboard

## API Endpoints

### Partner Endpoints

```
POST   /api/partners/register
       - Multipart form with file upload
       - Files: verificationImage
       - Returns: { success, message, partner }

GET    /api/partners/referral/:code
       - Get referral by code

GET    /api/partners/:partnerId/stats
       - Partner dashboard stats

GET    /api/partners/:partnerId/earnings
       - Paginated earnings history

GET    /api/partners
       - List all partners

POST   /api/partners/:partnerId/generate-link
       - Generate referral link for user
```

### Admin Endpoints

```
GET    /api/partners/admin/pending
       - Get pending applications
       - Admin only (x-admin-wallet header)
       - Returns: { success, partners }

PATCH  /api/partners/:partnerId/status
       - Approve/reject application
       - Admin only (x-admin-wallet header)
       - Body: { status: 'approved'|'rejected', reason?: string }
       - Returns: { success, message, partner }
```

## Approval Flow Diagram

```
Partner Registration
       ↓
Upload Twitter Screenshot
       ↓
Form Submission
       ↓
Backend: Status = 'pending'
       ↓
Admin Reviews (GET /admin/pending)
       ↓
Admin Views Screenshot & Info
       ↓
Admin Makes Decision
       ├─ APPROVE → Status = 'approved' → Partner sees Dashboard
       └─ REJECT  → Status = 'rejected' → Partner sees Reason

When Partner Approved:
       ↓
Can Create Referral Links
       ↓
Users Click Links & Claim
       ↓
Earnings Recorded (only if approved)
       ↓
Partner Views Stats & History
```

## Key Features

1. **File Upload**
   - Secure multer storage
   - Image validation
   - File size limits
   - Relative paths for portability

2. **Admin Review**
   - View all pending applications
   - See uploaded screenshots
   - Approve/reject with reasons
   - Audit trail (approvedBy, approvedAt)

3. **Earning Gate**
   - Partner must be approved to earn
   - Daily claims with unapproved partners fail gracefully
   - Prevents fraud and gaming

4. **Status Tracking**
   - Partners see clear status on portal
   - Rejection reasons provided
   - Applied date shown
   - Admin can view decisions

## Security Measures

1. **File Validation**
   - Only image files accepted
   - File size limit 5MB
   - Type checking (MIME type + extension)

2. **Admin Access Control**
   - Requires x-admin-wallet header
   - Checks against NEXT_PUBLIC_ADMIN_WALLETS
   - Admin-only routes protected

3. **Approval Requirement**
   - Earnings only if `status='approved'`
   - Earnings check in recordPartnerEarning()
   - Prevents unapproved partners earning

4. **Immutable Records**
   - Approval/rejection reason stored
   - Admin wallet recorded
   - Timestamp tracked
   - Full audit trail

## Testing Checklist

- [ ] Partner can upload screenshot and submit form
- [ ] Admin can view pending applications
- [ ] Admin can see uploaded screenshots
- [ ] Admin can approve application
- [ ] Partner sees "Approved" status after admin approval
- [ ] Admin can reject with reason
- [ ] Partner sees rejection reason
- [ ] Unapproved partner cannot earn (graceful fail)
- [ ] Approved partner can earn
- [ ] File validation works (reject non-images, large files)
- [ ] Only admins can access /admin/partners
- [ ] Mobile view responsive

## Migration & Deployment

1. **Run Migration**
   ```bash
   npm run migrate
   ```

2. **Update .env (if needed)**
   ```env
   ADMIN_WALLETS=0x...,0x...
   ```

3. **Test Admin Page**
   - Go to /admin/partners
   - Verify access control

4. **Test Partner Flow**
   - Register as partner
   - Upload screenshot
   - Admin approves
   - Verify dashboard shows

## Files Created/Modified

### New Files
- `/backend/migrations/20260623-add-verification-to-partners.js`
- `/frontend/src/app/admin/partners/page.tsx`

### Modified Files
- `/backend/src/models/Partner.js`
- `/backend/src/services/partnerService.js`
- `/backend/src/routes/partners.js`
- `/frontend/src/components/PartnerRegistrationForm.tsx`
- `/frontend/src/app/partner/page.tsx`
- `/frontend/src/components/Header.tsx`

## Future Enhancements

1. **Email Notifications**
   - Email partner when approved/rejected
   - Include rejection reason in email

2. **Bulk Actions**
   - Admin can approve/reject multiple partners at once
   - Batch download screenshots

3. **Metrics & Analytics**
   - Approval rate statistics
   - Time to approval
   - Common rejection reasons

4. **Reapplication**
   - Allow partners to reapply after rejection
   - Track reapplication history

5. **Suspension**
   - Admin can suspend approved partners
   - Add `suspendedAt` and `suspensionReason` fields
   - Approved partners can be suspended for violations
