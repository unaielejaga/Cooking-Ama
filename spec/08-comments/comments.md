# Comments - Comentarios y Valoraciones

## Descripción

Sistema de comentarios y valoraciones (estrellas) para recetas. Los usuarios pueden dejar un comentario con puntuación opcional en cualquier receta que puedan ver.

## Funcionalidades

### 1. Crear Comentario
- Formulario en detalle de receta
- Campos: contenido (requerido), rating 1-5 estrellas (opcional pero recomendado)
- Un usuario puede comentar múltiples veces en la misma receta
- Al crear comentario: notificar al autor de la receta

### 2. Ver Comentarios
- En detalle de receta: sección "Comentarios"
- Lista cronológica (más recientes primero)
- Cada comentario: avatar, username, contenido, estrellas, fecha relativa
- Paginación

### 3. Editar Comentario
- Solo el autor puede editar
- Inline o modal

### 4. Eliminar Comentario
- Solo el autor puede eliminar
- Confirmación

### 5. Rating Promedio
- Calcular y mostrar rating promedio de la receta
- Basado solo en comentarios que tengan rating

## Componentes

### `code/components/CommentItem.tsx`
- Props: comment, currentUserId, onEdit, onDelete
- Avatar del autor
- Username
- Contenido del comentario
- RatingStars (si tiene rating)
- Fecha relativa
- Menú de opciones (editar/eliminar) si es propio

### `code/components/CommentForm.tsx`
- Props: onSubmit, loading
- TextInput multiline para contenido
- RatingStars para puntuación
- Botón "Publicar"
- Contador de caracteres

### `code/components/RatingStars.tsx`
- Props: value, onChange?, readonly?, size?
- 5 estrellas interactivas o de solo lectura
- Media estrella soportada
- Tamaño configurable (sm, md, lg)

### `code/components/RecipeRating.tsx`
- Muestra rating promedio de la receta
- Número de valoraciones
- Estrellas promedio

## Hooks

### `code/hooks/useComments.ts`

```typescript
interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  addComment: (data: CommentInput) => Promise<{ error?: string }>;
  editComment: (id: string, data: CommentInput) => Promise<{ error?: string }>;
  deleteComment: (id: string) => Promise<{ error?: string }>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  averageRating: number | null;
  totalRatings: number;
}
```

## Base de Datos

### Tabla comments

```sql
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS

```sql
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Lectura: comentarios de recetas públicas o propias
CREATE POLICY "Comments viewable for accessible recipes"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = comments.recipe_id
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
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Edición: solo propio
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Eliminación: solo propio
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);
```

## Notificación al Autor

Al crear un comentario, ejecutar:

```sql
-- Notificar al autor de la receta
INSERT INTO notifications (user_id, type, title, message, data)
VALUES (
  (SELECT author_id FROM recipes WHERE id = NEW.recipe_id),
  CASE
    WHEN NEW.rating IS NOT NULL THEN 'rating'
    ELSE 'comment'
  END,
  CASE
    WHEN NEW.rating IS NOT NULL THEN 'Nueva valoración en tu receta'
    ELSE 'Nuevo comentario en tu receta'
  END,
  (SELECT username FROM profiles WHERE id = NEW.user_id) || ' ha comentado en ' || (SELECT title FROM recipes WHERE id = NEW.recipe_id),
  jsonb_build_object('recipe_id', NEW.recipe_id, 'comment_id', NEW.id)
);
```

## Archivos a Crear

```
code/hooks/useComments.ts
code/components/CommentItem.tsx
code/components/CommentForm.tsx
code/components/RatingStars.tsx
code/components/RecipeRating.tsx
```
