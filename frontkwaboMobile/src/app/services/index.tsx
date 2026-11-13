import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { Header } from '@/components/common/Header';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/data/categories';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { PHOTOS, SERVICE_PHOTOS } from '@/constants/photos';

export default function ServicesCatalogScreen() {
  const router = useRouter();
  const { services } = useApp();
  const params = useLocalSearchParams<{ category?: string }>();
  const [selectedCat, setSelectedCat] = useState<string>(params.category || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = services.filter((s) => {
    const matchCat = selectedCat === 'all' || s.cat === selectedCat;
    const matchQuery =
      searchQuery.trim() === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.short.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title="Catalogue des services"
        subtitle="Nos prestations de confiance au Bénin"
        showBack
      />

      {/* BARRE DE RECHERCHE */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher (chantier, santé, visa, foncier...)"
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FILTRES CATÉGORIES */}
      <View style={styles.catScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          <TouchableOpacity
            style={[styles.catChip, selectedCat === 'all' && styles.catChipActive]}
            onPress={() => setSelectedCat('all')}
          >
            <Text style={[styles.catChipText, selectedCat === 'all' && styles.catChipTextActive]}>
              Tous ({services.length})
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCat === cat.id && styles.catChipActive]}
              onPress={() => setSelectedCat(cat.id)}
            >
              <Text style={[styles.catChipText, selectedCat === cat.id && styles.catChipTextActive]}>
                {cat.short}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTE DES SERVICES */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredServices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>Aucun service trouvé</Text>
            <Text style={styles.emptyDesc}>Essayez une autre recherche ou catégorie.</Text>
          </View>
        ) : (
          filteredServices.map((srv) => {
            const photoKey = SERVICE_PHOTOS[srv.id] || 'chantier';
            return (
              <TouchableOpacity
                key={srv.id}
                style={styles.serviceCard}
                onPress={() => router.push(`/services/${srv.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <Image source={PHOTOS[photoKey]} style={styles.servicePhotoThumb} />
                  <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                      <Text style={styles.serviceTitle}>{srv.name}</Text>
                    </View>
                    <Text style={styles.priceTag}>{srv.price}</Text>
                  </View>
                </View>

                <Text style={styles.serviceDesc}>{srv.short}</Text>

                {/* POINTS FORTS INCLUS */}
                <View style={styles.includedList}>
                  {srv.included.slice(0, 3).map((inc, i) => (
                    <View key={i} style={styles.includedItem}>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                      <Text style={styles.includedText}>{inc}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.actionLink}>Voir les détails et réserver →</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <WhatsAppButton bottomOffset={20} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutralPale,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  catScrollWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
  },
  catScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
  },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.neutralPale,
  },
  catChipActive: {
    backgroundColor: COLORS.green,
  },
  catChipText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: SPACING.lg,
    gap: 14,
    paddingBottom: 90,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  servicePhotoThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.greenPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  priceTag: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green,
    marginTop: 2,
  },
  serviceDesc: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    marginBottom: 10,
  },
  includedList: {
    gap: 4,
    marginBottom: 12,
    backgroundColor: COLORS.neutralPale,
    padding: 10,
    borderRadius: RADIUS.md,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  includedText: {
    fontSize: 12,
    color: COLORS.textMid,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralPale,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  actionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green,
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
  },
});

