# Favorites - Favoritos y Colecciones

## Descripción

Sistema de marcadores personales: favoritos (recetas guardadas rápido) y colecciones (organización personal de recetas en categorías).

## Funcionalidades

### 1. Favoritos
- Marcar/desmarcar receta como favorita desde detalle o card
- Botón corazón en `RecipeCard` y en `recipe/[id].tsx`
- Pantalla de favoritos en perfil
- Contador de favoritos en perfil

### 2. Colecciones
- Crear colecciones con nombre y descripción
- Agregar recetas desde detalle de receta
- Ver colecciones en perfil
- Ver detalle de colección con lista de recetas
- Eliminar receta de colección
- Eliminar colección completa

### 3. Agregar a Colección
- Desde detalle de receta: botón "Agregar a colección"
- Modal/selector de colecciones del usuario
- Opción de crear nueva colección en el momento
- Agregar a múltiples colecciones

## Pantallas

### `code/src/app/(tabs)/profile.tsx` (sección)
- Contadores: recetas creadas | favoritos | colecciones
- Botón "Favoritos" → lista de recetas favoritas
- Botón "Mis colecciones" → lista de colecciones
- Botón "+" para crear colección

### `code/src/app/collections/[id].tsx`
- Header: nombre de colección, descripción
- Lista de recetas en la colección
- Botón "Eliminar" en cada receta (swipe o botón)
- Pull-to-refresh

## Componentes

### `code/components/FavoriteButton.tsx`
- Props: recipeId, isFavorited, onToggle
- Corazón outline/solid según estado
- Animación de toggle (opcional)
- Tamaño configurable

### `code/components/CollectionCard.tsx`
- Props: collection, recipeCount, onPress
- Nombre, descripción, contador de recetas
- Card

### `code/components/CollectionSelector.tsx`
- Modal/bottom sheet
- Lista de colecciones del usuario con checkbox
- Botón crear nueva colección
- Botón "Agregar" para confirmar

## Hooks

### `code/hooks/useFavorites.ts`

```typescript
interface UseFavoritesReturn {
  favorites: Recipe[];
  loading: boolean;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isFavorited: (recipeId: string) => boolean;
  refresh: () => Promise<void>;
}
```

### `code/hooks/useCollections.ts`

```typescript
interface UseCollectionsReturn {
  collections: Collection[];
  loading: boolean;
  createCollection: (data: CreateCollectionInput) => Promise<{ id?: string; error?: string }>;
  deleteCollection: (id: string) => Promise<{ error?: string }>;
  addToCollection: (collectionId: string, recipeId: string) => Promise<{ error?: string }>;
  removeFromCollection: (collectionId: string, recipeId: string) => Promise<{ error?: string }>;
  getCollectionsForRecipe: (recipeId: string) => Collection[];
  refresh: () => Promise<void>;
}
```

## Base de Datos

### Tabla favorites

```sql
CREATE TABLE favorites (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);
```

### Tabla collections

```sql
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla collection_recipes

```sql
CREATE TABLE collection_recipes (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (collection_id, recipe_id)
);
```

### RLS

```sql
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_recipes ENABLE ROW LEVEL SECURITY;

-- favorites: solo propio
CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);

-- collections: solo propio (lectura públicas por URL opcional)
CREATE POLICY "Users can manage own collections"
  ON collections FOR ALL
  USING (auth.uid() = user_id);

-- collection_recipes: solo propio
CREATE POLICY "Users can manage own collection recipes"
  ON collection_recipes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE id = collection_recipes.collection_id
      AND user_id = auth.uid()
    )
  );
```

## Archivos a Crear

```
code/hooks/useFavorites.ts
code/hooks/useCollections.ts
code/components/FavoriteButton.tsx
code/components/CollectionCard.tsx
code/components/CollectionSelector.tsx
code/src/app/collections/[id].tsx
```
