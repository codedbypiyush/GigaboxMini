# Gigabox Mini

Bare React Native (CLI) take-home slice of a quick-commerce app for iOS and Android.

Stack highlights:

- React Native **0.87** with **New Architecture** enabled
- Redux Toolkit + redux-persist + **MMKV**
- FlashList catalog, NetInfo offline banner, BootSplash
- Reanimated product CTA + maps-based order tracking

## Requirements

- Node `>= 22.11`
- Android Studio / Xcode per [RN environment setup](https://reactnative.dev/docs/set-up-your-environment)
- For Android maps: a Google Maps API key in `android/app/src/main/AndroidManifest.xml` (`com.google.android.geo.API_KEY`)

## Run

```sh
npm install
npm start
```

In another terminal:

```sh
npm run android
# or
npm run ios
```

iOS (first time / after native dep changes):

```sh
bundle install
bundle exec pod install
npm run ios
```

## App flow

1. **Catalog** — products from DummyJSON, category chips, debounced search
2. **Product details** — image carousel, quantity stepper, animated add-to-cart
3. **Cart** — subtotal, free delivery threshold ($50), mock checkout
4. **Tracking** — PLACED → PACKED → OUT_FOR_DELIVERY → DELIVERED on a map

Cart + active tracking survive restarts via MMKV. Catalog products are cached for offline browse.

## Project layout

```
src/
  api/           # HTTP client + product endpoints
  components/    # UI building blocks
  navigation/    # Root stack
  providers/     # NetInfo wrapper
  screens/       # Feature screens
  services/      # MockTrackingService (timestamp-delta)
  store/         # RTK slices + MMKV persist
  theme/         # colors + responsive layout helpers
  utils/         # commerce helpers
```

## Native notes

- `android/gradle.properties` → `newArchEnabled=true`
- NDK **27.1** + `packaging.jniLibs.useLegacyPackaging = false` for Android 15 / **16 KB** page size
- Splash uses `react-native-bootsplash` with `#FFC107` background (see `src/theme/colors.ts`)

## Demo tracking timeline

Statuses are derived from `Date.now() - orderPlacedAt` in `MockTrackingService` (not from a timer alone). Approximate windows:

| Status | Elapsed |
| --- | --- |
| PLACED | 0–15s |
| PACKED | 15–35s |
| OUT_FOR_DELIVERY | 35–90s |
| DELIVERED | ≥90s |

Backgrounding the app and returning still lands on the correct status because the service recalculates from timestamps.

## Docs

- [PERFORMANCE.md](./PERFORMANCE.md) — scroll, search abort, list, and tracking decisions

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Metro |
| `npm run android` / `npm run ios` | Run app |
| `npm test` | Jest |
| `npm run lint` | ESLint |
