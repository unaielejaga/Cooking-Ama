import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '@/lib/theme';

interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <View style={styles.container}>
      <MaterialIcons name="error-outline" size={18} color={Colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    borderRadius: BorderRadius.button,
    borderCurve: 'continuous',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  text: {
    color: Colors.error,
    fontSize: FontSize.caption,
    flex: 1,
  },
});
