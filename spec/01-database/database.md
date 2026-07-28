# Database - Schema y Migraciones

## Descripción

Definición completa del schema de PostgreSQL, migraciones secuenciales y políticas Row Level Security (RLS). Esta es la base sobre la que se construyen todas las funcionalidades.

## Tablas Principales

### profiles
Extiende `auth.users` de Supabase Auth con datos de perfil públicos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, FK → auth.users | ID del usuario |
| username | TEXT | UNIQUE, NOT NULL | Nombre de usuario único |
| display_name | TEXT | | Nombre para mostrar |
| avatar_url | TEXT | | URL del avatar en Supabase Storage |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

### recipes
Recetas creadas por usuarios. Pueden ser públicas o privadas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID de la receta |
| author_id | UUID | FK → profiles, NOT NULL | Autor |
| title | TEXT | NOT NULL | Título |
| description | TEXT | | Descripción |
| ingredients | JSONB | NOT NULL, DEFAULT '[]' | Lista de ingredientes |
| steps | JSONB | NOT NULL, DEFAULT '[]' | Lista de pasos |
| image_url | TEXT | | URL de imagen principal |
| is_public | BOOLEAN | DEFAULT TRUE | Visibilidad |
| difficulty | TEXT | CHECK IN ('easy','medium','hard') | Dificultad |
| prep_time_minutes | INT | | Tiempo de preparación |
| cook_time_minutes | INT | | Tiempo de cocción |
| tags | TEXT[] | DEFAULT '{}' | Etiquetas para categorización |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Índices:**
- `idx_recipes_author_id` ON author_id
- `idx_recipes_is_public` ON is_public
- `idx_recipes_tags` GIN ON tags
- `idx_recipes_created_at` ON created_at DESC
- `idx_recipes_search` GIN ON (to_tsvector('spanish', title || ' ' || COALESCE(description, '')))

### groups
Grupos simplificados para compartir recetas privadas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | ID del grupo |
| name | TEXT | NOT NULL | Nombre |
| description | TEXT | | Descripción |
| created_by | UUID | FK → profiles, NOT NULL | Creador |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

### group_members
Relación N:N entre grupos y usuarios con rol.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| group_id | UUID | FK → groups, ON DELETE CASCADE | Grupo |
| user_id | UUID | FK → profiles, ON DELETE CASCADE | Usuario |
| role | TEXT | DEFAULT 'member', CHECK IN ('admin','member') | Rol |
| joined_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de ingreso |

**PK compuesta:** (group_id, user_id)

### recipe_shares
Vincula recetas privadas con grupos para compartir.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | ID del share |
| recipe_id | UUID | FK → recipes, ON DELETE CASCADE | Receta |
| group_id | UUID | FK → groups, ON DELETE CASCADE | Grupo |
| shared_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha de compartir |

**Unique:** (recipe_id, group_id)

### recipe_replications
Registro cuando un usuario cocina una receta existente.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | ID de la replicación |
| recipe_id | UUID | FK → recipes, ON DELETE CASCADE | Receta original |
| user_id | UUID | FK → profiles, NOT NULL | Usuario que cocinó |
| image_url | TEXT | | Foto del resultado |
| comment | TEXT | | Comentario |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha |

### favorites
Recetas marcadas como favoritas por usuarios.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| user_id | UUID | FK → profiles, ON DELETE CASCADE | Usuario |
| recipe_id | UUID | FK → recipes, ON DELETE CASCADE | Receta |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha |

**PK compuesta:** (user_id, recipe_id)

### collections
Colecciones personales de recetas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | ID de la colección |
| user_id | UUID | FK → profiles, NOT NULL | Propietario |
| name | TEXT | NOT NULL | Nombre |
| description | TEXT | | Descripción |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha |

### collection_reciples
Relación N:N entre colecciones y recetas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| collection_id | UUID | FK → collections, ON DELETE CASCADE | Colección |
| recipe_id | UUID | FK → recipes, ON DELETE CASCADE | Receta |
| added_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha |

**PK compuesta:** (collection_id, recipe_id)

### comments
Comentarios y valoraciones de recetas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | ID del comentario |
| recipe_id | UUID | FK → recipes, ON DELETE CASCADE | Receta |
| user_id | UUID | FK → profiles, NOT NULL | Autor |
| content | TEXT | NOT NULL | Texto del comentario |
| rating | INT | CHECK (1-5) | Puntuación (estrellas) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha |

### notifications
Notificaciones in-app para usuarios.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | ID |
| user_id | UUID | FK → profiles, NOT NULL | Destinatario |
| type | TEXT | NOT NULL | Tipo (replication, comment, etc.) |
| title | TEXT | NOT NULL | Título |
| message | TEXT | | Mensaje descriptivo |
| data | JSONB | | Datos adicionales (recipe_id, etc.) |
| read | BOOLEAN | DEFAULT FALSE | Leída |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha |

### push_tokens
Tokens de dispositivos para envío de notificaciones push.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| user_id | UUID | FK → profiles, ON DELETE CASCADE | Usuario |
| token | TEXT | NOT NULL | Token Expo Push |
| platform | TEXT | NOT NULL | 'android' | 'ios' | 'web' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Fecha |

**PK compuesta:** (user_id, token)

## Migraciones

Las migraciones se ejecutan en orden secuencial. Cada archivo es una migración atómica.

```
supabase/migrations/
├── 001_profiles.sql
├── 002_recipes.sql
├── 003_groups.sql
├── 004_replications.sql
├── 005_notifications.sql
├── 006_favorites.sql
├── 007_comments.sql
└── 008_rls_policies.sql
```

## Row Level Security (RLS)

Habilitado en TODAS las tablas. Políticas principales:

- **profiles:** Lectura pública del username/avatar; escritura solo propio
- **recipes:** Públicas leíbles por todos autenticados; privadas solo autor + miembros de grupos con share
- **groups:** Lectura solo miembros; creación autenticado
- **group_members:** Lectura solo miembros del grupo
- **recipe_shares:** Solo autor de la receta puede crear
- **recipe_replications:** Lectura pública; creación autenticado
- **favorites:** Solo propio
- **collections:** Solo propio (públicas legibles por URL)
- **collection_recicles:** Solo propio
- **comments:** Lectura pública; creación autenticado
- **notifications:** Solo propio
- **push_tokens:** Solo propio
