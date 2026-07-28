import { useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, DimensionValue, TextInput, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { useRecipes } from '@/hooks/useRecipes';
import { RecipeCard } from '@/components/RecipeCard';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/lib/theme';
import { Recipe, Difficulty } from '@/lib/types';
import { supabase } from '@/lib/supabase';

const DIFFICULTIES: { label: string; value: Difficulty | '' }[] = [
  { label: 'Todas', value: '' },
  { label: 'Fácil', value: 'easy' },
  { label: 'Media', value: 'medium' },
  { label: 'Difícil', value: 'hard' },
];

const MAX_TIME = 240;

function formatTimeLabel(minutes: number): string {
  if (minutes === 0) return 'Cualquier';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function TimeSlider({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const trackRef = useRef<View>(null);
  const trackLayout = useRef({ x: 0, width: 0 });
  const internalValue = value ?? 0;
  const fraction = internalValue / MAX_TIME;

  const updateValue = useCallback((pageX: number) => {
    const { x, width } = trackLayout.current;
    if (width <= 0) return;
    const clamped = Math.max(0, Math.min(1, (pageX - x) / width));
    const minutes = Math.round(clamped * MAX_TIME);
    onChange(minutes === 0 ? null : minutes);
  }, [onChange]);

  const handleLayout = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackLayout.current = { x, width };
    });
  }, []);

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.header}>
        <MaterialIcons name="timer" size={16} color={Colors.brownMedium} />
        <Text style={sliderStyles.label}>
          Tiempo máximo: {formatTimeLabel(internalValue)}
        </Text>
        {value !== null && (
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <MaterialIcons name="close" size={16} color={Colors.brownLight} />
          </Pressable>
        )}
      </View>
      <View
        ref={trackRef}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={e => updateValue(e.nativeEvent.pageX)}
        onResponderMove={e => updateValue(e.nativeEvent.pageX)}
        style={sliderStyles.track}
      >
        <View style={[sliderStyles.fill, { width: `${fraction * 100}%` as DimensionValue }]} />
        <View
          style={[
            sliderStyles.thumb,
            { left: `${fraction * 100}%` as DimensionValue, marginLeft: -12 },
          ]}
        >
          <View style={sliderStyles.thumbInner} />
        </View>
      </View>
      <Text style={sliderStyles.rangeLabel}>0 — 4h</Text>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    paddingTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  label: {
    flex: 1,
    fontSize: FontSize.caption,
    color: Colors.brownMedium,
  },
  track: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
    marginHorizontal: 8,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 6,
    backgroundColor: Colors.greenAccent,
    borderRadius: 3,
  },
  thumb: {
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
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
  },
  thumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.greenAccent,
  },
  rangeLabel: {
    fontSize: 10,
    color: Colors.brownLight,
    textAlign: 'center',
    paddingTop: Spacing.xs,
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const { getResponsiveValue } = useResponsive();
  const [searchText, setSearchText] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [ingredient, setIngredient] = useState('');
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sharedGroupMap, setSharedGroupMap] = useState<Record<string, string[]>>({});

  const { recipes, loading, loadingMore, hasMore, refresh, loadMore } = useRecipes({
    searchText,
    difficulty: difficulty || null,
    ingredient: ingredient || undefined,
    maxTime,
  });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );
  const contentMaxWidth: DimensionValue = getResponsiveValue({ mobile: '100%' as DimensionValue, tablet: 600, desktop: 800 });

  useEffect(() => {
    if (recipes.length === 0) {
      setSharedGroupMap({});
      return;
    }

    const allIds = recipes.map(r => r.id);

    supabase
      .from('recipe_shares')
      .select('recipe_id, group:groups(name)')
      .in('recipe_id', allIds)
      .then(({ data }) => {
        const map: Record<string, string[]> = {};
        for (const row of data || []) {
          const name = (row as any).group?.name;
          if (name) {
            if (!map[row.recipe_id]) map[row.recipe_id] = [];
            map[row.recipe_id].push(name);
          }
        }
        setSharedGroupMap(map);
      });
  }, [recipes]);

  const handleRecipePress = useCallback((recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}` as any);
  }, [router]);

  function renderItem({ item }: { item: Recipe }) {
    return (
      <RecipeCard
        recipe={item}
        onPress={handleRecipePress}
        sharedGroupNames={sharedGroupMap[item.id]}
      />
    );
  }

  function renderFooter() {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.greenAccent} />
      </View>
    );
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <MaterialIcons name="search-off" size={64} color={Colors.brownLight} />
        <Text style={styles.emptyTitle}>
          {searchText || difficulty || ingredient || maxTime !== null ? 'Sin resultados' : 'No hay recetas aún'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchText || difficulty || ingredient || maxTime !== null ? 'Prueba con otros filtros' : 'Crea la primera receta para comenzar'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <MaterialIcons name="search" size={20} color={Colors.brownLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar recetas..."
                placeholderTextColor={Colors.brownLight}
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
              />
              {searchText ? (
                <Pressable onPress={() => setSearchText('')}>
                  <MaterialIcons name="close" size={18} color={Colors.brownLight} />
                </Pressable>
              ) : null}
            </View>
            <Pressable
              style={[styles.filterButton, showFilters && styles.filterButtonActive]}
              onPress={() => setShowFilters(v => !v)}
            >
              <MaterialIcons
                name="tune"
                size={20}
                color={showFilters ? Colors.white : Colors.brownMedium}
              />
            </Pressable>
          </View>

          {showFilters && (
            <View>
              <View style={styles.filterChips}>
                {DIFFICULTIES.map(d => {
                  const selected = difficulty === d.value;
                  return (
                    <Pressable
                      key={d.value}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setDifficulty(d.value as Difficulty | '')}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.filterInputsRow}>
                <View style={styles.filterInputWrapper}>
                  <MaterialIcons name="kitchen" size={16} color={Colors.brownLight} />
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Ingrediente"
                    placeholderTextColor={Colors.brownLight}
                    value={ingredient}
                    onChangeText={setIngredient}
                  />
                  {ingredient ? (
                    <Pressable onPress={() => setIngredient('')}>
                      <MaterialIcons name="close" size={16} color={Colors.brownLight} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
              <TimeSlider value={maxTime} onChange={setMaxTime} />
            </View>
          )}
        </View>

        <FlatList
          data={recipes}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onRefresh={refresh}
          refreshing={loading}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cream,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.cream,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.brownDark,
    padding: 0,
    height: 44,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.greenAccent,
    borderColor: Colors.greenAccent,
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.tag,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.greenAccent,
  },
  chipText: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  chipTextSelected: {
    color: Colors.greenAccent,
  },
  filterInputsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  filterInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
    height: 40,
  },
  filterInput: {
    flex: 1,
    fontSize: FontSize.caption,
    color: Colors.brownDark,
    padding: 0,
    height: 40,
  },

  list: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  separator: {
    height: Spacing.md,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'] * 2,
  },
  emptyTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  emptySubtitle: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
    textAlign: 'center',
  },
});
