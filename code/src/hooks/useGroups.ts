import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupWithDetails } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

export interface CreateGroupInput {
  name: string;
  description?: string;
}

export interface UseGroupsReturn {
  groups: GroupWithDetails[];
  loading: boolean;
  createGroup: (data: CreateGroupInput) => Promise<{ id?: string; error?: string }>;
  joinGroup: (groupId: string) => Promise<{ error?: string }>;
  leaveGroup: (groupId: string) => Promise<{ error?: string }>;
  deleteGroup: (groupId: string) => Promise<{ error?: string }>;
  refresh: () => Promise<void>;
}

export function useGroups(): UseGroupsReturn {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    try {
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      if (!membership || membership.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = membership.map(m => m.group_id);
      const adminIds = new Set(
        membership.filter(m => m.role === 'admin').map(m => m.group_id)
      );

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*, member_count:group_members(count), recipe_count:recipe_shares(count)')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      setGroups(
        (groupsData || []).map(g => ({
          ...g,
          is_admin: adminIds.has(g.id),
          member_count: (g as any).member_count?.[0]?.count ?? 0,
          recipe_count: (g as any).recipe_count?.[0]?.count ?? 0,
        }))
      );
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = useCallback(async (data: CreateGroupInput): Promise<{ id?: string; error?: string }> => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { data: group, error: createError } = await supabase
        .from('groups')
        .insert({ name: data.name, description: data.description || null, created_by: user.id })
        .select()
        .single();

      if (createError) return { error: createError.message };
      if (!group) return { error: 'Error al crear el grupo' };

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'admin' });

      if (memberError) {
        await supabase.from('groups').delete().eq('id', group.id);
        return { error: memberError.message };
      }

      await fetchGroups();
      return { id: group.id };
    } catch {
      return { error: 'Error inesperado al crear el grupo' };
    }
  }, [user, fetchGroups]);

  const joinGroup = useCallback(async (groupId: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id, role: 'member' });

      if (error) return { error: error.message };
      await fetchGroups();
      return {};
    } catch {
      return { error: 'Error inesperado al unirse al grupo' };
    }
  }, [user, fetchGroups]);

  const leaveGroup = useCallback(async (groupId: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (membership?.role === 'admin') {
        const { data: otherMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)
          .neq('user_id', user.id)
          .order('joined_at', { ascending: true })
          .limit(1);

        if (otherMembers && otherMembers.length > 0) {
          const { error: transferError } = await supabase
            .from('group_members')
            .update({ role: 'admin' })
            .eq('group_id', groupId)
            .eq('user_id', otherMembers[0].user_id);

          if (transferError) return { error: transferError.message };
        }
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) return { error: error.message };
      await fetchGroups();
      return {};
    } catch {
      return { error: 'Error inesperado al salir del grupo' };
    }
  }, [user, fetchGroups]);

  const deleteGroup = useCallback(async (groupId: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'No autenticado' };

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) return { error: error.message };
      await fetchGroups();
      return {};
    } catch {
      return { error: 'Error inesperado al eliminar el grupo' };
    }
  }, [user, fetchGroups]);

  return {
    groups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
    refresh: fetchGroups,
  };
}
