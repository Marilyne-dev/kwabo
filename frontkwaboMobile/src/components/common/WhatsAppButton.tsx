import React from 'react';
import { StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '@/constants/theme';
import { WHATSAPP_CONTACT } from '@/data/categories';

interface WhatsAppButtonProps {
  bottomOffset?: number;
}

export function WhatsAppButton({ bottomOffset = 80 }: WhatsAppButtonProps) {
  const handlePress = async () => {
    const cleanNumber = WHATSAPP_CONTACT.replace(/[^0-9]/g, '');
    const message = encodeURIComponent("Bonjour KWABO, j'ai une question concernant vos services.");
    const appUrl = `whatsapp://send?phone=${cleanNumber}&text=${message}`;
    const webUrl = `https://wa.me/${cleanNumber}?text=${message}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        const webSupported = await Linking.canOpenURL(webUrl);
        if (webSupported) {
          await Linking.openURL(webUrl);
        } else {
          Alert.alert(
            'Assistance WhatsApp KWABO',
            `Contact direct avec notre équipe au Bénin :\n${WHATSAPP_CONTACT}\n(Disponible 7j/7)`,
            [{ text: 'Fermer' }]
          );
        }
      }
    } catch {
      Alert.alert('Contact WhatsApp', `Équipe KWABO : ${WHATSAPP_CONTACT}`);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.button, { bottom: bottomOffset }]}
      onPress={handlePress}
      accessibilityLabel="Contacter KWABO sur WhatsApp"
    >
      <Ionicons name="logo-whatsapp" size={28} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    ...SHADOWS.md,
  },
});

