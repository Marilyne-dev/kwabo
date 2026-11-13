import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/common/Header';
import { PHOTOS, DOCUMENT_PHOTOS } from '@/constants/photos';
import { DocumentModal } from '@/components/common/DocumentModal';

type DocFilter = 'all' | 'media' | 'reports';

export default function DocumentsScreen() {
  const { documents, refreshDocuments } = useApp();
  useFocusEffect(
    React.useCallback(() => {
      refreshDocuments();
    }, [refreshDocuments])
  );
  const [filter, setFilter] = useState<DocFilter>('all');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const filteredDocs = documents.filter((doc) => {
    if (filter === 'media') return doc.type === 'video' || doc.type === 'photo';
    if (filter === 'reports') return doc.type === 'report' || doc.type === 'contract';
    return true;
  });

  const handleOpenDoc = (doc: any) => {
    setSelectedDoc(doc);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title="Documents & Médias"
        subtitle="Rapports, contrats et vidéos 360°"
        showBack
      />

      {/* FILTRES */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tous ({documents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'media' && styles.filterChipActive]}
          onPress={() => setFilter('media')}
        >
          <Text style={[styles.filterText, filter === 'media' && styles.filterTextActive]}>
            Vidéos & Photos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'reports' && styles.filterChipActive]}
          onPress={() => setFilter('reports')}
        >
          <Text style={[styles.filterText, filter === 'reports' && styles.filterTextActive]}>
            Rapports & Contrats
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.noticeBox}>
          <Ionicons name="cloud-done-outline" size={20} color={COLORS.green} />
          <Text style={styles.noticeText}>
            Les photos et vidéos de vos chantiers sont horodatées et certifiées par nos agents de terrain au Bénin.
          </Text>
        </View>

        <View style={styles.list}>
          {filteredDocs.map((doc) => {
            const photoKey = DOCUMENT_PHOTOS[doc.id];
            const isMedia = doc.type === 'video' || doc.type === 'photo';
            return (
              <TouchableOpacity
                key={doc.id}
                style={styles.card}
                onPress={() => handleOpenDoc(doc)}
                activeOpacity={0.85}
              >
                {photoKey ? (
                  <View style={styles.thumbWrapper}>
                    <Image source={PHOTOS[photoKey]} style={styles.docThumbImg} />
                    {doc.type === 'video' && (
                      <View style={styles.playBadgeSmall}>
                        <Ionicons name="videocam" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.iconBox,
                      isMedia ? styles.iconBoxMedia : styles.iconBoxDoc,
                    ]}
                  >
                    <Ionicons
                      name={
                        doc.type === 'video'
                          ? 'videocam'
                          : doc.type === 'photo'
                          ? 'image'
                          : doc.type === 'contract'
                          ? 'document-attach'
                          : 'document-text'
                      }
                      size={24}
                      color={isMedia ? COLORS.greenDark : COLORS.green}
                    />
                  </View>
                )}

                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={styles.meta}>
                    {doc.date} · {doc.size || 'Document PDF'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleOpenDoc(doc)}
                >
                  <Ionicons name="download-outline" size={20} color={COLORS.green} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* MODAL DE PRÉVISUALISATION ET TÉLÉCHARGEMENT EFFECTIF */}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.neutralPale,
  },
  filterChipActive: {
    backgroundColor: COLORS.green,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: 40,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.greenPale,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 10,
    alignItems: 'center',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.greenDark,
    lineHeight: 16,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  thumbWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
  },
  docThumbImg: {
    width: '100%',
    height: '100%',
  },
  playBadgeSmall: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxMedia: {
    backgroundColor: COLORS.goldPale,
  },
  iconBoxDoc: {
    backgroundColor: COLORS.greenPale,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: COLORS.muted,
  },
  actionBtn: {
    padding: 8,
  },
});

