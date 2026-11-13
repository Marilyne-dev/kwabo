import { Alert, Platform } from 'react-native';

/**
 * Sur le web, Alert.alert de React Native ne fait RIEN : aucune erreur n'est affichée
 * (envoi impossible, fichier refusé, confirmation de déconnexion...).
 * On le remplace par window.alert / window.confirm. Sur mobile natif, rien ne change.
 */
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  (Alert as any).alert = (title: string, message?: string, buttons?: any[]) => {
    const text = message ? `${title}\n\n${message}` : title;
    if (!buttons || buttons.length === 0) {
      window.alert(text);
      return;
    }
    if (buttons.length === 1) {
      window.alert(text);
      buttons[0].onPress?.();
      return;
    }
    const cancel = buttons.find((b) => b.style === 'cancel');
    const action = buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1];
    if (window.confirm(text)) action.onPress?.();
    else cancel?.onPress?.();
  };
}

export {};
