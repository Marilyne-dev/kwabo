import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { SERVICES } from '@/data/services';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { PHOTOS, SERVICE_PHOTOS } from '@/constants/photos';

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const service = SERVICES.find((s) => s.id === id) || SERVICES[0];

  const handleOrder = () => {
    router.push(`/(tabs)/nouvelle-demande?service=${service.id}`);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header title={service.name} subtitle="Détail de la prestation" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNIÈRE SERVICE AVEC SA VRAIE PHOTO */}
        <View style={styles.heroCard}>
          <Image
            source={PHOTOS[SERVICE_PHOTOS[service.id] || 'chantier']}
            style={styles.heroImg}
            resizeMode="cover"
          />
          <View style={styles.heroImgOverlay} />
          <View style={styles.heroCardInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.servicePrice}>{service.price}</Text>
            <Text style={styles.serviceShort}>{service.short}</Text>
          </View>
        </View>

        {/* INCLUSIONS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ce qui est inclus dans le service</Text>
          <View style={styles.inclusionsList}>
            {service.included.map((item, idx) => (
              <View key={idx} style={styles.inclusionRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
                <Text style={styles.inclusionText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* GARANTIE KWABO */}
        <View style={styles.guaranteeCard}>
          <View style={styles.guaranteeIcon}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.goldText} />
          </View>
          <View style={styles.guaranteeInfo}>
            <Text style={styles.guaranteeTitle}>Garantie Confiance KWABO</Text>
            <Text style={styles.guaranteeDesc}>
              Intervenants vérifiés sur le terrain au Bénin, photos et vidéos horodatées, devis transparent sans frais cachés.
            </Text>
          </View>
        </View>

        {/* INFORMATIONS NÉCESSAIRES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations demandées au formulaire</Text>
          <Text style={styles.fieldsIntro}>
            Pour préparer votre devis, vous préciserez :
          </Text>
          <View style={styles.fieldsList}>
            {service.fields.map((f) => (
              <View key={f.name} style={styles.fieldItem}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.muted} />
                <Text style={styles.fieldName}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* PIED D'ACTION FIXE */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Tarif indicatif</Text>
          <Text style={styles.footerPriceValue}>{service.price}</Text>
        </View>
        <Button
          title="Demander ce service"
          onPress={handleOrder}
          variant="primary"
          size="md"
          icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        />
      </View>
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
    gap: SPACING.md,
    paddingBottom: 110,
  },
  heroCard: {
    backgroundColor: COLORS.greenHero,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 180,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  heroImg: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  heroImgOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(18, 63, 40, 0.65)',
  },
  heroCardInfo: {
    padding: SPACING.lg,
    zIndex: 1,
  },
  serviceName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.goldLight,
    marginTop: 4,
    marginBottom: 6,
  },
  serviceShort: {
    fontSize: 13,
    color: '#DCEBE2',
    lineHeight: 18,
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
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  inclusionsList: {
    gap: 10,
  },
  inclusionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inclusionText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  guaranteeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.goldPale,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#EBDCAE',
    gap: 12,
  },
  guaranteeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeInfo: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.goldText,
    marginBottom: 2,
  },
  guaranteeDesc: {
    fontSize: 12,
    color: COLORS.textMid,
    lineHeight: 18,
  },
  fieldsIntro: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 8,
  },
  fieldsList: {
    gap: 6,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  fieldName: {
    fontSize: 13,
    color: COLORS.textMid,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.md,
  },
  footerPrice: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },
  footerPriceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.greenDark,
  },
});

