# Profile - Perfil de Usuario

## Descripción

Pantalla de perfil del usuario con información personal, estadísticas y acceso a secciones personales (recetas creadas, favoritos, colecciones, configuración).

## Funcionalidades

### 1. Ver Perfil
- Avatar (imagen o iniciales por defecto)
- Username
- Nombre display
- Fecha de registro
- Estadísticas: recetas creadas, favoritos, colecciones

### 2. Editar Perfil
- Cambiar avatar (subir a Supabase Storage)
- Cambiar nombre display
- Cambiar username (con validación de unicidad)
- Guardar cambios

### 3. Secciones del Perfil
- **Mis Recetas:** Lista de recetas propias (públicas y privadas)
- **Favoritos:** Lista de recetas marcadas como favoritas
- **Mis Colecciones:** Lista de colecciones personales
- **Configuración:** Cerrar sesión

### 4. Perfil de Otros Usuarios
- Ruta: `profile/[id].tsx`
- Ver recetas públicas del usuario
- Avatar, username, nombre display
- Sin acceso a editar o ver privadas

## Pantallas

### `code/src/app/(tabs)/profile.tsx`
- Header con avatar, username, nombre
- Botón editar perfil
- Contadores: recetas | favoritos | colecciones
- Secciones expandibles o tabs:
  - Mis Recetas (con filtro público/privado)
  - Favoritos
  - Mis Colecciones
- Botón cerrar sesión al final

### `code/src/app/profile/[id].tsx` (opcional)
- Perfil de otro usuario
- Solo recetas públicas

## Componentes

### `code/components/ProfileHeader.tsx`
- Props: profile, isOwnProfile, onEdit
- Avatar grande (click para cambiar si es propio)
- Username, nombre display
- Estadísticas (recetas, favoritos, colecciones)

### `code/components/ProfileStats.tsx`
- Props: recipesCount, favoritesCount, collectionsCount
- Grid de estadísticas
- Números grandes + labels

### `code/components/ProfileSection.tsx`
- Props: title, count, children
- Sección expandible con título y contador
- Lista de items (recetas, favoritos, colecciones)

## Hooks

### `code/hooks/useProfile.ts`

```typescript
interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (data: UpdateProfileInput) => Promise<{ error?: string }>;
  uploadAvatar: (uri: string) => Promise<{ url?: string; error?: string }>;
  myRecipes: Recipe[];
  favorites: Recipe[];
  collections: Collection[];
  stats: {
    recipesCount: number;
    favoritesCount: number;
    collectionsCount: number;
  };
}
```

## Base de Datos

### Perfil propio

```sql
-- Ya cubierto por RLS de profiles
-- SELECT: público
-- UPDATE: solo propio
```

### Storage: avatar

```
Bucket: avatars
Path: avatars/{user_id}/{filename}
Tamaño máximo: 5MB
Tipos: image/jpeg, image/png, image/webp
```

### RLS para avatars

```sql
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Archivos a Crear

```
code/hooks/useProfile.ts
code/components/ProfileHeader.tsx
code/components/ProfileStats.tsx
code/components/ProfileSection.tsx
code/src/app/(tabs)/profile.tsx
code/src/app/profile/[id].tsx                # Perfil de otro usuario (opcional)
```
