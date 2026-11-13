import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { PHOTOS } from '@/constants/photos';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez saisir votre adresse e-mail');
      return;
    }
    setSent(true);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* HAUT : IMAGE ATTIRANTE DE LA PLAGE DE FIDJROSSÈ (AUCUN TEXTE DEDANS) */}
        <View style={styles.topHeader}>
          <Image
            source={PHOTOS['plage']}
            style={styles.headerBgPhoto}
            resizeMode="cover"
          />

          {/* Bouton de retour discret uniquement */}
          <SafeAreaView edges={['top']} style={styles.headerSafeContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Retour"
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* BAS : TEXTES ET FORMULAIRE PLACÉS JUSTE EN DESSOUS DE L'IMAGE */}
        <View style={styles.card}>
          {sent ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="mail-open" size={40} color={COLORS.green} />
              </View>
              <Text style={styles.successTitle}>E-mail envoyé !</Text>
              <Text style={styles.successDesc}>
                Si un compte est associé à <Text style={{ fontWeight: '700' }}>{email}</Text>, vous recevrez un lien de réinitialisation sous quelques instants.
              </Text>
              <Button
                title="Retour à la connexion"
                onPress={() => router.replace('/(auth)/login')}
                variant="primary"
                size="md"
                style={{ marginTop: 24 }}
              />
            </View>
          ) : (
            <View>
              {/* TITRE ET TEXTE COURT EN DESSOUS DE L'IMAGE */}
              <Text style={styles.cardTitle}>Mot de passe oublié</Text>
              <Text style={styles.cardSubtitle}>
                Entrez votre e-mail pour recevoir le lien de réinitialisation.
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Adresse e-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="nom@exemple.com"
                  placeholderTextColor={COLORS.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.btnWrapper}>
                <Button
                  title="Envoyer le lien de réinitialisation"
                  onPress={handleReset}
                  variant="primary"
                  size="md"
                  style={styles.submitBtn}
                />
              </View>

              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    height: 220,
    position: 'relative',
    backgroundColor: '#000000',
  },
  headerBgPhoto: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 1, // Pleine clarté, nette et lumineuse
  },
  headerSafeContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 40,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: 22,
  },
  formGroup: {
    marginBottom: SPACING.lg,
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
  btnWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtn: {
    paddingHorizontal: 20,
    height: 44,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  cancelText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.greenPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
