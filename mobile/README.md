# EPWX Tasks Mobile

The Expo Android application is isolated from the existing Next.js frontend
and Express backend.

## Start

```powershell
cd mobile
npm install
Copy-Item .env.example .env.local
npm run start
```

Press `a` to open Android, or scan the QR code with Expo Go.

## Current milestone

The current app includes:

- Displays the daily-claim summary.
- Displays recent daily claims and BaseScan transaction links.
- Connects compatible wallets through Reown/WalletConnect.
- Requests a backend-generated, one-time login nonce.
- Signs the nonce with the wallet on Base.
- Verifies the signature using the existing `/api/auth/connect` backend route.
- Stores only the resulting access token in Expo SecureStore.
- Restores and validates the session when the app starts.

Daily Claims are enabled after wallet authentication and verification. Screenshot
submission remains outside the mobile release scope. The existing backend remains
the only authority for reward eligibility and payouts.

The Play-review variant intentionally does not expose social campaigns, reward
draws, winner selection, token sales, exchanges, or custody features. It includes
token-risk, age/jurisdiction, privacy, terms, and account/data-request disclosures.

## Configuration

Set `EXPO_PUBLIC_API_URL` to the public EPWX backend origin. Never place database
credentials, private keys, or backend secrets in `EXPO_PUBLIC_*` variables because
Expo includes those values in the Android application.

Set `EXPO_PUBLIC_REOWN_PROJECT_ID` to the public project ID from the Reown dashboard.
Without it, public read-only screens continue working and the Wallet tab displays
the required setup notice.

The mobile flow reuses the existing backend routes:

- `POST /api/auth/nonce`
- `POST /api/auth/connect`
- `GET /api/auth/me`

No backend route, database schema, smart contract, or existing web authentication
change is required.

## Validation

```powershell
npm run typecheck
npx expo-doctor
npx expo export --platform android
```

## Android development build

WalletConnect native modules do not run inside Expo Go. Create an installable
development APK with EAS:

```powershell
npx eas-cli@latest project:init
npx eas-cli@latest build --platform android --profile development
```

Use the preview profile for an internal signed APK without development tools:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

`eas.json` contains only public `EXPO_PUBLIC_*` configuration. Backend secrets
must not be added to it.

## Play Console safety declaration

Declare that the app enables users to earn tokenized digital assets. Classify the
wallet integration as an external, non-custodial connection, not an in-app
custodial wallet or exchange. Exclude Play regions where the service is prohibited
or where licensing evidence is unavailable.

The store description must not promise a guaranteed reward, token value,
investment return, lifetime availability, payout timing, or odds. Publish the
public privacy, terms, support, age/jurisdiction, and data-deletion information
before requesting review.
