import { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppNotification } from '@/lib/types';
import { getNotificationIcon, formatRelativeTime } from '@/lib/notifications';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';

const SWIPE_THRESHOLD = -80;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({
  notification,
  onPress,
  onMarkRead,
  onDelete,
}: NotificationItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) {
          translateX.setValue(Math.max(gesture.dx, -120));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -120,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDelete(notification.id);
    });
  };

  const icon = getNotificationIcon(notification.type);

  return (
    <View style={styles.wrapper}>
      <View style={styles.deleteBackground}>
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <MaterialIcons name="delete-outline" size={24} color={Colors.white} />
          <Text style={styles.deleteText}>Eliminar</Text>
        </Pressable>
      </View>
      <Animated.View
        style={[styles.container, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={({ pressed }) => [
            styles.content,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            if (!notification.read) {
              onMarkRead(notification.id);
            }
            onPress(notification);
          }}
          onLongPress={() => {
            if (!notification.read) {
              onMarkRead(notification.id);
            }
          }}
        >
          <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
            <MaterialIcons name={icon.icon as any} size={22} color={icon.color} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, !notification.read && styles.titleUnread]} numberOfLines={1}>
                {notification.title}
              </Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            {notification.message && (
              <Text style={styles.message} numberOfLines={2}>
                {notification.message}
              </Text>
            )}
            <Text style={styles.time}>{formatRelativeTime(notification.created_at)}</Text>
          </View>

          <MaterialIcons name="chevron-right" size={20} color={Colors.brownLight} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 1,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderTopLeftRadius: BorderRadius.card,
    borderBottomLeftRadius: BorderRadius.card,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  deleteText: {
    fontSize: FontSize.small,
    color: Colors.white,
    fontWeight: FontWeight.medium,
  },
  container: {
    backgroundColor: Colors.white,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  pressed: {
    backgroundColor: Colors.cream,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownDark,
    flex: 1,
  },
  titleUnread: {
    fontWeight: FontWeight.semiBold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A7C59',
  },
  message: {
    fontSize: FontSize.caption,
    color: Colors.brownMedium,
    lineHeight: 18,
  },
  time: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
    marginTop: 1,
  },
});
