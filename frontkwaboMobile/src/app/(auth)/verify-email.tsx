import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { useApp } from '@/context/AppContext';
import { getFirstValidationError } from '@/services/api';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { verifyEmail, resendVerification, notify } = useApp();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Saisissez le code à 6 chiffres.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyEmail(String(email), code);
      notify('Bienvenue sur KWABO !', 'Votre e-mail est confirmé.', 'success');
      router.replace('/(tabs)');
    } catch (e) {
      setError(getFirstValidationError(e, 'Code invalide.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await resendVerification(String(email));
      setInfo('Un nouveau code vient d’être envoyé.');
    } catch (e) {
      setError(getFirstValidationError(e, 'Envoi impossible.'));
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView edges={['top']} style={styles.top}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmez votre e-mail</Text>
        </SafeAreaView>

        <View style={styles.card}>
          <Text style={styles.subtitle}>
            Nous avons envoyé un code à 6 chiffres à {email}. Saisissez-le pour activer votre compte.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor={COLORS.muted}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!info && <Text style={styles.info}>{info}</Text>}
          <Button title={loading ? 'Vérification…' : 'Confirmer'} onPress={handleVerify} disabled={loading} variant="primary" size="lg" fullWidth />
          <TouchableOpacity onPress={handleResend} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={styles.link}>Renvoyer le code</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.greenHero },
  top: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 16 },
  card: { flex: 1, backgroundColor: COLORS.cream, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingTop: 28 },
  subtitle: { fontSize: 14, color: COLORS.muted, lineHeight: 20, marginBottom: 20 },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    height: 56, paddingHorizontal: 14, fontSize: 24, letterSpacing: 8, textAlign: 'center', color: COLORS.text, marginBottom: 12,
  },
  error: { color: COLORS.terracotta, fontSize: 13, marginBottom: 8 },
  info: { color: COLORS.green, fontSize: 13, marginBottom: 8 },
  link: { color: COLORS.green, fontWeight: '700', fontSize: 14 },
});
