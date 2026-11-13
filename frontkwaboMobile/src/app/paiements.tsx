import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { DocumentModal } from '@/components/common/DocumentModal';
import { DocumentDownloadData } from '@/utils/documentDownloader';

export default function PaiementsScreen() {
  const { requests, notify } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<DocumentDownloadData | null>(null);

  const handleOpenInvoice = (title: string, amount: string, date: string, ref: string) => {
    setSelectedDoc({
      id: ref,
      name: `Facture acquittée - ${title}.pdf`,
      type: 'invoice',
      date,
      size: '220 Ko',
      reference: ref,
      serviceTitle: title,
      amount,
    });
  };

  const handlePay = (amount: number, title: string) => {
    Alert.alert(
      'Règlement sécurisé',
      `Valider le règlement de ${amount} € pour :\n« ${title} »\n\nMoyens acceptés :\n• Carte bancaire (Stripe 3D Secure)\n• Mobile Money (MTN / Moov Bénin)\n• Virement bancaire`,
      [
        {
          text: 'Payer maintenant',
          onPress: () => {
            notify(
              'Paiement validé avec succès',
              `Votre règlement de ${amount} € pour « ${title} » a été confirmé. La mission démarre immédiatement.`,
              'payment'
            );
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title="Paiements & Devis"
        subtitle="Historique des règlements et factures"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOTAL RÉCAP */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total des prestations réglées</Text>
          <Text style={styles.summaryAmount}>215 €</Text>
          <View style={styles.badgeSecure}>
            <Ionicons name="lock-closed" size={12} color={COLORS.green} />
            <Text style={styles.badgeSecureText}>Paiements chiffrés SSL / Stripe</Text>
          </View>
        </View>

        {/* DEVIS EN ATTENTE DE RÈGLEMENT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Devis en attente d'accord</Text>

          {requests
            .filter((r) => r.status === 'pending' && r.quote)
            .map((req) => (
              <View key={req.id} style={styles.quoteCard}>
                <View style={styles.quoteTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quoteTitle}>{req.title}</Text>
                    <Text style={styles.quoteRef}>Réf : {req.tracking}</Text>
                  </View>
                  <Text style={styles.quotePrice}>{req.quote?.amount} €</Text>
                </View>

                <Text style={styles.quoteDetail}>
                  Prestation : {req.quote?.label}
                </Text>

                <View style={styles.quoteActions}>
                  <Button
                    title="Valider et régler"
                    onPress={() => handlePay(req.quote!.amount, req.title)}
                    variant="primary"
                    size="md"
                    fullWidth
                  />
                </View>
              </View>
            ))}
        </View>

        {/* FACTURES ET PAIEMENTS ACQUITTÉS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Factures & Règlements validés</Text>

          <View style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <View>
                <Text style={styles.invoiceTitle}>Suivi villa Abomey-Calavi</Text>
                <Text style={styles.invoiceDate}>17 janv. 2026 · Carte bancaire</Text>
              </View>
              <Text style={styles.invoiceAmount}>160 €</Text>
            </View>
            <View style={styles.invoiceFooter}>
              <View style={styles.paidBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
                <Text style={styles.paidText}>Payé</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  handleOpenInvoice(
                    'Suivi villa Abomey-Calavi',
                    '160 €',
                    '17 janv. 2026',
                    'FACT-2026-0042'
                  )
                }
              >
                <Text style={styles.downloadInvoice}>Facture PDF ↓</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <View>
                <Text style={styles.invoiceTitle}>Acte de naissance légalisé</Text>
                <Text style={styles.invoiceDate}>11 déc. 2025 · Virement</Text>
              </View>
              <Text style={styles.invoiceAmount}>55 €</Text>
            </View>
            <View style={styles.invoiceFooter}>
              <View style={styles.paidBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
                <Text style={styles.paidText}>Payé</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  handleOpenInvoice(
                    'Acte de naissance légalisé',
                    '55 €',
                    '11 déc. 2025',
                    'FACT-2025-0189'
                  )
                }
              >
                <Text style={styles.downloadInvoice}>Facture PDF ↓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODAL TÉLÉCHARGEMENT FACTURE */}
      <DocumentModal
        visible={!!selectedDoc}
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
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
    gap: SPACING.lg,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: COLORS.greenHero,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  summaryLabel: {
    color: '#DCEBE2',
    fontSize: 13,
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 6,
  },
  badgeSecure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  badgeSecureText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    ...SHADOWS.sm,
  },
  quoteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  quoteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  quoteRef: {
    fontSize: 12,
    color: COLORS.muted,
  },
  quotePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.green,
  },
  quoteDetail: {
    fontSize: 13,
    color: COLORS.textMid,
    marginBottom: 12,
  },
  quoteActions: {
    marginTop: 4,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  invoiceDate: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralPale,
    paddingTop: 8,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF8EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#27AE60',
  },
  downloadInvoice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },
});

