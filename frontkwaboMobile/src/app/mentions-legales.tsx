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

export default function MentionsLegalesScreen() {
  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title="Mentions légales"
        subtitle="Informations légales et éditeur"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Éditeur de l'application</Text>
          <Text style={styles.paragraph}>
            <Text style={{ fontWeight: '700' }}>KWABO SAS</Text>{'\n'}
            Société par actions simplifiée{'\n'}
            Siège social : Haie Vive, Cotonou, République du Bénin{'\n'}
            RCCM : RB/COT/24-B-0000{'\n'}
            IFU : 0202400000000
          </Text>

          <Text style={styles.sectionTitle}>Contact officiel</Text>
          <Text style={styles.paragraph}>
            Téléphone / WhatsApp : +229 01 66 73 02 74{'\n'}
            E-mail : contact@kwabo.bj{'\n'}
            Site web : www.kwabo.bj
          </Text>

          <Text style={styles.sectionTitle}>Hébergement & Infrastructure</Text>
          <Text style={styles.paragraph}>
            Serveurs cloud sécurisés haute disponibilité situés en conformité avec les réglementations de protection des données, avec protocole TLS/SSL et sauvegardes quotidiennes chiffrées.
          </Text>

          <Text style={styles.sectionTitle}>Propriété intellectuelle</Text>
          <Text style={styles.paragraph}>
            L'ensemble des éléments constituant l'application KWABO (marques, logos, graphismes, logiciels, interfaces, photographies) sont protégés par le droit de la propriété intellectuelle et demeurent la propriété exclusive de KWABO SAS.
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

