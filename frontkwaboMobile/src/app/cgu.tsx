import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { Header } from '@/components/common/Header';

export default function CGUScreen() {
  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title="Conditions d'utilisation"
        subtitle="Règles d'utilisation du service KWABO"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.noticeBox}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.green} />
          <Text style={styles.noticeText}>
            Les présentes conditions générales régissent l'accès et l'utilisation de l'application et des services KWABO au Bénin.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Objet du service</Text>
          <Text style={styles.paragraph}>
            KWABO est une plateforme facilitant la réalisation, la supervision et le suivi d'interventions locales au Bénin (suivi de chantier, assistance familiale, démarches administratives, santé et fret) au bénéfice des membres de la diaspora et de leurs mandataires.
          </Text>

          <Text style={styles.sectionTitle}>2. Devis, commande et démarrage de mission</Text>
          <Text style={styles.paragraph}>
            Toute demande soumise par l'utilisateur fait l'objet d'un examen par un chargé de mission KWABO. Un devis clair et chiffré est alors établi. La mission ne démarre formellement qu'après acceptation expresse du devis et validation du règlement correspondant.
          </Text>

          <Text style={styles.sectionTitle}>3. Preuves de mission et traçabilité</Text>
          <Text style={styles.paragraph}>
            KWABO s'engage à documenter chaque étape des missions par des photos et vidéos horodatées certifiées par nos agents de terrain, accompagnées de rapports d'intervention vérifiables et téléchargeables au format PDF.
          </Text>

          <Text style={styles.sectionTitle}>4. Annulation et rétractation</Text>
          <Text style={styles.paragraph}>
            L'utilisateur conserve la faculté d'annuler une demande sans frais tant que celle-ci n'a pas été acceptée ni engagée par nos équipes sur le terrain au Bénin.
          </Text>

          <Text style={styles.sectionTitle}>5. Litiges et droit applicable</Text>
          <Text style={styles.paragraph}>
            Les présentes conditions sont soumises à la législation en vigueur. En cas de réclamation, le service client KWABO reste joignable 7j/7 pour une résolution amiable par e-mail ou sur WhatsApp.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
    gap: SPACING.md,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.greenPale,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#D4E8DC',
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.greenDark,
    lineHeight: 18,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.greenDark,
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 10,
  },
});

