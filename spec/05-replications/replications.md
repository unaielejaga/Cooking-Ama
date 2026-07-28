# Replications - Replicaciones de Recetas

## Descripción

Sistema para que los usuarios registren cuando cocinan una receta existente. Permite subir una foto del resultado, añadir un comentario y puntuar la receta. Notifica al autor original. El autor puede reaccionar a las réplicas con emojis.

## Funcionalidades

### 1. Replicar Receta
- Acceso desde detalle de receta: botón "He cocinado esta receta"
- Abrir modal/formulario con:
  - Imagen del resultado **obligatoria** (subir a Supabase Storage bucket `replications`)
  - Puntuación (1-5 estrellas) **obligatoria**
  - Comentario (opcional)
- Validación en cliente antes de enviar
- Guardar en `recipe_replications`
- Notificar al autor de la receta mediante trigger de BD:
  - Inserta en `notifications` automáticamente
  - Omite notificación si el autor se replica a sí mismo

### 2. Editar Replicación
- El usuario puede editar sus propias réplicas
- Icono de lápiz en la réplica (visible solo para el dueño)
- Modal pre-relleno con datos existentes
- Usa UPDATE en vez de INSERT

### 3. Eliminar Replicación
- El usuario puede eliminar sus propias réplicas
- Icono de papelera con diálogo de confirmación
- refresca la lista tras eliminar

### 4. Ver Replicaciones de una Receta
- En detalle de receta: sección "Replicaciones" con lista
- Cada item: avatar del usuario, imagen (click para ver completa), comentario, rating, fecha
- Paginación (10 por página)

### 5. Ver Mis Replicaciones
- En perfil: sección "Mis replicaciones"
- Lista de recetas que he cocinado

### 6. Puntuación Media
- El promedio de ratings de todas las réplicas se calcula en los hooks
- Se muestra en RecipeCard (Home) y en el detalle de receta
- Se recalcula al crear/editar/eliminar réplicas

### 7. Reacciones del Autor
- El creador de la receta puede reaccionar a las réplicas con emojis
- Emojis disponibles: ❤️, 🔥, 👏, 😍, 🎉, 💪
- Las reacciones se muestran como pills con contador
- La reacción del autor se resalta visualmente
- Pulsar una reacción propia la elimina (toggle)

### 8. Visor de Imagen
- Click en la imagen de una réplica la abre a pantalla completa
- Botón X para cerrar (útil en imágenes grandes)
- Fondo negro con resizeMode="contain"

## Componentes

### `code/components/ReplicationForm.tsx`
- Modal/sheet desde detalle de receta
- ImagePicker para foto del resultado (obligatorio)
- TextInput multiline para comentario (opcional)
- RatingStars para puntuación (obligatorio)
- Botón "Publicar replicación" / "Guardar" (modo edición)
- Validación de campos obligatorios con errores inline
- Estado de carga y errores
- Soporta modo creación y edición

### `code/components/ReplicationItem.tsx`
- Props: replication, reactions, canReact, currentUserId, onReact, onRemoveReaction, onImagePress, onEdit, onDelete, isOwner
- Avatar del usuario
- Imagen (click para ver completa)
- Comentario
- Estrellas de rating
- Fecha relativa
- Botones de editar/eliminar (solo dueño)
- Pills de reacciones con contador
- Botón "+" para abrir selector de emojis (solo autor de la receta)
- Emoji picker inline

### `code/components/RatingStars.tsx`
- Props: rating, onChange?, readonly?, size?
- 5 estrellas interactivas o de solo lectura
- Soporte para media estrella

## Hooks

### `code/hooks/useRecipeDetail.ts`

```typescript
interface UseRecipeDetailReturn {
  recipe: Recipe | null;
  replications: Replication[];
  comments: Comment[];
  loading: boolean;
  replicationsLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refreshReplications: () => Promise<void>;
}
```

- Calcula `avg_rating` desde `recipe_replications` al cargar el detalle
- Expone `refreshReplications` para recargar la lista

### `code/hooks/useReplications.ts`

```typescript
interface UseReplicationsReturn {
  replications: Replication[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

- Paginación con cursor
- Función helper `createReplication()` exportada

## Base de Datos

### Tabla recipe_replications

```sql
CREATE TABLE recipe_replications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  image_url TEXT,
  comment TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla replication_reactions

```sql
CREATE TABLE replication_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replication_id UUID NOT NULL REFERENCES recipe_replications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (replication_id, user_id, emoji)
);
```

### Storage

- Bucket `replications` (público) para imágenes de réplicas
- Path: `{userId}/{recipeId}/{timestamp}.{ext}`
- RLS: propietario puede leer/actualizar/eliminar; autenticados pueden insertar

### RLS

```sql
ALTER TABLE recipe_replications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replications viewable for accessible recipes"
  ON recipe_replications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_replications.recipe_id
      AND (
        r.is_public = true
        OR r.author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM recipe_shares rs
          JOIN group_members gm ON gm.group_id = rs.group_id
          WHERE rs.recipe_id = r.id
          AND gm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Authenticated users can create replications"
  ON recipe_replications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replications"
  ON recipe_replications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own replications"
  ON recipe_replications FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE replication_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON replication_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON replication_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON replication_reactions FOR DELETE
  USING (auth.uid() = user_id);
```

## Trigger de Notificación

```sql
CREATE OR REPLACE FUNCTION notify_recipe_replication()
RETURNS TRIGGER AS $$
DECLARE
  recipe_author_id UUID;
  replicator_username TEXT;
  recipe_title TEXT;
BEGIN
  SELECT author_id INTO recipe_author_id FROM recipes WHERE id = NEW.recipe_id;
  SELECT username INTO replicator_username FROM profiles WHERE id = NEW.user_id;
  SELECT title INTO recipe_title FROM recipes WHERE id = NEW.recipe_id;

  IF recipe_author_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      recipe_author_id,
      'replication',
      '¡Alguien cocinó tu receta!',
      replicator_username || ' ha cocinado ' || recipe_title,
      jsonb_build_object('recipe_id', NEW.recipe_id, 'replication_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_replication_created
  AFTER INSERT ON recipe_replications
  FOR EACH ROW
  EXECUTE FUNCTION notify_recipe_replication();
```

## Puntuación Media

El `avg_rating` se calcula en los hooks consultando `recipe_replications`:

```typescript
// En useRecipes (feed):
const { data: ratingsData } = await supabase
  .from('recipe_replications')
  .select('recipe_id, rating')
  .in('recipe_id', recipeIds)
  .not('rating', 'is', null);
// Agrupar por recipe_id y promediar

// En useRecipeDetail (detalle):
const { data: avgData } = await supabase
  .from('recipe_replications')
  .select('rating')
  .eq('recipe_id', id)
  .not('rating', 'is', null);
// Calcular promedio
```

## Migraciones

- `015_replications_rls.sql` — rating column, RLS, storage bucket, trigger de notificación
- `016_replication_reactions.sql` — tabla de reacciones con RLS

## Archivos

```
code/hooks/useReplications.ts
code/hooks/useRecipeDetail.ts          (modificado)
code/components/RatingStars.tsx
code/components/ReplicationItem.tsx
code/components/ReplicationForm.tsx
code/app/(tabs)/recipe/[id].tsx        (modificado)
code/lib/types.ts                      (modificado)
code/lib/supabase.ts                   (modificado)
```
