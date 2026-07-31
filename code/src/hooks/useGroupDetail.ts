import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupWithDetails, GroupMember, Recipe } from '@/lib/types';

export interface UseGroupDetailReturn {
  group: GroupWithDetails | null;
  members: GroupMember[];
  recipes: Recipe[];
  loading: boolean;
  inviteUser: (userId: string) => Promise<{ error?: string }>;
  removeMember: (userId: string) => Promise<{ error?: string }>;
  promoteMember: (userId: string) => Promise<{ error?: string }>;
  shareRecipe: (recipeId: string) => Promise<{ error?: string }>;
  unshareRecipe: (recipeId: string) => Promise<{ error?: string }>;
  deleteGroup: () => Promise<{ error?: string }>;
  refresh: () => Promise<void>;
}

export function useGroupDetail(groupId: string | undefined): UseGroupDetailReturn {
  const [group, setGroup] = useState<GroupWithDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const isAdmin = membership?.role === 'admin';

      const { data: groupData } = await supabase
        .from('groups')
        .select('*, member_count:group_members(count), recipe_count:recipe_shares(count)')
        .eq('id', groupId)
        .single();

      if (groupData) {
        setGroup({
          ...groupData,
          is_admin: isAdmin,
          member_count: (groupData as any).member_count?.[0]?.count ?? 0,
          recipe_count: (groupData as any).recipe_count?.[0]?.count ?? 0,
        });
      }

      const { data: membersData } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', groupId);

      setMembers((membersData || []) as GroupMember[]);

      const { data: sharesData } = await supabase
        .from('recipe_shares')
        .select('recipe:recipes(*, author:profiles!author_id(*))')
        .eq('group_id', groupId);

      const fetchedRecipes = (sharesData || [])
        .map((s: any) => s.recipe)
        .filter(Boolean);

      setRecipes(fetchedRecipes as Recipe[]);
    } catch {
      setGroup(null);
      setMembers([]);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const inviteUser = useCallback(async (userId: string): Promise<{ error?: string }> => {
    if (!groupId) return { error: 'Grupo no especificado' };

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: userId, role: 'member' });

      if (error) return { error: error.message };
      await fetchDetail();
      return {};
    } catch {
      return { error: 'Error inesperado al invitar usuario' };
    }
  }, [groupId, fetchDetail]);

  const removeMember = useCallback(async (userId: string): Promise<{ error?: string }> => {
    if (!groupId) return { error: 'Grupo no especificado' };

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) return { error: error.message };
      await fetchDetail();
      return {};
    } catch {
      return { error: 'Error inesperado al expulsar miembro' };
    }
  }, [groupId, fetchDetail]);

  const promoteMember = useCallback(async (userId: string): Promise<{ error?: string }> => {
    if (!groupId) return { error: 'Grupo no especificado' };

    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) return { error: error.message };
      await fetchDetail();
      return {};
    } catch {
      return { error: 'Error inesperado al promover miembro' };
    }
  }, [groupId, fetchDetail]);

  const shareRecipe = useCallback(async (recipeId: string): Promise<{ error?: string }> => {
    if (!groupId) return { error: 'Grupo no especificado' };

    try {
      const { error } = await supabase
        .from('recipe_shares')
        .insert({ recipe_id: recipeId, group_id: groupId });

      if (error) return { error: error.message };
      await fetchDetail();
      return {};
    } catch {
      return { error: 'Error inesperado al compartir receta' };
    }
  }, [groupId, fetchDetail]);

  const unshareRecipe = useCallback(async (recipeId: string): Promise<{ error?: string }> => {
    if (!groupId) return { error: 'Grupo no especificado' };

    try {
      const { error } = await supabase
        .from('recipe_shares')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('group_id', groupId);

      if (error) return { error: error.message };
      await fetchDetail();
      return {};
    } catch {
      return { error: 'Error inesperado al dejar de compartir receta' };
    }
  }, [groupId, fetchDetail]);

  const deleteGroup = useCallback(async (): Promise<{ error?: string }> => {
    if (!groupId) return { error: 'Grupo no especificado' };

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) return { error: error.message };
      return {};
    } catch {
      return { error: 'Error inesperado al eliminar el grupo' };
    }
  }, [groupId]);

  return {
    group,
    members,
    recipes,
    loading,
    inviteUser,
    removeMember,
    promoteMember,
    shareRecipe,
    unshareRecipe,
    deleteGroup,
    refresh: fetchDetail,
  };
}
