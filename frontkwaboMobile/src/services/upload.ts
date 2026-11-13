import { Platform } from 'react-native';

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Ajoute un fichier à un FormData.
 * - Mobile natif : objet { uri, name, type } (géré par React Native).
 * - Web : le navigateur ne comprend PAS cet objet (il enverrait "[object Object]") :
 *   il faut récupérer le vrai fichier (Blob) à partir de son URL.
 */
export async function appendFile(fd: FormData, field: string, file: PickedFile) {
  if (Platform.OS === 'web') {
    let blob = await (await fetch(file.uri)).blob();
    if (file.type && blob.type !== file.type) blob = new Blob([blob], { type: file.type });
    fd.append(field, blob, file.name);
  } else {
    fd.append(field, { uri: file.uri, name: file.name, type: file.type } as any);
  }
}
