# Replications - Replicaciones de Recetas

## Descripción

Sistema para que los usuarios registren cuando cocinan una receta existente. Permite subir una foto del resultado, añadir un comentario y puntuar la receta. Notifica al autor original.

## Funcionalidades

### 1. Replicar Receta
- Acceso desde detalle de receta: botón "He cocinado esta receta"
- Abrir modal/formulario con:
  - Imagen del resultado (opcional, subir a Supabase Storage)
  - Comentario (opcional)
  - Puntuación (1-5 estrellas, opcional pero recomendado)
- Guardar en `recipe_replications`
- Notificar al autor de la receta:
  - Crear notificación in-app en `notifications`
  - Enviar push notification

### 2. Ver Replicaciones de una Receta
- En detalle de receta: sección "Replicaciones" con lista
- Cada item: avatar del usuario, imagen (si tiene), comentario, rating, fecha
- Paginación

### 3. Ver Mis Replicaciones
- En perfil: sección "Mis replicaciones"
- Lista de recetas que he cocinado

## Componentes

### `code/components/ReplicationForm.tsx`
- Modal/sheet desde detalle de receta
- ImagePicker para foto del resultado
- TextInput multiline para comentario
- RatingStars para puntuación
- Botón "Publicar replicación"
- Estado de carga y errores

### `code/components/ReplicationItem.tsx`
- Props: replication
- Avatar del usuario
- Imagen (si tiene, click para ver completa)
- Comentario
- Estrellas de rating
- Fecha relativa

### `code/components/RatingStars.tsx`
- Props: rating, onChange?, readonly?
- 5 estrellas interactivas o de solo lectura
- Soporte para media estrella (opcional)

## Hooks

### `code/hooks/useRecipeDetail.ts`

```typescript
interface UseRecipeDetailReturn {
  recipe: Recipe | null;
  replications: Replication[];
  comments: Comment[];
  loading: boolean;
  replicate: (data: ReplicationInput) => Promise<{ error?: string }>;
  favorite: () => Promise<{ error?: string }>;
  unfavorite: () => Promise<{ error?: string }>;
  isFavorited: boolean;
  addToCollection: (collectionId: string) => Promise<{ error?: string }>;
}
```

### `code/hooks/useReplications.ts`

```typescript
interface UseReplicationsReturn {
  replications: Replication[];
  loading: boolean;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}
```

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

### RLS

```sql
ALTER TABLE recipe_replications ENABLE ROW LEVEL SECURITY;

-- Lectura: replications de recetas públicas o propias
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

-- Creación: autenticado
CREATE POLICY "Authenticated users can create replications"
  ON recipe_replications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Notificación al Autor

Al crear una replicación, ejecutar:

1. **Insertar notificación in-app:**
```sql
INSERT INTO notifications (user_id, type, title, message, data)
VALUES (
  (SELECT author_id FROM recipes WHERE id = NEW.recipe_id),
  'replication',
  '¡Alguna cocinó tu receta!',
  (SELECT username FROM profiles WHERE id = NEW.user_id) || ' ha cocinado ' || (SELECT title FROM recipes WHERE id = NEW.recipe_id),
  jsonb_build_object('recipe_id', NEW.recipe_id, 'replication_id', NEW.id)
);
```

2. **Enviar push notification** via Edge Function de Supabase:
   - Buscar token push del autor
   - Enviar push con Expo Server SDK
   - Deep link a la receta

## Archivos a Crear

```
code/hooks/useReplications.ts
code/components/ReplicationForm.tsx
code/components/ReplicationItem.tsx
code/components/RatingStars.tsx
```
