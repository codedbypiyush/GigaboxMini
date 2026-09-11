import React from 'react';
import {StyleSheet, View} from 'react-native';

import {colors} from '../theme/colors';
import {useCatalogLayout} from '../theme/layout';

type Props = {
  count?: number;
};

export function CatalogSkeleton({count = 6}: Props) {
  const {gap, cardWidth} = useCatalogLayout();

  return (
    <View style={[styles.grid, {gap}]}>
      {Array.from({length: count}).map((_, index) => (
        <View key={`skeleton-${index}`} style={[styles.card, {width: cardWidth}]}>
          <View style={styles.image} />
          <View style={styles.lineWide} />
          <View style={styles.lineNarrow} />
        </View>
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
});
