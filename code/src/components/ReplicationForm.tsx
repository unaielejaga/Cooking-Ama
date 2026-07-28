import { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Button } from '@/components/Button';
import { ImagePicker } from '@/components/ImagePicker';
import { RatingStars } from '@/components/RatingStars';
import { ErrorAlert } from '@/components/ErrorAlert';
import { supabase, getReplicationImageUrl } from '@/lib/supabase';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/lib/theme';
import { Replication } from '@/lib/types';

interface ReplicationFormProps {
  visible: boolean;
  recipeId: string;
  recipeTitle: string;
  existingReplication?: Replication;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReplicationForm({ visible, recipeId, recipeTitle, existingReplication, onClose, onSuccess }: ReplicationFormProps) {
  const isEditing = !!existingReplication;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ image?: string; rating?: string }>({});

  useEffect(() => {
    if (visible) {
      setImageUri(null);
      setComment(existingReplication?.comment || '');
      setRating(existingReplication?.rating || 0);
      setError(null);
      setFieldErrors({});
      setExistingImageUrl(
        existingReplication?.image_url ? getReplicationImageUrl(existingReplication.image_url) : null
      );
    }
  }, [visible, existingReplication]);

  const hasImage = !!(imageUri || existingImageUrl);
  const hasRating = rating > 0;
  const canSubmit = hasImage && hasRating;

  const handleSubmit = useCallback(async () => {
    const currentHasImage = !!(imageUri || existingImageUrl);
    const currentHasRating = rating > 0;
    const errors: { image?: string; rating?: string } = {};
    if (!currentHasImage) errors.image = 'La foto del resultado es obligatoria';
    if (!currentHasRating) errors.rating = 'La puntuación es obligatoria';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('No autenticado');
        setUploading(false);
        return;
      }

      let image_url: string | null = existingReplication?.image_url || null;

      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const ext = blob.type.split('/')[1] || 'jpg';
        const filePath = `${session.user.id}/${recipeId}/${Date.now()}.${ext}`;

        const { data, error: uploadError } = await supabase.storage
          .from('replications')
          .upload(filePath, blob, {
            contentType: blob.type,
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          setError(uploadError.message);
          setUploading(false);
          return;
        }

        image_url = data.path;
      }

      const payload = {
        image_url,
        comment: comment.trim() || null,
        rating: rating > 0 ? rating : null,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('recipe_replications')
          .update(payload)
          .eq('id', existingReplication.id);

        if (updateError) {
          setError(updateError.message);
          setUploading(false);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from('recipe_replications')
          .insert({
            ...payload,
            recipe_id: recipeId,
            user_id: session.user.id,
          });

        if (insertError) {
          setError(insertError.message);
          setUploading(false);
          return;
        }
      }

      setImageUri(null);
      setComment('');
      setRating(0);
      onSuccess();
    } catch {
      setError('Error inesperado al crear la replicación');
    } finally {
      setUploading(false);
    }
  }, [imageUri, comment, rating, recipeId, existingReplication, isEditing, onSuccess]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View onStartShouldSetResponder={() => true} style={styles.modal}>
          <ScrollView bounces={false}>
            <Text style={styles.title}>{isEditing ? 'Editar replicación' : 'He cocinado esta receta'}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>{recipeTitle}</Text>

            {error && <ErrorAlert message={error} />}

            <View style={styles.section}>
              <Text style={styles.label}>Foto del resultado *</Text>
              <ImagePicker
                imageUri={imageUri || existingImageUrl}
                onImagePicked={(uri) => { setImageUri(uri); setFieldErrors(p => ({ ...p, image: undefined })); }}
                onRemove={() => { setImageUri(null); }}
              />
              {fieldErrors.image && <Text style={styles.fieldError}>{fieldErrors.image}</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Puntuación *</Text>
              <RatingStars rating={rating} onChange={(v) => { setRating(v); setFieldErrors(p => ({ ...p, rating: undefined })); }} size={36} />
              {fieldErrors.rating && <Text style={styles.fieldError}>{fieldErrors.rating}</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Comentario</Text>
              <TextInput
                style={styles.textInput}
                placeholder="¿Qué tal te quedó?"
                placeholderTextColor={Colors.brownLight}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.buttons}>
              <Button title="Cancelar" onPress={onClose} variant="secondary" />
              <Button title={isEditing ? 'Guardar' : 'Publicar'} onPress={handleSubmit} loading={uploading} disabled={!canSubmit || uploading} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.card,
    borderTopRightRadius: BorderRadius.card,
    borderCurve: 'continuous',
    padding: Spacing.lg,
    maxHeight: '90%',
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semiBold,
    color: Colors.brownDark,
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.brownMedium,
  },
  section: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: Colors.brownMedium,
  },
  textInput: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.input,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.sm,
    fontSize: FontSize.body,
    color: Colors.brownDark,
    minHeight: 80,
  },
  fieldError: {
    fontSize: FontSize.small,
    color: Colors.error,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
});
