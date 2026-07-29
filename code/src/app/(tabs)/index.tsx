import { useCallback, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  DimensionValue,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { useSearch, SearchFilters } from '@/hooks/useSearch';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { SearchSuggestions } from '@/components/SearchSuggestions';
import { RecipeCard } from '@/components/RecipeCard';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/lib/theme';
import { Recipe } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const { getResponsiveValue, width: screenWidth } = useResponsive();
  const {
    results,
    loading,
    loadingMore,
    hasMore,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    refresh,
    loadMore,
    recentSearches,
    addRecentSearch,
    popularTags,
  } = useSearch();

  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sharedGroupMap, setSharedGroupMap] = useState<Record<string, string[]>>({});

  const numColumns = screenWidth >= 900 ? 4 : screenWidth >= 600 ? 3 : 2;
  const GAP = Spacing.md;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const contentMaxWidth: DimensionValue = getResponsiveValue({
    mobile: '100%' as DimensionValue,
    tablet: 600,
    desktop: 800,
  });

  useEffect(() => {
    if (results.length === 0) {
      setSharedGroupMap({});
      return;
    }

    const allIds = results.map(r => r.id);

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
  }, [results]);

  const handleSearch = useCallback((text: string) => {
    setFilters({ query: text });
    if (text.trim()) {
      addRecentSearch(text);
    }
  }, [setFilters, addRecentSearch]);

  const handleClear = useCallback(() => {
    setFilters({ query: '' });
    setShowSuggestions(false);
  }, [setFilters]);

  const handleFilterApply = useCallback((filterChanges: Partial<SearchFilters>) => {
    setFilters(filterChanges);
  }, [setFilters]);

  const handleFilterRemove = useCallback(
    (key: keyof SearchFilters, value?: string) => {
      if (key === 'query') {
        setFilters({ query: '' });
      } else if (key === 'difficulty' && value) {
        setFilters({
          difficulty: filters.difficulty.filter(d => d !== value),
        });
      } else if (key === 'ingredient' && value) {
        setFilters({
          ingredient: filters.ingredient.filter(i => i !== value),
        });
      } else if (key === 'maxTime') {
        setFilters({ maxTime: null });
      } else if (key === 'onlyFavorites') {
        setFilters({ onlyFavorites: false });
      } else if (key === 'onlyMine') {
        setFilters({ onlyMine: false });
      }
    },
    [filters, setFilters]
  );

  const handleRecipePress = useCallback((recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}` as any);
  }, [router]);

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      setFilters({ query: suggestion });
      addRecentSearch(suggestion);
      setShowSuggestions(false);
    },
    [setFilters, addRecentSearch]
  );

  const columnWrapperStyle = useMemo(() => ({
    gap: GAP,
    marginBottom: GAP,
  }), []);

  function renderItem({ item }: { item: Recipe }) {
    return (
      <RecipeCard
        recipe={item}
        onPress={handleRecipePress}
        sharedGroupNames={sharedGroupMap[item.id]}
        variant="grid"
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
    if (!hasActiveFilters && results.length === 0) {
      return (
        <View style={styles.empty}>
          <MaterialIcons name="search" size={64} color={Colors.brownLight} />
          <Text style={styles.emptyTitle}>Busca recetas</Text>
          <Text style={styles.emptySubtitle}>
            Encuentra recetas por título, ingredientes,{'\n'}tags y más
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <MaterialIcons name="search-off" size={64} color={Colors.brownLight} />
        <Text style={styles.emptyTitle}>Sin resultados</Text>
        <Text style={styles.emptySubtitle}>
          Prueba con otros filtros o términos de búsqueda
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <SearchBar
              value={filters.query}
              onChangeText={handleSearch}
              onClear={handleClear}
              onSubmitEditing={() => setShowSuggestions(false)}
            />
            <Pressable
              style={[
                styles.filterButton,
                hasActiveFilters && styles.filterButtonActive,
              ]}
              onPress={() => setShowFilters(true)}
            >
              <MaterialIcons
                name="tune"
                size={20}
                color={hasActiveFilters ? Colors.white : Colors.brownMedium}
              />
            </Pressable>
          </View>

          <SearchSuggestions
            suggestions={recentSearches}
            popularTags={popularTags}
            onSelect={handleSuggestionSelect}
            visible={
              showSuggestions &&
              !filters.query &&
              (recentSearches.length > 0 || popularTags.length > 0)
            }
          />
        </View>

        <FlatList
          key={numColumns}
          data={results}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          columnWrapperStyle={columnWrapperStyle}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onRefresh={refresh}
          refreshing={loading}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setShowSuggestions(false)}
        />

        <FilterPanel
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={handleFilterApply}
          onClear={clearFilters}
          currentFilters={filters}
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: Colors.cream,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  list: {
    padding: Spacing.md,
    flexGrow: 1,
    paddingBottom: Spacing.md,
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
