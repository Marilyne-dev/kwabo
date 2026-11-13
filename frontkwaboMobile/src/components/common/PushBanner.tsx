import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';

export function PushBanner() {
  const { activePushBanner, dismissPushBanner } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activePushBanner) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activePushBanner]);

  if (!activePushBanner) return null;

  const handlePress = () => {
    dismissPushBanner();
    router.push('/notifications');
  };

  const getTypeConfig = () => {
    switch (activePushBanner.type) {
      case 'payment':
        return {
          icon: 'card' as const,
          iconColor: '#B45309',
          iconBg: '#FEF3C7',
          borderColor: '#FCD34D',
        };
      case 'doc':
        return {
          icon: 'document-text' as const,
          iconColor: '#1D4ED8',
          iconBg: '#DBEAFE',
          borderColor: '#93C5FD',
        };
      case 'info':
        return {
          icon: 'information-circle' as const,
          iconColor: '#0F766E',
          iconBg: '#CCFBF1',
          borderColor: '#99F6E4',
        };
      case 'success':
      default:
        return {
          icon: 'checkmark-circle' as const,
          iconColor: '#047857',
          iconBg: '#D1FAE5',
          borderColor: '#86EFAC',
        };
    }
  };

  const config = getTypeConfig();
  const topPosition = Math.max(insets.top, Platform.OS === 'android' ? 16 : 24) + 6;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: topPosition,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        style={[styles.card, { borderColor: config.borderColor }]}
        onPress={handlePress}
      >
        <View style={styles.contentRow}>
          <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
            <Ionicons name={config.icon} size={22} color={config.iconColor} />
          </View>

          <View style={styles.textWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {activePushBanner.title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {activePushBanner.message}
            </Text>
          </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              dismissPushBanner();
            }}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
    elevation: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  message: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 17,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 2,
  },
});
