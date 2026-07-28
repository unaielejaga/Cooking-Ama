import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/lib/types';

export interface UseRecipeDetailReturn {
  recipe: Recipe | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecipeDetail(id: string | undefined): UseRecipeDetailReturn {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
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
      setRecipe(data as Recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la receta');
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  return { recipe, loading, error, refetch: fetchRecipe };
}
