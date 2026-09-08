import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useAppSelector} from '../store/hooks';
import {selectCartItems, selectCartSubtotal} from '../store/slices/cartSlice';
import type {RootStackParamList} from '../navigation/types';
import {colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export function CartScreen(_props: Props) {
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>Cart</Text>
        <Text style={styles.subtitle}>
          {items.length === 0
            ? 'Cart is empty. Checkout logic lands in Phase 4.'
            : `${items.length} line item(s) · subtotal ₹${subtotal.toFixed(2)}`}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: '6%',
    paddingTop: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
});
