import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { COLORS } from '@/constants/theme';

export default function IndexScreen() {
  const router = useRouter();
  const { user } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <Text style={styles.logoK}>K</Text>
      </View>
      <Text style={styles.brandTitle}>
        KWABO<Text style={styles.brandDot}>.</Text>
      </Text>
      <Text style={styles.tagline}>Votre présence de confiance au Bénin</Text>
      <ActivityIndicator color={COLORS.goldLight} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greenHero,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoK: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.greenDark,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  brandDot: {
    color: COLORS.goldLight,
  },
  tagline: {
    fontSize: 14,
    color: '#DCEBE2',
    marginTop: 8,
    textAlign: 'center',
  },
});

