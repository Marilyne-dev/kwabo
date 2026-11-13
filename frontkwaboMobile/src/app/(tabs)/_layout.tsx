import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function TabLayout() {
  const { unreadMessagesCount } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={String(color)}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="demandes"
        options={{
          title: 'Demandes',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Ionicons
                name={focused ? 'clipboard' : 'clipboard-outline'}
                size={22}
                color={String(color)}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="nouvelle-demande"
        options={{
          title: 'Nouvelle',
          tabBarIcon: () => (
            <View style={styles.primaryTabButton}>
              <Ionicons name="add" size={28} color={COLORS.text} />
            </View>
          ),
          tabBarLabelStyle: [styles.tabBarLabel, { color: COLORS.text, fontWeight: '700' }],
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={22}
                color={String(color)}
              />
              {unreadMessagesCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadMessagesCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={String(color)}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === 'ios' ? 86 : 68,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    ...SHADOWS.md,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrapper: {
    width: 48,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  iconWrapperActive: {
    backgroundColor: COLORS.greenPale,
  },
  primaryTabButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    ...SHADOWS.md,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 6,
    backgroundColor: COLORS.terracotta,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});

