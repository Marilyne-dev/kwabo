import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/common/Header';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { WHATSAPP_CONTACT } from '@/data/categories';

export default function CompteScreen() {
  const router = useRouter();
  const { user, logout } = useApp();

  const handleOpenWhatsApp = async () => {
    const cleanNumber = WHATSAPP_CONTACT.replace(/[^0-9]/g, '');
    const message = encodeURIComponent("Bonjour KWABO, j'ai une question concernant mon compte.");
    const appUrl = `whatsapp://send?phone=${cleanNumber}&text=${message}`;
    const webUrl = `https://wa.me/${cleanNumber}?text=${message}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      Alert.alert('Contact WhatsApp', `Équipe KWABO : ${WHATSAPP_CONTACT}`);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter de votre compte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header title="Mon compte" subtitle="Espace personnel KWABO" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARTE PROFIL ÉPURÉE (SANS IMAGE, NOM ET E-MAIL DU CLIENT) */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/profil')}
          activeOpacity={0.88}
        >
          <View style={styles.profileTop}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'AS'}
              </Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>
                {user ? `${user.firstName} ${user.lastName}` : 'Aïcha Sossa'}
              </Text>
              <Text style={styles.profileEmail}>
                {user?.email || 'client@kwabo.demo'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </View>

          {/* CODE PARRAINAGE */}
          <View style={styles.referralBanner}>
            <View>
              <Text style={styles.referralLabel}>Code parrainage</Text>
              <Text style={styles.referralCode}>{user?.referralCode || 'KW-AICH01'}</Text>
            </View>
            <TouchableOpacity
              style={styles.referralBtn}
              onPress={() => router.push('/parrainage')}
            >
              <Text style={styles.referralBtnText}>30 € offerts</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* CARTE 1 : MON ESPACE (FIDÈLE À LA MAQUETTE) */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/documents')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="folder-outline" size={20} color={COLORS.green} />
            </View>
            <Text style={styles.menuLabel}>Mes documents</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/paiements')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="card-outline" size={20} color={COLORS.green} />
            </View>
            <Text style={styles.menuLabel}>Paiements</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.green} />
            </View>
            <Text style={styles.menuLabel}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/parrainage')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="gift-outline" size={20} color={COLORS.green} />
            </View>
            <Text style={styles.menuLabel}>Parrainage</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/services')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="grid-outline" size={20} color={COLORS.green} />
            </View>
            <Text style={styles.menuLabel}>Catalogue des services</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* CARTE 2 : AIDE ET INFORMATIONS (FIDÈLE À LA MAQUETTE, SANS CRÉDITS PHOTOS) */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOpenWhatsApp}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.green} />
            </View>
            <Text style={styles.menuLabel}>Écrire sur WhatsApp</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/confidentialite')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.green} />
            </View>
            <Text style={styles.menuLabel}>Confidentialité</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/cgu')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.green} />
            </View>
            <Text style={styles.menuLabel}>Conditions d'utilisation</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/mentions-legales')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.green} />
            </View>
            <Text style={styles.menuLabel}>Mentions légales</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* DÉCONNEXION */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.terracotta} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
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
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 110,
    gap: SPACING.lg,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.greenDark,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  countryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  countryText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  referralBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.goldPale,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#EBDCAE',
  },
  referralLabel: {
    fontSize: 11,
    color: COLORS.goldText,
    fontWeight: '600',
  },
  referralCode: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 1,
  },
  referralBtn: {
    backgroundColor: COLORS.goldLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  referralBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralPale,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.greenPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ECCDBD',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.terracotta,
  },
});

