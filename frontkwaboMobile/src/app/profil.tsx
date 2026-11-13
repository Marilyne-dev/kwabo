import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';

export default function ProfilScreen() {
  const { user } = useApp();

  const [firstName, setFirstName] = useState(user?.firstName || 'Aïcha');
  const [lastName, setLastName] = useState(user?.lastName || 'Sossa');
  const [email, setEmail] = useState(user?.email || 'client@kwabo.demo');
  const [phone, setPhone] = useState(user?.phone || '+33 6 12 34 56 78');
  const [country, setCountry] = useState(user?.country || 'France');

  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);

  const handlePhoneChange = (text: string) => {
    // N'autorise que les chiffres, l'indicatif '+' et les espaces
    const sanitized = text.replace(/[^0-9+\s]/g, '');
    setPhone(sanitized);
  };

  const handleSave = () => {
    Alert.alert('Profil mis à jour', 'Vos modifications ont été enregistrées avec succès.');
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title="Mon profil"
        subtitle="Coordonnées et préférences de contact"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AVATAR & RÔLE */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {firstName[0]}
              {lastName[0]}
            </Text>
          </View>
          <Text style={styles.fullName}>
            {firstName} {lastName}
          </Text>
          <View style={styles.roleTag}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
            <Text style={styles.roleText}>Compte Client Vérifié</Text>
          </View>
        </View>

        {/* COORDONNÉES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Adresse e-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Téléphone / WhatsApp</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Pays de résidence</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
            />
          </View>
        </View>

        {/* PRÉFÉRENCES DE NOTIFICATIONS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Canaux de notification</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Notifications push mobiles</Text>
              <Text style={styles.switchDesc}>Alertes instantanées sur votre téléphone</Text>
            </View>
            <Switch
              value={notifPush}
              onValueChange={setNotifPush}
              trackColor={{ false: COLORS.border, true: COLORS.green }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Alertes WhatsApp</Text>
              <Text style={styles.switchDesc}>Messages lors du démarrage et devis</Text>
            </View>
            <Switch
              value={notifWhatsApp}
              onValueChange={setNotifWhatsApp}
              trackColor={{ false: COLORS.border, true: COLORS.green }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Récapitulatifs par e-mail</Text>
              <Text style={styles.switchDesc}>Factures et rapports PDF par courriel</Text>
            </View>
            <Switch
              value={notifEmail}
              onValueChange={setNotifEmail}
              trackColor={{ false: COLORS.border, true: COLORS.green }}
            />
          </View>
        </View>

        <Button
          title="Enregistrer les modifications"
          onPress={handleSave}
          variant="primary"
          size="lg"
          fullWidth
        />
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
    gap: SPACING.lg,
    paddingBottom: 40,
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.greenDark,
  },
  fullName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.greenPale,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.greenDark,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.neutralPale,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 46,
    fontSize: 14,
    color: COLORS.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutralPale,
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  switchDesc: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
});

