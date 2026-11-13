import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/data/categories';
import { SERVICES } from '@/data/services';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { Badge } from '@/components/common/Badge';
import { NotificationBell } from '@/components/common/NotificationBell';
import { PHOTOS, SERVICE_PHOTOS, CATEGORY_PHOTOS, DOCUMENT_PHOTOS } from '@/constants/photos';

export default function HomeScreen() {
  const router = useRouter();
  const { user, requests, documents, unreadNotificationsCount } = useApp();

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const activeCount = requests.filter((r) => r.status === 'active').length;
  const doneCount = requests.filter((r) => r.status === 'done').length;

  const activeRequest = requests.find((r) => r.status === 'active');
  const popularServices = SERVICES.filter((s) => s.popular);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER HERO AVEC PHOTO DE FOND (Chantier / Ganvié) */}
        <View style={styles.hero}>
          <Image
            source={PHOTOS['chantier']}
            style={styles.heroBgPhoto}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />

          <SafeAreaView edges={['top']} style={styles.heroContent}>
            <View style={styles.heroTop}>
              <TouchableOpacity
                style={styles.heroUser}
                onPress={() => router.push('/(tabs)/compte')}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user ? `${user.firstName[0]}${user.lastName[0]}` : 'AS'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.greetingSmall}>Bonjour</Text>
                  <Text style={styles.greetingName}>
                    {user?.firstName || 'Aïcha'}
                  </Text>
                </View>
              </TouchableOpacity>

              <NotificationBell />
            </View>

            {/* BARRE DE RECHERCHE TACTILE : QUE CHERCHEZ-VOUS ? */}
            <TouchableOpacity
              style={styles.searchPill}
              onPress={() => router.push('/services')}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={20} color={COLORS.muted} />
              <Text style={styles.searchPlaceholder}>Que cherchez-vous ?</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* COMPTEURS DE STATUT (Total, En attente, En cours, Terminées) */}
        <View style={styles.countersWrapper}>
          <View style={styles.counters}>
            <TouchableOpacity
              style={styles.counterItem}
              onPress={() => router.push('/(tabs)/demandes')}
            >
              <Text style={styles.counterNum}>{totalCount}</Text>
              <Text style={styles.counterLabel}>Total</Text>
            </TouchableOpacity>
            <View style={styles.counterDivider} />
            <TouchableOpacity
              style={styles.counterItem}
              onPress={() => router.push('/(tabs)/demandes')}
            >
              <Text style={styles.counterNum}>{pendingCount}</Text>
              <Text style={styles.counterLabel}>En attente</Text>
            </TouchableOpacity>
            <View style={styles.counterDivider} />
            <TouchableOpacity
              style={styles.counterItem}
              onPress={() => router.push('/(tabs)/demandes')}
            >
              <Text style={styles.counterNum}>{activeCount}</Text>
              <Text style={styles.counterLabel}>En cours</Text>
            </TouchableOpacity>
            <View style={styles.counterDivider} />
            <TouchableOpacity
              style={styles.counterItem}
              onPress={() => router.push('/(tabs)/demandes')}
            >
              <Text style={styles.counterNum}>{doneCount}</Text>
              <Text style={styles.counterLabel}>Terminées</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ALERTE DEVIS À PAYER */}
        <View style={styles.sectionPadding}>
          <View style={styles.alertCard}>
            <View style={styles.alertIconBox}>
              <Ionicons name="cash-outline" size={20} color={COLORS.goldText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Devis à payer : 45 €</Text>
              <Text style={styles.alertSub}>Santé de vos proches · Médicaments</Text>
            </View>
            <TouchableOpacity
              style={styles.alertBtn}
              onPress={() => router.push('/paiements')}
            >
              <Text style={styles.alertBtnText}>Payer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MISSION EN COURS AVEC SA VRAIE PHOTO ET PROGRESSION */}
        {activeRequest && (
          <View style={styles.sectionPadding}>
            <TouchableOpacity
              style={styles.missionCard}
              onPress={() => router.push(`/demande/${activeRequest.id}`)}
              activeOpacity={0.88}
            >
              <View style={styles.missionPhotoWrapper}>
                <Image
                  source={PHOTOS['chantier']}
                  style={styles.missionPhoto}
                  resizeMode="cover"
                />
                <View style={styles.missionPhotoTag}>
                  <Ionicons name="flash" size={13} color="#FFFFFF" />
                  <Text style={styles.missionPhotoTagText}>Mission en cours</Text>
                </View>
              </View>

              <View style={styles.missionBody}>
                <Text style={styles.missionTitle}>{activeRequest.title}</Text>

                {/* Étapes d'avancement comme sur la maquette */}
                <View style={styles.stepsRow}>
                  <View style={[styles.stepDot, styles.stepDone]} />
                  <View style={[styles.stepBar, styles.stepDone]} />
                  <View style={[styles.stepDot, styles.stepDone]} />
                  <View style={[styles.stepBar, styles.stepDone]} />
                  <View style={[styles.stepDot, styles.stepActive]} />
                  <View style={styles.stepBar} />
                  <View style={styles.stepDot} />
                </View>

                <Text style={styles.missionHistory}>
                  {activeRequest.history[activeRequest.history.length - 1]?.text}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* PHOTOS DU CHANTIER AVEC LES VRAIES PHOTOS */}
        <View style={styles.sectionPadding}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Photos du chantier</Text>
            <TouchableOpacity onPress={() => router.push('/documents')}>
              <Text style={styles.headLink}>Tout voir</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScroll}>
            <TouchableOpacity
              style={styles.photoThumbCard}
              onPress={() => router.push('/documents')}
              activeOpacity={0.85}
            >
              <Image source={PHOTOS['chantier-tour']} style={styles.photoThumbImg} />
              <View style={styles.playBadge}>
                <Ionicons name="videocam" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.photoThumbDate}>10 févr. 2026</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoThumbCard}
              onPress={() => router.push('/documents')}
              activeOpacity={0.85}
            >
              <Image source={PHOTOS['chantier-terrain']} style={styles.photoThumbImg} />
              <Text style={styles.photoThumbDate}>3 févr. 2026</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoThumbCard}
              onPress={() => router.push('/documents')}
              activeOpacity={0.85}
            >
              <Image source={PHOTOS['chantier']} style={styles.photoThumbImg} />
              <Text style={styles.photoThumbDate}>28 janv. 2026</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* NOS UNIVERS AVEC LEURS 4 VRAIES PHOTOS */}
        <View style={styles.sectionPadding}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Nos univers</Text>
            <TouchableOpacity onPress={() => router.push('/services')}>
              <Text style={styles.headLink}>Catalogue</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.universGrid}>
            {CATEGORIES.map((cat) => {
              const photoKey = CATEGORY_PHOTOS[cat.id] || 'chantier-tour';
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.universTile}
                  onPress={() => router.push(`/services?category=${cat.id}`)}
                  activeOpacity={0.85}
                >
                  <Image source={PHOTOS[photoKey]} style={styles.universImg} />
                  <View style={styles.universOverlay} />
                  <View style={styles.universIconBox}>
                    <Ionicons name={cat.icon as any} size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.universName}>{cat.short}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* LES PLUS DEMANDÉS (CARROUSEL AVEC PHOTOS DES SERVICES) */}
        <View style={styles.sectionPadding}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Les plus demandés</Text>
            <TouchableOpacity onPress={() => router.push('/services')}>
              <Text style={styles.headLink}>Tout voir</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselScroll}>
            {popularServices.map((srv) => {
              const photoKey = SERVICE_PHOTOS[srv.id] || 'chantier';
              return (
                <TouchableOpacity
                  key={srv.id}
                  style={styles.popularCard}
                  onPress={() => router.push(`/services/${srv.id}`)}
                  activeOpacity={0.85}
                >
                  <Image source={PHOTOS[photoKey]} style={styles.popularImg} />
                  <View style={styles.popularOverlay} />
                  <View style={styles.popularInfo}>
                    <Text style={styles.popularTitle} numberOfLines={1}>
                      {srv.name}
                    </Text>
                    <Text style={styles.popularPrice}>{srv.price}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* MES DERNIÈRES DEMANDES (AVEC MINIATURES PHOTOS) */}
        <View style={styles.sectionPadding}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Mes dernières demandes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/demandes')}>
              <Text style={styles.headLink}>Tout voir</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.requestsList}>
            {requests.slice(0, 3).map((r) => {
              const photoKey = SERVICE_PHOTOS[r.serviceId] || 'chantier';
              return (
                <TouchableOpacity
                  key={r.id}
                  style={styles.requestRow}
                  onPress={() => router.push(`/demande/${r.id}`)}
                  activeOpacity={0.8}
                >
                  <Image source={PHOTOS[photoKey]} style={styles.reqThumb} />
                  <View style={styles.reqInfo}>
                    <Text style={styles.reqTitle} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={styles.reqSub}>
                      {r.tracking} · {r.city}
                    </Text>
                    <View style={styles.reqBadges}>
                      <Badge status={r.status} />
                      {r.urgency === 'urgent' && (
                        <Badge status="urgent" label="Urgent" />
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* VOS GARANTIES */}
        <View style={[styles.sectionPadding, { paddingBottom: 100 }]}>
          <Text style={styles.sectionTitleAlone}>Vos garanties</Text>
          <View style={styles.trustBox}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.green} />
              <View style={{ flex: 1 }}>
                <Text style={styles.trustTitle}>Sur le terrain au Bénin</Text>
                <Text style={styles.trustDesc}>
                  Nos agents vérifient tout sur place et vous envoient photos et vidéos datées.
                </Text>
              </View>
            </View>

            <View style={styles.trustDivider} />

            <View style={styles.trustItem}>
              <Ionicons name="document-text" size={24} color={COLORS.green} />
              <View style={{ flex: 1 }}>
                <Text style={styles.trustTitle}>Devis clair & sans surprise</Text>
                <Text style={styles.trustDesc}>
                  Un prix net convenu à l'avance, aucun frais imprévu.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <WhatsAppButton bottomOffset={Platform.OS === 'ios' ? 95 : 80} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    backgroundColor: '#0C1F15',
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 44,
  },
  heroBgPhoto: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 31, 21, 0.35)',
  },
  heroContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.greenDark,
  },
  greetingSmall: {
    color: '#E8F5EE',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  greetingName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.terracotta,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.pill,
    height: 48,
    paddingHorizontal: 16,
    gap: 10,
    ...SHADOWS.sm,
  },
  searchPlaceholder: {
    color: COLORS.muted,
    fontSize: 15,
  },
  countersWrapper: {
    paddingHorizontal: 16,
    marginTop: -26,
  },
  counters: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    ...SHADOWS.md,
  },
  counterItem: {
    flex: 1,
    alignItems: 'center',
  },
  counterDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    height: '70%',
    alignSelf: 'center',
  },
  counterNum: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  counterLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionPadding: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldPale,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EBDCAE',
    gap: 10,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  alertSub: {
    fontSize: 12,
    color: COLORS.textMid,
  },
  alertBtn: {
    backgroundColor: COLORS.goldLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  alertBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  missionPhotoWrapper: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  missionPhoto: {
    width: '100%',
    height: '100%',
  },
  missionPhotoTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.green,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  missionPhotoTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  missionBody: {
    padding: 14,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  stepBar: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.border,
  },
  stepDone: {
    backgroundColor: '#27AE60',
  },
  stepActive: {
    backgroundColor: COLORS.green,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  missionHistory: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 6,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green,
  },
  photosScroll: {
    gap: 10,
  },
  photoThumbCard: {
    width: 140,
    height: 110,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumbDate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#FFFFFF',
    fontSize: 10,
    paddingVertical: 3,
    textAlign: 'center',
    fontWeight: '600',
  },
  universGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  universTile: {
    flex: 1,
    height: 90,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  universImg: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  universOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(18, 63, 40, 0.55)',
  },
  universIconBox: {
    marginBottom: 4,
  },
  universName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  carouselScroll: {
    gap: 10,
  },
  popularCard: {
    width: 150,
    height: 110,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 8,
  },
  popularImg: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  popularOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  popularInfo: {
    zIndex: 1,
  },
  popularTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  popularPrice: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  requestsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralPale,
    gap: 12,
  },
  reqThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  reqInfo: {
    flex: 1,
  },
  reqTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  reqSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  reqBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  sectionTitleAlone: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  trustBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.sm,
  },
  trustItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  trustDesc: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
  },
  trustDivider: {
    height: 1,
    backgroundColor: COLORS.neutralPale,
  },
});
