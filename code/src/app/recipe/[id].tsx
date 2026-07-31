import { useState, useCallback, useEffect } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, Pressable, Modal, StyleSheet, DimensionValue } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/hooks/useAuth';
import { useRecipeDetail } from '@/hooks/useRecipeDetail';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/Button';
import { FavoriteButton } from '@/components/FavoriteButton';
import { CollectionSelector } from '@/components/CollectionSelector';
import { ReplicationItem } from '@/components/ReplicationItem';
import { ReplicationForm } from '@/components/ReplicationForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { supabase, getRecipeImageUrl, getReplicationImageUrl } from '@/lib/supabase';
import { Replication, ReplicationReaction } from '@/lib/types';
import { setEditingRecipeId } from '@/lib/navigationState';

const DIFFICULTIES: Record<string, { label: string; color: string }> = {
  easy: { label: 'Fácil', color: Colors.success },
  medium: { label: 'Media', color: Colors.warning },
  hard: { label: 'Difícil', color: Colors.error },
};

function formatTime(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function RecipeDetailScreen() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const router = useRouter();
  const { getResponsiveValue } = useResponsive();
  const { profile } = useAuth();
  const { recipe, replications, loading, replicationsLoading, error, sharedGroupNames, refetch, refreshReplications } = useRecipeDetail(id);
  const { isFavorited, toggleFavorite } = useFavorites();
  const contentMaxWidth: DimensionValue = getResponsiveValue({ mobile: '100%' as DimensionValue, tablet: 600, desktop: 800 });
  const [showReplicationForm, setShowReplicationForm] = useState(false);
  const [editingReplication, setEditingReplication] = useState<Replication | undefined>(undefined);
  const [deletingReplication, setDeletingReplication] = useState<Replication | undefined>(undefined);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [reactionsMap, setReactionsMap] = useState<Record<string, ReplicationReaction[]>>({});
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);

  useEffect(() => {
    if (replications.length === 0) {
      setReactionsMap({});
      return;
    }

    const repIds = replications.map(r => r.id);
    supabase
      .from('replication_reactions')
      .select('*')
      .in('replication_id', repIds)
      .then(({ data }) => {
        const map: Record<string, ReplicationReaction[]> = {};
        for (const repId of repIds) map[repId] = [];
        for (const row of (data || []) as ReplicationReaction[]) {
          if (!map[row.replication_id]) map[row.replication_id] = [];
          map[row.replication_id].push(row);
        }
        setReactionsMap(map);
      });
  }, [replications]);

  const handleReact = useCallback(async (replicationId: string, emoji: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from('replication_reactions')
      .insert({ replication_id: replicationId, user_id: profile.id, emoji });

    if (!error) {
      const { data } = await supabase
        .from('replication_reactions')
        .select('*')
        .eq('replication_id', replicationId);
      setReactionsMap(prev => ({ ...prev, [replicationId]: (data || []) as ReplicationReaction[] }));
    }
  }, [profile]);

  const handleRemoveReaction = useCallback(async (replicationId: string, emoji: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from('replication_reactions')
      .delete()
      .eq('replication_id', replicationId)
      .eq('user_id', profile.id)
      .eq('emoji', emoji);

    if (!error) {
      const { data } = await supabase
        .from('replication_reactions')
        .select('*')
        .eq('replication_id', replicationId);
      setReactionsMap(prev => ({ ...prev, [replicationId]: (data || []) as ReplicationReaction[] }));
    }
  }, [profile]);

  const handleBack = useCallback(() => {
    if (created) {
      router.push('/(tabs)');
    } else {
      router.back();
    }
  }, [created, router]);

  const openCreateForm = useCallback(() => {
    setEditingReplication(undefined);
    setShowReplicationForm(true);
  }, []);

  const openEditForm = useCallback((rep: Replication) => {
    setEditingReplication(rep);
    setShowReplicationForm(true);
  }, []);

  const handleReplicationSuccess = useCallback(() => {
    setShowReplicationForm(false);
    setEditingReplication(undefined);
    refetch();
    refreshReplications();
  }, [refetch, refreshReplications]);

  const handleDeleteReplication = useCallback(async () => {
    if (!deletingReplication) return;

    const { error } = await supabase
      .from('recipe_replications')
      .delete()
      .eq('id', deletingReplication.id);

    if (!error) {
      setDeletingReplication(undefined);
      refetch();
      refreshReplications();
    }
  }, [deletingReplication, refetch, refreshReplications]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.greenAccent} />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error || 'Receta no encontrada'}</Text>
        <Button title="Volver" onPress={handleBack} variant="secondary" />
      </View>
    );
  }

  const diff = recipe.difficulty ? DIFFICULTIES[recipe.difficulty] : null;
  const authorName = recipe.author?.display_name || recipe.author?.username || '';
  const isOwner = profile?.id === recipe.author_id;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <View>
            {recipe.image_url ? (
              <Image source={{ uri: getRecipeImageUrl(recipe.image_url) ?? '' }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroPlaceholder}>
                <MaterialIcons name="restaurant" size={64} color={Colors.brownLight} />
              </View>
            )}
            <Pressable style={styles.backButton} onPress={handleBack}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.white} />
            </Pressable>
            <FavoriteButton
              recipeId={recipe.id}
              isFavorited={isFavorited(recipe.id)}
              onToggle={toggleFavorite}
              style={styles.favoriteButton}
            />
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>{recipe.title}</Text>

            <View style={styles.authorRow}>
              {recipe.author?.avatar_url ? (
                <Image source={{ uri: recipe.author.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials(authorName)}</Text>
                </View>
              )}
              <Text style={styles.authorName}>{authorName}</Text>
              {!recipe.is_public && (
                <MaterialIcons name="lock" size={16} color={Colors.brownLight} />
              )}
            </View>

            <View style={styles.metaRow}>
              {diff && (
                <View style={[styles.metaBadge, { backgroundColor: diff.color + '20' }]}>
                  <Text style={[styles.metaBadgeText, { color: diff.color }]}>{diff.label}</Text>
                </View>
              )}
              {recipe.prep_time_minutes && (
                <View style={styles.metaBadge}>
                  <MaterialIcons name="timer" size={14} color={Colors.brownMedium} />
                  <Text style={styles.metaBadgeText}>Prep: {formatTime(recipe.prep_time_minutes)}</Text>
                </View>
              )}
              {recipe.cook_time_minutes && (
                <View style={styles.metaBadge}>
                  <MaterialIcons name="timer-off" size={14} color={Colors.brownMedium} />
                  <Text style={styles.metaBadgeText}>Cocción: {formatTime(recipe.cook_time_minutes)}</Text>
                </View>
              )}
              {recipe.avg_rating !== undefined && recipe.avg_rating > 0 && (
                <View style={styles.metaBadge}>
                  <MaterialIcons name="star" size={14} color={Colors.warning} />
                  <Text style={[styles.metaBadgeText, { color: Colors.warning }]}>{recipe.avg_rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            {sharedGroupNames.length > 0 && (
              <View style={styles.sharedRow}>
                <MaterialIcons name="group" size={16} color={Colors.greenAccent} />
                <Text style={styles.sharedText}>
                  Compartido contigo desde: {sharedGroupNames.join(', ')}
                </Text>
              </View>
            )}

            {recipe.description && (
              <Text style={styles.description}>{recipe.description}</Text>
            )}

            {recipe.tags && recipe.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {recipe.tags.map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <Button
              title="He cocinado esta receta"
              onPress={openCreateForm}
            />

            <Button
              title="Agregar a colección"
              onPress={() => setShowCollectionSelector(true)}
              variant="secondary"
            />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Ingredientes</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients?.map((ing, index) => (
                <View key={ing.id || index} style={styles.ingredientRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.ingredientText}>
                    {ing.quantity && `${ing.quantity} `}
                    {ing.unit && `${ing.unit} `}
                    {ing.name}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Pasos</Text>
            <View style={styles.stepsList}>
              {recipe.steps?.map((step, index) => (
                <View key={step.id || index} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.description}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Creaciones</Text>
            {replicationsLoading ? (
              <ActivityIndicator size="small" color={Colors.greenAccent} />
            ) : replications.length === 0 ? (
              <Text style={styles.emptyText}>Sé el primero en cocinar esta receta</Text>
            ) : (
              <View style={styles.replicationsList}>
                {replications.map(rep => (
                  <ReplicationItem
                    key={rep.id}
                    replication={rep}
                    reactions={reactionsMap[rep.id]}
                    canReact={profile?.id === recipe?.author_id}
                    currentUserId={profile?.id}
                    onReact={(emoji) => handleReact(rep.id, emoji)}
                    onRemoveReaction={(emoji) => handleRemoveReaction(rep.id, emoji)}
                    onImagePress={(url) => setPreviewImageUrl(getReplicationImageUrl(url) ?? url)}
                    onEdit={() => openEditForm(rep)}
                    onDelete={() => setDeletingReplication(rep)}
                    isOwner={profile?.id === rep.user_id}
                  />
                ))}
              </View>
            )}

            <View style={styles.divider} />

            {isOwner && (
              <Button
                title="Editar receta"
                onPress={() => {
                  setEditingRecipeId(recipe.id);
                  router.push('/(tabs)/create' as any);
                }}
                variant="secondary"
              />
            )}

            <View style={styles.spacer} />
          </View>
        </View>
      </ScrollView>

      <ReplicationForm
        visible={showReplicationForm}
        recipeId={recipe.id}
        recipeTitle={recipe.title}
        existingReplication={editingReplication}
        onClose={() => { setShowReplicationForm(false); setEditingReplication(undefined); }}
        onSuccess={handleReplicationSuccess}
      />

      <CollectionSelector
        visible={showCollectionSelector}
        recipeId={recipe.id}
        onClose={() => setShowCollectionSelector(false)}
        onSuccess={refetch}
      />

      <ConfirmDialog
        visible={!!deletingReplication}
        title="Eliminar creación"
        message="¿Estás seguro de que quieres eliminar esta creación?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDeleteReplication}
        onCancel={() => setDeletingReplication(undefined)}
      />

      <Modal visible={!!previewImageUrl} transparent animationType="fade" onRequestClose={() => setPreviewImageUrl(null)}>
        <Pressable style={styles.imagePreviewOverlay} onPress={() => setPreviewImageUrl(null)}>
          {previewImageUrl && (
            <Image
              source={{ uri: previewImageUrl }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          )}
          <Pressable style={styles.imagePreviewClose} onPress={() => setPreviewImageUrl(null)} onStartShouldSetResponder={() => true}>
            <MaterialIcons name="close" size={28} color={Colors.white} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
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
  heroImage: {
    width: '100%',
    height: 280,
  },
  heroPlaceholder: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.bone,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.brownDark,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semiBold,
    color: Colors.greenAccent,
  },
  authorName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownDark,
    flex: 1,
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.greenLight,
    borderRadius: BorderRadius.button,
  },
  sharedText: {
    fontSize: FontSize.caption,
    color: Colors.greenAccent,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.tag,
    borderCurve: 'continuous',
    backgroundColor: Colors.cream,
  },
  metaBadgeText: {
    fontSize: FontSize.small,
    color: Colors.brownMedium,
    fontWeight: FontWeight.medium,
  },
  description: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.greenLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.tag,
    borderCurve: 'continuous',
  },
  tagText: {
    fontSize: FontSize.small,
    color: Colors.greenAccent,
    fontWeight: FontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  ingredientsList: {
    gap: Spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.greenAccent,
    marginTop: 2,
  },
  ingredientText: {
    fontSize: FontSize.body,
    color: Colors.brownDark,
    flex: 1,
  },
  stepsList: {
    gap: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.greenAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  stepText: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.brownDark,
    lineHeight: 24,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  replicationsList: {
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.brownLight,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  spacer: {
    height: Spacing['2xl'],
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePreviewClose: {
    position: 'absolute',
    top: Spacing.xl,
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
