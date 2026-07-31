import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  DimensionValue,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useCollections } from '@/hooks/useCollections';
import { CollectionCard } from '@/components/CollectionCard';
import { Button } from '@/components/Button';
import { ErrorAlert } from '@/components/ErrorAlert';
import { supabase } from '@/lib/supabase';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/lib/theme';
import { Collection } from '@/lib/types';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileScreen() {
  const router = useRouter();
  const { getResponsiveValue } = useResponsive();
  const { profile } = useAuth();
  const { favorites, refresh: refreshFavorites } = useFavorites();
  const { collections, loading: collectionsLoading, createCollection, refresh: refreshCollections } = useCollections();

  const [recipesCount, setRecipesCount] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const contentMaxWidth: DimensionValue = getResponsiveValue({
    mobile: '100%' as DimensionValue,
    tablet: 600,
    desktop: 800,
  });

  const fetchRecipesCount = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      setRecipesCount(0);
      return;
    }

    const { count } = await supabase
      .from('recipes')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userData.user.id);

    setRecipesCount(count ?? 0);
  }, []);

  useEffect(() => {
    fetchRecipesCount();
  }, [fetchRecipesCount]);

  useFocusEffect(
    useCallback(() => {
      refreshFavorites();
      refreshCollections();
      fetchRecipesCount();
    }, [refreshFavorites, refreshCollections, fetchRecipesCount])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshFavorites(), refreshCollections(), fetchRecipesCount()]);
    setRefreshing(false);
  }, [refreshFavorites, refreshCollections, fetchRecipesCount]);

  const handleCollectionPress = useCallback((collection: Collection) => {
    router.push(`/collections/${collection.id}` as any);
  }, [router]);

  const handleCreate = useCallback(async () => {
    if (!collectionName.trim()) return;

    setCreating(true);
    setCreateError(null);
    const result = await createCollection({ name: collectionName.trim(), description: collectionDescription.trim() || undefined });
    setCreating(false);

    if (result.error) {
      setCreateError(result.error);
      return;
    }

    setShowCreate(false);
    setCollectionName('');
    setCollectionDescription('');
  }, [collectionName, collectionDescription, createCollection]);

  const displayName = profile?.display_name || profile?.username || '';

  return (
    <View style={styles.container}>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.greenAccent]} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeader}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              {profile?.username && <Text style={styles.profileUsername}>@{profile.username}</Text>}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{recipesCount ?? '—'}</Text>
              <Text style={styles.statLabel}>Recetas</Text>
            </View>
            <Pressable style={styles.stat} onPress={() => router.push('/favorites' as any)}>
              <Text style={styles.statNumber}>{favorites.length}</Text>
              <Text style={styles.statLabel}>Favoritos</Text>
            </Pressable>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{collections.length}</Text>
              <Text style={styles.statLabel}>Colecciones</Text>
            </View>
          </View>

          <Pressable style={styles.favoritesButton} onPress={() => router.push('/favorites' as any)}>
            <MaterialIcons name="favorite" size={22} color={Colors.error} />
            <Text style={styles.favoritesButtonText}>Ver mis favoritos</Text>
            <MaterialIcons name="chevron-right" size={22} color={Colors.brownLight} />
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis colecciones</Text>
            <Pressable style={styles.iconButton} onPress={() => setShowCreate(true)}>
              <MaterialIcons name="add" size={22} color={Colors.greenAccent} />
            </Pressable>
          </View>

          {collectionsLoading && collections.length === 0 ? (
            <ActivityIndicator size="small" color={Colors.greenAccent} style={styles.loading} />
          ) : collections.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="bookmark-outline" size={48} color={Colors.brownLight} />
              <Text style={styles.emptyText}>
                Crea colecciones para organizar tus recetas
              </Text>
            </View>
          ) : (
            <View style={styles.collectionsList}>
              {collections.map(collection => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  recipeCount={collection.recipe_count || 0}
                  onPress={handleCollectionPress}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Crear colección</Text>

            {createError && <ErrorAlert message={createError} />}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="bookmark" size={20} color={Colors.brownLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de la colección"
                  placeholderTextColor={Colors.brownLight}
                  value={collectionName}
                  onChangeText={setCollectionName}
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="description" size={20} color={Colors.brownLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Breve descripción"
                  placeholderTextColor={Colors.brownLight}
                  value={collectionDescription}
                  onChangeText={setCollectionDescription}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={() => { setShowCreate(false); setCreateError(null); }}
              />
              <Button
                title="Crear"
                loading={creating}
                disabled={!collectionName.trim()}
                onPress={handleCreate}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.brownDark,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.greenAccent,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  profileUsername: {
    fontSize: FontSize.caption,
    color: Colors.brownMedium,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.brownDark,
  },
  statLabel: {
    fontSize: FontSize.small,
    color: Colors.brownMedium,
    fontWeight: FontWeight.medium,
  },
  favoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    minHeight: 48,
  },
  favoritesButtonText: {
    flex: 1,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionsList: {
    gap: Spacing.sm,
  },
  loading: {
    paddingVertical: Spacing.lg,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderCurve: 'continuous',
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingLeft: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm + 4,
    fontSize: FontSize.body,
    color: Colors.brownDark,
    minHeight: 48,
    outlineWidth: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
