import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useEffect, useMemo, useState} from 'react';
import {
  AppState,
  type AppStateStatus,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/types';
import {
  STATUS_ORDER,
  TICK_MS,
  formatStatusLabel,
  getTrackingSnapshot,
  type TrackingSnapshot,
} from '../services/tracking/MockTrackingService';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {clearTracking} from '../store/slices/trackingSlice';
import {colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Tracking'>;

export function TrackingScreen({navigation}: Props) {
  const dispatch = useAppDispatch();
  const orderId = useAppSelector(state => state.tracking.orderId);
  const orderPlacedAt = useAppSelector(state => state.tracking.orderPlacedAt);
  const {width, height} = useWindowDimensions();
  const mapHeight = Math.min(Math.max(height * 0.42, 220), 420);

  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);

  // Tick every 2.5s + refresh when app comes back (survives backgrounding).
  useEffect(() => {
    if (!orderPlacedAt) {
      setSnapshot(null);
      return;
    }

    const refresh = () => setSnapshot(getTrackingSnapshot(orderPlacedAt));
    refresh();

    const intervalId = setInterval(refresh, TICK_MS);
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        refresh();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(intervalId);
      sub.remove();
    };
  }, [orderPlacedAt]);

  const region = useMemo(() => {
    if (!snapshot) {
      return null;
    }
    return {
      latitude: (snapshot.store.latitude + snapshot.customer.latitude) / 2,
      longitude: (snapshot.store.longitude + snapshot.customer.longitude) / 2,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }, [snapshot]);

  if (!orderId || !orderPlacedAt || !snapshot || !region) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.empty}>
          <Text style={styles.title}>No active order</Text>
          <Text style={styles.subtitle}>
            Place an order from the cart to start live tracking.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => navigation.navigate('Catalog')}>
            <Text style={styles.buttonText}>Browse catalog</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={[styles.mapWrap, {height: mapHeight, width}]}>
        <MapView
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={region}
          region={region}>
          <Polyline
            coordinates={[snapshot.store, snapshot.customer]}
            strokeColor={colors.actionGreen}
            strokeWidth={4}
          />
          <Marker coordinate={snapshot.store} title="Store" pinColor={colors.navyStore} />
          <Marker
            coordinate={snapshot.customer}
            title="Delivery"
            pinColor={colors.accentHome}
          />
          <Marker
            coordinate={snapshot.courier}
            title="Courier"
            description={formatStatusLabel(snapshot.status)}
            pinColor={colors.actionGreen}
          />
        </MapView>
      </View>

      <View style={styles.panel}>
        <Text style={styles.orderId}>Order {orderId}</Text>
        <Text style={styles.eta}>ETA {snapshot.etaLabel}</Text>

        {STATUS_ORDER.map(step => {
          const done =
            STATUS_ORDER.indexOf(step) <= STATUS_ORDER.indexOf(snapshot.status);
          return (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.dot, done ? styles.dotDone : styles.dotTodo]} />
              <Text style={done ? styles.stepDone : styles.stepTodo}>
                {formatStatusLabel(step)}
              </Text>
            </View>
          );
        })}

        {snapshot.status === 'DELIVERED' ? (
          <Pressable
            style={styles.button}
            onPress={() => {
              dispatch(clearTracking());
              navigation.navigate('Catalog');
            }}>
            <Text style={styles.buttonText}>Order again</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  mapWrap: {backgroundColor: colors.surfaceSecondary},
  panel: {flex: 1, paddingHorizontal: '5%', paddingTop: 16, gap: 10},
  orderId: {fontSize: 18, fontWeight: '700', color: colors.textPrimary},
  eta: {fontSize: 14, color: colors.textSecondary, marginBottom: 4},
  stepRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  dot: {width: 12, height: 12, borderRadius: 6},
  dotDone: {backgroundColor: colors.actionGreen},
  dotTodo: {backgroundColor: colors.border},
  stepDone: {fontSize: 15, color: colors.textPrimary, fontWeight: '600'},
  stepTodo: {fontSize: 15, color: colors.textMuted},
  empty: {flex: 1, justifyContent: 'center', paddingHorizontal: '8%', gap: 10},
  title: {fontSize: 22, fontWeight: '700', color: colors.textPrimary},
  subtitle: {fontSize: 15, lineHeight: 22, color: colors.textSecondary},
  button: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryButton,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {color: colors.primaryButtonText, fontWeight: '700'},
});
