import React, {memo} from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type {CatalogProduct} from '../store/slices/catalogSlice';
import {colors} from '../theme/colors';

type Props = {
  product: CatalogProduct;
  onPress: (productId: number) => void;
  style?: StyleProp<ViewStyle>;
};

function ProductCardComponent({product, onPress, style}: Props) {
  const hasDiscount = product.discountPercentage > 0;
  const discountedPrice =
    product.price * (1 - product.discountPercentage / 100);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={product.title}
      onPress={() => onPress(product.id)}
      style={({pressed}) => [styles.card, style, pressed && styles.pressed]}>
      <Image
        source={{uri: product.thumbnail}}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {product.category}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            ${hasDiscount ? discountedPrice.toFixed(2) : product.price.toFixed(2)}
          </Text>
          {hasDiscount ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {Math.round(product.discountPercentage)}% OFF
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  body: {
    padding: 10,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    minHeight: 36,
  },
  category: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.actionGreenLight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.discountBadgeText,
  },
});
