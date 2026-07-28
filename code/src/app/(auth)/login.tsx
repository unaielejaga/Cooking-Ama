import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { InputField, Button, Divider, ErrorAlert } from '@/components';

const FEATURES = [
  {
    icon: 'restaurant' as const,
    title: 'Recetas únicas',
    description: 'Descubre y comparte recetas familiares',
  },
  {
    icon: 'group' as const,
    title: 'Grupos privados',
    description: 'Crea grupos para compartir con los tuyos',
  },
  {
    icon: 'content-copy' as const,
    title: 'Replicar recetas',
    description: 'Guarda y adapta recetas a tu gusto',
  },
];

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { getResponsiveValue, getResponsiveStyle, formWidth } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setError('Por favor, rellena todos los campos');
      return;
    }

    setError('');
    setLoading(true);
    const result = await signIn({ email, password });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    }
  }, [email, password, signIn]);

  const scrollContentStyle = getResponsiveStyle({
    mobile: styles.scrollContentMobile,
    tablet: styles.scrollContentTablet,
    desktop: styles.scrollContentDesktop,
  });

  const featuresContainerStyle = getResponsiveStyle({
    mobile: styles.featuresContainerMobile,
    tablet: styles.featuresContainerTablet,
    desktop: styles.featuresContainerDesktop,
  });

  const featureCardStyle = getResponsiveStyle({
    mobile: styles.featureCardMobile,
    tablet: styles.featureCardTablet,
    desktop: styles.featureCardDesktop,
  });

  const logoSize = getResponsiveValue({ mobile: 48, tablet: 56, desktop: 64 });
  const titleSize = getResponsiveValue({ mobile: 36, tablet: 42, desktop: 48 });
  const formMaxWidth = formWidth;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={scrollContentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="restaurant-menu" size={logoSize} color={Colors.greenAccent} />
          </View>
          <Text style={[styles.title, { fontSize: titleSize }]}>Cooking Ama</Text>
          <Text style={styles.tagline}>Comparte tus recetas con quien más quieres</Text>
        </View>

        <View style={featuresContainerStyle}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={featureCardStyle}>
              <View style={styles.featureIcon}>
                <MaterialIcons name={feature.icon} size={24} color={Colors.greenAccent} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.formCard, { width: formMaxWidth }]}>
          <Text style={styles.formTitle}>Iniciar sesión</Text>

          {error ? <ErrorAlert message={error} /> : null}

          <InputField
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Contraseña"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Tu contraseña"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Button
            title="Iniciar sesión"
            onPress={handleLogin}
            loading={loading}
          />

          <Divider />

          <Link href={'/(auth)/signup' as any} asChild>
            <Pressable style={({ pressed }) => [styles.navLink, pressed && styles.navLinkPressed]}>
              <Text style={styles.navText}>¿No tienes cuenta?</Text>
              <Text style={styles.navLinkText}>Regístrate gratis</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContentMobile: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
  scrollContentTablet: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  scrollContentDesktop: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontWeight: FontWeight.bold,
    color: Colors.brownDark,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
    textAlign: 'center',
  },
  featuresContainerMobile: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  featuresContainerTablet: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    width: '100%',
    maxWidth: 600,
  },
  featuresContainerDesktop: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
    width: '100%',
    maxWidth: 700,
  },
  featureCardMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  featureCardTablet: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  featureCardDesktop: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
    marginBottom: 2,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: FontSize.small,
    color: Colors.brownMedium,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  formTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  navLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.button,
    borderCurve: 'continuous',
    minHeight: 48,
    justifyContent: 'center',
  },
  navLinkPressed: {
    backgroundColor: Colors.border,
  },
  navText: {
    fontSize: FontSize.caption,
    color: Colors.brownMedium,
    textAlign: 'center',
  },
  navLinkText: {
    fontSize: FontSize.body,
    color: Colors.greenAccent,
    fontWeight: FontWeight.semiBold,
    textAlign: 'center',
  },
});
