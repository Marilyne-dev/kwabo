import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/context/AppContext';
import { PushBanner } from '@/components/common/PushBanner';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <PushBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F9F7F4' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="demande/[id]" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="services/index" />
          <Stack.Screen name="services/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="documents" />
          <Stack.Screen name="paiements" />
          <Stack.Screen name="parrainage" />
          <Stack.Screen name="profil" />
          <Stack.Screen name="confidentialite" />
          <Stack.Screen name="cgu" />
          <Stack.Screen name="mentions-legales" />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}

