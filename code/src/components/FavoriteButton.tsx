import { Pressable, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/lib/theme';

interface FavoriteButtonProps {
  recipeId: string;
  isFavorited: boolean;
  onToggle: (recipeId: string) => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function FavoriteButton({ recipeId, isFavorited, onToggle, size = 44, style }: FavoriteButtonProps) {
  const iconSize = Math.round(size * 0.55);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
        style,
      ]}
      hitSlop={8}
      onPress={() => onToggle(recipeId)}
      accessibilityRole="button"
      accessibilityLabel={isFavorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      <MaterialIcons
        name={isFavorited ? 'favorite' : 'favorite-border'}
        size={iconSize}
        color={isFavorited ? '#E74C3C' : Colors.white}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
});
