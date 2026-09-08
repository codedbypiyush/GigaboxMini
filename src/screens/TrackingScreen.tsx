import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useAppSelector} from '../store/hooks';
import type {RootStackParamList} from '../navigation/types';
import {colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Tracking'>;

export function TrackingScreen(_props: Props) {
  const orderId = useAppSelector(state => state.tracking.orderId);
  const status = useAppSelector(state => state.tracking.status);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>Order Tracking</Text>
        <Text style={styles.subtitle}>
          {orderId
            ? `Order ${orderId} · ${status ?? 'unknown'}`
            : 'No active order. Map + MockTrackingService land in Phase 5.'}
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
