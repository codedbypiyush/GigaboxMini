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

## Architecture

Layers stay separate on purpose:

| Layer | Responsibility |
| --- | --- |
| `src/api` | DummyJSON HTTP (`fetch` + optional `AbortSignal`) |
| `src/store` | RTK slices (`catalog`, `cart`, `tracking`) + MMKV persist |
| `src/services` | Local tracking simulation (swap-friendly for a real socket later) |
| `src/screens` / `src/components` | UI only — dispatch actions / read selectors |
| `src/providers` | NetInfo → offline flag for banner + checkout guards |
| `src/navigation` | Native stack: Catalog → Details → Cart → Tracking |

Data flow for catalog: screen → thunk → `api/products` → slice status/error → FlashList.  
Tracking: checkout writes `orderId` + `orderPlacedAt` → `MockTrackingService.getTrackingSnapshot(now)` → map + timeline.

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

## Assumptions

- **Catalog pagination:** Browse mode loads DummyJSON in pages of 20 (`skip`/`limit`) via FlashList `onEndReached`. Search stays a single request (up to 100 hits) so abort-on-type stays simple.
- **Checkout / tracking:** No real backend. Checkout creates a local order id; courier location and status come from `MockTrackingService` using `Date.now() - orderPlacedAt` so backgrounding does not freeze progress.
- **Maps (Android):** Needs a Google Maps API key in `AndroidManifest` / `strings.xml`. Without it, the tracking screen still mounts; tiles may be blank depending on device/emulator.
- **Delivery fee:** Free delivery at **$50** subtotal (`src/utils/commerce.ts`).
- **Tracking demo speed:** Phases are shortened (~15s / 35s / 90s) so reviewers can see the full PLACED → DELIVERED path without waiting on a real delivery ETA.
- **Offline:** Cached `catalog.products` (and cart/tracking) are available offline. Search and checkout require a connection.
- **iOS maps:** Uses Apple Maps provider by default; Android uses Google provider when configured.

## What I would do next

- Paginate **search** results the same way as browse (optional).
- Add an image cache layer (`expo-image` / FastImage) for catalog thumbnails.
- Deep link `gigabox://product/{id}` into Product Details.
- Local push when status hits `DELIVERED`.
- Instrument cold start + scroll FPS on a mid-range Android device and fold numbers into [PERFORMANCE.md](./PERFORMANCE.md).
- Replace `MockTrackingService` with a real WebSocket client behind the same snapshot interface.

## AI tools used

- **Cursor** assisted with scaffolding, native config checks (New Arch / 16 KB packaging), and iterative UI/API wiring.
- All product decisions (state shape, abort-on-search, timestamp-based tracking, persist whitelist) were reviewed and kept explainable line-by-line for the interview.
- Final behavior was verified against the assignment checklist; leftover gaps are called out under **Assumptions** / **What I would do next**.

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
