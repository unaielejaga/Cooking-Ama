import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe, Replication, ReplicationInput } from '@/lib/types';

export interface UseRecipeDetailReturn {
  recipe: Recipe | null;
  replications: Replication[];
  loading: boolean;
  replicationsLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refreshReplications: () => Promise<void>;
}

export function useRecipeDetail(id: string | undefined): UseRecipeDetailReturn {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [replications, setReplications] = useState<Replication[]>([]);
  const [loading, setLoading] = useState(true);
  const [replicationsLoading, setReplicationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipe = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('recipes')
        .select(`
          *,
          author:profiles!author_id(*)
        `)
        .eq('id', id)
        .single();

      if (queryError) throw queryError;

      const recipe = data as Recipe;

      const { data: avgData } = await supabase
        .from('recipe_replications')
        .select('rating')
        .eq('recipe_id', id)
        .not('rating', 'is', null);

      if (avgData && avgData.length > 0) {
        const ratings = avgData.map(r => r.rating).filter(Boolean) as number[];
        recipe.avg_rating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      }

      setRecipe(recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la receta');
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReplications = useCallback(async () => {
    if (!id) return;

    setReplicationsLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from('recipe_replications')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('recipe_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (queryError) throw queryError;
      setReplications((data || []) as Replication[]);
    } catch {
      setReplications([]);
    } finally {
      setReplicationsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  useEffect(() => {
    fetchReplications();
  }, [fetchReplications]);

  return {
    recipe,
    replications,
    loading,
    replicationsLoading,
    error,
    refetch: fetchRecipe,
    refreshReplications: fetchReplications,
  };
}
