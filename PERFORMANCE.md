# Performance notes

Short write-up of the choices that keep Gigabox Mini usable on mid/low-end Android.

## Catalog scrolling

- Products render through **FlashList** (`@shopify/flash-list`) instead of `FlatList`.
- Browse mode pages DummyJSON with `limit=20` + `skip=products.length` on `onEndReached` (footer spinner while `isLoadingMore`).
- Column count comes from window width (`src/theme/layout.ts`): 2 on phones, 3 on tablets, 4 on large tablets.
- `ProductCard` is wrapped in `React.memo`. `renderItem` / `keyExtractor` use `useCallback` so FlashList does not remount cells on unrelated parent renders.
- `drawDistance={250}` keeps a modest offscreen buffer without over-allocating views.

## Search

- Input is debounced (~350ms) so we do not hit DummyJSON on every key.
- Every keystroke **aborts** the previous in-flight request via `AbortController` before scheduling the next debounce tick. That way a slow older response cannot overwrite newer results.
- Offline: filter cached `products` (title / category / description). Online still uses DummyJSON `/search` + abort.

## State & persistence

- Persist cart + tracking (and catalog `products` / `total` / `categories` for offline) go through **redux-persist**.
- Storage engine is **MMKV** (`react-native-mmkv`) — sync reads, cheap for restart survival without AsyncStorage latency.
- Ephemeral UI (search query, loading flags, selected category) is not persisted.

## Product details CTA

- Add-to-cart feedback is a small Reanimated scale + color pulse on the button itself.
- No layout thrashing or large JS-driven animations on the product list path.

## Order tracking

- Source of truth is `Date.now() - orderPlacedAt` in `MockTrackingService`.
- UI ticks every **2.5s** and also refreshes on `AppState` active (background-safe).
- Android map tiles need a Google Maps SDK key in `strings.xml` (see README).

## Layout / responsiveness

- Shared helpers in `src/theme/layout.ts` keep padding and column math consistent between the live grid and skeleton loaders (avoids the double-padding bug on skeleton state).
- Cart, product details, and tracking panels cap content width on tablets so landscape does not stretch text edge-to-edge.
- Safe areas come from `react-native-safe-area-context`. Offline banner owns the top inset when shown; the stack header adjusts so content does not sit under it.

## What we deliberately did not do

- No blanket `useMemo` / `useCallback` everywhere — only where list cells or abort/debounce handlers benefit.
- No fake splash React screen; BootSplash is native.
- No timer-only tracking model that would freeze while backgrounded.
