import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Replication, ReplicationInput } from '@/lib/types';

const PAGE_SIZE = 10;

interface UseReplicationsReturn {
  replications: Replication[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReplications(recipeId: string | undefined): UseReplicationsReturn {
  const [replications, setReplications] = useState<Replication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchReplications = useCallback(async (offset: number = 0) => {
    if (!recipeId) return [];

    const { data, error } = await supabase
      .from('recipe_replications')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching replications:', error);
      return [];
    }

    return data as Replication[];
  }, [recipeId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const newItems = await fetchReplications(replications.length);
    if (newItems.length < PAGE_SIZE) setHasMore(false);
    setReplications(prev => [...prev, ...newItems]);
    setLoadingMore(false);
  }, [fetchReplications, loadingMore, hasMore, replications.length]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setHasMore(true);
    const data = await fetchReplications(0);
    setReplications(data);
    if (data.length < PAGE_SIZE) setHasMore(false);
    setLoading(false);
  }, [fetchReplications]);

  return { replications, loading, loadingMore, hasMore, loadMore, refresh };
}

export async function createReplication(
  recipeId: string,
  data: ReplicationInput
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('recipe_replications')
      .insert({
        recipe_id: recipeId,
        image_url: data.image_url || null,
        comment: data.comment || null,
        rating: data.rating || null,
      });

    if (error) return { error: error.message };
    return {};
  } catch {
    return { error: 'Error inesperado al crear la creación' };
  }
}
