# Recipes - CRUD de Recetas

## Descripción

Sistema completo de creación, lectura, actualización y eliminación de recetas. Incluye feed principal, detalle de receta, y lógica de visibilidad (público/privado).

## Funcionalidades

### 1. Crear Receta
- Formulario completo con:
  - Título (requerido)
  - Descripción (opcional)
  - Ingredientes: lista dinámica (add/remove) con cantidad, unidad, nombre
  - Pasos: lista dinámica (add/remove) con orden y descripción
  - Imagen principal (pick de galería o cámara, subir a Supabase Storage)
  - Dificultad: fácil / media / difícil
  - Tiempo de preparación (minutos)
  - Tiempo de cocción (minutos)
  - Tags: input con autocompletado de tags existentes
  - Visibilidad: público / privado
  - Si privado: selector de usuarios o grupos para compartir
- Guardar en tabla `recipes` + subir imagen a Storage
- Si es privada: crear registros en `recipe_shares`

### 2. Feed de Recetas
- Pantalla principal `(tabs)/index.tsx`
- Lista scrollable con `FlatList`
- Cada item: `RecipeCard` con imagen, título, autor (avatar + username), dificultad, tiempo, media rating
- Pull-to-refresh
- Paginación por cursor (created_at DESC)
- Filtrar: solo públicas + privadas propias + privadas compartidas por grupos

### 3. Detalle de Receta
- Ruta: `recipe/[id].tsx`
- Imagen grande
- Título, descripción
- Info: autor, dificultad, tiempos
- Lista de ingredientes con cantidades
- Lista de pasos numerados
- Rating promedio (estrellas)
- Botones de acción:
  - "He cocinado esta receta" → abrir modal para subir imagen/comentario
  - "Favorito" (corazón)
  - "Agregar a colección"
  - "Compartir"
- Sección de comentarios/valoraciones
- Sección de replicaciones recientes

### 4. Editar Receta
- Solo el autor puede editar
- Mismo formulario que crear, pre-populado
- Actualizar timestamp `updated_at`

### 5. Eliminar Receta
- Solo el autor puede eliminar
- Confirmación antes de eliminar
- CASCADE: elimina shares, comentarios, replicaciones, favoritos asociados

## Componentes

### `code/components/RecipeCard.tsx`
- Props: recipe, onPress
- Muestra: imagen placeholder si no tiene, título truncado, autor con avatar, badges (dificultad, tiempo, público/privado)
- Estilo: card sombreada, border-radius

### `code/components/IngredientInput.tsx`
- Lista dinámica de ingredientes
- Cada fila: cantidad (TextInput) + unidad (TextInput) + nombre (TextInput) + botón eliminar
- Botón "Agregar ingrediente" al final

### `code/components/StepInput.tsx`
- Lista dinámica de pasos
- Cada fila: número de orden + descripción (TextInput multiline) + botón eliminar
- Botón "Agregar paso" al final
- Drag to reorder (opcional)

### `code/components/ImagePicker.tsx`
- Wrapper sobre `expo-image-picker`
- Opciones: galería o cámara
- Preview de imagen seleccionada
- Upload a Supabase Storage con progress

## Notas sobre subida de imágenes

### Flujo de subida
1. `ImagePicker` devuelve una URI local (`file://` en native, `blob:` en web)
2. `createRecipe` en `useCreateRecipe.ts` inserta la receta primero (sin `image_url`)
3. Luego `uploadImage` hace `fetch(uri) → blob` y sube a Supabase Storage
4. Finalmente se hace `UPDATE recipes SET image_url = ...`

### Errores corregidos

| Problema | Archivo | Fix |
|----------|---------|-----|
| Bucket `recipes` no existía | Nueva migración `011_storage_buckets.sql` | Creación del bucket + RLS policies |
| Error de `uploadImage` silenciado en creación | `useCreateRecipe.ts:82-89` | Ahora retorna `{ error }` si falla |
| URI `blob:` no detectada en edición web | `useCreateRecipe.ts:121` | Cambiado `startsWith('file://')` → `!startsWith('http')` |
| Error de `UPDATE image_url` tras upload silenciado | `useCreateRecipe.ts:85-89` | Ahora retorna el error si falla |
| Funciones SECURITY DEFINER expuestas como RPC | Migración `012_private_schema.sql` | Movidas a schema `_private` fuera del alcance de PostgREST |

### Pendiente para producción
- Validar tamaño y tipo de imagen en cliente antes de subir
- Limpiar imagen de Storage al eliminar receta
- Configurar bucket S3 externo en producción (actualmente usa backend local `file`)

## Hooks

### `code/hooks/useRecipes.ts`

```typescript
interface UseRecipesReturn {
  recipes: Recipe[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}
```

### `code/hooks/useCreateRecipe.ts`

```typescript
interface UseCreateRecipeReturn {
  createRecipe: (data: RecipeInput) => Promise<{ id?: string; error?: string }>;
  updateRecipe: (id: string, data: RecipeInput) => Promise<{ error?: string }>;
  deleteRecipe: (id: string) => Promise<{ error?: string }>;
  uploading: boolean;
  progress: number;
}
```

## Supabase Storage

### Bucket: `recipes`
- Path: `recipes/{user_id}/{recipe_id}/{filename}`
- Ruta real en código: `${userId}/${recipeId}/main.${ext}` (sin prefijo `recipes/` porque `supabase.storage.from('recipes')` ya scopes al bucket)
- Tamaño máximo: 10MB
- Tipos permitidos: image/jpeg, image/png, image/webp
- **Creación:** El bucket se crea mediante la migración `011_storage_buckets.sql`. No existe automáticamente.
- **RLS:** El bucket tiene políticas RLS (lectura pública, inserción solo autenticados, update/delete solo dueño según `userId` en la ruta). Ver `011_storage_buckets.sql`.

### Bucket: `replications`
- Path: `replications/{user_id}/{replication_id}/{filename}`
- Tamaño máximo: 10MB

## RLS - recipes

```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public recipes are viewable by authenticated users"
  ON recipes FOR SELECT
  USING (is_public = true OR auth.uid() = author_id);

CREATE POLICY "Private recipes viewable by author and shared groups"
  ON recipes FOR SELECT
  USING (
    is_public = false AND (
      auth.uid() = author_id
      OR EXISTS (
        SELECT 1 FROM recipe_shares rs
        JOIN group_members gm ON gm.group_id = rs.group_id
        WHERE rs.recipe_id = recipes.id
        AND gm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = author_id);
```

## Archivos a Crear

```
code/hooks/useRecipes.ts
code/hooks/useCreateRecipe.ts
code/hooks/useRecipeDetail.ts
code/components/RecipeCard.tsx
code/components/IngredientInput.tsx
code/components/StepInput.tsx
code/components/ImagePicker.tsx
code/src/app/(tabs)/index.tsx              # Feed
code/src/app/(tabs)/create.tsx             # Crear receta
code/src/app/recipe/[id].tsx               # Detalle
```
