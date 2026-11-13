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
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { COUNTRIES } from '@/data/categories';
import { useApp } from '@/context/AppContext';
import { PHOTOS } from '@/constants/photos';

export default function RegisterScreen() {
  const router = useRouter();
  const { loginDemo, notify } = useApp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('France');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleRegister = () => {
    loginDemo();
    notify(
      'Bienvenue sur KWABO !',
      'Votre compte a été créé avec succès. Découvrez nos services au Bénin.',
      'success'
    );
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HAUT AVEC PHOTO DU BÉNIN */}
          <View style={styles.topHeader}>
            <Image
              source={PHOTOS['ouidah-porte']}
              style={styles.headerBgPhoto}
              resizeMode="cover"
            />
            <View style={styles.headerBgOverlay} />

            <SafeAreaView edges={['top']} style={styles.headerSafeContent}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Créer un compte</Text>
              <Text style={styles.headerSubtitle}>
                Rejoignez les membres de la diaspora qui font confiance à KWABO.
              </Text>
            </SafeAreaView>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Prénom *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Aïcha"
                  placeholderTextColor={COLORS.muted}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Nom *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Sossa"
                  placeholderTextColor={COLORS.muted}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Pays de résidence *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="France, Belgique, Canada..."
                  placeholderTextColor={COLORS.muted}
                  value={country}
                  onChangeText={setCountry}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Numéro WhatsApp ou mobile *</Text>
              <TextInput
                style={styles.input}
                placeholder="+33 6 12 34 56 78"
                placeholderTextColor={COLORS.muted}
                value={phone}
                onChangeText={(val) => setPhone(val.replace(/[^0-9+\s]/g, ''))}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Adresse e-mail *</Text>
              <TextInput
                style={styles.input}
                placeholder="nom@exemple.com"
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mot de passe (8 car. min) *</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Code de parrainage (facultatif)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: KW-AICH01 (30 € offerts)"
                placeholderTextColor={COLORS.muted}
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
              />
            </View>

            <Button
              title="Créer mon compte KWABO"
              onPress={handleRegister}
              variant="primary"
              size="lg"
              fullWidth
              style={{ marginTop: 12 }}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Déjà inscrit ? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  topHeader: {
    minHeight: 160,
    backgroundColor: COLORS.greenHero,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBgPhoto: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  headerBgOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
  },
  headerSafeContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#DCEBE2',
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    fontSize: 15,
    color: COLORS.text,
  },
  inputWrapper: {
    width: '100%',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green,
  },
});
