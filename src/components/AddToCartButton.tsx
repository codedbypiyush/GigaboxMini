import React, {memo, useEffect} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {colors} from '../theme/colors';

type Props = {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AddToCartButtonComponent({
  label = 'Add to Cart',
  onPress,
  disabled = false,
}: Props) {
  const scale = useSharedValue(1);
  const success = useSharedValue(0);

  useEffect(() => {
    success.value = 0;
  }, [success]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    backgroundColor:
      success.value > 0.5 ? colors.actionGreen : colors.primaryButton,
  }));

  const handlePress = () => {
    if (disabled) {
      return;
    }

    scale.value = withSequence(
      withTiming(0.92, {duration: 80}),
      withSpring(1, {damping: 12, stiffness: 180}),
    );
    success.value = withSequence(
      withTiming(1, {duration: 160}),
      withTiming(0, {duration: 420}),
    );

    onPress();
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={handlePress}
      style={[styles.button, animatedStyle, disabled && styles.disabled]}>
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

export const AddToCartButton = memo(AddToCartButtonComponent);

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.primaryButtonText,
    fontSize: 16,
    fontWeight: '700',
  },
});
