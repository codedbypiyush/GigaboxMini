# Gigabox Mini

Bare React Native (CLI) take-home: catalog → cart → checkout → live order tracking.

Stack: **React Native 0.87** (New Architecture), **Redux Toolkit** + **redux-persist** + **MMKV**, FlashList, NetInfo, Reanimated, react-native-maps, BootSplash.

## Setup

### Prerequisites

- Node `>= 22.11`
- Follow [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) for Android / iOS
- **Android maps:** a Google Maps SDK key (see [Google Maps API key](#google-maps-api-key-android)). Without it, map **tiles** stay blank; status timeline + courier updates still work.

### Install & run

```sh
npm install
npm start
```

In a second terminal:

```sh
npm run android
# or
npm run ios
```

iOS (first clone / after native dependency changes):

```sh
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

### Release APK (optional, for reviewers)

```sh
cd android
./gradlew assembleRelease
# Windows: gradlew.bat assembleRelease
```

Outputs under `android/app/build/outputs/apk/release/` (prefer `app-arm64-v8a-release.apk` or `app-universal-release.apk` on modern phones).

| Script | Purpose |
| --- | --- |
| `npm start` | Metro |
| `npm run android` / `npm run ios` | Run app |
| `npm test` | Jest |
| `npm run lint` | ESLint |

## App flow

1. **Catalog** — DummyJSON products, infinite scroll, category chips, debounced search  
2. **Product details** — image carousel, quantity stepper, Reanimated add-to-cart  
3. **Cart** — edit/remove, free delivery above **$50**, mock checkout → local order id  
4. **Tracking** — map + PLACED → PACKED → OUT_FOR_DELIVERY → DELIVERED  

Cart + active tracking survive restarts (MMKV). Catalog `products` / `total` are cached for offline browse after at least one online fetch.

## Architecture

| Layer | Responsibility |
| --- | --- |
| `src/api` | DummyJSON HTTP (`fetch` + `AbortSignal` for search) |
| `src/store` | RTK slices: `catalog`, `cart`, `tracking` + MMKV persist |
| `src/services` | `MockTrackingService` — timestamp-based courier simulation |
| `src/screens` / `src/components` | UI only |
| `src/providers` | NetInfo → `isOffline` |
| `src/navigation` | Native stack: Catalog → Details → Cart → Tracking |

**Catalog:** screen → thunk → `api/products` → slice → FlashList (`onEndReached` pages with `skip`/`limit`).  

**Search:** debounce (~350ms). Online → DummyJSON `/search` (abort previous). Offline → filter cached `products` by title/category/description.  

**Tracking:** checkout stores `orderId` + `orderPlacedAt` → UI ticks every **2.5s** calling `getTrackingSnapshot(orderPlacedAt)` → also refresh on `AppState` active (background-safe).

```
src/
  api/
  components/
  navigation/
  providers/
  screens/
  services/tracking/
  store/
  theme/
  utils/
```

## Assumptions

- **Pagination:** Browse uses pages of 20 via FlashList `onEndReached`. Online search is one request (limit 100) so abort-on-type stays simple.
- **No backend for orders:** Mock checkout + local tracking only.
- **Single active order:** A new checkout replaces the previous tracking session (no order history).
- **Maps (Android):** Placeholder `YOUR_GOOGLE_MAPS_API_KEY` → blank tiles until a real key is set and the app is rebuilt.
- **Delivery fee:** Free above **$50** subtotal (`src/utils/commerce.ts`).
- **Tracking demo speed:** Short phases (~15s / 35s / 90s) so reviewers see full progression quickly.
- **Offline:** Banner + browse **previously fetched** catalog pages. Offline search filters that cache. Checkout still needs network. Reconnect retries only if the catalog failed or the cache is empty (so paginated category results are not wiped).
- **Product quantity stepper:** Controls “how many to add” on Add to Cart; cart badge is cart total.

## What I would do next

- Image caching (`expo-image` / FastImage)
- Deep link `gigabox://product/{id}`
- Local push when status is `DELIVERED`
- Paginate search the same way as browse
- Measure cold start / scroll FPS on a mid-range Android device and extend [PERFORMANCE.md](./PERFORMANCE.md)
- Swap `MockTrackingService` for a real WebSocket behind the same snapshot API

## AI tools used

- **Cursor** helped with scaffolding, native packaging checks, and iterating on UI/API wiring.
- Product decisions (abort-on-search, MMKV whitelist, timestamp tracking, pagination, offline cache search) were kept intentional and explainable for the review call.
- Gaps vs the brief are listed under **Assumptions** / **What I would do next**.

## Google Maps API key (Android)

1. [Google Cloud Console](https://console.cloud.google.com/) → project  
2. Enable **Maps SDK for Android**  
3. Create an API key (optional: restrict to package `com.gigabox.mini`)  
4. Paste into `android/app/src/main/res/values/strings.xml`:

```xml
<string name="google_maps_api_key" translatable="false">PASTE_KEY_HERE</string>
```

5. Rebuild (`npm run android` or a new APK). Metro reload alone is not enough.

## Native notes

- `android/gradle.properties` → `newArchEnabled=true`
- NDK **27.1** + `packaging.jniLibs.useLegacyPackaging = false` (Android 15 / 16 KB page size)
- BootSplash background `#FFC107` (`src/theme/colors.ts`)

## Demo tracking timeline

Status is always from `Date.now() - orderPlacedAt` (not from the timer alone):

| Status | Elapsed |
| --- | --- |
| PLACED | 0–15s |
| PACKED | 15–35s |
| OUT_FOR_DELIVERY | 35–90s |
| DELIVERED | ≥90s |

## Docs

- [PERFORMANCE.md](./PERFORMANCE.md) — list, search abort, tracking choices
