import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useNetwork} from '../providers/NetworkProvider';
import {colors} from '../theme/colors';

export function OfflineBanner() {
  const {isOffline} = useNetwork();
  const insets = useSafeAreaInsets();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.banner, {paddingTop: Math.max(insets.top, 8)}]}>
      <Text style={styles.title}>You are offline</Text>
      <Text style={styles.subtitle}>
        Showing cached catalog when available. Checkout needs a connection.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.navyStore,
    paddingHorizontal: '5%',
    paddingBottom: 10,
  },
  title: {
    color: colors.textOnDark,
    fontWeight: '700',
    fontSize: 14,
  },
  subtitle: {
    color: colors.textOnDark,
    opacity: 0.85,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
