# EPWX UI Template Blueprint (Industry-Standard, Free/Commercially Usable)

## Purpose
This file captures the approved UI template direction and page-by-page mapping for EPWX so future implementation stays consistent.

## Scope
- Ideas and mapping only (no code implementation in this document).
- Focus on professional, industry-standard dashboard UX.
- Template sources restricted to fully free and commercially usable options.

## Approved Free Template Sources

### 1) Tabler (Primary)
- Website: https://tabler.io
- Repo: https://github.com/tabler/tabler
- License: MIT
- Commercial use: Yes
- Attribution required: No

### 2) CoreUI Free Bootstrap Admin (Secondary)
- Website: https://coreui.io/bootstrap/
- Repo: https://github.com/coreui/coreui-free-bootstrap-admin-template
- License: MIT (free edition)
- Commercial use: Yes
- Attribution required: No

### 3) AdminLTE (Tertiary / Fast MVP)
- Website: https://adminlte.io
- Repo: https://github.com/ColorlibHQ/AdminLTE
- License: MIT
- Commercial use: Yes
- Attribution required: No

## Final Template Priority
1. Tabler (best overall fit)
2. CoreUI Free (best for enterprise-heavy tables/workflows)
3. AdminLTE (best for very fast MVP assembly)

## Global App Shell (Applies Across Pages)
- Left sidebar navigation:
  - Home
  - Daily Draws
  - Rewards
  - Verification
  - Merchant Admin
  - Partner Admin
  - Ledger
  - Settings
- Top bar:
  - Wallet connection state
  - Network badge
  - Notifications
  - Profile menu
- Optional right utility drawer:
  - Claim
  - Verify
  - Export
  - Copy referral
- Mobile behavior:
  - Bottom tab navigation with max 5 core items:
    - Home, Draws, Claims, Verify, Profile
  - Remaining destinations under "More"

## Page-by-Page Mapping

### 1) Home
- Base: Tabler dashboard index
- Modules:
  - Wallet + Telegram verification summary (trust card)
  - KPI row: EPWX balance, claimable rewards, referral count, verification status
  - Buyer badge progress meter
  - Recent activity feed (claims, draw entries, referral events)
  - CTA strip: Buy EPWX, Complete verification, Join Telegram group
- Mobile priority:
  - Summary + primary claim CTA first

### 2) Daily Draws
- Base: Tabler cards + countdown + table patterns
- Modules:
  - Current draw countdown
  - Participation requirement panel
  - Entry status and primary Enter Draw action
  - Recent winners list (last 5)
  - Rules accordion
  - User entry audit/history table
- Mobile priority:
  - Countdown and Enter Draw action pinned high

### 3) Merchant Admin
- Base: CoreUI (or Tabler table-heavy page)
- Modules:
  - Header actions: Add merchant, import CSV, export filtered list
  - Main table: name, wallet, status, campaign, spend, rewards, last activity
  - Bulk actions: approve, suspend, assign campaign
  - Detail pane/modal: profile, compliance docs, recent claims
  - Tabs: Transactions, Claims, Settings, Notes
- Mobile fallback:
  - Card list with quick actions

### 4) Partner Verification
- Base: Tabler form wizard + timeline/status stepper
- Modules:
  - Stage tracker: Submitted, Under Review, Needs Changes, Approved, Rejected
  - KYC/business blocks: identity, social proof, wallet ownership, policy acceptance
  - Evidence uploader with validation states
  - Reviewer panel: checklist, comments, decision controls
  - SLA card: review ETA + escalation
- Mobile priority:
  - One step group per screen

### 5) Telegram Group Rewards
- Base: Tabler stats + rules + history table
- Modules:
  - Telegram connection/membership status
  - Reward tier and task checklist
  - Reward estimate calculator
  - Claim history table/list
  - Anti-abuse rule panel
- Mobile priority:
  - Status + next action first

### 6) Reward Ledger
- Base: CoreUI advanced table (or Tabler with rich filters)
- Modules:
  - Filter bar: date, type, status, actor search
  - Ledger columns: timestamp, actor, source, type, amount, tx ref, status
  - Sticky summary: distributed, pending, rejected totals
  - Row detail drawer: full audit trail + reviewer actions
  - Export: CSV, PDF
- Mobile fallback:
  - Grouped cards by date with expandable details

### 7) Admin Dashboard
- Base: Tabler analytics dashboard
- Modules:
  - KPI tiles: active users, verified users, reward outflow, draw participation
  - Charts: claims trend, verification funnel, merchant contribution
  - Queue widgets: pending verifications, flagged claims, failed payouts
  - Ops alerts + quick tools (reconciliation, payout batch, cache refresh)
- Mobile priority:
  - KPI and queue widgets before charts

### 8) Buy EPWX / Conversion
- Base: Tabler checkout/pricing pattern
- Modules:
  - Amount input + receive estimate + fees/slippage + confirm
  - Trust panel: contract address, safety reminders, supported wallets
  - FAQ accordion
  - Post-buy success state with next action
- Mobile priority:
  - Single-column flow with sticky confirm button

## Component Consistency Standards
- Status chips:
  - Pending (amber)
  - Approved (green)
  - Rejected (red)
  - In Review (blue)
- Unified card structure:
  - Title, value, context line, primary action
- Button hierarchy:
  - Primary, Secondary, Ghost, Danger
- Table standards:
  - Server-side pagination
  - Sorting
  - Saved filters
- UX states required:
  - Loading, empty, success, error, pending, disabled

## Build Order (When Implementation Starts)
1. Global shell + design tokens
2. Home + Daily Draws
3. Reward Ledger + Merchant Admin
4. Partner Verification wizard
5. Telegram Rewards + polish

## Legal/Compliance Reminder
- Prefer MIT templates when possible to avoid attribution obligations.
- Always verify license in the specific template repo at implementation time.
- If any non-MIT assets are introduced later (icons, illustrations, fonts), check their commercial license separately.

## How This Should Be Used In Future Prompts
When asked to redesign EPWX UI, follow this document as the default blueprint unless the user explicitly asks to override it.

## Implementation Tracking (Live)

### Latest Applied UI Work
- Date: 2026-07-13
- Status: Phase 4 non-home pages implemented, lint-clean, and build-clean
- Commit sequence:
  - 3dce3a1 - feat(frontend): restyle tasks and cashback pages
  - 1100fe8 - feat(frontend): restyle partner portal shell

### Files Updated In This UI Rollout
- frontend/src/app/HomeTest.tsx
- frontend/src/app/globals.css
- frontend/src/components/HomeSwapCard.tsx
- frontend/src/components/TokenSupplyPieChart.tsx
- frontend/src/components/EPWXCashbackClaim_clean.tsx
- frontend/src/components/TwitterConnect.tsx
- frontend/src/components/TaskSubmissionModal.tsx
- frontend/src/components/PartnerDashboard.tsx
- frontend/src/app/admin/daily-draws/page.tsx
- frontend/src/app/admin/engagement-claims/page.tsx
- frontend/src/app/admin/twitter-claims/page.tsx
- frontend/src/app/admin/merchants/page.tsx
- frontend/src/app/admin/merchants.tsx
- frontend/src/app/admin/partners/page.tsx
- frontend/src/app/claim/page.tsx
- frontend/src/app/tasks/page.tsx
- frontend/src/app/partner/page.tsx
- frontend/src/app/cashback/page.tsx
- frontend/src/components/MerchantClaimsTable.tsx
- frontend/src/components/PartnerRegistrationForm.tsx
- frontend/src/app/user-guide/page.tsx

### Ongoing Tracking Rule
For every future UI phase:
1. Update this section with date, status, and commit hashes.
2. Add or remove changed files in the file list.
3. Keep template priority and component standards aligned unless intentionally revised.
