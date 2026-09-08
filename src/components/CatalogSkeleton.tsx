import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View, useWindowDimensions} from 'react-native';

import {colors} from '../theme/colors';

type Props = {
  count?: number;
};

function SkeletonCard({width}: {width: number}) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, {width, opacity}]}>
      <View style={styles.image} />
      <View style={styles.lineWide} />
      <View style={styles.lineNarrow} />
      <View style={styles.linePrice} />
    </Animated.View>
  );
}

export function CatalogSkeleton({count = 6}: Props) {
  const {width} = useWindowDimensions();
  const horizontalPadding = width * 0.04;
  const gap = 12;
  const numColumns = width >= 768 ? 3 : 2;
  const cardWidth =
    (width - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns;

  return (
    <View
      style={[
        styles.grid,
        {
          paddingHorizontal: horizontalPadding,
          gap,
        },
      ]}>
      {Array.from({length: count}).map((_, index) => (
        <SkeletonCard key={`skeleton-${index}`} width={cardWidth} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 12,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.inputBackground,
  },
  lineWide: {
    height: 12,
    marginTop: 12,
    marginHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.inputBackground,
  },
  lineNarrow: {
    height: 10,
    width: '45%',
    marginTop: 8,
    marginHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.inputBackground,
  },
  linePrice: {
    height: 12,
    width: '35%',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.inputBackground,
  },
});
