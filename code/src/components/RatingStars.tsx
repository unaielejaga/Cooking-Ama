import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/lib/theme';

interface RatingStarsProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}

export function RatingStars({ rating, onChange, readonly = false, size = 28 }: RatingStarsProps) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= rating;
        const half = !filled && star - 0.5 <= rating;
        return (
          <Pressable
            key={star}
            onPress={() => onChange?.(star)}
            disabled={readonly}
            hitSlop={6}
          >
            <MaterialIcons
              name={filled ? 'star' : half ? 'star-half' : 'star-border'}
              size={size}
              color={filled || half ? Colors.warning : Colors.brownLight}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
});
