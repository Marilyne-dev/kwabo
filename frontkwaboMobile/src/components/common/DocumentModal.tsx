import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { Button } from './Button';
import { PHOTOS, DOCUMENT_PHOTOS } from '@/constants/photos';
import {
  DocumentDownloadData,
  downloadPdfDocument,
  downloadMediaFile,
} from '@/utils/documentDownloader';
import { authImageSource, downloadAuthFile } from '@/services/files';

interface DocumentModalProps {
  visible: boolean;
  document: DocumentDownloadData | null;
  onClose: () => void;
}

export function DocumentModal({ visible, document, onClose }: DocumentModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!document) return null;

  const isVideo = document.type === 'video';
  const isPhoto = document.type === 'photo';
  const isMedia = isVideo || isPhoto;
  const realPhoto = !!document.downloadPath && isPhoto;
  const photoKey = document.downloadPath ? null : DOCUMENT_PHOTOS[document.id] || (isMedia ? 'chantier-tour' : null);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadSuccess(false);

    try {
      if (document.downloadPath) {
        await downloadAuthFile(document.downloadPath, document.name);
      } else if (isMedia) {
        await downloadMediaFile(document);
      } else {
        await downloadPdfDocument(document);
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch {
      Alert.alert('Téléchargement impossible', 'Le fichier n’a pas pu être récupéré. Réessayez.');
    } finally {
      setDownloading(false);
    }
  };

  const typeLabel =
    document.type === 'contract'
      ? 'Contrat signé'
      : document.type === 'report'
      ? 'Rapport technique'
      : document.type === 'receipt'
      ? 'Reçu de dépenses'
      : document.type === 'video'
      ? 'Vidéo 360°'
      : document.type === 'photo'
      ? 'Photo haute définition'
      : 'Document officiel';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* EN-TÊTE DU DIALOGUE */}
          <View style={styles.sheetHeader}>
            <View>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.typeBadge,
                    isMedia ? styles.typeBadgeMedia : styles.typeBadgeDoc,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      isMedia ? styles.typeBadgeTextMedia : styles.typeBadgeTextDoc,
                    ]}
                  >
                    {typeLabel}
                  </Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                  <Text style={styles.verifiedText}>Certifié conforme</Text>
                </View>
              </View>

              <Text style={styles.docTitle} numberOfLines={2}>
                {document.name}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          {/* ZONE DE PRÉVISUALISATION (.m-viewer) */}
          <View style={styles.viewer}>
            {realPhoto ? (
              <View style={styles.mediaContainer}>
                <Image source={authImageSource(document.downloadPath!)} style={styles.viewerImage} resizeMode="cover" />
              </View>
            ) : photoKey && PHOTOS[photoKey] ? (
              <View style={styles.mediaContainer}>
                <Image
                  source={PHOTOS[photoKey]}
                  style={styles.viewerImage}
                  resizeMode="cover"
                />
                {isVideo && (
                  <View style={styles.playButtonWrapper}>
                    <View style={styles.playCircle}>
                      <Ionicons name="play" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.playLabel}>Aperçu vidéo 360°</Text>
                  </View>
                )}
                <View style={styles.timestampBadge}>
                  <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.timestampText}>{document.date || '24 Septembre 2026'}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.pdfCardPlaceholder}>
                <View style={styles.pdfIconBig}>
                  <Ionicons name="document-text" size={48} color={COLORS.green} />
                </View>
                <Text style={styles.pdfPreviewName}>{document.name}</Text>
                <Text style={styles.pdfPreviewMeta}>
                  {document.size || '380 Ko'} · Format PDF signé numériquement
                </Text>
                <View style={styles.officialStampPill}>
                  <Ionicons name="shield-checkmark" size={14} color={COLORS.gold} />
                  <Text style={styles.officialStampText}>KWABO BÉNIN VALIDÉ</Text>
                </View>
              </View>
            )}
          </View>

          {/* DÉTAILS DU FICHIER */}
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Date d'enregistrement</Text>
              <Text style={styles.metaValue}>{document.date || '24/09/2026'}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Poids du fichier</Text>
              <Text style={styles.metaValue}>{document.size || (isMedia ? '24.5 Mo' : '380 Ko')}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Sécurité</Text>
              <Text style={styles.metaValue}>Chiffré AES-256</Text>
            </View>
          </View>

          {/* MESSAGE DE SUCCÈS APRÈS TÉLÉCHARGEMENT */}
          {downloadSuccess && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
              <Text style={styles.successBoxText}>
                Fichier prêt et téléchargé avec succès !
              </Text>
            </View>
          )}

          {/* BOUTONS D'ACTION */}
          <View style={styles.actionButtons}>
            <Button
              title={
                downloading
                  ? 'Téléchargement en cours...'
                  : isVideo
                  ? 'Télécharger la vidéo (MP4)'
                  : 'Télécharger le document (PDF)'
              }
              onPress={handleDownload}
              variant="primary"
              size="lg"
              fullWidth
              disabled={downloading}
              icon={
                downloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                )
              }
            />

            <Button
              title="Fermer"
              onPress={onClose}
              variant="ghost"
              size="md"
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(18, 63, 40, 0.60)', // Backdrop exact de la maquette
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...SHADOWS.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  typeBadgeDoc: {
    backgroundColor: COLORS.greenPale,
  },
  typeBadgeMedia: {
    backgroundColor: COLORS.goldPale,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typeBadgeTextDoc: {
    color: COLORS.greenDark,
  },
  typeBadgeTextMedia: {
    color: COLORS.goldText,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: COLORS.green,
    fontWeight: '600',
  },
  docTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 24,
    maxWidth: 270,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.neutralPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewer: {
    height: 190,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    backgroundColor: '#0C1F15', // Fond sombre fidèle à la maquette
    marginVertical: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  playButtonWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  playCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingLeft: 3,
    ...SHADOWS.md,
  },
  playLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timestampBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  timestampText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  pdfCardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.cream,
    width: '100%',
    height: '100%',
  },
  pdfIconBig: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.greenPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pdfPreviewName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  pdfPreviewMeta: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },
  officialStampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.goldPale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginTop: 8,
  },
  officialStampText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.goldText,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.greenPale,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 10,
    justifyContent: 'center',
  },
  successBoxText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.greenDark,
  },
  actionButtons: {
    gap: 8,
    marginTop: 6,
  },
});
