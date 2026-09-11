import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Carousel} from 'react-native-reanimated-carousel';

import {fetchProductById} from '../api/products';
import {isAbortError} from '../api/client';
import {AddToCartButton} from '../components/AddToCartButton';
import {QuantityStepper} from '../components/QuantityStepper';
import type {RootStackParamList} from '../navigation/types';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {addToCart, selectCartItems} from '../store/slices/cartSlice';
import type {CatalogProduct} from '../store/slices/catalogSlice';
import {colors} from '../theme/colors';
import {getDiscountedPrice} from '../utils/commerce';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen({route, navigation}: Props) {
  const {productId} = route.params;
  const dispatch = useAppDispatch();
  const {width} = useWindowDimensions();
  const cartItems = useAppSelector(selectCartItems);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const inCartQty =
    cartItems.find(item => item.productId === productId)?.quantity ?? 0;
  const cachedProduct = useAppSelector(state =>
    state.catalog.products.find(product => product.id === productId),
  );
  const searchMatch = useAppSelector(state =>
    state.catalog.searchResults?.find(product => product.id === productId),
  );

  const [product, setProduct] = useState<CatalogProduct | undefined>(
    cachedProduct ?? searchMatch,
  );
  // Stepper = how many of this product to add on the next "Add to Cart" press.
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(!cachedProduct && !searchMatch);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      navigation.setOptions({title: product.title});
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        const remote = await fetchProductById(productId, controller.signal);
        setProduct(remote);
        navigation.setOptions({title: remote.title});
        setError(null);
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }
        setError(
          err instanceof Error ? err.message : 'Unable to load product details',
        );
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [navigation, product, productId]);

  const images = useMemo(() => {
    if (!product) {
      return [];
    }

    const unique = Array.from(
      new Set([product.thumbnail, ...(product.images ?? [])].filter(Boolean)),
    );
    return unique;
  }, [product]);

  const unitPrice = product
    ? getDiscountedPrice(product.price, product.discountPercentage)
    : 0;

  const onAddToCart = () => {
    if (!product) {
      return;
    }

    dispatch(
      addToCart({
        productId: product.id,
        title: product.title,
        price: unitPrice,
        thumbnail: product.thumbnail,
        quantity,
      }),
    );
    // Stepper is "how many to add next time" — reset after a successful add.
    setQuantity(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.actionGreen} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!product || error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Product unavailable</Text>
          <Text style={styles.errorSubtitle}>
            {error ?? 'We could not find this product.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const carouselHeight = Math.min(width * 0.9, 420);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Carousel
          style={{width, height: carouselHeight}}
          itemSize={width}
          data={images}
          loop={images.length > 1}
          snapMode="page"
          renderItem={({item}: {item: string}) => (
            <Image
              source={{uri: item}}
              style={styles.image}
              resizeMode="cover"
            />
          )}
        />

        <View style={styles.body}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.title}>{product.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${unitPrice.toFixed(2)}</Text>
            {product.discountPercentage > 0 ? (
              <>
                <Text style={styles.mrp}>${product.price.toFixed(2)}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {Math.round(product.discountPercentage)}% OFF
                  </Text>
                </View>
              </>
            ) : null}
          </View>
          <Text style={styles.description}>{product.description}</Text>

          <Text style={styles.sectionLabel}>Quantity</Text>
          {inCartQty > 0 ? (
            <Text style={styles.inCartHint}>{inCartQty} already in cart</Text>
          ) : null}
          <QuantityStepper quantity={quantity} onChange={setQuantity} />

          <View style={styles.cta}>
            <View style={styles.ctaRow}>
              <View style={styles.ctaButton}>
                <AddToCartButton onPress={onAddToCart} />
              </View>
              <View
                style={styles.cartCount}
                accessibilityRole="text"
                accessibilityLabel={`${cartCount} items in cart`}>
                <Text style={styles.cartCountLabel}>Cart</Text>
                <Text style={styles.cartCountValue}>{cartCount}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceSecondary,
  },
  body: {
    paddingHorizontal: '5%',
    paddingTop: 18,
    gap: 10,
  },
  category: {
    textTransform: 'capitalize',
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mrp: {
    fontSize: 15,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  badge: {
    backgroundColor: colors.actionGreenLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.discountBadgeText,
    fontWeight: '700',
    fontSize: 12,
  },
  description: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  sectionLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inCartHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: -4,
  },
  cta: {
    marginTop: 18,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  ctaButton: {
    flex: 1,
    minWidth: 0,
  },
  cartCount: {
    minWidth: 64,
    maxWidth: '28%',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  cartCountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  cartCountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '8%',
    gap: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
