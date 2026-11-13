import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  Text,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

interface NotificationBellProps {
  style?: ViewStyle;
  iconColor?: string;
  size?: number;
}

export function NotificationBell({
  style,
  iconColor = '#FFFFFF',
  size = 24,
}: NotificationBellProps) {
  const router = useRouter();
  const {
    notifications,
    unreadNotificationsCount,
    activePushBanner,
    notificationPing,
  } = useApp();

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevPingRef = useRef(notificationPing);
  const prevCountRef = useRef(notifications.length);

  const ringAnimation = () => {
    // Réinitialise avant de jouer la sonnerie
    rotateAnim.setValue(0);
    scaleAnim.setValue(1);

    // Mouvement d'oscillation pendulaire d'une cloche qui tinte
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.25,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: -0.75, duration: 90, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0.75, duration: 90, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: -0.4, duration: 75, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0.4, duration: 75, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: -0.15, duration: 60, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]),
    ]).start();
  };

  // Déclencher quand une nouvelle notification arrive via ping ou ajout de notification
  useEffect(() => {
    if (
      notificationPing !== prevPingRef.current ||
      notifications.length > prevCountRef.current ||
      activePushBanner
    ) {
      ringAnimation();
    }
    prevPingRef.current = notificationPing;
    prevCountRef.current = notifications.length;
  }, [notificationPing, notifications.length, activePushBanner]);

  // Si des notifications non lues sont présentes, tinter doucement à l'ouverture
  useEffect(() => {
    if (unreadNotificationsCount > 0) {
      const timer = setTimeout(() => {
        ringAnimation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-24deg', '0deg', '24deg'],
  });

  return (
    <TouchableOpacity
      style={[styles.bellBtn, style]}
      onPress={() => {
        ringAnimation();
        router.push('/notifications');
      }}
      activeOpacity={0.8}
      accessibilityLabel="Notifications"
    >
      <Animated.View
        style={{
          transform: [{ rotate }, { scale: scaleAnim }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="notifications-outline" size={size} color={iconColor} />
      </Animated.View>

      {unreadNotificationsCount > 0 && (
        <View style={styles.bellBadge}>
          <Text style={styles.bellBadgeText}>
            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: COLORS.terracotta,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
});

