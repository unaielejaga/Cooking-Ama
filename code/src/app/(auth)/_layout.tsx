import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { Colors } from '@/lib/theme';

export default function AuthLayout() {
  const { getResponsiveValue } = useResponsive();

  return (
    <View style={[
      styles.container,
      getResponsiveValue({
        mobile: styles.containerMobile,
        tablet: styles.containerTablet,
        desktop: styles.containerDesktop,
      })
    ]}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  containerMobile: {},
  containerTablet: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
