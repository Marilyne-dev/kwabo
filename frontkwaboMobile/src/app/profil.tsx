import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import * as profileApi from '@/services/profile';
import { getFirstValidationError } from '@/services/api';
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

const PREF_LABELS: Array<{ key: string; label: string; desc: string }> = [
  { key: 'received', label: 'Demande reçue', desc: 'Confirmation à chaque nouvelle demande' },
  { key: 'quote', label: 'Devis disponible', desc: 'Quand un devis est prêt' },
  { key: 'started', label: 'Mission démarrée', desc: 'Quand l’agent démarre sur le terrain' },
  { key: 'report', label: 'Nouveau rapport', desc: 'Rapports, photos et vidéos' },
  { key: 'done', label: 'Mission terminée', desc: 'Clôture de la mission' },
  { key: 'payment', label: 'Paiements', desc: 'Confirmations de règlement' },
];

export default function ProfilScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useApp();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || '');
  const [prefs, setPrefs] = useState<Record<string, boolean>>(user?.notificationPrefs || {});
  const [saving, setSaving] = useState(false);

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

  const [tfaSecret, setTfaSecret] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [tfaPwd, setTfaPwd] = useState('');

  const [delPwd, setDelPwd] = useState('');

  const fail = (e: unknown) => Alert.alert('Erreur', getFirstValidationError(e));

  const handleSave = async () => {
    setSaving(true);
    try {
      updateUser(await profileApi.updateProfile({ first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim(), country: country.trim() }));
      Alert.alert('Profil mis à jour', 'Vos modifications ont été enregistrées.');
    } catch (e) { fail(e); } finally { setSaving(false); }
  };

  const togglePref = async (key: string, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      updateUser(await profileApi.updateNotificationPrefs(next));
    } catch (e) {
      setPrefs(prefs);
      fail(e);
    }
  };

  const handleChangePassword = async () => {
    try {
      await profileApi.changePassword(curPwd, newPwd);
      setCurPwd(''); setNewPwd('');
      Alert.alert('Mot de passe modifié', 'Les autres appareils ont été déconnectés.');
    } catch (e) { fail(e); }
  };

  const startTfa = async () => {
    try { setTfaSecret((await profileApi.twoFactorSetup()).secret); } catch (e) { fail(e); }
  };
  const enableTfa = async () => {
    try {
      await profileApi.twoFactorEnable(tfaCode);
      if (user) updateUser({ ...user, twoFactorEnabled: true });
      setTfaSecret(''); setTfaCode('');
      Alert.alert('Double authentification activée', 'Un code vous sera demandé à chaque connexion.');
    } catch (e) { fail(e); }
  };
  const disableTfa = async () => {
    try {
      await profileApi.twoFactorDisable(tfaPwd);
      if (user) updateUser({ ...user, twoFactorEnabled: false });
      setTfaPwd('');
    } catch (e) { fail(e); }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Votre compte et toutes vos données seront effacés définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileApi.deleteAccount(delPwd);
              await logout();
              router.replace('/(auth)/login');
            } catch (e) { fail(e); }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header title="Mon profil" subtitle="Coordonnées, sécurité et préférences" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{firstName[0]}{lastName[0]}</Text>
          </View>
          <Text style={styles.fullName}>{firstName} {lastName}</Text>
          <View style={styles.roleTag}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
            <Text style={styles.roleText}>{user?.emailVerified ? 'Compte Client Vérifié' : 'E-mail non confirmé'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Nom</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
            </View>
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Adresse e-mail (non modifiable)</Text>
            <TextInput style={[styles.input, { opacity: 0.6 }]} value={user?.email || ''} editable={false} />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Téléphone / WhatsApp</Text>
            <TextInput style={styles.input} value={phone} onChangeText={(t) => setPhone(t.replace(/[^0-9+\s]/g, ''))} keyboardType="phone-pad" />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pays de résidence</Text>
            <TextInput style={styles.input} value={country} onChangeText={setCountry} />
          </View>
          <Button title={saving ? 'Enregistrement…' : 'Enregistrer les modifications'} onPress={handleSave} disabled={saving} variant="primary" size="lg" fullWidth />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {PREF_LABELS.map((p) => (
            <View key={p.key} style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>{p.label}</Text>
                <Text style={styles.switchDesc}>{p.desc}</Text>
              </View>
              <Switch
                value={prefs[p.key] !== false}
                onValueChange={(v) => togglePref(p.key, v)}
                trackColor={{ false: COLORS.border, true: COLORS.green }}
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mot de passe</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Mot de passe actuel</Text>
            <TextInput style={styles.input} value={curPwd} onChangeText={setCurPwd} secureTextEntry />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nouveau mot de passe (8 car., 1 majuscule, 1 chiffre)</Text>
            <TextInput style={styles.input} value={newPwd} onChangeText={setNewPwd} secureTextEntry />
          </View>
          <Button title="Changer le mot de passe" onPress={handleChangePassword} disabled={!curPwd || !newPwd} variant="primary" size="md" fullWidth />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Double authentification</Text>
          {user?.twoFactorEnabled ? (
            <View>
              <Text style={styles.switchDesc}>Activée. Pour la désactiver, confirmez votre mot de passe.</Text>
              <View style={[styles.formGroup, { marginTop: 10 }]}>
                <TextInput style={styles.input} placeholder="Mot de passe" value={tfaPwd} onChangeText={setTfaPwd} secureTextEntry />
              </View>
              <Button title="Désactiver" onPress={disableTfa} disabled={!tfaPwd} variant="primary" size="md" fullWidth />
            </View>
          ) : tfaSecret ? (
            <View>
              <Text style={styles.switchDesc}>
                Dans votre application d'authentification (Google Authenticator, Authy…), ajoutez un compte avec cette clé :
              </Text>
              <Text selectable style={[styles.switchLabel, { marginVertical: 10, letterSpacing: 1 }]}>{tfaSecret}</Text>
              <View style={styles.formGroup}>
                <TextInput style={styles.input} placeholder="Code à 6 chiffres" value={tfaCode} onChangeText={(v) => setTfaCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" />
              </View>
              <Button title="Activer" onPress={enableTfa} disabled={tfaCode.length !== 6} variant="primary" size="md" fullWidth />
            </View>
          ) : (
            <View>
              <Text style={styles.switchDesc}>Protégez votre compte avec un code à chaque connexion.</Text>
              <Button title="Configurer" onPress={startTfa} variant="primary" size="md" fullWidth style={{ marginTop: 10 }} />
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: COLORS.terracotta }]}>Supprimer mon compte</Text>
          <Text style={styles.switchDesc}>Action définitive : toutes vos données sont effacées.</Text>
          <View style={[styles.formGroup, { marginTop: 10 }]}>
            <TextInput style={styles.input} placeholder="Mot de passe" value={delPwd} onChangeText={setDelPwd} secureTextEntry />
          </View>
          <Button title="Supprimer définitivement" onPress={handleDelete} disabled={!delPwd} variant="primary" size="md" fullWidth />
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

