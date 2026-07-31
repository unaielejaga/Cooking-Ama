import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  DimensionValue,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { useFavorites } from '@/hooks/useFavorites';
import { RecipeCard } from '@/components/RecipeCard';
import { Colors, FontSize, FontWeight, Spacing } from '@/lib/theme';
import { Recipe } from '@/lib/types';

export default function FavoritesScreen() {
  const router = useRouter();
  const { getResponsiveValue, width: screenWidth } = useResponsive();
  const { favorites, loading, toggleFavorite, isFavorited, refresh } = useFavorites();

  const contentMaxWidth: DimensionValue = getResponsiveValue({
    mobile: '100%' as DimensionValue,
    tablet: 600,
    desktop: 800,
  });

  const numColumns = screenWidth >= 900 ? 4 : screenWidth >= 600 ? 3 : 2;
  const GAP = Spacing.md;

  const columnWrapperStyle = useMemo(() => ({
    gap: GAP,
    marginBottom: GAP,
  }), []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleRecipePress = useCallback((recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}` as any);
  }, [router]);

  const handleToggleFavorite = useCallback((recipeId: string) => {
    toggleFavorite(recipeId);
  }, [toggleFavorite]);

  function renderItem({ item }: { item: Recipe }) {
    return (
      <RecipeCard
        recipe={item}
        onPress={handleRecipePress}
        variant="grid"
        isFavorited={isFavorited(item.id)}
        onToggleFavorite={handleToggleFavorite}
      />
    );
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <MaterialIcons name="favorite-border" size={64} color={Colors.brownLight} />
        <Text style={styles.emptyTitle}>No tienes favoritos</Text>
        <Text style={styles.emptySubtitle}>
          Marca el corazón de una receta para guardarla aquí
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.brownDark} />
            </Pressable>
            <Text style={styles.title}>Favoritos</Text>
          </View>
        </View>

        <FlatList
          key={numColumns}
          data={favorites}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          columnWrapperStyle={columnWrapperStyle}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmpty}
          onRefresh={refresh}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.brownDark,
  },
  list: {
    padding: Spacing.md,
    flexGrow: 1,
    paddingBottom: Spacing['2xl'],
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
    paddingHorizontal: Spacing.xl,
  },
});
