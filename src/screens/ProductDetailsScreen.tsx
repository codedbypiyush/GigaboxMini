import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/types';
import {colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen({route}: Props) {
  const {productId} = route.params;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>Product Details</Text>
        <Text style={styles.subtitle}>
          Stub for product #{productId}. Carousel, stepper, and add-to-cart
          animation arrive in Phase 4.
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
