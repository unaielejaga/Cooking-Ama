import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useCreateRecipe } from '@/hooks/useCreateRecipe';
import { useRecipeDetail } from '@/hooks/useRecipeDetail';
import { supabase } from '@/lib/supabase';
import { getEditingRecipeId, clearEditingRecipeId } from '@/lib/navigationState';
import { IngredientInput, StepInput, ImagePicker, ConfirmDialog } from '@/components';
import { Button } from '@/components/Button';
import { ErrorAlert } from '@/components/ErrorAlert';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { Difficulty, Ingredient, Step, RecipeInput } from '@/lib/types';

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Media' },
  { value: 'hard', label: 'Difícil' },
];

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { createRecipe, updateRecipe, deleteRecipe, uploading } = useCreateRecipe();
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditing = !!editingId;
  const { recipe: existingRecipe, loading: loadingRecipe } = useRecipeDetail(isEditing ? editingId : undefined);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const tagInputRef = useRef<TextInput>(null);

  function resetForm() {
    setTitle('');
    setDescription('');
    setIngredients([]);
    setSteps([]);
    setImageUri(null);
    setDifficulty(null);
    setPrepTime('');
    setCookTime('');
    setIsPublic(true);
    setTags([]);
    setTagInput('');
    setShowTagSuggestions(false);
    setError(null);
    setSaving(false);
  }

  useFocusEffect(
    useCallback(() => {
      const pendingId = getEditingRecipeId();
      clearEditingRecipeId();
      if (pendingId) {
        setEditingId(pendingId);
      } else {
        setEditingId(null);
        resetForm();
      }
    }, [])
  );

  useEffect(() => {
    if (existingRecipe && isEditing) {
      setTitle(existingRecipe.title);
      setDescription(existingRecipe.description || '');
      setIngredients(existingRecipe.ingredients || []);
      setSteps(existingRecipe.steps || []);
      setImageUri(existingRecipe.image_url);
      setDifficulty(existingRecipe.difficulty);
      setPrepTime(existingRecipe.prep_time_minutes?.toString() || '');
      setCookTime(existingRecipe.cook_time_minutes?.toString() || '');
      setIsPublic(existingRecipe.is_public);
      setTags(existingRecipe.tags || []);
    }
  }, [existingRecipe, isEditing]);

  useEffect(() => {
    supabase
      .from('recipes')
      .select('tags')
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.flatMap(r => r.tags))].sort();
          setAllTags(unique);
        }
      });
  }, []);

  const handleTagInputChange = useCallback((text: string) => {
    setTagInput(text);
    if (text.trim()) {
      const filtered = allTags.filter(t =>
        t.toLowerCase().includes(text.toLowerCase()) && !tags.includes(t)
      );
      setFilteredTags(filtered);
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setShowTagSuggestions(false);
    }
  }, [allTags, tags]);

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
    tagInputRef.current?.focus();
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  async function handleSave() {
    setError(null);

    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    if (ingredients.length === 0) {
      setError('Agrega al menos un ingrediente');
      return;
    }
    if (steps.length === 0) {
      setError('Agrega al menos un paso');
      return;
    }

    setSaving(true);

    const input: RecipeInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      ingredients,
      steps,
      image_url: imageUri || undefined,
      is_public: isPublic,
      difficulty: difficulty || undefined,
      prep_time_minutes: prepTime ? parseInt(prepTime, 10) : undefined,
      cook_time_minutes: cookTime ? parseInt(cookTime, 10) : undefined,
      tags,
    };

    if (isEditing && editingId) {
      const { error: updateError } = await updateRecipe(editingId, input);
      if (updateError) {
        setError(updateError);
      } else {
        setEditingId(null);
        router.back();
      }
    } else {
      const { id: newId, error: createError } = await createRecipe(input);
      if (createError) {
        setError(createError);
      } else {
        router.replace(`/recipe/${newId}?created=true` as any);
      }
    }

    setSaving(false);
  }

  function handleDeletePress() {
    if (!editingId) return;
    setShowDeleteConfirm(true);
  }

  async function handleDeleteConfirm() {
    if (!editingId) return;
    setShowDeleteConfirm(false);
    const { error: delError } = await deleteRecipe(editingId);
    if (delError) {
      setError(delError);
    } else {
      setEditingId(null);
      router.replace('/(tabs)');
    }
  }

  if (isEditing && loadingRecipe) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.greenAccent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.screenTitle}>
        {isEditing ? 'Editar receta' : 'Nueva receta'}
      </Text>

      {error && <ErrorAlert message={error} />}

      <View style={styles.section}>
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Nombre de la receta"
          placeholderTextColor={Colors.brownLight}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Breve descripción de la receta"
          placeholderTextColor={Colors.brownLight}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <ImagePicker
          imageUri={imageUri}
          onImagePicked={uri => setImageUri(uri)}
          onRemove={() => setImageUri(null)}
          loading={uploading}
        />
      </View>

      <View style={styles.section}>
        <IngredientInput ingredients={ingredients} onChange={setIngredients} />
      </View>

      <View style={styles.section}>
        <StepInput steps={steps} onChange={setSteps} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Dificultad</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map(d => (
            <Pressable
              key={d.value}
              style={[
                styles.difficultyOption,
                difficulty === d.value && styles.difficultySelected,
              ]}
              onPress={() => setDifficulty(d.value)}
            >
              <Text
                style={[
                  styles.difficultyText,
                  difficulty === d.value && styles.difficultyTextSelected,
                ]}
              >
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <Text style={styles.label}>Prep. (min)</Text>
          <TextInput
            style={styles.input}
            value={prepTime}
            onChangeText={setPrepTime}
            placeholder="15"
            placeholderTextColor={Colors.brownLight}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.timeField}>
          <Text style={styles.label}>Cocción (min)</Text>
          <TextInput
            style={styles.input}
            value={cookTime}
            onChangeText={setCookTime}
            placeholder="30"
            placeholderTextColor={Colors.brownLight}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagsContainer}>
          {tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <Pressable onPress={() => removeTag(tag)}>
                <MaterialIcons name="close" size={14} color={Colors.greenAccent} />
              </Pressable>
            </View>
          ))}
        </View>
        <TextInput
          ref={tagInputRef}
          style={styles.input}
          value={tagInput}
          onChangeText={handleTagInputChange}
          placeholder="Escribe un tag y presiona Enter"
          placeholderTextColor={Colors.brownLight}
          onSubmitEditing={() => addTag(tagInput)}
          returnKeyType="done"
        />
        {showTagSuggestions && (
          <View style={styles.suggestions}>
            {filteredTags.map(tag => (
              <Pressable
                key={tag}
                style={styles.suggestion}
                onPress={() => addTag(tag)}
              >
                <Text style={styles.suggestionText}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Visibilidad</Text>
        <View style={styles.visibilityRow}>
          <Pressable
            style={[
              styles.visibilityOption,
              isPublic && styles.visibilitySelected,
            ]}
            onPress={() => setIsPublic(true)}
          >
            <MaterialIcons
              name="public"
              size={20}
              color={isPublic ? Colors.white : Colors.brownMedium}
            />
            <Text
              style={[
                styles.visibilityText,
                isPublic && styles.visibilityTextSelected,
              ]}
            >
              Público
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.visibilityOption,
              !isPublic && styles.visibilitySelected,
            ]}
            onPress={() => setIsPublic(false)}
          >
            <MaterialIcons
              name="lock"
              size={20}
              color={!isPublic ? Colors.white : Colors.brownMedium}
            />
            <Text
              style={[
                styles.visibilityText,
                !isPublic && styles.visibilityTextSelected,
              ]}
            >
              Privado
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={isEditing ? 'Guardar cambios' : 'Publicar receta'}
          onPress={handleSave}
          loading={saving}
        />

        {isEditing && (
          <Button
            title="Eliminar receta"
            onPress={handleDeletePress}
            variant="secondary"
          />
        )}
      </View>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Eliminar receta"
        message="¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing['2xl'] * 2,
    gap: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cream,
  },
  screenTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.brownDark,
  },
  section: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.body,
    color: Colors.brownDark,
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.sm + 2,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  difficultySelected: {
    backgroundColor: Colors.greenAccent,
    borderColor: Colors.greenAccent,
  },
  difficultyText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  difficultyTextSelected: {
    color: Colors.white,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeField: {
    flex: 1,
    gap: Spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  suggestions: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  suggestion: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    fontSize: FontSize.body,
    color: Colors.brownDark,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  visibilitySelected: {
    backgroundColor: Colors.greenAccent,
    borderColor: Colors.greenAccent,
  },
  visibilityText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  visibilityTextSelected: {
    color: Colors.white,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
