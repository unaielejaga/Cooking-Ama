import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Collection } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

export interface CreateCollectionInput {
  name: string;
  description?: string;
}

interface UseCollectionsReturn {
  collections: Collection[];
  loading: boolean;
  createCollection: (data: CreateCollectionInput) => Promise<{ id?: string; error?: string }>;
  deleteCollection: (id: string) => Promise<{ error?: string }>;
  addToCollection: (collectionId: string, recipeId: string) => Promise<{ error?: string }>;
  removeFromCollection: (collectionId: string, recipeId: string) => Promise<{ error?: string }>;
  getCollectionsForRecipe: (recipeId: string) => Collection[];
  refresh: () => Promise<void>;
}

export function useCollections(): UseCollectionsReturn {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionRecipeMap, setCollectionRecipeMap] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    if (!user) {
      setCollections([]);
      setCollectionRecipeMap({});
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*, recipe_count:collection_recipes(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const collectionsData = (data || []).map(c => ({
        ...c,
        recipe_count: (c as any).recipe_count?.[0]?.count ?? 0,
      })) as Collection[];

      setCollections(collectionsData);

      const ids = collectionsData.map(c => c.id);
      if (ids.length === 0) {
        setCollectionRecipeMap({});
        return;
      }

      const { data: crData } = await supabase
        .from('collection_recipes')
        .select('collection_id, recipe_id')
        .in('collection_id', ids);

      const map: Record<string, Set<string>> = {};
      for (const row of (crData || []) as { collection_id: string; recipe_id: string }[]) {
        if (!map[row.recipe_id]) map[row.recipe_id] = new Set();
        map[row.recipe_id].add(row.collection_id);
      }
      setCollectionRecipeMap(map);
    } catch {
      setCollections([]);
      setCollectionRecipeMap({});
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = useCallback(async (data: CreateCollectionInput): Promise<{ id?: string; error?: string }> => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { data: collection, error } = await supabase
        .from('collections')
        .insert({ user_id: user.id, name: data.name, description: data.description || null })
        .select()
        .single();

      if (error) return { error: error.message };
      if (!collection) return { error: 'Error al crear la colección' };

      await fetchCollections();
      return { id: collection.id };
    } catch {
      return { error: 'Error inesperado al crear la colección' };
    }
  }, [user, fetchCollections]);

  const deleteCollection = useCallback(async (id: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) return { error: error.message };
      await fetchCollections();
      return {};
    } catch {
      return { error: 'Error inesperado al eliminar la colección' };
    }
  }, [user, fetchCollections]);

  const addToCollection = useCallback(async (collectionId: string, recipeId: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { error } = await supabase
        .from('collection_recipes')
        .insert({ collection_id: collectionId, recipe_id: recipeId });

      if (error) return { error: error.message };

      setCollectionRecipeMap(prev => {
        const ids = prev[recipeId] ? new Set(prev[recipeId]) : new Set<string>();
        ids.add(collectionId);
        return { ...prev, [recipeId]: ids };
      });
      setCollections(prev => prev.map(c =>
        c.id === collectionId ? { ...c, recipe_count: (c.recipe_count || 0) + 1 } : c
      ));

      return {};
    } catch {
      return { error: 'Error inesperado al agregar la receta' };
    }
  }, [user]);

  const removeFromCollection = useCallback(async (collectionId: string, recipeId: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { error } = await supabase
        .from('collection_recipes')
        .delete()
        .eq('collection_id', collectionId)
        .eq('recipe_id', recipeId);

      if (error) return { error: error.message };

      setCollectionRecipeMap(prev => {
        const ids = prev[recipeId];
        if (!ids) return prev;
        const next = new Set(ids);
        next.delete(collectionId);
        return { ...prev, [recipeId]: next };
      });
      setCollections(prev => prev.map(c =>
        c.id === collectionId ? { ...c, recipe_count: Math.max(0, (c.recipe_count || 0) - 1) } : c
      ));

      return {};
    } catch {
      return { error: 'Error inesperado al eliminar la receta' };
    }
  }, [user]);

  const getCollectionsForRecipe = useCallback((recipeId: string): Collection[] => {
    const ids = collectionRecipeMap[recipeId];
    if (!ids || ids.size === 0) return [];
    return collections.filter(c => ids.has(c.id));
  }, [collectionRecipeMap, collections]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    loading,
    createCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    getCollectionsForRecipe,
    refresh,
  };
}
