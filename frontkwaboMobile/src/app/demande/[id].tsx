import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  StyleSheet as RNStyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/common/Header';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { PHOTOS, SERVICE_PHOTOS } from '@/constants/photos';
import { DocumentModal } from '@/components/common/DocumentModal';
import { fetchRequest } from '@/services/requests';
import { reviewRequest } from '@/services/profile';
import { getFirstValidationError } from '@/services/api';
import type { RequestItem } from '@/data/mockData';

export default function DemandeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, documents, cancelRequest } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [detail, setDetail] = useState<RequestItem | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  // Détail frais depuis l'API (chargé de mission, avis, historique complet)
  useEffect(() => {
    if (id) fetchRequest(String(id)).then(setDetail).catch(() => {});
  }, [id]);

  const request = detail ?? requests.find((r) => r.id === id);

  if (!request) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top']}>
        <Header title="Demande" showBack />
        <ActivityIndicator color={COLORS.green} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const relatedDocs = documents.filter((d) => d.requestId === request.id);

  const handleCancel = () => {
    Alert.alert('Annuler la demande', `Voulez-vous vraiment annuler « ${request.title} » ?`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await cancelRequest(request.id);
            router.back();
          } catch (e) {
            Alert.alert('Annulation impossible', getFirstValidationError(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const handleReview = async () => {
    if (rating < 1) {
      Alert.alert('Votre note', 'Choisissez une note de 1 à 5 étoiles.');
      return;
    }
    setBusy(true);
    try {
      await reviewRequest(request.id, rating, comment.trim());
      setDetail(await fetchRequest(request.id));
      Alert.alert('Merci !', 'Votre avis a été envoyé. Il sera publié après modération.');
    } catch (e) {
      Alert.alert('Envoi impossible', getFirstValidationError(e));
    } finally {
      setBusy(false);
    }
  };

  if (!request) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <Header title="Demande introuvable" showBack />
        <View style={styles.notFound}>
          <Text>Cette demande n'existe pas.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title={request.tracking}
        subtitle={request.city}
        showBack
        rightAction={
          <Badge status={request.status} />
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNIÈRE PHOTO DE LA MISSION */}
        <View style={styles.bannerWrapper}>
          <Image
            source={PHOTOS[SERVICE_PHOTOS[request.serviceId] || 'chantier']}
            style={styles.bannerImg}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerTag}>
            <Ionicons name="business" size={14} color="#FFFFFF" />
            <Text style={styles.bannerTagText}>{request.title}</Text>
          </View>
        </View>

        {/* TITRE ET INFO GÉNÉRALE */}
        <View style={styles.mainCard}>
          <Text style={styles.title}>{request.title}</Text>
          <Text style={styles.description}>{request.description}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Ville</Text>
              <Text style={styles.metaValue}>{request.city}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Budget estimé</Text>
              <Text style={styles.metaValue}>{request.budget || 'Sur devis'}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Urgence</Text>
              <Text style={styles.metaValue}>
                {request.urgency === 'urgent' ? 'Haute (+20%)' : 'Standard'}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Date de création</Text>
              <Text style={styles.metaValue}>{request.createdAt}</Text>
            </View>
          </View>
        </View>

        {/* SUIVI D'AVANCEMENT / TIMELINE */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Chronologie de la mission</Text>

          <View style={styles.timeline}>
            {request.history.map((step, index) => {
              const isLast = index === request.history.length - 1;
              return (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        isLast ? styles.timelineDotActive : styles.timelineDotDone,
                      ]}
                    >
                      <Ionicons
                        name={isLast ? 'time' : 'checkmark'}
                        size={12}
                        color="#FFFFFF"
                      />
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>

                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineText,
                        isLast && styles.timelineTextActive,
                      ]}
                    >
                      {step.text}
                    </Text>
                    <Text style={styles.timelineDate}>{step.at}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* DÉTAILS SPÉCIFIQUES DU FORMULAIRE */}
        {Object.keys(request.details).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Informations fournies</Text>
            <View style={styles.detailsList}>
              {Object.entries(request.details).map(([key, value]) => (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailKey}>{key} :</Text>
                  <Text style={styles.detailVal}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* DEVIS & FACTURATION */}
        {request.quote && (
          <View style={styles.quoteCard}>
            <View style={styles.quoteTop}>
              <View>
                <Text style={styles.quoteLabel}>Devis officiel KWABO</Text>
                <Text style={styles.quoteName}>{request.quote.label}</Text>
              </View>
              <Text style={styles.quotePrice}>{request.quote.amount} €</Text>
            </View>
            <View style={styles.quoteStatus}>
              <Ionicons
                name={request.status === 'active' || request.status === 'done' ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={request.status === 'active' || request.status === 'done' ? COLORS.green : COLORS.goldText}
              />
              <Text style={styles.quoteStatusText}>
                {request.status === 'active' || request.status === 'done'
                  ? 'Devis accepté & règlement validé'
                  : 'En attente de votre accord'}
              </Text>
            </View>
          </View>
        )}

        {/* CHARGÉ DE MISSION RÉFÉRENT */}
        <View style={styles.operatorCard}>
          <View style={styles.operatorAvatar}>
            <Ionicons name="person" size={24} color={COLORS.greenDark} />
          </View>
          <View style={styles.operatorInfo}>
            <Text style={styles.operatorRole}>Chargé de mission KWABO</Text>
            <Text style={styles.operatorName}>{request.operatorName || 'Attribution en cours'}</Text>
            <Text style={styles.operatorPlace}>{request.operatorName ? 'Équipe KWABO au Bénin' : 'Un chargé de mission va vous être attribué'}</Text>
          </View>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => router.push(`/chat/${request.id}`)}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* AVIS (mission terminée) */}
        {request.status === 'done' && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Votre avis</Text>
            {request.review ? (
              <View>
                <Text style={xs.stars}>{'★'.repeat(request.review.rating)}{'☆'.repeat(5 - request.review.rating)}</Text>
                {!!request.review.comment && <Text style={xs.comment}>{request.review.comment}</Text>}
                {request.review.status === 'pending' && <Text style={xs.hint}>En attente de modération</Text>}
              </View>
            ) : (
              <View>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                      <Text style={[xs.star, { color: n <= rating ? COLORS.goldText : COLORS.border }]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={xs.input}
                  placeholder="Un commentaire (facultatif)"
                  placeholderTextColor={COLORS.muted}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                />
                <Button title={busy ? 'Envoi…' : 'Envoyer mon avis'} onPress={handleReview} disabled={busy} variant="primary" size="md" fullWidth />
              </View>
            )}
          </View>
        )}

        {/* ANNULATION */}
        {(request.status === 'pending' || request.status === 'active') && (
          <TouchableOpacity onPress={handleCancel} disabled={busy} style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: COLORS.terracotta, fontWeight: '700', fontSize: 14 }}>Annuler cette demande</Text>
          </TouchableOpacity>
        )}

        {/* DOCUMENTS ET PHOTOS ASSOCIÉS */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Documents & médias de mission</Text>

          {relatedDocs.length === 0 ? (
            <Text style={styles.noDocText}>
              Aucun document déposé pour le moment. Votre chargé de mission téléversera les rapports et vidéos ici.
            </Text>
          ) : (
            relatedDocs.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.docItem}
                onPress={() => setSelectedDoc(doc)}
              >
                <View style={styles.docIcon}>
                  <Ionicons
                    name={doc.type === 'video' ? 'videocam' : 'document-text'}
                    size={20}
                    color={COLORS.green}
                  />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={styles.docSub}>{doc.date} · {doc.size || 'Fichier'}</Text>
                </View>
                <Ionicons name="download-outline" size={18} color={COLORS.muted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* BOUTON D'ACTION FIXE BAS */}
      <View style={styles.bottomBar}>
        <Button
          title="Échanger avec l'équipe"
          onPress={() => router.push(`/chat/${request.id}`)}
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />}
        />
      </View>

      {/* MODAL TÉLÉCHARGEMENT ET PRÉVISUALISATION DU DOCUMENT */}
      <DocumentModal
        visible={!!selectedDoc}
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </SafeAreaView>
  );
}

const xs = RNStyleSheet.create({
  star: { fontSize: 32 },
  stars: { fontSize: 24, color: '#D4A017', marginBottom: 6 },
  comment: { fontSize: 14, color: '#1E2320', lineHeight: 20 },
  hint: { fontSize: 12, color: '#6E7671', marginTop: 6 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E1DA', borderRadius: 12, minHeight: 70, padding: 12, fontSize: 14, marginBottom: 12, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: 100,
  },
  notFound: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  bannerWrapper: {
    height: 150,
    width: '100%',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 4,
    ...SHADOWS.sm,
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(18, 63, 40, 0.40)',
  },
  bannerTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  bannerTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralPale,
    paddingTop: SPACING.md,
  },
  metaCell: {
    width: '46%',
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 14,
    width: 24,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    backgroundColor: COLORS.green,
  },
  timelineDotDone: {
    backgroundColor: '#27AE60',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  timelineTextActive: {
    fontWeight: '700',
    color: COLORS.greenDark,
  },
  timelineDate: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  detailsList: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralPale,
  },
  detailKey: {
    fontSize: 13,
    color: COLORS.muted,
    textTransform: 'capitalize',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  quoteCard: {
    backgroundColor: COLORS.goldPale,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#EBDCAE',
  },
  quoteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  quoteLabel: {
    fontSize: 11,
    color: COLORS.goldText,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  quoteName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  quotePrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.greenDark,
  },
  quoteStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#E6D3A3',
    paddingTop: 8,
  },
  quoteStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMid,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  operatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.greenPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorRole: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
  },
  operatorName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  operatorPlace: {
    fontSize: 12,
    color: COLORS.greenMid,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDocText: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralPale,
  },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.greenPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  docSub: {
    fontSize: 11,
    color: COLORS.muted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
});

