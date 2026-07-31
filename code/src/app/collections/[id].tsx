import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  DimensionValue,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { useCollections } from '@/hooks/useCollections';
import { useFavorites } from '@/hooks/useFavorites';
import { RecipeCard } from '@/components/RecipeCard';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { supabase } from '@/lib/supabase';
import { hydrateRecipeStats } from '@/lib/recipeStats';
import { Colors, FontSize, FontWeight, Spacing } from '@/lib/theme';
import { Recipe } from '@/lib/types';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getResponsiveValue } = useResponsive();
  const { collections, loading, removeFromCollection, deleteCollection, refresh } = useCollections();
  const { isFavorited, toggleFavorite } = useFavorites();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingRecipe, setRemovingRecipe] = useState<Recipe | null>(null);
  const [deletingCollection, setDeletingCollection] = useState(false);

  const collection = collections.find(c => c.id === id);

  const contentMaxWidth: DimensionValue = getResponsiveValue({
    mobile: '100%' as DimensionValue,
    tablet: 600,
    desktop: 800,
  });

  const fetchRecipes = useCallback(async () => {
    if (!id) return;

    setRecipesLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from('collection_recipes')
        .select('recipe:recipes(*, author:profiles!author_id(*))')
        .eq('collection_id', id)
        .order('added_at', { ascending: false });

      if (queryError) throw queryError;

      const rows = (data || []) as unknown as { recipe: Recipe }[];
      const recipesData = await hydrateRecipeStats(rows.map(r => r.recipe).filter(Boolean));
      setRecipes(recipesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la colección');
      setRecipes([]);
    } finally {
      setRecipesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
      refresh();
    }, [fetchRecipes, refresh])
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchRecipes(), refresh()]);
  }, [fetchRecipes, refresh]);

  const handleRemoveConfirm = useCallback(async () => {
    if (!removingRecipe || !id) return;

    const result = await removeFromCollection(id, removingRecipe.id);
    if (!result.error) {
      setRecipes(prev => prev.filter(r => r.id !== removingRecipe.id));
    }
    setRemovingRecipe(null);
  }, [removingRecipe, id, removeFromCollection]);

  const handleDeleteCollection = useCallback(async () => {
    if (!id) return;

    const result = await deleteCollection(id);
    if (!result.error) {
      router.back();
    }
    setDeletingCollection(false);
  }, [id, deleteCollection, router]);

  const handleRecipePress = useCallback((recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}` as any);
  }, [router]);

  const handleToggleFavorite = useCallback((recipeId: string) => {
    toggleFavorite(recipeId);
  }, [toggleFavorite]);

  if (loading && !collection) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.greenAccent} />
      </View>
    );
  }

  if (!collection) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Colección no encontrada</Text>
        <Button title="Volver" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  function renderItem({ item }: { item: Recipe }) {
    return (
      <View style={styles.itemRow}>
        <View style={styles.itemCard}>
          <RecipeCard
            recipe={item}
            onPress={handleRecipePress}
            variant="list"
            isFavorited={isFavorited(item.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        </View>
        <Pressable
          style={styles.removeButton}
          onPress={() => setRemovingRecipe(item)}
          hitSlop={8}
          accessibilityLabel={`Eliminar ${item.title} de la colección`}
        >
          <MaterialIcons name="close" size={20} color={Colors.error} />
        </Pressable>
      </View>
    );
  }

  function renderEmpty() {
    if (recipesLoading) return null;
    return (
      <View style={styles.empty}>
        <MaterialIcons name="bookmark-outline" size={64} color={Colors.brownLight} />
        <Text style={styles.emptyTitle}>Colección vacía</Text>
        <Text style={styles.emptySubtitle}>
          Agrega recetas desde la pantalla de cada receta
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
            <Text style={styles.title} numberOfLines={1}>
              {collection.name}
            </Text>
          </View>
          <Pressable
            style={styles.deleteButton}
            onPress={() => setDeletingCollection(true)}
            accessibilityLabel="Eliminar colección"
          >
            <MaterialIcons name="delete-outline" size={22} color={Colors.error} />
          </Pressable>
        </View>

        <View style={styles.subHeader}>
          {collection.description ? (
            <Text style={styles.description}>{collection.description}</Text>
          ) : null}
          <Text style={styles.count}>
            {collection.recipe_count || 0} {collection.recipe_count === 1 ? 'receta' : 'recetas'}
          </Text>
        </View>

        {error && (
          <Text style={styles.inlineError}>{error}</Text>
        )}

        <FlatList
          data={recipes}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={renderEmpty}
          onRefresh={handleRefresh}
          refreshing={recipesLoading}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <ConfirmDialog
        visible={removingRecipe !== null}
        title="Eliminar receta"
        message={`¿Quieres quitar "${removingRecipe?.title}" de esta colección?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemovingRecipe(null)}
      />

      <ConfirmDialog
        visible={deletingCollection}
        title="Eliminar colección"
        message={`¿Estás seguro de que quieres eliminar "${collection.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDeleteCollection}
        onCancel={() => setDeletingCollection(false)}
      />
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
    gap: Spacing.md,
    padding: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
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
    flex: 1,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDECEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subHeader: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 2,
  },
  description: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
  },
  count: {
    fontSize: FontSize.caption,
    color: Colors.brownLight,
    fontWeight: FontWeight.medium,
  },
  inlineError: {
    fontSize: FontSize.caption,
    color: Colors.error,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  list: {
    padding: Spacing.md,
    flexGrow: 1,
    paddingBottom: Spacing['2xl'],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemCard: {
    flex: 1,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDECEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: Spacing.sm,
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
