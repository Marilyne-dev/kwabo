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

export default function ConfidentialiteScreen() {
  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title="Confidentialité"
        subtitle="Protection de vos données personnelles"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.noticeBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.green} />
          <Text style={styles.noticeText}>
            KWABO s'engage à garantir la confidentialité et la sécurité des données de la diaspora et de leurs proches au Bénin.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Données collectées</Text>
          <Text style={styles.paragraph}>
            Identité, adresse e-mail, numéro de téléphone (WhatsApp), pays de résidence, ainsi que les informations indispensables que vous communiquez lors de vos demandes d'intervention (adresses de chantier, contacts locaux au Bénin).
          </Text>

          <Text style={styles.sectionTitle}>Utilisation de vos informations</Text>
          <Text style={styles.paragraph}>
            Vos données servent exclusivement à traiter vos demandes, éditer vos devis officiels, mandater nos agents sur le terrain et vous transmettre vos rapports photos et vidéos d'avancement.
          </Text>

          <Text style={styles.sectionTitle}>Paiements & Données bancaires</Text>
          <Text style={styles.paragraph}>
            Aucune coordonnée de carte bancaire n'est conservée ni enregistrée par KWABO. Tous les règlements sont exécutés et sécurisés par nos prestataires agréés conformes aux normes PCI-DSS (Stripe, Mobile Money MTN et Moov Bénin).
          </Text>

          <Text style={styles.sectionTitle}>Vos droits</Text>
          <Text style={styles.paragraph}>
            Conformément à la réglementation sur la protection des données, vous pouvez à tout moment consulter, modifier ou demander la suppression définitive de votre compte et de l'ensemble des données associées depuis la section « Mon profil ».
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

