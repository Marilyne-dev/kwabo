import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { PHOTOS } from '@/constants/photos';

const SLIDES = [
  {
    photoKey: 'chantier-tour',
    titleMain: 'Voyez le travail, ',
    titleEm: 'où que vous soyez',
    text: 'Vidéos, photos datées, reçus et rapports arrivent directement dans votre téléphone.',
  },
  {
    photoKey: 'cotonou',
    titleMain: 'Une demande ',
    titleEm: 'en moins de 3 minutes',
    text: 'Chantier, famille, démarches, fret : choisissez un service, décrivez votre besoin, recevez un devis.',
  },
  {
    photoKey: 'port',
    titleMain: 'Prévenu ',
    titleEm: 'à chaque étape',
    text: 'Devis, démarrage, rapport, fin de mission : une notification, et tout est à portée de main.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const slide = SLIDES[currentStep];
  const isLast = currentStep === SLIDES.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/(auth)/register');
    }
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* HAUT : PHOTO HD EN PLEINE VISIBILITÉ (SANS VOILE, SANS RECTANGLE JAUNE, SANS TEXTE SUR L'IMAGE) */}
      <View style={styles.topCard}>
        <Image
          source={PHOTOS[slide.photoKey]}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        <SafeAreaView edges={['top']} style={styles.topSafeArea}>
          {/* Logo KWABO discret en haut à gauche */}
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoCircleText}>K</Text>
            </View>
            <Text style={styles.logoText}>
              KWABO<Text style={styles.logoDot}>.</Text>
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* BAS : CONTENU TEXTE + PAGINATION + BOUTONS D'ACTION */}
      <SafeAreaView edges={['bottom']} style={styles.bottomCard}>
        <View style={styles.bodyContent}>
          <Text style={styles.title}>
            {slide.titleMain}
            <Text style={styles.titleEm}>{slide.titleEm}</Text>
          </Text>

          <Text style={styles.description}>{slide.text}</Text>

          {/* Points de pagination */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentStep ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Boutons d'action */}
          <View style={styles.actions}>
            {isLast ? (
              <Button
                title="Créer mon compte gratuit"
                onPress={handleNext}
                variant="primary"
                size="lg"
                fullWidth
              />
            ) : (
              <Button
                title="Suivant"
                onPress={handleNext}
                variant="primary"
                size="lg"
                fullWidth
              />
            )}

            <Button
              title="J'ai déjà un compte"
              onPress={handleLogin}
              variant="ghost"
              size="lg"
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topCard: {
    flex: 1.35,
    backgroundColor: '#000000',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  topSafeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircleText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.greenDark,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  logoDot: {
    color: COLORS.goldLight,
  },
  bottomCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bodyContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 33,
    letterSpacing: -0.5,
  },
  titleEm: {
    color: COLORS.greenMid,
    fontStyle: 'normal',
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: -4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.green,
  },
  dotInactive: {
    width: 8,
    backgroundColor: COLORS.border,
  },
  actions: {
    gap: 10,
    marginTop: 6,
  },
});
