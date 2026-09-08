import React, {memo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors} from '../theme/colors';

type Props = {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
};

function QuantityStepperComponent({
  quantity,
  onChange,
  min = 1,
  max = 20,
}: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Decrease quantity"
        disabled={quantity <= min}
        onPress={() => onChange(Math.max(min, quantity - 1))}
        style={[styles.button, quantity <= min && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <Text style={styles.value}>{quantity}</Text>
      <Pressable
        accessibilityLabel="Increase quantity"
        disabled={quantity >= max}
        onPress={() => onChange(Math.min(max, quantity + 1))}
        style={[styles.button, quantity >= max && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

export const QuantityStepper = memo(QuantityStepperComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 24,
  },
  value: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
