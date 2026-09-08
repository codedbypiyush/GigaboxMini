import React, {memo} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';

import {colors} from '../theme/colors';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

function SearchBarComponent({
  value,
  onChangeText,
  placeholder = 'Search products',
}: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={styles.input}
      />
    </View>
  );
}

export const SearchBar = memo(SearchBarComponent);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
