import { Tabs, usePathname } from 'expo-router';
import { Text, ColorValue } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Colors, FontSize, BorderRadius } from '@/lib/theme';

function TabLabel({ label, color }: { label: string; color: ColorValue }) {
  return (
    <Text style={{ fontSize: FontSize.small, color, textAlign: 'center', paddingTop: 2 }}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  usePushNotifications();
  const { isDesktop } = useResponsive();
  const pathname = usePathname();

  const isHomeActive = pathname === '/' || pathname === '/(tabs)' || pathname === '/index' || pathname.startsWith('/recipe/');
  const isCreateActive = pathname === '/create' || pathname === '/(tabs)/create';
  const isGroupsActive = pathname === '/groups' || pathname === '/(tabs)/groups' || pathname.startsWith('/group/');
  const isProfileActive = pathname === '/profile' || pathname === '/(tabs)/profile' || pathname.startsWith('/favorites') || pathname.startsWith('/collections');

  function tabColor(active: boolean): ColorValue {
    return active ? Colors.greenAccent : Colors.brownLight;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.greenAccent,
        tabBarInactiveTintColor: Colors.brownLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          paddingHorizontal: 16,
          height: 72,
          ...(isDesktop ? {
            maxWidth: 600,
            alignSelf: 'center',
            width: '100%',
            borderRadius: BorderRadius.card,
            borderCurve: 'continuous',
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          } : {}),
        },
        tabBarItemStyle: {
          paddingHorizontal: 8,
          paddingVertical: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: () => <TabLabel label="Inicio" color={tabColor(isHomeActive)} />,
          tabBarIcon: ({ size }) => (
            <MaterialIcons name="home" size={size} color={tabColor(isHomeActive)} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarLabel: () => <TabLabel label="Crear" color={tabColor(isCreateActive)} />,
          tabBarIcon: ({ size }) => (
            <MaterialIcons name="add-circle-outline" size={size} color={tabColor(isCreateActive)} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          tabBarLabel: () => <TabLabel label="Grupos" color={tabColor(isGroupsActive)} />,
          tabBarIcon: ({ size }) => (
            <MaterialIcons name="group" size={size} color={tabColor(isGroupsActive)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: () => <TabLabel label="Perfil" color={tabColor(isProfileActive)} />,
          tabBarIcon: ({ size }) => (
            <MaterialIcons name="person-outline" size={size} color={tabColor(isProfileActive)} />
          ),
        }}
      />
    </Tabs>
  );
}
