import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

interface BadgeProps {
  status?: 'pending' | 'active' | 'done' | 'cancelled' | 'urgent';
  label?: string;
  size?: 'sm' | 'md';
}

export function Badge({ status = 'pending', label, size = 'sm' }: BadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'active':
        return {
          bg: COLORS.statusActiveBg,
          text: COLORS.statusActiveText,
          defaultLabel: 'En cours',
        };
      case 'pending':
        return {
          bg: COLORS.statusPendingBg,
          text: COLORS.statusPendingText,
          defaultLabel: 'Devis reçu',
        };
      case 'done':
        return {
          bg: COLORS.statusDoneBg,
          text: COLORS.statusDoneText,
          defaultLabel: 'Terminée',
        };
      case 'urgent':
        return {
          bg: COLORS.statusUrgentBg,
          text: COLORS.statusUrgentText,
          defaultLabel: 'Urgent',
        };
      case 'cancelled':
      default:
        return {
          bg: COLORS.neutralPale,
          text: COLORS.muted,
          defaultLabel: 'Annulée',
        };
    }
  };

  const config = getBadgeConfig();
  const displayLabel = label || config.defaultLabel;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          paddingVertical: size === 'sm' ? 3 : 5,
          paddingHorizontal: size === 'sm' ? 8 : 12,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: size === 'sm' ? 11 : 12,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});

