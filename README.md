# Car Sale — React Native (AutoHayq)

Mobile client for the AutoHayq car sale platform. Companion to the Laravel app in `../car_sale`.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | [Expo SDK 56](https://docs.expo.dev/) + React Native 0.85 |
| Language | TypeScript (strict) |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| Animation | React Native Reanimated |
| Lint / format | ESLint (expo config) + Prettier |

## Project structure

```
car-sale-rn/
├── src/
│   ├── app/           # Screens & layouts (Expo Router)
│   ├── components/    # Reusable UI
│   ├── constants/     # App config & env-backed values
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilities (API client, storage, etc.)
│   ├── services/      # Domain logic (auth, announcements, …)
│   ├── theme/         # Colors, spacing, typography tokens
│   └── types/         # Shared TypeScript types
├── assets/            # Icons, splash, images
└── app.json           # Expo config
```

## Getting started

```bash
cd car-sale-rn
cp .env.example .env   # set EXPO_PUBLIC_API_URL to your Laravel API
npm install
npm start
```

Then press `a` for Android emulator, `w` for web, or scan the QR code with Expo Go.

> **Expo Go note:** This project uses **Expo SDK 56**. The Play Store / App Store version of Expo Go is still on an older SDK. On Android, install the matching Expo Go from [expo.dev/go](https://expo.dev/go?sdkVersion=56&platform=android&device=true) (USB + Expo Orbit, or scan the QR on that page). Until then, use `npm run web` in the browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Open on Android |
| `npm run ios` | Open on iOS (macOS only) |
| `npm run web` | Open in browser |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run format` | Format with Prettier |

## API integration

The app is prepared to talk to the Laravel API using the same `{ data, meta }` response shape as the web client. Configure the base URL via `EXPO_PUBLIC_API_URL` in `.env`.

## Next steps

Screens, auth flow, and announcement features will be added on top of this scaffold.
