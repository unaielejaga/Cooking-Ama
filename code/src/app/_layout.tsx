import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { Colors } from '@/lib/theme';

export default function RootLayout() {
  const { user, loading } = useAuth();
  const { getResponsiveValue } = useResponsive();
  const segments = useSegments();
  const router = useRouter();

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

  return <Slot />;
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
