import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { SearchFilters } from '@/hooks/useSearch';

interface FilterChipsProps {
  filters: SearchFilters;
  onRemove: (key: keyof SearchFilters, value?: string) => void;
}

export function FilterChips({ filters, onRemove }: FilterChipsProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.query) {
    chips.push({
      key: 'query',
      label: `"${filters.query}"`,
      onRemove: () => onRemove('query'),
    });
  }

  for (const d of filters.difficulty) {
    const labels: Record<string, string> = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' };
    chips.push({
      key: `difficulty-${d}`,
      label: labels[d] || d,
      onRemove: () => onRemove('difficulty', d),
    });
  }

  for (const tag of filters.tags) {
    chips.push({
      key: `tag-${tag}`,
      label: tag,
      onRemove: () => onRemove('tags', tag),
    });
  }

  if (filters.ingredient) {
    chips.push({
      key: 'ingredient',
      label: `Ingrediente: ${filters.ingredient}`,
      onRemove: () => onRemove('ingredient'),
    });
  }

  if (filters.maxTime !== null) {
    const h = Math.floor(filters.maxTime / 60);
    const m = filters.maxTime % 60;
    const timeLabel = h > 0
      ? m > 0 ? `${h}h ${m}min` : `${h}h`
      : `${filters.maxTime}min`;
    chips.push({
      key: 'maxTime',
      label: `Máx ${timeLabel}`,
      onRemove: () => onRemove('maxTime'),
    });
  }

  if (filters.onlyFavorites) {
    chips.push({
      key: 'onlyFavorites',
      label: 'Favoritos',
      onRemove: () => onRemove('onlyFavorites'),
    });
  }

  if (filters.onlyMine) {
    chips.push({
      key: 'onlyMine',
      label: 'Mis recetas',
      onRemove: () => onRemove('onlyMine'),
    });
  }

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {chips.map(chip => (
        <View key={chip.key} style={styles.chip}>
          <Text style={styles.chipText} numberOfLines={1}>
            {chip.label}
          </Text>
          <Pressable onPress={chip.onRemove} hitSlop={6}>
            <MaterialIcons name="close" size={14} color={Colors.greenAccent} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.tag,
    backgroundColor: Colors.greenLight,
    borderWidth: 1,
    borderColor: Colors.greenAccent,
  },
  chipText: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    color: Colors.greenAccent,
  },
});
