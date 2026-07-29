import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  DimensionValue,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/NotificationItem';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { AppNotification } from '@/lib/types';
import { getNotificationDeepLink } from '@/lib/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const { getResponsiveValue } = useResponsive();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();

  const contentMaxWidth: DimensionValue = getResponsiveValue({
    mobile: '100%' as DimensionValue,
    tablet: 600,
    desktop: 800,
  });

  const handleNotificationPress = useCallback((notification: AppNotification) => {
    const link = getNotificationDeepLink(notification.data);
    if (link) {
      router.push(link as any);
    }
  }, [router]);

  const renderItem = useCallback(({ item }: { item: AppNotification }) => (
    <NotificationItem
      notification={item}
      onPress={handleNotificationPress}
      onMarkRead={markAsRead}
      onDelete={deleteNotification}
    />
  ), [handleNotificationPress, markAsRead, deleteNotification]);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <MaterialIcons name="notifications-none" size={64} color={Colors.brownLight} />
        <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
        <Text style={styles.emptySubtitle}>
          Aquí verás actividad relacionada con tus recetas y grupos
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (notifications.length === 0) return null;
    return (
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {unreadCount > 0
            ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
            : 'Todas las notificaciones leídas'}
        </Text>
      </View>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.brownDark} />
            </Pressable>
            <Text style={styles.title}>Notificaciones</Text>
          </View>
          {unreadCount > 0 && (
            <Pressable style={styles.markAllButton} onPress={markAllAsRead}>
              <MaterialIcons name="done-all" size={22} color={Colors.greenAccent} />
            </Pressable>
          )}
        </View>

        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={renderSeparator}
          onRefresh={refresh}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    flexWrap: 'wrap',
    rowGap: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.brownDark,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flexGrow: 1,
    paddingBottom: Spacing.lg,
  },
  listHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  listHeaderText: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
    fontWeight: FontWeight.medium,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 72,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'] * 2,
  },
  emptyTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  emptySubtitle: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
