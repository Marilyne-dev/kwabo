import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { useApp } from '@/context/AppContext';
import { PHOTOS } from '@/constants/photos';
import { getFirstValidationError } from '@/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login, notify } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [code, setCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Renseignez votre e-mail et votre mot de passe.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password, needsCode ? code : undefined);
      if (res.status === 'needs_code') {
        setNeedsCode(true);
      } else if (res.status === 'needs_verification') {
        router.push({ pathname: '/(auth)/verify-email', params: { email: email.trim() } });
      } else {
        notify('Bon retour sur KWABO !', 'Vous êtes connecté à votre espace personnel.', 'success');
        router.replace('/(tabs)');
      }
    } catch (e) {
      setError(getFirstValidationError(e, 'Connexion impossible.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* HAUT : PHOTO D'ABOMEY EN FOND + LOGO KWABO */}
          <View style={styles.authTop}>
            <Image
              source={PHOTOS['abomey']}
              style={styles.bgPhoto}
              resizeMode="cover"
            />
            <View style={styles.bgOverlay} />

            <SafeAreaView edges={['top']} style={styles.safeTopContent}>
              <View style={styles.logoRow}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoBadgeText}>K</Text>
                </View>
                <Text style={styles.logoTitle}>
                  KWABO<Text style={styles.logoDot}>.</Text>
                </Text>
              </View>
              <Text style={styles.tagline}>
                Votre présence de confiance au Bénin
              </Text>
            </SafeAreaView>
          </View>

          {/* CARTE BLANCHE / CRÈME DE CONNEXION */}
          <View style={styles.authCard}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>
              Accédez à votre espace pour suivre vos demandes et échanger avec l'équipe.
            </Text>

            {/* FORMULAIRE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Adresse e-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="aicha@exemple.com"
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.passHeader}>
                <Text style={styles.label}>Mot de passe</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                >
                  <Text style={styles.forgotLink}>Oublié ?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {needsCode && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Code d'authentification (6 chiffres)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor={COLORS.muted}
                  value={code}
                  onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            )}

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title={loading ? 'Connexion…' : 'Se connecter'}
              disabled={loading}
              onPress={handleLogin}
              variant="primary"
              size="lg"
              fullWidth
              style={{ marginTop: 12 }}
            />

            <View style={styles.altRow}>
              <Text style={styles.altText}>Pas encore de compte ? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.altLink}>Créer un compte</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.legalLinks}>
              <TouchableOpacity
                onPress={() => router.push('/confidentialite')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.legalItem}>Confidentialité</Text>
              </TouchableOpacity>
              <Text style={styles.legalSep}>·</Text>
              <TouchableOpacity
                onPress={() => router.push('/cgu')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.legalItem}>CGU</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <WhatsAppButton bottomOffset={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greenHero,
  },
  scrollContent: {
    flexGrow: 1,
  },
  authTop: {
    minHeight: 160,
    backgroundColor: COLORS.greenHero,
    position: 'relative',
    overflow: 'hidden',
  },
  bgPhoto: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
  },
  safeTopContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.greenDark,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  logoDot: {
    color: COLORS.goldLight,
  },
  tagline: {
    color: '#DCEBE2',
    fontSize: 13,
    marginTop: 6,
  },
  authCard: {
    flex: 1,
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  passWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    height: 48,
  },
  eyeBtn: {
    paddingHorizontal: 12,
  },
  errorText: {
    color: COLORS.terracotta,
    fontSize: 13,
    marginBottom: 8,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  altText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  altLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  legalItem: {
    fontSize: 12,
    color: COLORS.muted,
  },
  legalSep: {
    color: COLORS.muted,
  },
});
