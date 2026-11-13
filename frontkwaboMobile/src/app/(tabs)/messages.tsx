import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/common/Header';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { PHOTOS, SERVICE_PHOTOS } from '@/constants/photos';

export default function MessagesScreen() {
  const router = useRouter();
  const { requests, threads, refreshThreads, refreshRequests } = useApp();
  useFocusEffect(
    React.useCallback(() => {
      refreshThreads();
      refreshRequests();
    }, [refreshThreads, refreshRequests])
  );

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title="Messages"
        subtitle="Échanges avec vos chargés de mission au Bénin"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.noticeBox}>
          <Ionicons name="shield-checkmark" size={18} color={COLORS.green} />
          <Text style={styles.noticeText}>
            Toutes les communications et confirmations de mission sont enregistrées et sécurisées sur votre espace KWABO.
          </Text>
        </View>

        <View style={styles.list}>
          {requests.map((req) => {
            const thread = threads[req.id];
            const photoKey = SERVICE_PHOTOS[req.serviceId] || 'chantier';

            return (
              <TouchableOpacity
                key={req.id}
                style={styles.chatCard}
                onPress={() => router.push(`/chat/${req.id}`)}
                activeOpacity={0.85}
              >
                <Image source={PHOTOS[photoKey]} style={styles.avatarImg} />

                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatTitle} numberOfLines={1}>
                      {req.title}
                    </Text>
                    <Text style={styles.chatTime}>
                      {thread?.lastAt || req.createdAt}
                    </Text>
                  </View>

                  <Text style={styles.chatTracking}>Réf : {req.tracking}</Text>

                  <Text style={styles.chatSnippet} numberOfLines={2}>
                    {thread?.lastText
                      ? `${thread.lastAuthor ? thread.lastAuthor + ' : ' : ''}${thread.lastText}`
                      : 'Discussion ouverte avec votre chargé de mission...'}
                  </Text>
                </View>

                {!!thread && thread.unread > 0 && (
                  <View style={styles.unreadDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

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
    padding: SPACING.lg,
    paddingBottom: 110,
    gap: SPACING.md,
  },
  noticeBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.greenPale,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7E5D5',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.greenDark,
    lineHeight: 16,
  },
  list: {
    gap: 10,
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.goldPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 11,
    color: COLORS.muted,
  },
  chatTracking: {
    fontSize: 11,
    color: COLORS.greenMid,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatSnippet: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green,
    marginLeft: 8,
  },
});

