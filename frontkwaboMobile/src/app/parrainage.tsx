import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';

export default function ParrainageScreen() {
  const { user } = useApp();
  const referralCode = user?.referralCode || 'KW-AICH01';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Rejoins KWABO pour toutes tes démarches et chantiers au Bénin ! Utilise mon code ${referralCode} pour bénéficier de 30 € offerts sur ta première mission. https://kwabo.bj`,
      });
    } catch {
      Alert.alert('Partage', `Votre code de parrainage est : ${referralCode}`);
    }
  };

  const handleCopy = () => {
    Alert.alert('Copié !', `Le code ${referralCode} a été copié dans votre presse-papier.`);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title="Parrainage"
        subtitle="Partagez la confiance KWABO"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNIÈRE PARRAINAGE */}
        <View style={styles.heroCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="gift" size={36} color={COLORS.goldText} />
          </View>
          <Text style={styles.heroTitle}>Gagnez 30 € de crédit</Text>
          <Text style={styles.heroSubtitle}>
            Pour chaque proche de la diaspora qui lance sa première mission avec votre code, vous recevez tous les deux 30 € de remise.
          </Text>

          {/* CODE BOX */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>VOTRE CODE PERSONNEL</Text>
            <Text style={styles.codeText}>{referralCode}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={16} color={COLORS.green} />
              <Text style={styles.copyBtnText}>Copier</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Partager mon invitation"
            onPress={handleShare}
            variant="gold"
            size="lg"
            fullWidth
            icon={<Ionicons name="share-social-outline" size={20} color={COLORS.text} />}
            style={{ marginTop: 14 }}
          />
        </View>

        {/* STATISTIQUES PARRAINAGE */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Mes gains de parrainage</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Filleuls inscrits</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statNumber}>60 €</Text>
              <Text style={styles.statLabel}>Crédits disponibles</Text>
            </View>
          </View>
        </View>

        {/* COMMENT ÇA MARCHE */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Comment ça marche ?</Text>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepHeading}>Partagez votre code</Text>
              <Text style={styles.stepDesc}>
                Envoyez votre code par WhatsApp, SMS ou e-mail à votre entourage.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepHeading}>Votre filleul commande</Text>
              <Text style={styles.stepDesc}>
                Il renseigne votre code à l'inscription et profite de 30 € de réduction immédiate.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepHeading}>Vous êtes crédité</Text>
              <Text style={styles.stepDesc}>
                Dès que sa première mission est validée, vos 30 € sont déduits de votre prochaine facture.
              </Text>
            </View>
          </View>
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
    gap: SPACING.md,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: COLORS.greenHero,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#DCEBE2',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  codeContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.muted,
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.greenDark,
    letterSpacing: 2,
    marginVertical: 4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.greenPale,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.green,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
    ...SHADOWS.sm,
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.goldPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.goldText,
  },
  stepInfo: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  stepDesc: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    lineHeight: 16,
  },
});

