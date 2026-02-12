# EPWX Merchant Reward Requirements (2026)

## Overview
This document outlines the requirements for the EPWX merchant reward system, including the corrected rule for customer claims based on wallet and IP address. It clarifies that the admin wallet is the only entity that distributes EPWX tokens, and tokens are sent directly to customers after claim approval—not to merchants.

## Requirements

1. **Admin Wallet Onboarding:**
   - The admin wallet is used to onboard merchants, storing their longitude, latitude, and address details.

2. **Customer Claim Flow (QR, Geofencing, Wallet Connect):**
   1. Customer visits the merchant’s shop and makes a purchase.
   2. Merchant displays a unique QR code at the shop (static or dynamically generated).
   3. Customer scans the QR code using the EPWX dApp or web app on their mobile device.
   4. The app requests permission to access the customer’s location (geolocation API).
   5. The app verifies the customer is within 50 meters of the shop’s registered coordinates (geofencing check).
   6. Customer connects their crypto wallet (e.g., MetaMask, WalletConnect) to the dApp.
   7. The app checks if the customer is eligible to claim (has not claimed in the last 24 hours).
   8. If eligible, the customer submits a claim request (optionally entering the bill amount for reward calculation).
   9. The backend verifies all conditions (location, claim interval, etc.) and records the claim.
   10. The admin (using the admin wallet) reviews and, if approved, manually sends EPWX tokens directly to the customer’s wallet address. No tokens are sent to the merchant’s wallet.

3. **Customer Purchases & Reward Independence:**
   - Customers purchase goods or services from merchants and pay the merchant directly, using any payment method. The payment process is entirely independent of the EPWX dApp.
   - After payment, EPWX (ePowerX On Base) tokens are distributed as free rewards to the merchant's customers, with no cost to the merchant or customer. These rewards are provided solely to promote EPWX and increase its popularity, and are not linked to the payment transaction in any way.

3. **No Merchant Fees:**
   - Merchants do not pay any fees to the EPWX owner (admin) at any time.

4. **Admin-Only Distribution:**
   - Only the admin wallet can distribute EPWX tokens manually via the dApp, similar to daily rewards.
   - The admin wallet sends EPWX tokens directly to the customer’s wallet after claim approval. The merchant’s wallet is not used for reward distribution.

5. **Customer Claim Rule (Corrected):**
   - A customer (identified by both wallet and IP address) can claim EPWX rewards only once every 24 hours, even if they make multiple purchases within that period.

6. **Geofencing Requirement:**
   - Customers must be physically present at the shop when claiming rewards.
   - Geofencing is used to verify the customer is within 50 meters of the QR code scanner at the store.

7. **Maximum Reward Cap:**
   - The total EPWX tokens distributed as rewards cannot exceed 1 million.

8. **Additional Suggestions:**
   - Merchant verification (KYC or business registration) to prevent fraud.
   - Clear reward calculation formula based on bill amount.
   - Daily/monthly cap per customer to prevent abuse.
   - Secure, dynamic QR codes to prevent spoofing.
   - Audit trail for all reward distributions.
   - Restrict claims to shop operating hours.
   - Track customer claim history for enforcement.
   - Merchant dashboard for reward and customer activity.
   - Admin controls to pause/adjust rewards if needed.
   - Monitor and alert when nearing the 1 million token cap.

---
Last updated: 2026-02-10
