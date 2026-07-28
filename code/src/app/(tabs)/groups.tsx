import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
  DimensionValue,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { useGroups } from '@/hooks/useGroups';
import { GroupCard } from '@/components/GroupCard';
import { Button } from '@/components/Button';
import { ErrorAlert } from '@/components/ErrorAlert';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/lib/theme';
import { GroupWithDetails } from '@/lib/types';

export default function GroupsScreen() {
  const router = useRouter();
  const { getResponsiveValue } = useResponsive();
  const { groups, loading, createGroup, joinGroup, leaveGroup, deleteGroup, refresh } = useGroups();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [joinQuery, setJoinQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [leavingGroup, setLeavingGroup] = useState<GroupWithDetails | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<GroupWithDetails | null>(null);

  const contentMaxWidth: DimensionValue = getResponsiveValue({
    mobile: '100%' as DimensionValue,
    tablet: 600,
    desktop: 800,
  });

  const handleGroupPress = useCallback((group: GroupWithDetails) => {
    router.push(`/group/${group.id}` as any);
  }, [router]);

  const handleCreate = useCallback(async () => {
    if (!groupName.trim()) return;

    setCreating(true);
    const result = await createGroup({ name: groupName.trim(), description: groupDescription.trim() || undefined });
    setCreating(false);

    if (result.error) {
      setJoinError(result.error);
      return;
    }

    setShowCreate(false);
    setGroupName('');
    setGroupDescription('');
    setJoinError(null);
    if (result.id) {
      router.push(`/group/${result.id}` as any);
    }
  }, [groupName, groupDescription, createGroup, router]);

  const handleJoin = useCallback(async () => {
    if (!joinQuery.trim()) return;

    setJoinError(null);
    const result = await joinGroup(joinQuery.trim());
    if (result.error) {
      setJoinError(result.error);
      return;
    }

    setShowJoin(false);
    setJoinQuery('');
  }, [joinQuery, joinGroup]);

  const handleLeaveConfirm = useCallback(async () => {
    if (!leavingGroup) return;
    await leaveGroup(leavingGroup.id);
    setLeavingGroup(null);
  }, [leavingGroup, leaveGroup]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingGroup) return;
    await deleteGroup(deletingGroup.id);
    setDeletingGroup(null);
  }, [deletingGroup, deleteGroup]);

  function renderItem({ item }: { item: GroupWithDetails }) {
    return (
      <GroupCard group={item} onPress={handleGroupPress} />
    );
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <MaterialIcons name="group" size={64} color={Colors.brownLight} />
        <Text style={styles.emptyTitle}>No tienes grupos</Text>
        <Text style={styles.emptySubtitle}>
          Crea un grupo o únete a uno para compartir recetas
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Grupos</Text>
          <View style={styles.headerButtons}>
            <Pressable style={styles.iconButton} onPress={() => setShowJoin(true)}>
              <MaterialIcons name="person-add" size={22} color={Colors.greenAccent} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setShowCreate(true)}>
              <MaterialIcons name="add" size={22} color={Colors.greenAccent} />
            </Pressable>
          </View>
        </View>

        <FlatList
          data={groups}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={renderEmpty}
          onRefresh={refresh}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Crear grupo</Text>

            {joinError && <ErrorAlert message={joinError} />}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="group" size={20} color={Colors.brownLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del grupo"
                  placeholderTextColor={Colors.brownLight}
                  value={groupName}
                  onChangeText={setGroupName}
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
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={() => { setShowCreate(false); setJoinError(null); }} variant="secondary" />
              <Button title="Crear" onPress={handleCreate} loading={creating} disabled={!groupName.trim()} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showJoin} transparent animationType="fade" onRequestClose={() => setShowJoin(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Unirse a grupo</Text>
            <Text style={styles.modalSubtitle}>Introduce el ID del grupo para unirte</Text>

            {joinError && <ErrorAlert message={joinError} />}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ID del grupo</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="vpn-key" size={20} color={Colors.brownLight} />
                <TextInput
                  style={styles.input}
                  placeholder="ID del grupo"
                  placeholderTextColor={Colors.brownLight}
                  value={joinQuery}
                  onChangeText={setJoinQuery}
                  autoCapitalize="none"
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={() => { setShowJoin(false); setJoinError(null); setJoinQuery(''); }} variant="secondary" />
              <Button title="Unirse" onPress={handleJoin} disabled={!joinQuery.trim()} />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={leavingGroup !== null}
        title="Salir del grupo"
        message={`¿Estás seguro de que quieres salir de "${leavingGroup?.name}"?`}
        confirmLabel="Salir"
        cancelLabel="Cancelar"
        onConfirm={handleLeaveConfirm}
        onCancel={() => setLeavingGroup(null)}
      />

      <ConfirmDialog
        visible={deletingGroup !== null}
        title="Eliminar grupo"
        message={`¿Estás seguro de que quieres eliminar "${deletingGroup?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingGroup(null)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.brownDark,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  separator: {
    height: Spacing.md,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'] * 2,
  },
  emptyTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  emptySubtitle: {
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
  modalSubtitle: {
    fontSize: FontSize.caption,
    color: Colors.brownMedium,
    marginTop: -Spacing.sm,
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
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
