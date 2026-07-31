import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import { PushPlatform, NotificationType } from '@/lib/types';

const NOTIFICATION_ICONS: Record<NotificationType, { icon: string; color: string }> = {
  replication: { icon: 'cached', color: '#4A7C59' },
  comment: { icon: 'chat-bubble-outline', color: '#FFA000' },
  rating: { icon: 'star', color: '#FFA000' },
  group_invite: { icon: 'person-add', color: '#4A7C59' },
  group_share: { icon: 'share', color: '#4A7C59' },
};

export function getNotificationIcon(type: NotificationType): { icon: string; color: string } {
  return NOTIFICATION_ICONS[type] || { icon: 'notifications', color: '#A89585' };
}

export function getNotificationDeepLink(data: Record<string, any> | null): string | null {
  if (!data) return null;

  if (data.recipe_id) {
    return `/recipe/${data.recipe_id}`;
  }
  if (data.group_id) {
    return `/group/${data.group_id}`;
  }
  if (data.replication_id && data.recipe_id) {
    return `/recipe/${data.recipe_id}`;
  }

  return null;
}

export async function registerPushToken(userId: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return null;
    }

    const { getExpoPushTokenAsync, requestPermissionsAsync } = await import('expo-notifications');

    const { status } = await requestPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const tokenData = await getExpoPushTokenAsync();
    const token = tokenData.data;

    const platform: PushPlatform =
      Platform.OS === 'android' ? 'android' :
      Platform.OS === 'ios' ? 'ios' : 'web';

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform },
        { onConflict: 'user_id, token' }
      );

    if (error) throw error;

    return token;
  } catch (e) {
    console.warn('[push] Registration failed:', e);
    return null;
  }
}

export async function unregisterPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const { getExpoPushTokenAsync } = await import('expo-notifications');

    const tokenData = await getExpoPushTokenAsync();

    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', tokenData.data);
  } catch {
    // skip
  }
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months}mes`;
  const years = Math.floor(months / 12);
  return `hace ${years}a`;
}
