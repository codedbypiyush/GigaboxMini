import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {FlashList} from '@shopify/flash-list';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {CatalogSkeleton} from '../components/CatalogSkeleton';
import {CategoryChips} from '../components/CategoryChips';
import {ProductCard} from '../components/ProductCard';
import {SearchBar} from '../components/SearchBar';
import type {RootStackParamList} from '../navigation/types';
import {useNetwork} from '../providers/NetworkProvider';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  fetchCatalog,
  fetchCategoryCatalog,
  fetchMoreCatalog,
  hydrateCategoriesFromProducts,
  loadCategories,
  searchCachedCatalog,
  searchCatalog,
  selectCatalogError,
  selectCatalogStatus,
  selectCategories,
  selectCategoryStatus,
  selectHasMoreCatalog,
  selectIsLoadingMoreCatalog,
  selectSearchQuery,
  selectSearchStatus,
  selectSelectedCategory,
  selectVisibleProducts,
  setSearchQuery,
  setSelectedCategory,
  type CatalogProduct,
} from '../store/slices/catalogSlice';
import {colors} from '../theme/colors';
import {useCatalogLayout} from '../theme/layout';

type Props = NativeStackScreenProps<RootStackParamList, 'Catalog'>;

const SEARCH_DEBOUNCE_MS = 350;

export function CatalogScreen({navigation}: Props) {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectVisibleProducts);
  const cachedCount = useAppSelector(state => state.catalog.products.length);
  const status = useAppSelector(selectCatalogStatus);
  const searchStatus = useAppSelector(selectSearchStatus);
  const categoryStatus = useAppSelector(selectCategoryStatus);
  const error = useAppSelector(selectCatalogError);
  const categories = useAppSelector(selectCategories);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const searchQuery = useAppSelector(selectSearchQuery);
  const hasMore = useAppSelector(selectHasMoreCatalog);
  const isLoadingMore = useAppSelector(selectIsLoadingMoreCatalog);
  const activeOrderId = useAppSelector(state => state.tracking.orderId);
  const {isOffline} = useNetwork();
  const {horizontalPadding, gap, numColumns, cardWidth} = useCatalogLayout();

  const [draftQuery, setDraftQuery] = useState(searchQuery);
  const searchAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSearching = draftQuery.trim().length > 0;
  const isCategoryBrowse = selectedCategory !== null;

  // Load first page once. Pagination is handled by onEndReached → fetchMoreCatalog.
  useEffect(() => {
    if (cachedCount === 0 && !isOffline) {
      dispatch(fetchCatalog());
    }
    // Chips are persisted; if missing after kill/reopen, rebuild from cache / API.
    if (categories.length === 0) {
      dispatch(hydrateCategoriesFromProducts());
      if (!isOffline) {
        dispatch(loadCategories());
      }
    } else if (cachedCount === 0 && !isOffline) {
      dispatch(loadCategories());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only; don't reset on page growth
  }, [dispatch]);

  // Retry on reconnect only when we have nothing usable — avoid wiping
  // already-paginated cache (client category filter would then look empty).
  const wasOfflineRef = useRef(isOffline);
  useEffect(() => {
    if (wasOfflineRef.current && !isOffline) {
      if (cachedCount === 0 || status === 'failed') {
        dispatch(fetchCatalog());
        dispatch(loadCategories());
      }
    }
    wasOfflineRef.current = isOffline;
  }, [cachedCount, dispatch, isOffline, status]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          {activeOrderId ? (
            <Pressable
              onPress={() => navigation.navigate('Tracking')}
              hitSlop={8}
              style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Track</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => navigation.navigate('Cart')}
            hitSlop={8}
            style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cart</Text>
          </Pressable>
        </View>
      ),
    });
  }, [activeOrderId, navigation]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      searchAbortRef.current?.abort();
    };
  }, []);

  const runSearch = useCallback(
    (query: string) => {
      searchAbortRef.current?.abort();

      const trimmed = query.trim();
      dispatch(setSearchQuery(query));

      if (!trimmed) {
        searchAbortRef.current = null;
        return;
      }

      // Offline: filter MMKV-cached browse pages instead of DummyJSON /search.
      if (isOffline) {
        dispatch(searchCachedCatalog(trimmed));
        return;
      }

      const controller = new AbortController();
      searchAbortRef.current = controller;

      dispatch(
        searchCatalog({
          query: trimmed,
          signal: controller.signal,
        }),
      );
    },
    [dispatch, isOffline],
  );

  const onChangeSearch = useCallback(
    (text: string) => {
      setDraftQuery(text);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Cancel the in-flight request immediately on every keystroke so a
      // slower previous response can never overwrite newer results.
      searchAbortRef.current?.abort();

      debounceRef.current = setTimeout(() => {
        runSearch(text);
      }, SEARCH_DEBOUNCE_MS);
    },
    [runSearch],
  );

  const onSelectCategory = useCallback(
    (category: string | null) => {
      dispatch(setSelectedCategory(category));
      // Online: DummyJSON /category/{slug} so chips work without scrolling All first.
      // Offline: leave categoryResults null → filter already-cached products.
      if (category && !isOffline) {
        dispatch(fetchCategoryCatalog(category));
      }
    },
    [dispatch, isOffline],
  );

  const onProductPress = useCallback(
    (productId: number) => {
      navigation.navigate('ProductDetails', {productId});
    },
    [navigation],
  );

  const onEndReached = useCallback(() => {
    if (
      isOffline ||
      isSearching ||
      isCategoryBrowse ||
      !hasMore ||
      isLoadingMore
    ) {
      return;
    }
    dispatch(fetchMoreCatalog());
  }, [
    dispatch,
    hasMore,
    isCategoryBrowse,
    isLoadingMore,
    isOffline,
    isSearching,
  ]);

  const listFooter = useMemo(() => {
    if (!isLoadingMore || isSearching || isCategoryBrowse) {
      return null;
    }

    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.actionGreen} />
        <Text style={styles.footerText}>Loading more…</Text>
      </View>
    );
  }, [isCategoryBrowse, isLoadingMore, isSearching]);

  const renderItem = useCallback(
    ({item, index}: {item: CatalogProduct; index: number}) => {
      const isEndOfRow = (index + 1) % numColumns === 0;

      return (
        <ProductCard
          product={item}
          onPress={onProductPress}
          style={{
            width: cardWidth,
            marginRight: isEndOfRow ? 0 : gap,
            marginBottom: gap,
          }}
        />
      );
    },
    [cardWidth, gap, numColumns, onProductPress],
  );

  const keyExtractor = useCallback(
    (item: CatalogProduct) => String(item.id),
    [],
  );

  const listHeader = useMemo(() => {
    return (
      <View>
        <SearchBar value={draftQuery} onChangeText={onChangeSearch} />
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={onSelectCategory}
        />
        {searchStatus === 'loading' ? (
          <View style={styles.searchingRow}>
            <ActivityIndicator color={colors.actionGreen} size="small" />
            <Text style={styles.searchingText}>Searching…</Text>
          </View>
        ) : null}
        {categoryStatus === 'loading' ? (
          <View style={styles.searchingRow}>
            <ActivityIndicator color={colors.actionGreen} size="small" />
            <Text style={styles.searchingText}>Loading category…</Text>
          </View>
        ) : null}
        {error && cachedCount > 0 && !draftQuery.trim() && !selectedCategory ? (
          <View style={styles.inlineNotice}>
            <Text style={styles.inlineNoticeText}>
              {isOffline
                ? 'Offline — showing your last cached catalog.'
                : `Could not refresh catalog: ${error}`}
            </Text>
          </View>
        ) : null}
        {isOffline && draftQuery.trim().length > 0 ? (
          <View style={styles.inlineNotice}>
            <Text style={styles.inlineNoticeText}>
              Offline search — matching previously fetched products only.
            </Text>
          </View>
        ) : null}
        {isOffline && selectedCategory ? (
          <View style={styles.inlineNotice}>
            <Text style={styles.inlineNoticeText}>
              Offline category — showing matches in previously fetched pages
              only.
            </Text>
          </View>
        ) : null}
      </View>
    );
  }, [
    cachedCount,
    categories,
    categoryStatus,
    draftQuery,
    error,
    isOffline,
    onChangeSearch,
    onSelectCategory,
    searchStatus,
    selectedCategory,
  ]);

  const showSkeleton = status === 'loading' && cachedCount === 0;
  const showEmptyError = status === 'failed' && cachedCount === 0;
  const showSearchError =
    searchStatus === 'failed' && draftQuery.trim().length > 0;
  const showNoMatches =
    !showSkeleton &&
    !showEmptyError &&
    !showSearchError &&
    categoryStatus !== 'loading' &&
    products.length === 0 &&
    (draftQuery.trim().length > 0 || selectedCategory !== null);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {showSkeleton ? (
        <View style={{paddingHorizontal: horizontalPadding, paddingTop: 12}}>
          {listHeader}
          <CatalogSkeleton count={numColumns * 3} />
        </View>
      ) : showEmptyError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Catalog unavailable</Text>
          <Text style={styles.emptySubtitle}>
            {isOffline
              ? 'Connect to the internet to download products.'
              : error ?? 'Something went wrong while loading products.'}
          </Text>
          {!isOffline ? (
            <Pressable
              style={styles.retryButton}
              onPress={() => dispatch(fetchCatalog())}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : showSearchError ? (
        <View style={{flex: 1, paddingHorizontal: horizontalPadding}}>
          {listHeader}
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Search failed</Text>
            <Text style={styles.emptySubtitle}>
              {error ?? 'Something went wrong while searching.'}
            </Text>
            {!isOffline ? (
              <Pressable
                style={styles.retryButton}
                onPress={() => runSearch(draftQuery)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : showNoMatches ? (
        <View style={{flex: 1, paddingHorizontal: horizontalPadding}}>
          {listHeader}
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              Try another search term or category.
            </Text>
          </View>
        </View>
      ) : (
        <FlashList
          data={products}
          key={numColumns}
          numColumns={numColumns}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingTop: 12,
            paddingBottom: 24,
          }}
          drawDistance={250}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButtonText: {
    color: colors.textOnDark,
    fontWeight: '600',
    fontSize: 15,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  inlineNotice: {
    backgroundColor: colors.warmBanner,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  inlineNoticeText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: '8%',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  retryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryButton,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: colors.primaryButtonText,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
