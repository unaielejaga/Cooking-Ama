import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ title, onPress, loading, variant = 'primary', disabled }: ButtonProps) {
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        isSecondary ? styles.secondary : styles.primary,
        disabled && styles.disabled,
        pressed && (isSecondary ? styles.secondaryPressed : styles.primaryPressed),
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? Colors.greenAccent : Colors.white} />
      ) : (
        <Text style={[styles.text, isSecondary && styles.secondaryText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.button,
    borderCurve: 'continuous',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: Colors.greenAccent,
  },
  primaryPressed: {
    opacity: 0.85,
  },
  secondary: {
    backgroundColor: Colors.bone,
  },
  secondaryPressed: {
    backgroundColor: Colors.border,
  },
  disabled: {
    opacity: 0.7,
  },
  text: {
    color: Colors.white,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    textAlign: 'center',
  },
  secondaryText: {
    color: Colors.greenAccent,
  },
});
