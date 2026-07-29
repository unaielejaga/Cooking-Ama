import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/lib/types';

const PAGE_SIZE = 10;

export interface SearchFilters {
  query: string;
  tags: string[];
  ingredient: string[];
  difficulty: ('easy' | 'medium' | 'hard')[];
  maxTime: number | null;
  onlyFavorites: boolean;
  onlyMine: boolean;
  sortBy: 'newest' | 'oldest' | 'rating' | 'replications';
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  tags: [],
  ingredient: [],
  difficulty: [],
  maxTime: null,
  onlyFavorites: false,
  onlyMine: false,
  sortBy: 'newest',
};

function uniqById(recipes: Recipe[]): Recipe[] {
  const map = new Map<string, Recipe>();
  for (const r of recipes) map.set(r.id, r);
  return [...map.values()];
}

export interface UseSearchReturn {
  results: Recipe[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  popularTags: string[];
}

export function useSearch(): UseSearchReturn {
  const [filters, setFiltersState] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const initialLoadRef = useRef(true);

  const hasActiveFilters =
    filters.query !== '' ||
    filters.tags.length > 0 ||
    filters.ingredient.length > 0 ||
    filters.difficulty.length > 0 ||
    filters.maxTime !== null ||
    filters.onlyFavorites ||
    filters.onlyMine;

  const setFilters = useCallback((partial: Partial<SearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
    pageRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    pageRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    setResults([]);
  }, []);

  const addRecentSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== q.trim());
      return [q.trim(), ...filtered].slice(0, 10);
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  useEffect(() => {
    supabase
      .from('recipes')
      .select('tags')
      .limit(1000)
      .then(({ data }) => {
        const tagCount = new Map<string, number>();
        for (const row of data || []) {
          for (const tag of (row as any).tags || []) {
            tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
          }
        }
        const sorted = [...tagCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag]) => tag);
        setPopularTags(sorted);
      });
  }, []);

  const fetchRecipes = useCallback(async (pageNum: number): Promise<Recipe[]> => {
    const { query, tags, ingredient, difficulty, maxTime, onlyFavorites, onlyMine, sortBy } = filters;

    let ids: string[] | undefined;

    if (ingredient.length > 0) {
      const allResults = await Promise.all(
        ingredient.map(ing =>
          supabase
            .rpc('search_recipe_ids_by_ingredient', { search_name: ing })
            .then(({ data, error }) => {
              if (error) return [] as string[];
              return (data ?? []).map((r: { recipe_id: string }) => r.recipe_id);
            })
        )
      );
      for (const resultIds of allResults) {
        if (resultIds.length === 0) return [];
      }
      ids = allResults.reduce<string[] | null>((acc, resultIds) =>
        acc === null ? resultIds : acc.filter(id => resultIds.includes(id))
      , null) ?? undefined;
      if (!ids || ids.length === 0) return [];
    }

    if (onlyFavorites) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return [];
      const { data: favData } = await supabase
        .from('favorites')
        .select('recipe_id')
        .eq('user_id', userData.user.id);
      if (!favData || favData.length === 0) return [];
      const favIds = favData.map(f => f.recipe_id);
      if (ids) {
        ids = ids.filter(id => favIds.includes(id));
        if (ids.length === 0) return [];
      } else {
        ids = favIds;
      }
    }

    let q = supabase
      .from('recipes')
      .select('*, author:profiles!author_id(*)')
      .limit(PAGE_SIZE)
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (query) {
      q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (tags.length > 0) {
      q = q.overlaps('tags', tags);
    }

    if (difficulty.length > 0) {
      q = q.in('difficulty', difficulty);
    }

    if (maxTime !== null) {
      q = q
        .or(`prep_time_minutes.lte.${maxTime},prep_time_minutes.is.null`)
        .or(`cook_time_minutes.lte.${maxTime},cook_time_minutes.is.null`);
    }

    if (onlyMine) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        q = q.eq('author_id', userData.user.id);
      }
    }

    if (ids) {
      q = q.in('id', ids);
    }

    if (sortBy === 'newest') {
      q = q.order('created_at', { ascending: false });
    } else if (sortBy === 'oldest') {
      q = q.order('created_at', { ascending: true });
    } else {
      q = q.order('created_at', { ascending: false });
    }

    const { data, error } = await q;
    if (error) throw error;

    const recipes = data as Recipe[];

    if (recipes.length > 0) {
      const recipeIds = recipes.map(r => r.id);

      const [ratingsResult, replResult] = await Promise.all([
        supabase
          .from('recipe_replications')
          .select('recipe_id, rating')
          .in('recipe_id', recipeIds)
          .not('rating', 'is', null),
        supabase
          .from('recipe_replications')
          .select('recipe_id')
          .in('recipe_id', recipeIds),
      ]);

      const ratingMap = new Map<string, { sum: number; count: number }>();
      const replCountMap = new Map<string, number>();

      if (ratingsResult.data) {
        for (const r of ratingsResult.data) {
          const entry = ratingMap.get(r.recipe_id) || { sum: 0, count: 0 };
          entry.sum += r.rating || 0;
          entry.count += 1;
          ratingMap.set(r.recipe_id, entry);
        }
      }

      if (replResult.data) {
        for (const r of replResult.data) {
          replCountMap.set(r.recipe_id, (replCountMap.get(r.recipe_id) || 0) + 1);
        }
      }

      for (const recipe of recipes) {
        const ratingEntry = ratingMap.get(recipe.id);
        if (ratingEntry && ratingEntry.count > 0) {
          recipe.avg_rating = ratingEntry.sum / ratingEntry.count;
        }
        recipe.replication_count = replCountMap.get(recipe.id) || 0;
      }
    }

    if (sortBy === 'rating') {
      recipes.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    } else if (sortBy === 'replications') {
      recipes.sort((a, b) => (b.replication_count || 0) - (a.replication_count || 0));
    }

    return recipes;
  }, [filters]);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    pageRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);

    try {
      const data = await fetchRecipes(0);
      setResults(uniqById(data));
      if (data.length < PAGE_SIZE) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchRecipes]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const data = await fetchRecipes(nextPage);
      setResults(prev => uniqById([...prev, ...data]));
      pageRef.current = nextPage;
      if (data.length < PAGE_SIZE) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [fetchRecipes]);

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      refresh();
    }, 100);
    return () => clearTimeout(timer);
  }, [refresh]);

  return {
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
    clearRecentSearches,
    popularTags,
  };
}
