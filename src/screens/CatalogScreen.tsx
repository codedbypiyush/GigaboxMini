import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {FlashList} from '@shopify/flash-list';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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
  loadCategories,
  searchCatalog,
  selectCatalogError,
  selectCatalogStatus,
  selectCategories,
  selectSearchQuery,
  selectSearchStatus,
  selectSelectedCategory,
  selectVisibleProducts,
  setSearchQuery,
  setSelectedCategory,
  type CatalogProduct,
} from '../store/slices/catalogSlice';
import {colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Catalog'>;

const SEARCH_DEBOUNCE_MS = 350;

export function CatalogScreen({navigation}: Props) {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectVisibleProducts);
  const cachedCount = useAppSelector(state => state.catalog.products.length);
  const status = useAppSelector(selectCatalogStatus);
  const searchStatus = useAppSelector(selectSearchStatus);
  const error = useAppSelector(selectCatalogError);
  const categories = useAppSelector(selectCategories);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const searchQuery = useAppSelector(selectSearchQuery);
  const activeOrderId = useAppSelector(state => state.tracking.orderId);
  const {isOffline} = useNetwork();
  const {width} = useWindowDimensions();

  const [draftQuery, setDraftQuery] = useState(searchQuery);
  const searchAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const horizontalPadding = width * 0.04;
  const gap = 12;
  const numColumns = width >= 768 ? 3 : 2;
  const cardWidth =
    (width - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns;

  useEffect(() => {
    const load = async () => {
      try {
        await dispatch(fetchCatalog({force: cachedCount === 0})).unwrap();
        await dispatch(loadCategories());
      } catch {
        // Errors live in the catalog slice; cached products still render.
      }
    };

    if (!isOffline || cachedCount === 0) {
      load();
    }
  }, [cachedCount, dispatch, isOffline]);

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

      if (isOffline) {
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
    },
    [dispatch],
  );

  const onProductPress = useCallback(
    (productId: number) => {
      navigation.navigate('ProductDetails', {productId});
    },
    [navigation],
  );

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
        {error && cachedCount > 0 && !draftQuery.trim() ? (
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
              Search needs a connection. Clear the query to browse cached
              products.
            </Text>
          </View>
        ) : null}
      </View>
    );
  }, [
    cachedCount,
    categories,
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
  const showNoMatches =
    !showSkeleton &&
    !showEmptyError &&
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
              onPress={() => dispatch(fetchCatalog({force: true}))}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          ) : null}
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
});
