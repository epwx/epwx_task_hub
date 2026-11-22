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

- Loads active social campaigns.
- Displays the daily-claim summary.
- Displays the latest reward draw and winners.
- Opens campaign URLs in the Android browser.
- Connects compatible wallets through Reown/WalletConnect.
- Requests a backend-generated, one-time login nonce.
- Signs the nonce with the wallet on Base.
- Verifies the signature using the existing `/api/auth/connect` backend route.
- Stores only the resulting access token in Expo SecureStore.
- Restores and validates the session when the app starts.

Claims and screenshot submissions remain disabled in this milestone. The existing
backend remains the only authority for reward eligibility and payouts.

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
