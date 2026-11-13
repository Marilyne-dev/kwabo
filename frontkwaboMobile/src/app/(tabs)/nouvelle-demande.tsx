import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { SERVICES, ServiceItem, FormField } from '@/data/services';
import { CITIES } from '@/data/categories';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { PHOTOS, SERVICE_PHOTOS } from '@/constants/photos';

export default function NouvelleDemandeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ service?: string }>();
  const { createRequest, user, notify } = useApp();

  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [city, setCity] = useState(CITIES[0]);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdTracking, setCreatedTracking] = useState('');

  const isNumericField = (f: FormField) => {
    const name = f.name.toLowerCase();
    const label = f.label.toLowerCase();
    return (
      f.type === 'number' ||
      name.includes('budget') ||
      name.includes('poids') ||
      name.includes('montant') ||
      name.includes('surface') ||
      name.includes('quantite') ||
      label.includes('budget') ||
      label.includes('poids') ||
      label.includes('montant') ||
      label.includes('surface') ||
      label.includes('quantité')
    );
  };

  const isPhoneField = (f: FormField) => {
    const name = f.name.toLowerCase();
    const label = f.label.toLowerCase();
    return (
      f.type === 'tel' ||
      name.includes('phone') ||
      name.includes('telephone') ||
      name.includes('tel') ||
      label.includes('téléphone') ||
      label.includes('telephone')
    );
  };

  useEffect(() => {
    if (params.service) {
      const found = SERVICES.find((s) => s.id === params.service);
      if (found) setSelectedService(found);
    }
  }, [params.service]);

  const handleSelectService = (service: ServiceItem) => {
    setSelectedService(service);
    setDynamicFields({});
  };

  const handleFieldChange = (f: FormField, value: string) => {
    let cleanVal = value;
    if (isNumericField(f)) {
      // Bloquer strictement tout caractère non numérique
      cleanVal = value.replace(/[^0-9]/g, '');
    } else if (isPhoneField(f)) {
      // Pour les numéros de téléphone: uniquement chiffres, +, et espaces
      cleanVal = value.replace(/[^0-9+\s]/g, '');
    }
    setDynamicFields((prev) => ({ ...prev, [f.name]: cleanVal }));
  };

  const handleSubmit = () => {
    if (!selectedService) return;

    if (!description.trim()) {
      Alert.alert('Champs requis', 'Veuillez préciser brièvement votre besoin dans la description.');
      return;
    }

    const newReq = createRequest({
      userId: user?.id || 'u01',
      serviceId: selectedService.id,
      status: 'pending',
      title: `${selectedService.name} - ${city}`,
      city,
      urgency,
      budget: selectedService.price,
      description: description.trim(),
      details: dynamicFields,
      quote: null,
    });

    notify(
      'Demande transmise avec succès',
      `Votre demande « ${newReq.title} » est enregistrée sous le N° ${newReq.tracking}. Notre équipe prépare votre devis sous 24h.`,
      'success'
    );

    setCreatedTracking(newReq.tracking);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setSelectedService(null);
    setDescription('');
    setDynamicFields({});
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top']}>
        <Header title="Demande envoyée" />
        <View style={styles.successWrapper}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-done" size={48} color={COLORS.green} />
          </View>
          <Text style={styles.successTitle}>Demande transmise !</Text>
          <View style={styles.trackingBadge}>
            <Text style={styles.trackingBadgeText}>N° {createdTracking}</Text>
          </View>
          <Text style={styles.successDesc}>
            Votre demande a été attribuée à notre équipe locale au Bénin. Vous recevrez un devis détaillé et une notification sous 24h ouvrées.
          </Text>

          <View style={styles.successActions}>
            <Button
              title="Suivre mes demandes"
              onPress={() => {
                handleReset();
                router.replace('/(tabs)/demandes');
              }}
              variant="primary"
              size="lg"
              fullWidth
            />
            <Button
              title="Nouvelle demande"
              onPress={handleReset}
              variant="ghost"
              size="md"
              fullWidth
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title={selectedService ? selectedService.name : 'Nouvelle demande'}
        subtitle={selectedService ? 'Formulaire personnalisé' : 'Choisissez le service souhaité'}
        showBack={!!selectedService}
        onBack={() => setSelectedService(null)}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!selectedService ? (
            /* ÉTAPE 1 : CHOIX DU SERVICE */
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Services disponibles au Bénin</Text>
              <Text style={styles.stepSubtitle}>
                Sélectionnez le type d'intervention souhaité pour accéder au formulaire adapté.
              </Text>

              <View style={styles.servicesList}>
                {SERVICES.map((srv) => {
                  const photoKey = SERVICE_PHOTOS[srv.id] || 'chantier';
                  return (
                    <TouchableOpacity
                      key={srv.id}
                      style={styles.serviceItemCard}
                      onPress={() => handleSelectService(srv)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.serviceItemTop}>
                        <Image source={PHOTOS[photoKey]} style={styles.serviceThumbImg} />
                        <View style={styles.serviceItemInfo}>
                          <View style={styles.serviceItemHeader}>
                            <Text style={styles.serviceItemName}>{srv.name}</Text>
                          </View>
                          <Text style={styles.servicePrice}>{srv.price}</Text>
                        </View>
                      </View>

                      <Text style={styles.serviceItemShort}>{srv.short}</Text>

                      <View style={styles.serviceItemFooter}>
                        <Text style={styles.selectActionText}>Choisir ce service</Text>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.green} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            /* ÉTAPE 2 : FORMULAIRE ADAPTÉ */
            <View style={styles.formContainer}>
              {/* BANNIÈRE RÉCAP DU SERVICE */}
              <View style={styles.serviceRecapBanner}>
                <View style={styles.serviceRecapLeft}>
                  <Text style={styles.serviceRecapTitle}>{selectedService.name}</Text>
                  <Text style={styles.serviceRecapPrice}>{selectedService.price}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedService(null)}>
                  <Text style={styles.changeServiceLink}>Changer</Text>
                </TouchableOpacity>
              </View>

              {/* VILLE D'INTERVENTION */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Ville d'intervention au Bénin *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityScroll}>
                  {CITIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.cityChip, city === c && styles.cityChipActive]}
                      onPress={() => setCity(c)}
                    >
                      <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* CHAMPS DYNAMIQUES DU SERVICE */}
              {selectedService.fields.map((f) => {
                const isNum = isNumericField(f);
                const isPhone = isPhoneField(f);
                const keyboardType = isNum ? 'numeric' : isPhone ? 'phone-pad' : 'default';

                return (
                  <View key={f.name} style={styles.fieldGroup}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.fieldLabel}>
                        {f.label} {f.required && '*'}
                      </Text>
                      {isNum && (
                        <Text style={{ fontSize: 11, color: COLORS.green, fontWeight: '600' }}>
                          Chiffres uniquement
                        </Text>
                      )}
                    </View>
                    {f.type === 'select' && f.options ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityScroll}>
                        {f.options.map((opt) => {
                          const isSelected = dynamicFields[f.name] === opt;
                          return (
                            <TouchableOpacity
                              key={opt}
                              style={[styles.optionChip, isSelected && styles.optionChipActive]}
                              onPress={() => handleFieldChange(f, opt)}
                            >
                              <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                                {opt}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <TextInput
                        style={styles.textInput}
                        placeholder={f.placeholder || `Entrez ${f.label.toLowerCase()}`}
                        placeholderTextColor={COLORS.muted}
                        value={dynamicFields[f.name] || ''}
                        onChangeText={(val) => handleFieldChange(f, val)}
                        keyboardType={keyboardType}
                      />
                    )}
                  </View>
                );
              })}

              {/* DESCRIPTION GLOBALE */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Précisions sur votre besoin *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Décrivez précisément votre demande, vos attentes ou vos contraintes de délai..."
                  placeholderTextColor={COLORS.muted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* DEGRÉ D'URGENCE */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Degré d'urgence</Text>
                <View style={styles.urgencyRow}>
                  <TouchableOpacity
                    style={[styles.urgencyCard, urgency === 'normal' && styles.urgencyCardActive]}
                    onPress={() => setUrgency('normal')}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={urgency === 'normal' ? COLORS.green : COLORS.muted}
                    />
                    <Text style={[styles.urgencyText, urgency === 'normal' && styles.urgencyTextActive]}>
                      Standard
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.urgencyCard, urgency === 'urgent' && styles.urgencyCardUrgentActive]}
                    onPress={() => setUrgency('urgent')}
                  >
                    <Ionicons
                      name="flash-outline"
                      size={20}
                      color={urgency === 'urgent' ? COLORS.terracotta : COLORS.muted}
                    />
                    <Text style={[styles.urgencyText, urgency === 'urgent' && styles.urgencyTextUrgentActive]}>
                      Urgent (+20%)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Button
                title="Valider et envoyer ma demande"
                onPress={handleSubmit}
                variant="primary"
                size="lg"
                fullWidth
                style={{ marginTop: 16 }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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
    paddingBottom: 110,
  },
  stepContainer: {
    padding: SPACING.lg,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  stepSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  servicesList: {
    gap: 12,
  },
  serviceItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  serviceItemTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceThumbImg: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  serviceIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.greenPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceItemInfo: {
    flex: 1,
  },
  serviceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  servicePrice: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: '700',
    marginTop: 2,
  },
  serviceItemShort: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    marginBottom: 10,
  },
  serviceItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralPale,
    paddingTop: 8,
  },
  selectActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green,
  },
  formContainer: {
    padding: SPACING.lg,
  },
  serviceRecapBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  serviceRecapLeft: {
    flex: 1,
  },
  serviceRecapTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  serviceRecapPrice: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '700',
    marginTop: 2,
  },
  changeServiceLink: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  cityScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  cityChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cityChipActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  cityChipText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  cityChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionChipActive: {
    backgroundColor: COLORS.greenPale,
    borderColor: COLORS.green,
  },
  optionChipText: {
    fontSize: 12,
    color: COLORS.text,
  },
  optionChipTextActive: {
    color: COLORS.green,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  urgencyCardActive: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenPale,
  },
  urgencyCardUrgentActive: {
    borderColor: COLORS.terracotta,
    backgroundColor: COLORS.terracottaPale,
  },
  urgencyText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  urgencyTextActive: {
    color: COLORS.green,
  },
  urgencyTextUrgentActive: {
    color: COLORS.terracotta,
  },
  successWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.greenPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  trackingBadge: {
    backgroundColor: COLORS.goldPale,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.md,
  },
  trackingBadgeText: {
    color: COLORS.goldText,
    fontWeight: '800',
    fontSize: 14,
  },
  successDesc: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  successActions: {
    width: '100%',
  },
});

