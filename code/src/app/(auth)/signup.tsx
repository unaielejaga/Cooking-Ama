import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { InputField, Button, Divider, ErrorAlert } from '@/components';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const { getResponsiveValue, getResponsiveStyle, formWidth } = useResponsive();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = useCallback(async () => {
    if (!username || !email || !password) {
      setError('Por favor, rellena todos los campos obligatorios');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError('El nombre de usuario debe tener entre 3 y 20 caracteres');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setError('');
    setLoading(true);
    const result = await signUp({ email, password, username, displayName });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    }
  }, [username, email, password, displayName, signUp]);

  const scrollContentStyle = getResponsiveStyle({
    mobile: styles.scrollContentMobile,
    tablet: styles.scrollContentTablet,
    desktop: styles.scrollContentDesktop,
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
          <Text style={styles.subtitle}>Crea tu cuenta</Text>
        </View>

        <View style={[styles.formCard, { width: formMaxWidth }]}>
          {error ? <ErrorAlert message={error} /> : null}

          <InputField
            label="Nombre de usuario *"
            icon="person-outline"
            value={username}
            onChangeText={setUsername}
            placeholder="mi_usuario"
            autoCapitalize="none"
          />

          <InputField
            label="Email *"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Contraseña *"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
          />

          <InputField
            label="Nombre para mostrar"
            icon="badge"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Mi Nombre"
          />

          <Button
            title="Crear cuenta"
            onPress={handleSignup}
            loading={loading}
          />

          <Divider />

          <Link href={'/(auth)/login' as any} asChild>
            <Pressable style={({ pressed }) => [styles.navLink, pressed && styles.navLinkPressed]}>
              <Text style={styles.navText}>¿Ya tienes cuenta?</Text>
              <Text style={styles.navLinkText}>Inicia sesión</Text>
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
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    padding: Spacing.lg,
    gap: Spacing.md,
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
