import React, {useMemo, useState} from 'react';
import {LayoutChangeEvent, StyleSheet, Text, View} from 'react-native';

import type {LatLng} from '../services/tracking/MockTrackingService';
import {colors} from '../theme/colors';

type Props = {
  store: LatLng;
  customer: LatLng;
  courier: LatLng;
  courierLabel: string;
};

type Point = {x: number; y: number};

/** Pad the bounding box so pins are not glued to the edges. */
const PAD = 0.12;

/**
 * Interview-friendly map: project lat/lng into a View — no Google Maps key,
 * no tiles, works offline. Same coordinates the mock courier already uses.
 */
function project(
  point: LatLng,
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  width: number,
  height: number,
): Point {
  const x = ((point.longitude - minLng) / (maxLng - minLng)) * width;
  // Screen Y grows downward; latitude grows north, so flip.
  const y = (1 - (point.latitude - minLat) / (maxLat - minLat)) * height;
  return {x, y};
}

function routeDots(from: Point, to: Point, count: number): Point[] {
  const dots: Point[] = [];
  for (let i = 1; i < count; i += 1) {
    const t = i / count;
    dots.push({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    });
  }
  return dots;
}

export function TrackingMap({
  store,
  customer,
  courier,
  courierLabel,
}: Props) {
  const [size, setSize] = useState({width: 0, height: 0});

  const onLayout = (event: LayoutChangeEvent) => {
    const {width, height} = event.nativeEvent.layout;
    setSize({width, height});
  };

  const layout = useMemo(() => {
    if (size.width === 0 || size.height === 0) {
      return null;
    }

    const lats = [store.latitude, customer.latitude, courier.latitude];
    const lngs = [store.longitude, customer.longitude, courier.longitude];
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);

    const latPad = Math.max((maxLat - minLat) * PAD, 0.01);
    const lngPad = Math.max((maxLng - minLng) * PAD, 0.01);
    minLat -= latPad;
    maxLat += latPad;
    minLng -= lngPad;
    maxLng += lngPad;

    const toPoint = (point: LatLng) =>
      project(point, minLat, maxLat, minLng, maxLng, size.width, size.height);

    const storePt = toPoint(store);
    const customerPt = toPoint(customer);
    const courierPt = toPoint(courier);

    return {
      storePt,
      customerPt,
      courierPt,
      route: routeDots(storePt, customerPt, 18),
    };
  }, [courier, customer, size.height, size.width, store]);

  return (
    <View style={styles.root} onLayout={onLayout}>
      <View style={styles.grid} pointerEvents="none" />
      {layout ? (
        <>
          {layout.route.map((dot, index) => (
            <View
              key={`route-${index}`}
              style={[
                styles.routeDot,
                {left: dot.x - 2, top: dot.y - 2},
              ]}
            />
          ))}
          <Pin
            point={layout.storePt}
            color={colors.navyStore}
            label="Store"
          />
          <Pin
            point={layout.customerPt}
            color={colors.accentHome}
            label="You"
          />
          <Pin
            point={layout.courierPt}
            color={colors.actionGreen}
            label={courierLabel}
            large
          />
        </>
      ) : null}
    </View>
  );
}

function Pin({
  point,
  color,
  label,
  large,
}: {
  point: Point;
  color: string;
  label: string;
  large?: boolean;
}) {
  const size = large ? 16 : 12;
  return (
    <View
      style={[
        styles.pinWrap,
        {
          left: point.x - 36,
          top: point.y - size / 2,
        },
      ]}>
      <View
        style={[
          styles.pin,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
      <Text style={styles.pinLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E8F0E9',
    overflow: 'hidden',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    opacity: 0.5,
  },
  routeDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.actionGreen,
    opacity: 0.45,
  },
  pinWrap: {
    position: 'absolute',
    alignItems: 'center',
    width: 72,
  },
  pin: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pinLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
