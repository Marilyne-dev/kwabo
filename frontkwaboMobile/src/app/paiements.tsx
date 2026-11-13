import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getFirstValidationError } from '@/services/api';
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

const METHOD_LABEL: Record<string, string> = { card: 'Carte bancaire', momo: 'Mobile Money', wise: 'Virement Wise' };

export default function PaiementsScreen() {
  const { invoices, invoicesMeta, refreshInvoices, payInvoice, notify, user } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<DocumentDownloadData | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshInvoices();
    }, [refreshInvoices])
  );

  const dueInvoices = invoices.filter((i) => i.status === 'due');
  const paidInvoices = invoices.filter((i) => i.status === 'paid' || i.status === 'refunded');

  const handleOpenInvoice = (inv: (typeof invoices)[number]) => {
    setSelectedDoc({
      id: inv.number || inv.id,
      name: `Facture ${inv.number} - ${inv.title}.pdf`,
      type: 'invoice',
      date: inv.paidAt || inv.createdAt,
      reference: inv.number,
      serviceTitle: inv.title,
      clientName: user ? `${user.firstName} ${user.lastName}` : undefined,
      amount: `${inv.amount} €`,
    });
  };

  const doPay = async (id: string, amount: number, title: string, method: 'card' | 'momo' | 'wise') => {
    setPayingId(id);
    try {
      await payInvoice(id, method);
      notify(
        'Paiement validé avec succès',
        `Votre règlement de ${amount} € pour « ${title} » a été confirmé. La mission démarre.`,
        'payment'
      );
    } catch (e) {
      Alert.alert('Paiement impossible', getFirstValidationError(e, 'Le paiement a échoué. Réessayez.'));
    } finally {
      setPayingId(null);
    }
  };

  const handlePay = (id: string, amount: number, title: string) => {
    Alert.alert(
      'Règlement sécurisé',
      `Régler ${amount} € pour :\n« ${title} »\n\nChoisissez le moyen de paiement.`,
      [
        { text: METHOD_LABEL.card, onPress: () => doPay(id, amount, title, 'card') },
        { text: METHOD_LABEL.momo, onPress: () => doPay(id, amount, title, 'momo') },
        { text: METHOD_LABEL.wise, onPress: () => doPay(id, amount, title, 'wise') },
      ],
      { cancelable: true }
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
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total des prestations réglées</Text>
          <Text style={styles.summaryAmount}>{invoicesMeta.paidTotal} €</Text>
          <View style={styles.badgeSecure}>
            <Ionicons name="lock-closed" size={12} color={COLORS.green} />
            <Text style={styles.badgeSecureText}>Paiements sécurisés</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Devis en attente de règlement</Text>
          {dueInvoices.length === 0 && (
            <Text style={styles.quoteDetail}>Aucun règlement en attente.</Text>
          )}
          {dueInvoices.map((inv) => (
            <View key={inv.id} style={styles.quoteCard}>
              <View style={styles.quoteTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quoteTitle}>{inv.title}</Text>
                  <Text style={styles.quoteRef}>Réf : {inv.tracking} · {inv.number}</Text>
                </View>
                <Text style={styles.quotePrice}>{inv.amount} €</Text>
              </View>
              <Text style={styles.quoteDetail}>Prestation : {inv.label}</Text>
              <View style={styles.quoteActions}>
                <Button
                  title={payingId === inv.id ? 'Paiement en cours…' : 'Valider et régler'}
                  onPress={() => handlePay(inv.id, inv.amount, inv.title)}
                  disabled={payingId !== null}
                  variant="primary"
                  size="md"
                  fullWidth
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Factures & Règlements validés</Text>
          {paidInvoices.length === 0 && (
            <Text style={styles.quoteDetail}>Aucune facture réglée pour le moment.</Text>
          )}
          {paidInvoices.map((inv) => (
            <View key={inv.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invoiceTitle}>{inv.title}</Text>
                  <Text style={styles.invoiceDate}>
                    {inv.paidAt || inv.createdAt}
                    {inv.method ? ` · ${METHOD_LABEL[inv.method] || inv.method}` : ''}
                  </Text>
                </View>
                <Text style={styles.invoiceAmount}>{inv.amount} €</Text>
              </View>
              <View style={styles.invoiceFooter}>
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
                  <Text style={styles.paidText}>{inv.status === 'refunded' ? 'Remboursé' : 'Payé'}</Text>
                </View>
                <TouchableOpacity onPress={() => handleOpenInvoice(inv)}>
                  <Text style={styles.downloadInvoice}>Facture PDF ↓</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

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

