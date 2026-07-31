import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
  StyleSheet,
  DimensionValue,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/hooks/useAuth';
import { useGroupDetail } from '@/hooks/useGroupDetail';
import { Button } from '@/components/Button';
import { RecipeCard } from '@/components/RecipeCard';
import { UserSelector } from '@/components/UserSelector';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorAlert } from '@/components/ErrorAlert';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { getRecipeImageUrl } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { GroupMember, Recipe } from '@/lib/types';

type Tab = 'members' | 'recipes';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function InviteModal({
  visible,
  onClose,
  onInvite,
  excludeIds,
}: {
  visible: boolean;
  onClose: () => void;
  onInvite: (userId: string) => Promise<{ error?: string }>;
  excludeIds: string[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = useCallback((userId: string) => {
    setSelected(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }, []);

  const handleInvite = useCallback(async () => {
    setInviting(true);
    setError(null);

    for (const userId of selected) {
      const result = await onInvite(userId);
      if (result.error) {
        setError(result.error);
        setInviting(false);
        return;
      }
    }

    setInviting(false);
    setSelected([]);
    onClose();
  }, [selected, onInvite, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View onStartShouldSetResponder={() => true} style={styles.modal}>
          <Text style={styles.modalTitle}>Invitar miembros</Text>
          {error && <ErrorAlert message={error} />}
          <UserSelector
            selectedIds={selected}
            onToggle={handleToggle}
            excludeIds={excludeIds}
          />
          <View style={styles.modalButtons}>
            <Button title="Cancelar" onPress={onClose} variant="secondary" />
            <Button
              title="Invitar"
              onPress={handleInvite}
              loading={inviting}
              disabled={selected.length === 0}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ShareRecipeModal({
  visible,
  onClose,
  onShare,
  groupId,
}: {
  visible: boolean;
  onClose: () => void;
  onShare: (recipeId: string) => Promise<{ error?: string }>;
  groupId: string;
}) {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(async () => {
    setLoadingRecipes(true);
    setError(null);
    setSelectedIds(new Set());
    setSearchText('');

    try {
      const { data: sharedIds } = await supabase
        .from('recipe_shares')
        .select('recipe_id')
        .eq('group_id', groupId);

      const excludeIds = new Set((sharedIds || []).map(s => s.recipe_id));

      const { data } = await supabase
        .from('recipes')
        .select('*, author:profiles!author_id(*)')
        .eq('author_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_public', false);

      setAllRecipes((data || []).filter(r => !excludeIds.has(r.id)) as Recipe[]);
    } catch {
      setError('Error al cargar recetas');
    } finally {
      setLoadingRecipes(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (visible) {
      handleOpen();
    }
  }, [visible, handleOpen]);

  const toggleRecipe = useCallback((recipeId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(recipeId)) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });
  }, []);

  const handleShareSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setSharing(true);
    setError(null);

    for (const recipeId of selectedIds) {
      const result = await onShare(recipeId);
      if (result.error) {
        setError(result.error);
        setSharing(false);
        return;
      }
    }

    setSharing(false);
    onClose();
  }, [selectedIds, onShare, onClose]);

  const filtered = searchText.trim()
    ? allRecipes.filter(r =>
        r.title.toLowerCase().includes(searchText.toLowerCase())
      )
    : allRecipes;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View onStartShouldSetResponder={() => true} style={styles.modal}>
          <Text style={styles.modalTitle}>Compartir receta</Text>
          {error && <ErrorAlert message={error} />}

          {loadingRecipes ? (
            <ActivityIndicator size="large" color={Colors.greenAccent} style={{ padding: Spacing.xl }} />
          ) : allRecipes.length === 0 ? (
            <Text style={styles.emptyText}>No tienes recetas privadas disponibles para compartir</Text>
          ) : (
            <>
              <View style={styles.shareSearchWrapper}>
                <MaterialIcons name="search" size={20} color={Colors.brownLight} />
                <TextInput
                  style={styles.shareSearchInput}
                  placeholder="Buscar recetas..."
                  placeholderTextColor={Colors.brownLight}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCapitalize="none"
                />
                {searchText ? (
                  <Pressable onPress={() => setSearchText('')}>
                    <MaterialIcons name="close" size={18} color={Colors.brownLight} />
                  </Pressable>
                ) : null}
              </View>

              <ScrollView style={styles.shareRecipeList} nestedScrollEnabled>
                {filtered.map(recipe => {
                  const selected = selectedIds.has(recipe.id);
                  return (
                    <Pressable
                      key={recipe.id}
                      style={[styles.shareRecipeRow, selected && styles.shareRecipeRowSelected]}
                      onPress={() => toggleRecipe(recipe.id)}
                    >
                      <View style={styles.shareCheckbox}>
                        <MaterialIcons
                          name={selected ? 'check-box' : 'check-box-outline-blank'}
                          size={24}
                          color={selected ? Colors.greenAccent : Colors.brownLight}
                        />
                      </View>
                      {recipe.image_url ? (
                        <Image
                          source={{ uri: getRecipeImageUrl(recipe.image_url) ?? '' }}
                          style={styles.shareRecipeImage}
                        />
                      ) : (
                        <View style={styles.shareRecipeImagePlaceholder}>
                          <MaterialIcons name="restaurant" size={20} color={Colors.brownLight} />
                        </View>
                      )}
                      <View style={styles.shareRecipeInfo}>
                        <Text style={styles.shareRecipeName} numberOfLines={1}>
                          {recipe.title}
                        </Text>
                        {recipe.description && (
                          <Text style={styles.shareRecipeDesc} numberOfLines={1}>
                            {recipe.description}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.shareFooter}>
                <Text style={styles.shareSelectedCount}>
                  {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
                </Text>
                <View style={styles.shareFooterButtons}>
                  <Button title="Cancelar" onPress={onClose} variant="secondary" />
                  <Button
                    title="Compartir"
                    onPress={handleShareSelected}
                    loading={sharing}
                    disabled={selectedIds.size === 0}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getResponsiveValue } = useResponsive();
  const { profile } = useAuth();
  const {
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
    refresh,
  } = useGroupDetail(id);

  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [showInvite, setShowInvite] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [removingMember, setRemovingMember] = useState<GroupMember | null>(null);
  const [removingRecipe, setRemovingRecipe] = useState<Recipe | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const contentMaxWidth: DimensionValue = getResponsiveValue({
    mobile: '100%' as DimensionValue,
    tablet: 600,
    desktop: 800,
  });

  const handleRecipePress = useCallback((recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}` as any);
  }, [router]);

  const handleRemoveMember = useCallback(async () => {
    if (!removingMember) return;
    await removeMember(removingMember.user_id);
    setRemovingMember(null);
  }, [removingMember, removeMember]);

  const handleRemoveRecipe = useCallback(async () => {
    if (!removingRecipe) return;
    await unshareRecipe(removingRecipe.id);
    setRemovingRecipe(null);
  }, [removingRecipe, unshareRecipe]);

  const handleDeleteGroup = useCallback(async () => {
    const result = await deleteGroup();
    if (result.error) return;
    setConfirmingDelete(false);
    router.replace('/(tabs)/groups');
  }, [deleteGroup, router]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.greenAccent} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Grupo no encontrado</Text>
        <Button title="Volver" onPress={() => router.push('/(tabs)/groups')} variant="secondary" />
      </View>
    );
  }

  const isAdmin = group.is_admin;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <Pressable style={styles.backButton} onPress={() => router.push('/(tabs)/groups')}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.brownDark} />
        </Pressable>

        {isAdmin && (
          <Pressable
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
            onPress={() => setConfirmingDelete(true)}
            hitSlop={8}
          >
            <MaterialIcons name="delete-outline" size={22} color={Colors.error} />
          </Pressable>
        )}

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialIcons name="group" size={40} color={Colors.greenAccent} />
          </View>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}
          <View style={styles.headerStats}>
            <Text style={styles.headerStat}>
              {group.member_count} {group.member_count === 1 ? 'miembro' : 'miembros'}
            </Text>
            <Text style={styles.headerStat}>
              {group.recipe_count} {group.recipe_count === 1 ? 'receta' : 'recetas'}
            </Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'members' && styles.tabActive]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
              Miembros
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'recipes' && styles.tabActive]}
            onPress={() => setActiveTab('recipes')}
          >
            <Text style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}>
              Recetas
            </Text>
          </Pressable>
        </View>

        {activeTab === 'members' ? (
          <FlatList
            data={members}
            keyExtractor={item => item.user_id}
            contentContainerStyle={styles.tabContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={
              isAdmin ? (
                <Pressable style={styles.inviteButton} onPress={() => setShowInvite(true)}>
                  <MaterialIcons name="person-add" size={20} color={Colors.greenAccent} />
                  <Text style={styles.inviteText}>Invitar miembros</Text>
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => {
              const displayName = item.profile?.display_name || item.profile?.username || '';
              return (
                <View style={styles.memberRow}>
                  {item.profile?.avatar_url ? (
                    <Image source={{ uri: item.profile.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
                    </View>
                  )}
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={styles.memberUsername}>@{item.profile?.username}</Text>
                  </View>
                  <View style={styles.memberRoleContainer}>
                    <Text style={[styles.memberRole, item.role === 'admin' && styles.adminRole]}>
                      {item.role === 'admin' ? 'Admin' : 'Miembro'}
                    </Text>
                  </View>
                  {isAdmin && item.user_id !== profile?.id && (
                    <Pressable
                      style={styles.memberAction}
                      onPress={() => {
                        if (item.role === 'member') {
                          promoteMember(item.user_id);
                        }
                      }}
                    >
                      {item.role === 'member' && (
                        <MaterialIcons name="arrow-upward" size={18} color={Colors.greenAccent} />
                      )}
                    </Pressable>
                  )}
                  {isAdmin && item.user_id !== profile?.id && (
                    <Pressable
                      style={styles.memberAction}
                      onPress={() => setRemovingMember(item)}
                    >
                      <MaterialIcons name="remove-circle-outline" size={20} color={Colors.error} />
                    </Pressable>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay miembros</Text>
            }
          />
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.tabContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={
              <Pressable style={styles.inviteButton} onPress={() => { setShowShare(true); }}>
                <MaterialIcons name="share" size={20} color={Colors.greenAccent} />
                <Text style={styles.inviteText}>Compartir receta</Text>
              </Pressable>
            }
            renderItem={({ item }) => (
              <View style={styles.recipeCardWrapper}>
                <RecipeCard recipe={item} onPress={handleRecipePress} />
                {item.author_id === profile?.id && (
                  <Pressable
                    style={styles.unshareButton}
                    onPress={() => setRemovingRecipe(item)}
                  >
                    <MaterialIcons name="close" size={16} color={Colors.error} />
                  </Pressable>
                )}
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay recetas compartidas en este grupo</Text>
            }
          />
        )}
      </View>

      <InviteModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        onInvite={inviteUser}
        excludeIds={members.map(m => m.user_id)}
      />

      <ShareRecipeModal
        visible={showShare}
        onClose={() => setShowShare(false)}
        onShare={shareRecipe}
        groupId={id!}
      />

      <ConfirmDialog
        visible={removingMember !== null}
        title="Expulsar miembro"
        message={`¿Expulsar a @${removingMember?.profile?.username} del grupo?`}
        confirmLabel="Expulsar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleRemoveMember}
        onCancel={() => setRemovingMember(null)}
      />

      <ConfirmDialog
        visible={removingRecipe !== null}
        title="Dejar de compartir"
        message="¿Dejar de compartir esta receta en el grupo?"
        confirmLabel="Dejar de compartir"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleRemoveRecipe}
        onCancel={() => setRemovingRecipe(null)}
      />

      <ConfirmDialog
        visible={confirmingDelete}
        title="Eliminar grupo"
        message={`¿Estás seguro de que quieres eliminar "${group.name}"? Esta acción no se puede deshacer y eliminará también a todos sus miembros y recetas compartidas.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDeleteGroup}
        onCancel={() => setConfirmingDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bone,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF1EF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupName: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.brownDark,
    textAlign: 'center',
  },
  groupDescription: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  headerStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  headerStat: {
    fontSize: FontSize.caption,
    color: Colors.brownLight,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.button,
    borderCurve: 'continuous',
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: Colors.white,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  tabText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: Colors.brownLight,
  },
  tabTextActive: {
    color: Colors.greenAccent,
    fontWeight: FontWeight.semiBold,
  },
  tabContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  separator: {
    height: Spacing.sm,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.greenLight,
    borderRadius: BorderRadius.button,
    borderCurve: 'continuous',
    marginBottom: Spacing.sm,
  },
  inviteText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.greenAccent,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: Colors.greenAccent,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownDark,
  },
  memberUsername: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
  },
  memberRoleContainer: {
    marginRight: Spacing.xs,
  },
  memberRole: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    color: Colors.brownLight,
  },
  adminRole: {
    color: Colors.greenAccent,
  },
  memberAction: {
    padding: Spacing.xs,
  },
  recipeCardWrapper: {
    position: 'relative',
  },
  unshareButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.brownLight,
    textAlign: 'center',
    paddingVertical: Spacing['2xl'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    gap: Spacing.md,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  recipeList: {
    maxHeight: 300,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recipeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownDark,
  },
  recipeMeta: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
  },
  shareSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    height: 44,
  },
  shareSearchInput: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.brownDark,
    padding: 0,
    height: 44,
  },
  shareRecipeList: {
    maxHeight: 320,
  },
  shareRecipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  shareRecipeRowSelected: {
    borderColor: Colors.greenAccent,
    backgroundColor: Colors.greenLight,
  },
  shareCheckbox: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareRecipeImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  shareRecipeImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderCurve: 'continuous',
    backgroundColor: Colors.bone,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareRecipeInfo: {
    flex: 1,
  },
  shareRecipeName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownDark,
  },
  shareRecipeDesc: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
    marginTop: 2,
  },
  shareFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  shareSelectedCount: {
    fontSize: FontSize.caption,
    color: Colors.brownMedium,
    fontWeight: FontWeight.medium,
  },
  shareFooterButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
