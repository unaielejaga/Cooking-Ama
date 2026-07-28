import { useCallback, useState, useMemo } from 'react';
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
import { FilterChips } from '@/components/FilterChips';
import { SearchSuggestions } from '@/components/SearchSuggestions';
import { RecipeCard } from '@/components/RecipeCard';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/lib/theme';
import { Recipe } from '@/lib/types';

const SORT_LABELS: Record<SearchFilters['sortBy'], string> = {
  newest: 'Más recientes',
  oldest: 'Más antiguos',
  rating: 'Mejor valorados',
  replications: 'Más replicados',
};

export default function SearchScreen() {
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
      } else if (key === 'tags' && value) {
        setFilters({
          tags: filters.tags.filter(t => t !== value),
        });
      } else if (key === 'ingredient') {
        setFilters({ ingredient: '' });
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

  const handleRecipePress = useCallback(
    (recipe: Recipe) => {
      router.push(`/recipe/${recipe.id}` as any);
    },
    [router]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      setFilters({ query: suggestion });
      addRecentSearch(suggestion);
      setShowSuggestions(false);
    },
    [setFilters, addRecentSearch]
  );

  const showEmptyPrompt = !hasActiveFilters && !loading && results.length === 0;

  const columnWrapperStyle = useMemo(
    () => ({
      gap: GAP,
      marginBottom: GAP,
    }),
    []
  );

  function renderItem({ item }: { item: Recipe }) {
    return (
      <RecipeCard
        recipe={item}
        onPress={handleRecipePress}
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
    if (showEmptyPrompt) {
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

          <View style={styles.sortRow}>
            <Text style={styles.sortLabel}>
              {hasActiveFilters
                ? `Orden: ${SORT_LABELS[filters.sortBy]}`
                : ''}
            </Text>
          </View>
        </View>

        <FilterChips filters={filters} onRemove={handleFilterRemove} />

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
          popularTags={popularTags}
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
  sortRow: {
    paddingVertical: Spacing.sm,
  },
  sortLabel: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
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
