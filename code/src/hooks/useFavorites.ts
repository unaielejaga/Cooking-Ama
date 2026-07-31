import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { hydrateRecipeStats } from '@/lib/recipeStats';

interface UseFavoritesReturn {
  favorites: Recipe[];
  loading: boolean;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isFavorited: (recipeId: string) => boolean;
  refresh: () => Promise<void>;
}

export function useFavorites(): UseFavoritesReturn {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('recipe_id, recipe:recipes(*, author:profiles!author_id(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []) as unknown as { recipe_id: string; recipe: Recipe }[];
      const recipes = await hydrateRecipeStats(
        rows.map(r => r.recipe).filter(Boolean)
      );

      setFavorites(recipes);
      setFavoriteIds(new Set(rows.map(r => r.recipe_id)));
    } catch {
      setFavorites([]);
      setFavoriteIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (recipeId: string) => {
    if (!user) return;
    const wasFavorited = favoriteIds.has(recipeId);

    if (wasFavorited) {
      setFavoriteIds(prev => {
        const next = new Set(prev);
        next.delete(recipeId);
        return next;
      });
      setFavorites(prev => prev.filter(r => r.id !== recipeId));

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);

      if (error) {
        await fetchFavorites();
      }
    } else {
      setFavoriteIds(prev => new Set(prev).add(recipeId));

      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, recipe_id: recipeId });

      if (error) {
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });
      } else {
        const { data } = await supabase
          .from('recipes')
          .select('*, author:profiles!author_id(*)')
          .eq('id', recipeId)
          .single();

        if (data) {
          setFavorites(prev => [data as Recipe, ...prev]);
        }
      }
    }
  }, [user, favoriteIds, fetchFavorites]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorited: (recipeId: string) => favoriteIds.has(recipeId),
    refresh,
  };
}
