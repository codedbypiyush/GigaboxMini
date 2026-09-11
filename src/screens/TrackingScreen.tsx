import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  AppState,
  type AppStateStatus,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';

import type {RootStackParamList} from '../navigation/types';
import {
  STATUS_ORDER,
  formatStatusLabel,
  getTrackingSnapshot,
  type TrackingSnapshot,
} from '../services/tracking/MockTrackingService';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  clearTracking,
  setTrackingStatus,
} from '../store/slices/trackingSlice';
import {colors} from '../theme/colors';
import {useResponsiveLayout} from '../theme/layout';

type Props = NativeStackScreenProps<RootStackParamList, 'Tracking'>;

export function TrackingScreen({navigation}: Props) {
  const dispatch = useAppDispatch();
  const orderId = useAppSelector(state => state.tracking.orderId);
  const orderPlacedAt = useAppSelector(state => state.tracking.orderPlacedAt);
  const {width, height, contentMaxWidth, horizontalPadding, isTablet} =
    useResponsiveLayout();
  const mapHeight = Math.min(
    Math.max(height * (isTablet ? 0.48 : 0.42), 220),
    isTablet ? 480 : 420,
  );

  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);

  const refreshSnapshot = useCallback(() => {
    if (!orderPlacedAt) {
      setSnapshot(null);
      return;
    }

    const next = getTrackingSnapshot(orderPlacedAt);
    setSnapshot(next);
    dispatch(setTrackingStatus(next.status));
  }, [dispatch, orderPlacedAt]);

  useFocusEffect(
    useCallback(() => {
      refreshSnapshot();
    }, [refreshSnapshot]),
  );

  useEffect(() => {
    const onAppStateChange = (state: AppStateStatus) => {
      // Recalculate from timestamps when returning from background.
      if (state === 'active') {
        refreshSnapshot();
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [refreshSnapshot]);

  useEffect(() => {
    if (!orderPlacedAt || snapshot?.status === 'DELIVERED') {
      return;
    }

    // Lightweight UI refresh while foregrounded only.
    // Source of truth remains Date.now() - orderPlacedAt inside the service.
    const intervalId = setInterval(refreshSnapshot, 1000);
    return () => clearInterval(intervalId);
  }, [orderPlacedAt, refreshSnapshot, snapshot?.status]);

  const region = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    const midLat = (snapshot.store.latitude + snapshot.customer.latitude) / 2;
    const midLng = (snapshot.store.longitude + snapshot.customer.longitude) / 2;
    const latDelta =
      Math.abs(snapshot.store.latitude - snapshot.customer.latitude) * 1.8 ||
      0.05;
    const lngDelta =
      Math.abs(snapshot.store.longitude - snapshot.customer.longitude) * 1.8 ||
      0.05;

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(latDelta, 0.04),
      longitudeDelta: Math.max(lngDelta, 0.04),
    };
  }, [snapshot]);

  if (!orderId || !orderPlacedAt || !snapshot || !region) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View
          style={[
            styles.empty,
            {
              width: Math.min(width, contentMaxWidth),
              paddingHorizontal: horizontalPadding,
              alignSelf: 'center',
            },
          ]}>
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
          region={region}
          scrollEnabled
          zoomEnabled>
          <Polyline
            coordinates={[snapshot.store, snapshot.customer]}
            strokeColor={colors.actionGreen}
            strokeWidth={4}
          />
          <Marker
            coordinate={snapshot.store}
            title="Gigabox Store"
            description="Packing hub"
            pinColor={colors.navyStore}
          />
          <Marker
            coordinate={snapshot.customer}
            title="Delivery address"
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

      <View
        style={[
          styles.panel,
          {
            width: Math.min(width, contentMaxWidth),
            paddingHorizontal: horizontalPadding,
            alignSelf: 'center',
          },
        ]}>
        <Text style={styles.orderId}>Order {orderId}</Text>
        <Text style={styles.eta}>ETA {snapshot.etaLabel}</Text>

        <View style={styles.timeline}>
          {STATUS_ORDER.map(step => {
            const activeIndex = STATUS_ORDER.indexOf(snapshot.status);
            const stepIndex = STATUS_ORDER.indexOf(step);
            const done = stepIndex <= activeIndex;

            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[styles.dot, done ? styles.dotDone : styles.dotTodo]}
                />
                <Text
                  style={[
                    styles.stepLabel,
                    done ? styles.stepLabelDone : styles.stepLabelTodo,
                  ]}>
                  {formatStatusLabel(step)}
                </Text>
              </View>
            );
          })}
        </View>

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
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapWrap: {
    backgroundColor: colors.surfaceSecondary,
  },
  panel: {
    flex: 1,
    paddingTop: 16,
    gap: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  eta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  timeline: {
    gap: 10,
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotDone: {
    backgroundColor: colors.actionGreen,
  },
  dotTodo: {
    backgroundColor: colors.border,
  },
  stepLabel: {
    fontSize: 15,
  },
  stepLabelDone: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  stepLabelTodo: {
    color: colors.textMuted,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  button: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryButton,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: colors.primaryButtonText,
    fontWeight: '700',
  },
});
