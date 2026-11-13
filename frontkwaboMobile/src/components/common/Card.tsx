import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({ children, onPress, style, variant = 'elevated' }: CardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: COLORS.white,
          borderWidth: 1,
          borderColor: COLORS.border,
        };
      case 'flat':
        return {
          backgroundColor: COLORS.neutralPale,
          borderWidth: 0,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: COLORS.white,
          borderWidth: 1,
          borderColor: COLORS.border,
          ...SHADOWS.sm,
        };
    }
  };

  const containerStyle = [styles.card, getVariantStyle(), style];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={containerStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    overflow: 'hidden',
  },
});

