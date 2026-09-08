import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {FlashList} from '@shopify/flash-list';
import React, {useCallback, useEffect, useMemo} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ProductCard} from '../components/ProductCard';
import {CatalogSkeleton} from '../components/CatalogSkeleton';
import type {RootStackParamList} from '../navigation/types';
import {useNetwork} from '../providers/NetworkProvider';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  selectCatalogError,
  selectCatalogProducts,
  selectCatalogStatus,
  fetchCatalog,
  type CatalogProduct,
} from '../store/slices/catalogSlice';
import {colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Catalog'>;

export function CatalogScreen({navigation}: Props) {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectCatalogProducts);
  const status = useAppSelector(selectCatalogStatus);
  const error = useAppSelector(selectCatalogError);
  const {isOffline} = useNetwork();
  const {width} = useWindowDimensions();

  const horizontalPadding = width * 0.04;
  const gap = 12;
  const numColumns = width >= 768 ? 3 : 2;
  const cardWidth =
    (width - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns;

  useEffect(() => {
    const load = async () => {
      try {
        await dispatch(fetchCatalog({force: products.length === 0})).unwrap();
      } catch {
        // Errors are stored in the catalog slice; cached products still render.
      }
    };

    if (!isOffline || products.length === 0) {
      load();
    }
  }, [dispatch, isOffline, products.length]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Cart')}
          hitSlop={8}
          style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Cart</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

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
    if (!error || products.length === 0) {
      return null;
    }

    return (
      <View style={styles.inlineNotice}>
        <Text style={styles.inlineNoticeText}>
          {isOffline
            ? 'Offline — showing your last cached catalog.'
            : `Could not refresh catalog: ${error}`}
        </Text>
      </View>
    );
  }, [error, isOffline, products.length]);

  const showSkeleton = status === 'loading' && products.length === 0;
  const showEmptyError = status === 'failed' && products.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {showSkeleton ? (
        <CatalogSkeleton count={numColumns * 3} />
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
  headerButtonText: {
    color: colors.textOnDark,
    fontWeight: '600',
    fontSize: 15,
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
