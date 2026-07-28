import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';

interface SearchSuggestionsProps {
  suggestions: string[];
  popularTags: string[];
  onSelect: (suggestion: string) => void;
  visible: boolean;
}

export function SearchSuggestions({
  suggestions,
  popularTags,
  onSelect,
  visible,
}: SearchSuggestionsProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      {suggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
          {suggestions.map((s, i) => (
            <Pressable
              key={`recent-${i}`}
              style={styles.suggestionRow}
              onPress={() => onSelect(s)}
            >
              <MaterialIcons name="history" size={16} color={Colors.brownLight} />
              <Text style={styles.suggestionText} numberOfLines={1}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {popularTags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags populares</Text>
          <View style={styles.tagsRow}>
            {popularTags.map(tag => (
              <Pressable
                key={tag}
                style={styles.tagChip}
                onPress={() => onSelect(tag)}
              >
                <Text style={styles.tagChipText}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  suggestionText: {
    fontSize: FontSize.body,
    color: Colors.brownDark,
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.tag,
    backgroundColor: Colors.bone,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipText: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
});
