import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { Colors } from '@/lib/theme';

function useWebInputStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent =
      'input:focus, input:focus-visible, textarea:focus, textarea:focus-visible { outline: none !important; box-shadow: none !important; }';
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
}

function useNotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let cleanup: (() => void) | undefined;

    async function setup() {
      try {
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
          const data = response.notification.request.content.data;
          if (data?.recipe_id) {
            router.push(`/recipe/${data.recipe_id}` as any);
          } else if (data?.group_id) {
            router.push(`/group/${data.group_id}` as any);
          }
        });

        cleanup = () => responseSubscription.remove();
      } catch {
        // expo-notifications not available
      }
    }

    setup();
    return () => cleanup?.();
  }, [router]);
}

export default function RootLayout() {
  const { user, loading } = useAuth();
  const { getResponsiveValue } = useResponsive();
  const segments = useSegments();
  const router = useRouter();

  useNotificationHandler();
  useWebInputStyles();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <MaterialIcons name="restaurant-menu" size={getResponsiveValue({ mobile: 48, tablet: 56, desktop: 64 })} color={Colors.greenAccent} />
        <ActivityIndicator size="large" color={Colors.greenAccent} style={styles.spinner} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.cream },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="collections/[id]" />
      <Stack.Screen name="recipe/[id]" />
      <Stack.Screen name="group/[id]" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    gap: 16,
  },
  spinner: {
    marginTop: 16,
  },
});
