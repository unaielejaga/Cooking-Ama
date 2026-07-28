# Search - Búsqueda Avanzada

## Descripción

Sistema de búsqueda con filtros avanzados para encontrar recetas por título, ingredientes, categoría, dificultad, tiempo de cocción y más. Usa capacidades de búsqueda full-text de PostgreSQL.

## Funcionalidades

### 1. Búsqueda por Texto
- Barra de búsqueda principal
- Búsqueda full-text en título y descripción
- Autocompletado de sugerencias
- Historial de búsquedas recientes

### 2. Filtros Avanzados
- **Tags/Categorías:** Selector múltiple de tags
- **Ingrediente:** Buscar recetas que contengan ingrediente específico
- **Dificultad:** Fácil / Media / Difícil (checkboxes)
- **Tiempo total:** Rango de minutos (preparación + cocción)
- **Solo favoritos:** Filtrar solo recetas favoritas
- **Solo mis recetas:** Filtrar solo recetas propias
- **Ordenar por:** Más recientes, Más antiguos, Mejor valorados, Más replicados

### 3. Resultados
- Lista de recetas que coinciden con búsqueda/filtros
- Contador de resultados
- Mantener scroll position al volver
- Pull-to-refresh

## Pantalla

### `code/src/app/(tabs)/search.tsx`
- Header fijo con barra de búsqueda
- Botón de filtros (abre panel/modal de filtros)
- Chips de filtros activos (x para quitar)
- Lista de resultados (FlatList)
- Empty state: "No se encontraron recetas"
- Loading skeleton

## Componentes

### `code/components/SearchBar.tsx`
- Props: value, onChangeText, onClear, placeholder
- Input con icono de búsqueda
- Botón de limpiar (x)
- Debounce en la búsqueda (300ms)

### `code/components/FilterPanel.tsx`
- Props: filters, onChange, onApply, onClear
- Modal/bottom sheet
- Checkboxes de dificultad
- Selector de tags (multi-select)
- Input de ingrediente
- Rango de tiempo
- Botones "Aplicar" y "Limpiar filtros"

### `code/components/FilterChips.tsx`
- Props: filters, onRemove
- Lista horizontal de chips
- Cada chip: label + botón x

### `code/components/SearchSuggestions.tsx`
- Props: suggestions, onSelect
- Lista de sugerencias debajo del search bar
- Tags populares como sugerencias

## Hooks

### `code/hooks/useSearch.ts`

```typescript
interface SearchFilters {
  query: string;
  tags: string[];
  ingredient: string;
  difficulty: ('easy' | 'medium' | 'hard')[];
  maxTime: number | null;
  onlyFavorites: boolean;
  onlyMine: boolean;
  sortBy: 'newest' | 'oldest' | 'rating' | 'replications';
}

interface UseSearchReturn {
  results: Recipe[];
  loading: boolean;
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  popularTags: string[];
}
```

## Base de Datos

### Búsqueda Full-Text

```sql
-- Índice de búsqueda
CREATE INDEX idx_recipes_search ON recipes
  USING GIN (to_tsvector('spanish', title || ' ' || COALESCE(description, '')));

-- Búsqueda
SELECT * FROM recipes
WHERE to_tsvector('spanish', title || ' ' || COALESCE(description, ''))
  @@ plainto_tsquery('spanish', $1)
AND is_public = true;
```

### Búsqueda por Ingrediente

```sql
-- Buscar en JSONB de ingredientes
SELECT * FROM recipes
WHERE ingredients @> '[{"name": "tomate"}]'::jsonb
AND is_public = true;
```

### Búsqueda por Tag

```sql
SELECT * FROM recipes
WHERE tags && ARRAY['italiana', 'pasta']
AND is_public = true;
```

### Búsqueda por Tiempo

```sql
SELECT * FROM recipes
WHERE (COALESCE(prep_time_minutes, 0) + COALESCE(cook_time_minutes, 0)) <= 60
AND is_public = true;
```

## Archivos a Crear

```
code/hooks/useSearch.ts
code/components/SearchBar.tsx
code/components/FilterPanel.tsx
code/components/FilterChips.tsx
code/components/SearchSuggestions.tsx
code/src/app/(tabs)/search.tsx
```
