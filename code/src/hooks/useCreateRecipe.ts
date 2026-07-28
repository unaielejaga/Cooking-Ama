import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RecipeInput } from '@/lib/types';

export interface UseCreateRecipeReturn {
  createRecipe: (data: RecipeInput) => Promise<{ id?: string; error?: string }>;
  updateRecipe: (id: string, data: RecipeInput) => Promise<{ error?: string }>;
  deleteRecipe: (id: string) => Promise<{ error?: string }>;
  uploadImage: (uri: string, userId: string, recipeId: string) => Promise<{ url?: string; error?: string }>;
  uploading: boolean;
  progress: number;
}

export function useCreateRecipe(): UseCreateRecipeReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = useCallback(async (uri: string, userId: string, recipeId: string) => {
    setUploading(true);
    setProgress(0);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      const filePath = `${userId}/${recipeId}/main.${ext}`;

      setProgress(30);

      const { data, error } = await supabase.storage
        .from('recipes')
        .upload(filePath, blob, {
          contentType: blob.type,
          cacheControl: '3600',
          upsert: true,
        });

      if (error) return { error: error.message };

      setProgress(100);

      return { url: data.path };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al subir imagen' };
    } finally {
      setUploading(false);
    }
  }, []);

  const createRecipe = useCallback(async (input: RecipeInput) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { error: 'No autenticado' };
      const currentUser = session.user;

      const { data, error } = await supabase
        .from('recipes')
        .insert({
          author_id: currentUser.id,
          title: input.title,
          description: input.description || null,
          ingredients: input.ingredients,
          steps: input.steps,
          is_public: input.is_public,
          difficulty: input.difficulty || null,
          prep_time_minutes: input.prep_time_minutes || null,
          cook_time_minutes: input.cook_time_minutes || null,
          tags: input.tags,
        })
        .select('id')
        .single();

      if (error) return { error: error.message };
      const recipeId = data.id;

      if (input.image_url) {
        const result = await uploadImage(input.image_url, currentUser.id, recipeId);
        if (result.error) return { error: result.error };
        const { error: updateError } = await supabase
          .from('recipes')
          .update({ image_url: result.url, updated_at: new Date().toISOString() })
          .eq('id', recipeId);
        if (updateError) return { error: updateError.message };
      }

      if (!input.is_public && input.shared_with) {
        const shares: { recipe_id: string; group_id: string }[] =
          (input.shared_with.groups || []).map(groupId => ({
            recipe_id: recipeId,
            group_id: groupId,
          }));

        if (shares.length > 0) {
          const { error: shareError } = await supabase
            .from('recipe_shares')
            .insert(shares);

          if (shareError) return { error: shareError.message };
        }
      }

      return { id: recipeId };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al crear receta' };
    }
  }, [uploadImage]);

  const updateRecipe = useCallback(async (id: string, input: RecipeInput) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { error: 'No autenticado' };
      const currentUser = session.user;

      let image_url = input.image_url;
      if (input.image_url && (input.image_url.startsWith('file://') || input.image_url.startsWith('blob:'))) {
        const result = await uploadImage(input.image_url, currentUser.id, id);
        if (result.error) return { error: result.error };
        image_url = result.url;
      }

      const { error } = await supabase
        .from('recipes')
        .update({
          title: input.title,
          description: input.description || null,
          ingredients: input.ingredients,
          steps: input.steps,
          image_url: image_url || null,
          is_public: input.is_public,
          difficulty: input.difficulty || null,
          prep_time_minutes: input.prep_time_minutes || null,
          cook_time_minutes: input.cook_time_minutes || null,
          tags: input.tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) return { error: error.message };

      if (!input.is_public && input.shared_with?.groups) {
        await supabase.from('recipe_shares').delete().eq('recipe_id', id);

        const shares = input.shared_with.groups.map(groupId => ({
          recipe_id: id,
          group_id: groupId,
        }));

        if (shares.length > 0) {
          const { error: shareError } = await supabase
            .from('recipe_shares')
            .insert(shares);

          if (shareError) return { error: shareError.message };
        }
      }

      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al actualizar receta' };
    }
  }, [uploadImage]);

  const deleteRecipe = useCallback(async (id: string) => {
    try {
      const { data: recipe } = await supabase
        .from('recipes')
        .select('image_url')
        .eq('id', id)
        .single();

      if (recipe?.image_url) {
        await supabase.storage
          .from('recipes')
          .remove([recipe.image_url]);
      }

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) return { error: error.message };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al eliminar receta' };
    }
  }, []);

  return { createRecipe, updateRecipe, deleteRecipe, uploadImage, uploading, progress };
}
