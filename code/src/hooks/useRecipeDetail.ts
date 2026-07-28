import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe, Replication, ReplicationInput } from '@/lib/types';

export interface UseRecipeDetailReturn {
  recipe: Recipe | null;
  replications: Replication[];
  loading: boolean;
  replicationsLoading: boolean;
  error: string | null;
  sharedGroupNames: string[];
  refetch: () => Promise<void>;
  refreshReplications: () => Promise<void>;
}

export function useRecipeDetail(id: string | undefined): UseRecipeDetailReturn {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [replications, setReplications] = useState<Replication[]>([]);
  const [loading, setLoading] = useState(true);
  const [replicationsLoading, setReplicationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedGroupNames, setSharedGroupNames] = useState<string[]>([]);

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

  const fetchSharedGroups = useCallback(async () => {
    if (!id) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return;

    const { data: membership } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userData.user.id);

    if (!membership || membership.length === 0) {
      setSharedGroupNames([]);
      return;
    }

    const myGroupIds = membership.map(m => m.group_id);

    const { data: shares } = await supabase
      .from('recipe_shares')
      .select('group:groups(name)')
      .eq('recipe_id', id)
      .in('group_id', myGroupIds);

    const names = (shares || [])
      .map(s => (s as any).group?.name)
      .filter(Boolean) as string[];

    setSharedGroupNames(names);
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  useEffect(() => {
    fetchReplications();
  }, [fetchReplications]);

  useEffect(() => {
    fetchSharedGroups();
  }, [fetchSharedGroups]);

  return {
    recipe,
    replications,
    loading,
    replicationsLoading,
    error,
    sharedGroupNames,
    refetch: fetchRecipe,
    refreshReplications: fetchReplications,
  };
}
