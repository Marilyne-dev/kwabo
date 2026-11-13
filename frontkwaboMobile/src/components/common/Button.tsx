import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'gold':
        return {
          backgroundColor: COLORS.goldLight,
          borderColor: 'transparent',
          textColor: COLORS.text,
        };
      case 'ghost':
        return {
          backgroundColor: COLORS.white,
          borderColor: COLORS.border,
          textColor: COLORS.green,
        };
      case 'danger':
        return {
          backgroundColor: COLORS.terracotta,
          borderColor: 'transparent',
          textColor: COLORS.white,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: COLORS.border,
          textColor: COLORS.text,
        };
      case 'primary':
      default:
        return {
          backgroundColor: COLORS.green,
          borderColor: 'transparent',
          textColor: COLORS.white,
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 13,
          minHeight: 38,
        };
      case 'lg':
        return {
          paddingVertical: 14,
          paddingHorizontal: 26,
          fontSize: 16,
          minHeight: 52,
        };
      case 'md':
      default:
        return {
          paddingVertical: 11,
          paddingHorizontal: 20,
          fontSize: 15,
          minHeight: 46,
        };
    }
  };

  const vStyle = getVariantStyle();
  const sStyle = getSizeStyle();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: vStyle.backgroundColor,
          borderColor: vStyle.borderColor,
          borderWidth: variant === 'ghost' || variant === 'outline' ? 1.5 : 0,
          paddingVertical: sStyle.paddingVertical,
          paddingHorizontal: sStyle.paddingHorizontal,
          minHeight: sStyle.minHeight,
          width: fullWidth ? '100%' : 'auto',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vStyle.textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { color: vStyle.textColor, fontSize: sStyle.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

