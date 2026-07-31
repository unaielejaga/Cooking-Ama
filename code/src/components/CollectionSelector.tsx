import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCollections } from '@/hooks/useCollections';
import { Button } from '@/components/Button';
import { ErrorAlert } from '@/components/ErrorAlert';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';

interface CollectionSelectorProps {
  visible: boolean;
  recipeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CollectionSelector({ visible, recipeId, onClose, onSuccess }: CollectionSelectorProps) {
  const { collections, loading, createCollection, addToCollection, removeFromCollection, getCollectionsForRecipe, refresh } = useCollections();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      openedRef.current = false;
      return;
    }

    if (openedRef.current) return;
    openedRef.current = true;

    refresh();
    const current = getCollectionsForRecipe(recipeId).map(c => c.id);
    setSelectedIds(new Set(current));
    setShowCreate(false);
    setNewName('');
    setNewDescription('');
    setError(null);
  }, [visible, recipeId, refresh, getCollectionsForRecipe]);

  const toggleCollection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;

    setCreating(true);
    setError(null);
    const result = await createCollection({ name: newName.trim(), description: newDescription.trim() || undefined });
    setCreating(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.id) {
      setSelectedIds(prev => new Set(prev).add(result.id!));
    }
    setShowCreate(false);
    setNewName('');
    setNewDescription('');
  }, [newName, newDescription, createCollection]);

  const handleSave = useCallback(async () => {
    const current = new Set(getCollectionsForRecipe(recipeId).map(c => c.id));

    const toAdd = [...selectedIds].filter(id => !current.has(id));
    const toRemove = [...current].filter(id => !selectedIds.has(id));

    setSaving(true);
    setError(null);

    for (const id of toAdd) {
      const result = await addToCollection(id, recipeId);
      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
    }

    for (const id of toRemove) {
      const result = await removeFromCollection(id, recipeId);
      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSuccess();
    onClose();
  }, [selectedIds, recipeId, getCollectionsForRecipe, addToCollection, removeFromCollection, onSuccess, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Agregar a colección</Text>
          {error && <ErrorAlert message={error} />}

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {loading && collections.length === 0 ? (
              <Text style={styles.emptyText}>Cargando colecciones…</Text>
            ) : collections.length === 0 ? (
              <Text style={styles.emptyText}>No tienes colecciones todavía</Text>
            ) : (
              collections.map(collection => {
                const isSelected = selectedIds.has(collection.id);
                return (
                  <Pressable
                    key={collection.id}
                    style={styles.row}
                    onPress={() => toggleCollection(collection.id)}
                  >
                    <MaterialIcons
                      name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                      size={24}
                      color={isSelected ? Colors.greenAccent : Colors.brownLight}
                    />
                    <View style={styles.rowContent}>
                      <Text style={styles.rowName} numberOfLines={1}>
                        {collection.name}
                      </Text>
                      <Text style={styles.rowCount}>
                        {collection.recipe_count || 0} recetas
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            {showCreate ? (
              <View style={styles.createForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="bookmark" size={20} color={Colors.brownLight} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nombre de la colección"
                      placeholderTextColor={Colors.brownLight}
                      value={newName}
                      onChangeText={setNewName}
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
                      value={newDescription}
                      onChangeText={setNewDescription}
                    />
                  </View>
                </View>
                <View style={styles.createButtons}>
                  <Button
                    title="Cancelar"
                    variant="secondary"
                    onPress={() => { setShowCreate(false); setError(null); }}
                  />
                  <Button
                    title="Crear"
                    loading={creating}
                    disabled={!newName.trim()}
                    onPress={handleCreate}
                  />
                </View>
              </View>
            ) : (
              <Pressable style={styles.newCollectionButton} onPress={() => setShowCreate(true)}>
                <MaterialIcons name="add" size={22} color={Colors.greenAccent} />
                <Text style={styles.newCollectionText}>Crear nueva colección</Text>
              </Pressable>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button title="Cancelar" variant="secondary" onPress={onClose} />
            <Button title="Guardar" loading={saving} onPress={handleSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.card,
    borderTopRightRadius: BorderRadius.card,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    width: '100%',
    maxHeight: '80%',
    alignSelf: 'center',
    maxWidth: 600,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
    marginBottom: Spacing.md,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  rowContent: {
    flex: 1,
    gap: 1,
  },
  rowName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownDark,
  },
  rowCount: {
    fontSize: FontSize.small,
    color: Colors.brownLight,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.brownLight,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  newCollectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
    marginTop: Spacing.sm,
  },
  newCollectionText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.greenAccent,
  },
  createForm: {
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
  createButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
