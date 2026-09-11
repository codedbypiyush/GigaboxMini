import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useMemo} from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {QuantityStepper} from '../components/QuantityStepper';
import type {RootStackParamList} from '../navigation/types';
import {useNetwork} from '../providers/NetworkProvider';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  clearCart,
  removeFromCart,
  selectCartItems,
  selectCartSubtotal,
  updateQuantity,
  type CartItem,
} from '../store/slices/cartSlice';
import {startTracking} from '../store/slices/trackingSlice';
import {colors} from '../theme/colors';
import {useResponsiveLayout} from '../theme/layout';
import {
  FREE_DELIVERY_THRESHOLD,
  createOrderId,
  getDeliveryFee,
} from '../utils/commerce';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export function CartScreen({navigation}: Props) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const {isOffline} = useNetwork();
  const {width, contentMaxWidth, horizontalPadding} = useResponsiveLayout();
  const contentStyle = {
    width: Math.min(width, contentMaxWidth),
    alignSelf: 'center' as const,
    paddingHorizontal: horizontalPadding,
  };

  const deliveryFee = useMemo(() => getDeliveryFee(subtotal), [subtotal]);
  const total = subtotal + deliveryFee;
  const remainingForFreeDelivery = Math.max(
    0,
    FREE_DELIVERY_THRESHOLD - subtotal,
  );

  const onCheckout = () => {
    if (items.length === 0) {
      return;
    }

    if (isOffline) {
      Alert.alert(
        'You are offline',
        'Connect to the internet to place an order.',
      );
      return;
    }

    const orderId = createOrderId();
    dispatch(
      startTracking({
        orderId,
        orderPlacedAt: Date.now(),
      }),
    );
    dispatch(clearCart());

    Alert.alert('Order placed', `Your order ID is ${orderId}`, [
      {
        text: 'Track order',
        onPress: () => navigation.replace('Tracking'),
      },
    ]);
  };

  const renderItem = ({item}: {item: CartItem}) => (
    <View style={styles.card}>
      <Image source={{uri: item.thumbnail}} style={styles.thumb} />
      <View style={styles.cardBody}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.itemPrice}>
          ${(item.price * item.quantity).toFixed(2)}
        </Text>
        <QuantityStepper
          quantity={item.quantity}
          onChange={quantity =>
            dispatch(updateQuantity({productId: item.productId, quantity}))
          }
        />
        <Pressable onPress={() => dispatch(removeFromCart(item.productId))}>
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {items.length === 0 ? (
        <View style={[styles.empty, contentStyle]}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add products from the catalog to get started.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Catalog')}>
            <Text style={styles.primaryButtonText}>Browse catalog</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={item => String(item.productId)}
            renderItem={renderItem}
            contentContainerStyle={[styles.list, contentStyle]}
          />
          <View style={[styles.summary, contentStyle]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>
                {deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}
              </Text>
            </View>
            {remainingForFreeDelivery > 0 ? (
              <Text style={styles.freeDeliveryHint}>
                Add ${remainingForFreeDelivery.toFixed(2)} more for free
                delivery
              </Text>
            ) : (
              <Text style={styles.freeDeliveryUnlocked}>
                Free delivery unlocked
              </Text>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={onCheckout}>
              <Text style={styles.primaryButtonText}>Place order</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    gap: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: colors.background,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  remove: {
    color: colors.accentToys,
    fontWeight: '600',
    fontSize: 13,
  },
  summary: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: colors.background,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  freeDeliveryHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
  freeDeliveryUnlocked: {
    color: colors.discountBadgeText,
    fontSize: 12,
    fontWeight: '700',
  },
  totalRow: {
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.primaryButton,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.primaryButtonText,
    fontWeight: '700',
    fontSize: 15,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
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
});
