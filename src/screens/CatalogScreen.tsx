import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/types';
import {colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Catalog'>;

export function CatalogScreen({navigation}: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>Catalog</Text>
        <Text style={styles.subtitle}>
          Product grid, search, and filters land in later phases.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('ProductDetails', {productId: 1})}>
          <Text style={styles.buttonText}>Open sample product</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.secondaryButtonText}>Go to cart</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Tracking')}>
          <Text style={styles.secondaryButtonText}>Go to tracking</Text>
        </Pressable>
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
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  button: {
    backgroundColor: colors.primaryButton,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.primaryButtonText,
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
});
