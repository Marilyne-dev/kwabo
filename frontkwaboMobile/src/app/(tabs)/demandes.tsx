import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/common/Header';
import { Badge } from '@/components/common/Badge';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { PHOTOS, SERVICE_PHOTOS } from '@/constants/photos';

type FilterType = 'all' | 'active' | 'pending' | 'done';

export default function DemandesScreen() {
  const router = useRouter();
  const { requests, refreshRequests } = useApp();
  useFocusEffect(
    React.useCallback(() => {
      refreshRequests();
    }, [refreshRequests])
  );
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title="Mes demandes"
        subtitle="Suivi en direct de vos missions au Bénin"
        rightAction={
          <TouchableOpacity
            style={styles.newBtnSmall}
            onPress={() => router.push('/(tabs)/nouvelle-demande')}
          >
            <Ionicons name="add" size={20} color={COLORS.greenDark} />
            <Text style={styles.newBtnSmallText}>Créer</Text>
          </TouchableOpacity>
        }
      />

      {/* FILTRES PAR STATUT */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Toutes ({requests.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'active' && styles.filterChipActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
              En cours ({requests.filter((r) => r.status === 'active').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'pending' && styles.filterChipActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
              Devis reçu ({requests.filter((r) => r.status === 'pending').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'done' && styles.filterChipActive]}
            onPress={() => setFilter('done')}
          >
            <Text style={[styles.filterText, filter === 'done' && styles.filterTextActive]}>
              Terminées ({requests.filter((r) => r.status === 'done').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* LISTE DES DEMANDES */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>Aucune demande</Text>
            <Text style={styles.emptyDesc}>
              Vous n'avez pas de demande correspondant à ce filtre.
            </Text>
          </View>
        ) : (
          filteredRequests.map((req) => {
            const photoKey = SERVICE_PHOTOS[req.serviceId] || 'chantier';
            return (
              <TouchableOpacity
                key={req.id}
                style={styles.card}
                onPress={() => router.push(`/demande/${req.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTopRow}>
                  <Image source={PHOTOS[photoKey]} style={styles.reqThumb} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                      <Badge status={req.status} />
                      <Text style={styles.tracking}>{req.tracking}</Text>
                    </View>
                    <Text style={styles.title} numberOfLines={1}>{req.title}</Text>
                    <Text style={styles.cityText}>{req.city} · {req.createdAt}</Text>
                  </View>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                  {req.description}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.historyStep}>
                    {req.history[req.history.length - 1]?.text}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.green} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <WhatsAppButton bottomOffset={Platform.OS === 'ios' ? 95 : 80} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  newBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  newBtnSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.greenDark,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.neutralPale,
  },
  filterChipActive: {
    backgroundColor: COLORS.green,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: SPACING.lg,
    gap: 12,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  reqThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  cityText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tracking: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  quotePill: {
    backgroundColor: COLORS.goldPale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  quoteText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.goldText,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralPale,
    paddingTop: 10,
  },
  historyStep: {
    fontSize: 12,
    color: COLORS.textMid,
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },
});

