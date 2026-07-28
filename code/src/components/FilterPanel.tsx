import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  DimensionValue,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { SearchFilters } from '@/hooks/useSearch';

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<SearchFilters>) => void;
  onClear: () => void;
  currentFilters: SearchFilters;
  popularTags: string[];
}

const DIFFICULTIES: { label: string; value: 'easy' | 'medium' | 'hard' }[] = [
  { label: 'Fácil', value: 'easy' },
  { label: 'Media', value: 'medium' },
  { label: 'Difícil', value: 'hard' },
];

const SORT_OPTIONS: { label: string; value: SearchFilters['sortBy'] }[] = [
  { label: 'Más recientes', value: 'newest' },
  { label: 'Más antiguos', value: 'oldest' },
  { label: 'Mejor valorados', value: 'rating' },
  { label: 'Más replicados', value: 'replications' },
];

const MAX_TIME = 240;

function formatTimeLabel(minutes: number): string {
  if (minutes === 0) return 'Cualquier';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function FilterPanel({
  visible,
  onClose,
  onApply,
  onClear,
  currentFilters,
  popularTags,
}: FilterPanelProps) {
  const [difficulty, setDifficulty] = useState<('easy' | 'medium' | 'hard')[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [ingredient, setIngredient] = useState('');
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SearchFilters['sortBy']>('newest');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    if (visible) {
      setDifficulty(currentFilters.difficulty);
      setTags(currentFilters.tags);
      setIngredient(currentFilters.ingredient);
      setMaxTime(currentFilters.maxTime);
      setSortBy(currentFilters.sortBy);
      setOnlyFavorites(currentFilters.onlyFavorites);
      setOnlyMine(currentFilters.onlyMine);
    }
  }, [visible, currentFilters]);

  const toggleDifficulty = (value: 'easy' | 'medium' | 'hard') => {
    setDifficulty(prev =>
      prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
    );
  };

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleApply = () => {
    onApply({
      difficulty,
      tags,
      ingredient,
      maxTime,
      sortBy,
      onlyFavorites,
      onlyMine,
    });
    onClose();
  };

  const handleClear = () => {
    setDifficulty([]);
    setTags([]);
    setIngredient('');
    setMaxTime(null);
    setSortBy('newest');
    setOnlyFavorites(false);
    setOnlyMine(false);
    onClear();
    onClose();
  };

  const timeValue = maxTime ?? 0;
  const fraction = Math.min(timeValue / MAX_TIME, 1);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={Colors.brownDark} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Ordenar por</Text>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map(opt => {
                const selected = sortBy === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.sortChip, selected && styles.sortChipSelected]}
                    onPress={() => setSortBy(opt.value)}
                  >
                    <Text style={[styles.sortChipText, selected && styles.sortChipTextSelected]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Dificultad</Text>
            <View style={styles.difficultyRow}>
              {DIFFICULTIES.map(d => {
                const selected = difficulty.includes(d.value);
                return (
                  <Pressable
                    key={d.value}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleDifficulty(d.value)}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && (
                        <MaterialIcons name="check" size={14} color={Colors.white} />
                      )}
                    </View>
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {popularTags.slice(0, 8).map(tag => {
                const selected = tags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    style={[styles.tagChip, selected && styles.tagChipSelected]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
              {popularTags.length === 0 && (
                <Text style={styles.emptyTags}>No hay tags populares</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Ingrediente</Text>
            <View style={styles.ingredientWrapper}>
              <MaterialIcons name="kitchen" size={16} color={Colors.brownLight} />
              <TextInput
                style={styles.ingredientInput}
                placeholder="Nombre del ingrediente"
                placeholderTextColor={Colors.brownLight}
                value={ingredient}
                onChangeText={setIngredient}
              />
              {ingredient ? (
                <Pressable onPress={() => setIngredient('')} hitSlop={8}>
                  <MaterialIcons name="close" size={16} color={Colors.brownLight} />
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>
              Tiempo máximo: {formatTimeLabel(timeValue)}
            </Text>
            <View
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={e => {
                const x = e.nativeEvent.locationX;
                const fraction = Math.max(0, Math.min(1, x / 280));
                const minutes = Math.round(fraction * MAX_TIME);
                setMaxTime(minutes === 0 ? null : minutes);
              }}
              onResponderMove={e => {
                const x = e.nativeEvent.locationX;
                const fraction = Math.max(0, Math.min(1, x / 280));
                const minutes = Math.round(fraction * MAX_TIME);
                setMaxTime(minutes === 0 ? null : minutes);
              }}
              style={styles.sliderTrack}
            >
              <View style={[styles.sliderFill, { width: `${fraction * 100}%` as DimensionValue }]} />
              <View
                style={[
                  styles.sliderThumb,
                  { left: `${fraction * 100}%` as DimensionValue, marginLeft: -12 },
                ]}
              >
                <View style={styles.sliderThumbInner} />
              </View>
            </View>
            <Text style={styles.sliderRange}>0 — 4h</Text>

            <View style={styles.toggles}>
              <Pressable
                style={[styles.toggleRow, onlyFavorites && styles.toggleActive]}
                onPress={() => setOnlyFavorites(v => !v)}
              >
                <MaterialIcons
                  name={onlyFavorites ? 'favorite' : 'favorite-outline'}
                  size={20}
                  color={onlyFavorites ? Colors.greenAccent : Colors.brownMedium}
                />
                <Text style={[styles.toggleText, onlyFavorites && styles.toggleTextActive]}>
                  Solo favoritos
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleRow, onlyMine && styles.toggleActive]}
                onPress={() => setOnlyMine(v => !v)}
              >
                <MaterialIcons
                  name={onlyMine ? 'person' : 'person-outline'}
                  size={20}
                  color={onlyMine ? Colors.greenAccent : Colors.brownMedium}
                />
                <Text style={[styles.toggleText, onlyMine && styles.toggleTextActive]}>
                  Solo mis recetas
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Limpiar filtros</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  body: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownMedium,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.tag,
    backgroundColor: Colors.bone,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipSelected: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.greenAccent,
  },
  sortChipText: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  sortChipTextSelected: {
    color: Colors.greenAccent,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.bone,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.greenAccent,
  },
  chipText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  chipTextSelected: {
    color: Colors.greenAccent,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.greenAccent,
    borderColor: Colors.greenAccent,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.tag,
    backgroundColor: Colors.bone,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipSelected: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.greenAccent,
  },
  tagChipText: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  tagChipTextSelected: {
    color: Colors.greenAccent,
  },
  emptyTags: {
    fontSize: FontSize.caption,
    color: Colors.brownLight,
    fontStyle: 'italic',
  },
  ingredientWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
    height: 44,
  },
  ingredientInput: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.brownDark,
    padding: 0,
    height: 44,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 8,
    marginTop: Spacing.sm,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 6,
    backgroundColor: Colors.greenAccent,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.greenAccent,
    justifyContent: 'center',
    alignItems: 'center',
    top: -9,
  },
  sliderThumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.greenAccent,
  },
  sliderRange: {
    fontSize: 10,
    color: Colors.brownLight,
    textAlign: 'center',
    paddingTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  toggles: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.bone,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleActive: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.greenAccent,
  },
  toggleText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  toggleTextActive: {
    color: Colors.greenAccent,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.bone,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownMedium,
  },
  applyButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.greenAccent,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.white,
  },
});
