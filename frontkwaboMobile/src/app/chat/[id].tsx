import React, { useState, useRef } from 'react';
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
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/common/Header';
import * as DocumentPicker from 'expo-document-picker';
import { DocumentModal } from '@/components/common/DocumentModal';
import { DocumentDownloadData } from '@/utils/documentDownloader';
import { PHOTOS } from '@/constants/photos';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, messages, sendMessage } = useApp();
  const [inputText, setInputText] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentDownloadData | null>(null);
  const scrollViewRef = useRef<any>(null);

  const request = requests.find((r) => r.id === id) || requests[0];
  const thread = (request ? messages[request.id] : []) || [];

  const handleSend = () => {
    if (!inputText.trim() || !request) return;
    sendMessage(request.id, inputText.trim());
    setInputText('');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleAttach = async () => {
    try {
      // Ouvre directement le gestionnaire de fichiers natif du téléphone de l'utilisateur
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Autorise tous types : PDF, images, vidéos, documents bureautiques
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileSizeStr = file.size
          ? file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
            : `${Math.round(file.size / 1024)} Ko`
          : '';

        const lowerName = file.name.toLowerCase();
        const isPdf = lowerName.endsWith('.pdf');
        const isImage =
          file.mimeType?.startsWith('image/') ||
          /\.(jpg|jpeg|png|webp|gif)$/i.test(lowerName);
        const isVideo =
          file.mimeType?.startsWith('video/') ||
          /\.(mp4|mov|avi|mkv)$/i.test(lowerName);

        const icon = isPdf ? '📄' : isImage ? '🖼️' : isVideo ? '🎥' : '📎';

        if (!request) return;
        sendMessage(
          request.id,
          `${icon} [Fichier envoyé] : ${file.name}${fileSizeStr ? ` (${fileSizeStr})` : ''}`,
          file.uri
        );

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    } catch (err: any) {
      console.warn('Erreur gestionnaire de fichiers:', err);
    }
  };

  const handleOpenAttachedFile = (fileName: string, fileSize?: string, fileUri?: string) => {
    const lower = fileName.toLowerCase();
    const isPdf = lower.endsWith('.pdf');
    const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(lower);
    const isVid = /\.(mp4|mov|avi|mkv)$/i.test(lower);

    const docType: DocumentDownloadData['type'] = isVid
      ? 'video'
      : isImg
      ? 'photo'
      : isPdf
      ? 'report'
      : 'contract';

    setSelectedDoc({
      id: `chat-${Date.now()}`,
      name: fileName,
      type: docType,
      date: "Aujourd'hui",
      size: fileSize || (isVid ? '24.5 Mo' : isPdf ? '320 Ko' : '1.2 Mo'),
      reference: request?.tracking || 'KW-CHAT-2026',
      serviceTitle: request?.title || 'Mission KWABO Bénin',
    });
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title={request ? request.title : 'Discussion'}
        subtitle={request ? `Réf : ${request.tracking}` : ''}
        showBack
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {/* BANDEAU SÉCURITÉ */}
          <View style={styles.securityBanner}>
            <Ionicons name="lock-closed" size={14} color={COLORS.muted} />
            <Text style={styles.securityText}>
              Cette conversation est liée à la mission {request?.tracking}. Vos messages sont directement reçus par notre équipe au Bénin.
            </Text>
          </View>

          {/* BULLES DE MESSAGES */}
          {thread.map((msg) => {
            const isClient = msg.sender === 'client';
            const fileMatch = msg.text.match(
              /(?:\[Fichier envoyé\]|\[Document joint\]|\[Image jointe\])\s*:\s*([^()]+)(?:\s*\(([^)]+)\))?/
            );
            const isFileMsg = !!fileMatch;
            const fileName = fileMatch ? fileMatch[1].trim() : '';
            const fileSize = fileMatch && fileMatch[2] ? fileMatch[2].trim() : '';

            if (isFileMsg) {
              const lower = fileName.toLowerCase();
              const isPdf = lower.endsWith('.pdf');
              const isVid = /\.(mp4|mov|avi|mkv)$/i.test(lower);
              const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(lower);

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageWrapper,
                    isClient ? styles.messageClient : styles.messageKwabo,
                  ]}
                >
                  {!isClient && (
                    <Text style={styles.senderLabel}>{msg.senderName}</Text>
                  )}

                  {isImg || isVid ? (
                    /* CARTE MINIATURE POUR PHOTOS ET VIDÉOS */
                    <TouchableOpacity
                      style={[
                        styles.imageBubbleCard,
                        isClient ? styles.imageBubbleCardClient : styles.imageBubbleCardKwabo,
                      ]}
                      onPress={() => handleOpenAttachedFile(fileName, fileSize, msg.fileUri)}
                      activeOpacity={0.88}
                    >
                      <View style={styles.thumbnailContainer}>
                        <Image
                          source={msg.fileUri ? { uri: msg.fileUri } : PHOTOS['chantier']}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                        {isVid && (
                          <View style={styles.playOverlay}>
                            <Ionicons name="play" size={24} color="#FFFFFF" />
                          </View>
                        )}
                      </View>

                      <View style={styles.imageCardFooter}>
                        <Ionicons
                          name={isVid ? 'videocam' : 'image'}
                          size={16}
                          color={isClient ? COLORS.goldLight : COLORS.green}
                          style={{ marginRight: 6 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.fileNameText,
                              isClient ? styles.fileNameTextClient : styles.fileNameTextKwabo,
                            ]}
                            numberOfLines={1}
                          >
                            {fileName}
                          </Text>
                          {fileSize ? (
                            <Text
                              style={[
                                styles.fileMetaText,
                                isClient ? styles.fileMetaTextClient : styles.fileMetaTextKwabo,
                              ]}
                            >
                              {fileSize}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    /* BULLE FICHIER DOCUMENT / PDF SANS ŒIL NI TEXTE INUTILE */
                    <TouchableOpacity
                      style={[
                        styles.fileBubble,
                        isClient ? styles.fileBubbleClient : styles.fileBubbleKwabo,
                      ]}
                      onPress={() => handleOpenAttachedFile(fileName, fileSize, msg.fileUri)}
                      activeOpacity={0.88}
                    >
                      <View style={[styles.fileIconBox, isPdf && styles.pdfIconBox]}>
                        <Ionicons
                          name={isPdf ? 'document-text' : 'document-attach'}
                          size={22}
                          color={isPdf ? '#EF4444' : COLORS.green}
                        />
                      </View>

                      <View style={styles.fileInfo}>
                        <Text
                          style={[
                            styles.fileNameText,
                            isClient ? styles.fileNameTextClient : styles.fileNameTextKwabo,
                          ]}
                          numberOfLines={1}
                        >
                          {fileName}
                        </Text>
                        {fileSize ? (
                          <Text
                            style={[
                              styles.fileMetaText,
                              isClient ? styles.fileMetaTextClient : styles.fileMetaTextKwabo,
                            ]}
                          >
                            {fileSize}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  )}

                  <Text style={styles.messageTime}>{msg.time}</Text>
                </View>
              );
            }

            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isClient ? styles.messageClient : styles.messageKwabo,
                ]}
              >
                {!isClient && (
                  <Text style={styles.senderLabel}>{msg.senderName}</Text>
                )}

                <View
                  style={[
                    styles.bubble,
                    isClient ? styles.bubbleClient : styles.bubbleKwabo,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isClient ? styles.messageTextClient : styles.messageTextKwabo,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>

                <Text style={styles.messageTime}>{msg.time}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* BARRE DE SAISIE AVEC ICÔNE D'ATTACHEMENT (FICHIERS, IMAGES, PDF) */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleAttach}
            accessibilityLabel="Transférer un fichier, image ou PDF"
          >
            <Ionicons name="attach-outline" size={24} color={COLORS.green} />
          </TouchableOpacity>
          <TextInput
            style={styles.chatInput}
            placeholder="Écrivez à votre chargé de mission..."
            placeholderTextColor={COLORS.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              inputText.trim().length > 0 && styles.sendBtnActive,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim().length > 0 ? '#FFFFFF' : COLORS.muted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* VISIONNEUSE ET TÉLÉCHARGEMENT DE FICHIER EN 1 CLIC */}
      <DocumentModal
        visible={!!selectedDoc}
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  messagesList: {
    padding: SPACING.md,
    gap: 12,
  },
  securityBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 16,
  },
  messageWrapper: {
    maxWidth: '82%',
  },
  messageClient: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageKwabo: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.greenDark,
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleClient: {
    backgroundColor: COLORS.green,
    borderBottomRightRadius: 4,
  },
  bubbleKwabo: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  imageBubbleCard: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 220,
    maxWidth: '85%',
    ...SHADOWS.sm,
  },
  imageBubbleCardClient: {
    backgroundColor: COLORS.greenDark,
    borderBottomRightRadius: 4,
  },
  imageBubbleCardKwabo: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbnailContainer: {
    width: '100%',
    height: 135,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pdfIconBox: {
    backgroundColor: '#FEE2E2',
  },
  fileBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    gap: 10,
    minWidth: 220,
    maxWidth: '85%',
    ...SHADOWS.sm,
  },
  fileBubbleClient: {
    backgroundColor: COLORS.greenDark,
    borderBottomRightRadius: 4,
  },
  fileBubbleKwabo: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fileNameTextClient: {
    color: '#FFFFFF',
  },
  fileNameTextKwabo: {
    color: COLORS.text,
  },
  fileMetaText: {
    fontSize: 11,
    marginTop: 2,
  },
  fileMetaTextClient: {
    color: '#DCEBE2',
  },
  fileMetaTextKwabo: {
    color: COLORS.muted,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextClient: {
    color: '#FFFFFF',
  },
  messageTextKwabo: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 3,
    marginHorizontal: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  attachBtn: {
    padding: 6,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.neutralPale,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 90,
    color: COLORS.text,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.neutralPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: COLORS.green,
  },
});

