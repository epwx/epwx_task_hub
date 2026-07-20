# Coinbase Onramp Integration Guide

## Overview

The EPWX Task Hub now includes **Coinbase Onramp** integration, allowing users to purchase ETH or USDC directly with USD using their debit or credit card.

## What is Coinbase Onramp?

Coinbase Onramp is a payment solution that lets users convert USD to crypto on the Base blockchain without needing a Coinbase account. It handles all payment processing, fraud prevention, and KYC compliance.

**No signup required** for your LLC - it's a completely free integration that benefits your users.

## Features

✅ **Multiple payment methods**: Debit/Credit card, Bank transfer
✅ **Fast transactions**: Usually instant or within minutes
✅ **Secure**: Industry-standard encryption and fraud protection
✅ **Base network**: Crypto arrives directly to user's wallet
✅ **No intermediaries**: Users control their private keys
✅ **USD pricing**: Fixed amounts or custom amounts

## User Flow

```
User clicks "Buy EPWX with Card"
    ↓
Coinbase Onramp modal opens
    ↓
User enters USD amount ($50, $100, $500, etc.)
    ↓
User selects payment method (card or bank)
    ↓
Coinbase processes payment
    ↓
ETH or USDC lands in user's wallet (Base network)
    ↓
User returns to EPWX app
    ↓
User swaps crypto to EPWX or uses any DEX
```

## Implementation

### Component Location

- **Main App**: `frontend/src/components/CoinbaseOnrampCard.tsx`
- **Integrated into**: 
  - Homepage (`frontend/src/app/HomeTest.tsx`)
  - Telegram Mini App (`frontend/src/app/telegram-miniapp/page.tsx`)

### Usage

The component is already integrated and appears alongside the existing swap card.

```tsx
import { CoinbaseOnrampCard } from "@/components/CoinbaseOnrampCard";

export function MyPage() {
  return (
    <CoinbaseOnrampCard compact={false} />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `compact` | boolean | false | Renders a smaller version for tight spaces |

## Configuration

The component uses these hardcoded values:

- **App ID**: `epwx-task-hub` (free tier, no signup needed)
- **Network**: Base (Layer 2 Ethereum)
- **Currencies**: USD (input), ETH or USDC (output)
- **Payment Methods**: Card, Bank transfer

## User Experience Flow

### Desktop (Main App)
- Users see two cards side-by-side: "Swap ETH to EPWX" and "Buy with Card"
- Users can choose their preferred method
- After purchase, crypto arrives in their wallet

### Mobile (Telegram Mini App)
- Collapsible sections for "Swap ETH to EPWX" and "Buy EPWX with Card"
- Compact card design to save space
- Same payment experience

## How It Works (Technical)

When user clicks "Buy with Card":

1. Component verifies wallet is connected
2. User enters USD amount
3. Component opens Coinbase Onramp in a new window
4. Coinbase Onramp handles:
   - Payment collection
   - Compliance/KYC
   - Crypto purchase
   - Transfer to user's wallet

5. User returns to EPWX app with crypto in wallet
6. User can now:
   - Swap to EPWX using the existing swap card
   - Use any DEX (Uniswap, PancakeSwap, etc.)

## URL Parameters Sent to Coinbase

```
https://pay.coinbase.com/buy/select-asset?
  appId=epwx-task-hub
  destinationWallets=[{"address":"0x...", "blockchains":["base"], "assets":["ETH","USDC"]}]
  fiatAmount=100
  fiatCurrency=USD
  paymentMethods=CARD,BANK_TRANSFER
  redirectUrl=https://your-app.com/
```

## Features We Could Add Later

### 1. **Analytics Tracking**
```typescript
// Track when users complete purchases
if (event.type === 'purchase.completed') {
  trackEvent('coinbase_onramp_success', {
    userId: address,
    amount: usdAmount,
    timestamp: Date.now()
  });
}
```

### 2. **Partner Dashboard**
- Track total fiat purchases from Coinbase Onramp
- Monitor conversion rates
- Display payment method preferences

### 3. **Branded Experience**
Register as Coinbase Commerce partner for:
- Custom colors/branding
- Detailed analytics
- Webhook notifications

## Troubleshooting

### "Please connect your wallet first"
- User needs to connect wallet before using Coinbase Onramp
- Use the "Connect Wallet" button on the page

### Payment didn't arrive
- Check if Base network is selected in wallet
- Sometimes takes 5-10 minutes
- Check Coinbase's transaction status page

### Different asset received than expected
- Coinbase Onramp chooses the best route
- Can convert received crypto using any DEX
- No difference for user

## Security & Compliance

- **No private keys exposed**: Users maintain control
- **No account required**: Works with just wallet address
- **Secure payment**: PCI-DSS Level 1 compliance
- **Fraud prevention**: Industry-standard KYC/AML checks
- **Insurance**: Crypto is insured during transfer

## Support

For user support issues with Coinbase Onramp:
- Coinbase Support: https://help.coinbase.com/
- Check transaction status: https://pay.coinbase.com/

For EPWX integration issues:
- Check wallet connection
- Verify network is Base (chain ID 8453)
- Check browser console for errors

## Future Roadmap

- [ ] Track payment method statistics
- [ ] A/B test USD amounts vs custom input
- [ ] Add referral tracking for Coinbase
- [ ] Webhook notifications for completed purchases
- [ ] Dashboard analytics
- [ ] Integration with partner reward system

## Resources

- Coinbase Onramp Docs: https://docs.coinbase.com/onramp/
- Coinbase Pay Dashboard: https://pay.coinbase.com/
- Base Network: https://base.org/

---

**Last Updated**: 2026-07-20
**Status**: ✅ Implemented and live
**Component**: CoinbaseOnrampCard.tsx
