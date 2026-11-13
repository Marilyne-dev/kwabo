import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/common/Header';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markNotificationAsRead, refreshNotifications } = useApp();
  useFocusEffect(
    React.useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );
  const [filterUnread, setFilterUnread] = useState(false);

  const displayedNotifs = filterUnread
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handlePressNotif = (notif: any) => {
    markNotificationAsRead(notif.id);
    if (notif.requestId) {
      router.push(`/demande/${notif.requestId}`);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'quote':
        return { name: 'cash-outline', color: COLORS.goldText, bg: COLORS.goldPale };
      case 'started':
        return { name: 'play-outline', color: COLORS.green, bg: COLORS.greenPale };
      case 'report':
        return { name: 'document-text-outline', color: COLORS.greenDark, bg: COLORS.greenPale };
      case 'done':
        return { name: 'checkmark-circle-outline', color: '#27AE60', bg: '#EAF8EE' };
      case 'payment':
        return { name: 'card-outline', color: COLORS.green, bg: COLORS.greenPale };
      default:
        return { name: 'notifications-outline', color: COLORS.muted, bg: COLORS.neutralPale };
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <Header
        title="Notifications"
        subtitle="Historique des alertes en temps réel"
        showBack
        rightAction={
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterUnread(!filterUnread)}
          >
            <Text style={[styles.filterBtnText, filterUnread && styles.filterBtnTextActive]}>
              {filterUnread ? 'Toutes' : 'Non lues'}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayedNotifs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyDesc}>
              {filterUnread
                ? 'Toutes vos notifications sont lues !'
                : 'Vous recevrez ici les alertes à chaque avancée de votre mission.'}
            </Text>
          </View>
        ) : (
          displayedNotifs.map((item) => {
            const iconConfig = getNotifIcon(item.type);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                onPress={() => handlePressNotif(item)}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}
                >
                  <Ionicons
                    name={iconConfig.name as any}
                    size={20}
                    color={iconConfig.color}
                  />
                </View>

                <View style={styles.content}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, !item.read && styles.titleUnread]}>
                      {item.title}
                    </Text>
                    {!item.read && <View style={styles.dot} />}
                  </View>
                  {!!item.message && <Text style={styles.message}>{item.message}</Text>}
                  <Text style={styles.date}>{item.date}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.neutralPale,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  filterBtnTextActive: {
    color: COLORS.green,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: 10,
    paddingBottom: 40,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start',
    ...SHADOWS.sm,
  },
  notifCardUnread: {
    borderColor: COLORS.green,
    backgroundColor: '#FAFDFB',
    borderLeftWidth: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  titleUnread: {
    fontWeight: '800',
    color: COLORS.greenDark,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  message: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: COLORS.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },
});

