import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ApiError, buildApiUrl, getToken } from './api';

/** Source d'image <Image source={...}> pour un fichier protégé par le jeton. */
export function authImageSource(path: string) {
  return { uri: buildApiUrl(path), headers: { Authorization: `Bearer ${getToken() ?? ''}`, Accept: '*/*' } };
}

/** Télécharge un fichier protégé (document, pièce jointe) puis ouvre le partage / l'enregistrement. */
export async function downloadAuthFile(path: string, name: string) {
  const safe = (name || 'fichier').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  const headers = { Authorization: `Bearer ${getToken() ?? ''}` };

  if (Platform.OS === 'web') {
    const res = await fetch(buildApiUrl(path), { headers });
    if (!res.ok) throw new ApiError(res.status, 'Téléchargement impossible.');
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = safe;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const target = `${FileSystem.cacheDirectory}${safe}`;
  const res = await FileSystem.downloadAsync(buildApiUrl(path), target, { headers });
  if (res.status !== 200) throw new ApiError(res.status, 'Téléchargement impossible.');
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(res.uri, { dialogTitle: name });
  }
}
