import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/lib/types';

const PAGE_SIZE = 10;

function uniqById(recipes: Recipe[]): Recipe[] {
  const map = new Map<string, Recipe>();
  for (const r of recipes) map.set(r.id, r);
  return [...map.values()];
}

export interface UseRecipesReturn {
  recipes: Recipe[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export interface RecipeFilters {
  searchText?: string;
  difficulty?: string | null;
  ingredient?: string;
  maxTime?: number | null;
}

export function useRecipes(filters?: RecipeFilters): UseRecipesReturn {
  const searchText = filters?.searchText;
  const difficulty = filters?.difficulty;
  const ingredient = filters?.ingredient;
  const maxTime = filters?.maxTime;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchRecipes = useCallback(async (cursor?: string | null) => {
    let ids: string[] | undefined;
    if (ingredient) {
      const { data, error } = await supabase
        .rpc('search_recipe_ids_by_ingredient', { search_name: ingredient });
      if (error) return [];
      const result = (data ?? []).map((r: { recipe_id: string }) => r.recipe_id);
      if (result.length === 0) return [];
      ids = result;
    }

    let query = supabase
      .from('recipes')
      .select('*, author:profiles!author_id(*)')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (searchText) {
      query = query.ilike('title', `%${searchText}%`);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (ids) {
      query = query.in('id', ids);
    }

    if (maxTime) {
      query = query.or(`prep_time_minutes.lte.${maxTime},prep_time_minutes.is.null`).or(`cook_time_minutes.lte.${maxTime},cook_time_minutes.is.null`);
    }

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Recipe[];
  }, [searchText, difficulty, ingredient, maxTime]);

  const refresh = useCallback(async () => {
    setLoading(true);
    hasMoreRef.current = true;
    setHasMore(true);
    cursorRef.current = null;

    try {
      const data = await fetchRecipes(null);
      setRecipes(uniqById(data));
      if (data.length < PAGE_SIZE) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
      if (data.length > 0) {
        cursorRef.current = data[data.length - 1].created_at;
      }
    } finally {
      setLoading(false);
    }
  }, [fetchRecipes]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const data = await fetchRecipes(cursorRef.current);
      if (data.length === 0) {
        hasMoreRef.current = false;
        setHasMore(false);
      } else {
        setRecipes(prev => uniqById([...prev, ...data]));
        if (data.length < PAGE_SIZE) {
          hasMoreRef.current = false;
          setHasMore(false);
        }
        cursorRef.current = data[data.length - 1].created_at;
      }
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchRecipes]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    recipes,
    loading,
    loadingMore,
    hasMore,
    refresh,
    loadMore,
  };
}
