import React, {memo, useCallback} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {colors} from '../theme/colors';

type Props = {
  categories: string[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
};

function formatCategoryLabel(category: string) {
  return category
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function CategoryChipsComponent({
  categories,
  selectedCategory,
  onSelect,
}: Props) {
  const onPressAll = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Pressable
          onPress={onPressAll}
          style={[styles.chip, selectedCategory === null && styles.chipActive]}>
          <Text
            style={[
              styles.chipText,
              selectedCategory === null && styles.chipTextActive,
            ]}>
            All
          </Text>
        </Pressable>

        {categories.map(category => {
          const isActive = selectedCategory === category;
          return (
            <Pressable
              key={category}
              onPress={() => onSelect(isActive ? null : category)}
              style={[styles.chip, isActive && styles.chipActive]}>
              <Text
                style={[styles.chipText, isActive && styles.chipTextActive]}>
                {formatCategoryLabel(category)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const CategoryChips = memo(CategoryChipsComponent);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  content: {
    paddingVertical: 4,
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.textOnDark,
  },
});
