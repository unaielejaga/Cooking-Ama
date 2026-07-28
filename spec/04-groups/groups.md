# Groups - Gestión de Grupos

## Descripción

Sistema simplificado de grupos para compartir recetas privadas. Los usuarios crean grupos, invitan a otros usuarios y comparten recetas privadas dentro del grupo.

## Funcionalidades

### 1. Crear Grupo
- Formulario: nombre (requerido), descripción (opcional)
- El creador se asigna como `admin` automáticamente
- Redirigir al detalle del grupo creado

### 2. Unirse a Grupo
- Buscar grupo por nombre o código de invitación
- Unirse al grupo como `member`
- Confirmación antes de unirse

### 3. Salir del Grupo
- Botón "Salir del grupo" (excepto el admin)
- Confirmación antes de salir
- Si el admin sale y hay otros miembros: transferir admin al miembro más antiguo

### 4. Eliminar Grupo
- Solo el admin puede eliminar
- Confirmación (CASCADE elimina members y shares)

### 5. Gestionar Miembros
- Ver lista de miembros con rol
- Admin puede expulsar miembros
- Admin puede promover a miembro a admin

### 6. Compartir Recetas en Grupo
- Desde detalle de receta privada: seleccionar grupo(s)
- Crear registro en `recipe_shares`
- En feed del grupo: mostrar recetas compartidas

### 7. Feed de Grupo
- Lista de recetas compartidas en el grupo
- Misma estructura que feed principal pero filtrado por grupo

## Pantallas

### `code/src/app/(tabs)/groups.tsx`
- Lista de mis grupos (donde soy miembro)
- Botón "+" para crear grupo
- Cada item: nombre, descripción, número de miembros, número de recetas
- Pull-to-refresh

### `code/src/app/group/[id].tsx`
- Header: nombre del grupo, descripción
- Tabs: Miembros | Recetas
- **Tab Miembros:**
  - Lista de miembros con avatar, username, rol
  - Admin: botón para invitar (buscar usuario)
  - Admin: botón para expulsar
- **Tab Recetas:**
  - Lista de recetas compartidas en el grupo
  - Botón "Compartir receta" → selector de recetas privadas propias
  - Pull-to-refresh

## Componentes

### `code/components/GroupCard.tsx`
- Props: group, onPress, memberCount, recipeCount
- Muestra: nombre, descripción truncada, badges (miembros, recetas)
- Estilo: card

### `code/components/UserSelector.tsx`
- Input de búsqueda de usuarios
- Lista de resultados con avatar y username
- Selección múltiple (para invitar)
- Seleccionados mostrados como chips removibles

## Hooks

### `code/hooks/useGroups.ts`

```typescript
interface UseGroupsReturn {
  groups: GroupWithDetails[];
  loading: boolean;
  createGroup: (data: CreateGroupInput) => Promise<{ id?: string; error?: string }>;
  joinGroup: (groupId: string) => Promise<{ error?: string }>;
  leaveGroup: (groupId: string) => Promise<{ error?: string }>;
  deleteGroup: (groupId: string) => Promise<{ error?: string }>;
  refresh: () => Promise<void>;
}
```

### `code/hooks/useGroupDetail.ts`

```typescript
interface UseGroupDetailReturn {
  group: GroupWithDetails | null;
  members: GroupMember[];
  recipes: Recipe[];
  loading: boolean;
  inviteUser: (userId: string) => Promise<{ error?: string }>;
  removeMember: (userId: string) => Promise<{ error?: string }>;
  shareRecipe: (recipeId: string) => Promise<{ error?: string }>;
  unshareRecipe: (recipeId: string) => Promise<{ error?: string }>;
}
```

## RLS - groups

```sql
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;

-- groups: lectura solo miembros
CREATE POLICY "Members can view group"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = groups.id
      AND user_id = auth.uid()
    )
  );

-- groups: creación autenticado
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- group_members: lectura solo miembros del grupo
CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- group_members: admin puede gestionar
CREATE POLICY "Admins can manage members"
  ON group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- recipe_shares: solo autor de la receta puede compartir
CREATE POLICY "Authors can share their recipes"
  ON recipe_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE id = recipe_shares.recipe_id
      AND author_id = auth.uid()
    )
  );
```

## Archivos a Crear

```
code/hooks/useGroups.ts
code/hooks/useGroupDetail.ts
code/components/GroupCard.tsx
code/components/UserSelector.tsx
code/src/app/(tabs)/groups.tsx
code/src/app/group/[id].tsx
```
