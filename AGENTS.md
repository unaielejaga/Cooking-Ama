# Cooking Ama - Agent Guidelines

## Project Overview

Cooking Ama es una aplicación móvil PWA para compartir y distribuir recetas entre usuarios. Permite crear recetas públicas/privadas, organizarlas en grupos, replicar recetas de otros usuarios y recibir notificaciones.

## Deployment Model

Proyecto desplegado íntegramente en entorno local (casa). Todo se ejecuta en contenedores Docker:
- **Backend:** Supabase self-hosted via Docker Compose
- **Frontend:** Expo Web app servida via nginx en Docker
- **Despliegue:** Un solo `docker-compose.yml` para levantar todo

## Tech Stack

- **Frontend:** React Native + Expo SDK 57 + Expo Router (file-based routing)
- **Backend:** Supabase self-hosted (Auth, PostgreSQL, Storage, Realtime, Edge Functions)
- **DB:** PostgreSQL via Supabase con Row Level Security
- **Notificaciones Push:** Expo Push Service (requiere red pública para push nativo)
- **Notificaciones In-App:** Tabla `notifications` + Supabase Realtime
- **PWA:** Metro bundler, `web.output: "static"`, nginx para servir
- **Almacenamiento imágenes:** Supabase Storage
- **Contenedores:** Docker Compose para todo el stack

## Design System

Estilo visual limpio, minimalista y fácil de usar. Paleta de colores cálida y natural.

### Paleta de Colores

| Uso | Color | Hex |
|-----|-------|-----|
| Fondo principal | Blanco | `#FFFFFF` |
| Fondo secundario | Crema claro | `#FAF7F2` |
| Fondo de tarjetas | Blanco hueso | `#F5F0EB` |
| Texto principal | Marrón oscuro | `#3D2B1F` |
| Texto secundario | Marrón medio | `#7A6555` |
| Texto muted | Marrón claro | `#A89585` |
| Acento principal | Verde bosque | `#4A7C59` |
| Acento hover | Verde oscuro | `#3A6247` |
| Acento suave | Verde claro | `#E8F5E9` |
| Bordes | Beige | `#E0D5C8` |
| Error | Rojo suave | `#D32F2F` |
| Éxito | Verde medio | `#4CAF50` |
| Advertencia | Ámbar | `#FFA000` |

### Principios de Diseño

- **Limpieza:** Mucho espacio en blanco, interfaces sin sobrecarga visual
- **Jerarquía clara:** Títulos grandes y bold, contenido bien organizado
- **Consistencia:** Mismos patrones en todas las pantallas
- **Accesibilidad:** Contraste suficiente, texto legible, botones con tamaño mínimo de toque 44x44
- **Sencillez:** Pocos elementos por pantalla, acciones claras

### Tipografía

| Elemento | Tamaño | Peso |
|----------|--------|------|
| H1 (título pantalla) | 28px | Bold |
| H2 (secciones) | 22px | SemiBold |
| H3 (subtítulos) | 18px | Medium |
| Body | 16px | Regular |
| Caption | 14px | Regular |
| Small | 12px | Regular |

### Espaciado Base (8px grid)

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Componentes Base

- **Cards:** Bordes redondeados (12px), sombra sutil, fondo blanco
- **Botones:** Bordes redondeados (8px), fondo verde acento, texto blanco
- **Inputs:** Bordes redondeados (8px), borde beige, fondo blanco, focus verde
- **Header:** Fondo crema, texto marrón oscuro
- **Tab Bar:** Fondo blanco, iconos marrón claro (activo: verde)

## Project Structure

```
cooking-ama/
├── code/                        # Código fuente de la aplicación
│   ├── src/
│   │   └── app/                 # Expo Router (file-based routing)
│   │       ├── (auth)/          # Pantallas de autenticación (no autenticado)
│   │       │   ├── _layout.tsx  # Layout de autenticación
│   │       │   ├── login.tsx    # Inicio de sesión
│   │       │   └── signup.tsx   # Registro
│   │       ├── (tabs)/          # Pantallas principales (autenticado)
│   │       │   ├── _layout.tsx  # Tab navigator layout
│   │       │   ├── index.tsx    # Feed de recetas
│   │       │   ├── search.tsx   # Búsqueda avanzada
│   │       │   ├── create.tsx   # Crear receta
│   │       │   ├── groups.tsx   # Mis grupos
│   │       │   └── profile.tsx  # Mi perfil
│   │       ├── recipe/
│   │       │   └── [id].tsx     # Detalle de receta
│   │       ├── group/
│   │       │   └── [id].tsx     # Detalle de grupo
│   │       ├── collections/
│   │       │   └── [id].tsx     # Detalle de colección
│   │       ├── notifications.tsx # Centro de notificaciones
│   │       ├── +html.tsx        # PWA manifest injection
│   │       └── _layout.tsx      # Root layout (auth gate)
│   ├── components/              # Componentes reutilizables
│   ├── lib/
│   │   ├── supabase.ts          # Cliente Supabase (universal nativo+web)
│   │   ├── notifications.ts     # Push notifications helpers
│   │   ├── types.ts             # Tipos TypeScript del dominio
│   │   └── constants.ts         # Constantes de la app
│   ├── hooks/                   # Custom hooks
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   └── icons/               # Iconos PWA
│   ├── assets/                  # Iconos, imágenes estáticas
│   ├── Dockerfile               # Build de Expo Web
│   ├── nginx/
│   │   └── nginx.conf           # Configuración nginx
│   ├── .dockerignore
│   ├── app.json
│   ├── tsconfig.json
│   └── package.json
├── supabase/
│   ├── config.toml              # Configuración Supabase local
│   ├── migrations/              # Migraciones SQL
│   └── volumes/                 # Datos persistentes Supabase
├── docker-compose.yml           # Stack completo (Supabase + app)
├── docker-compose.dev.yml       # Override para desarrollo
├── spec/                        # Documentación de funcionalidades
└── .env
```

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

## Coding Conventions

- TypeScript estricto (`strict: true` en tsconfig)
- Expo Router para navegación (file-based)
- Hooks personalizados para toda lógica de negocio
- Componentes funcionales + React Compiler (habilitado por defecto SDK 57)
- Estilos con StyleSheet (React Native) o nativewind si se prefiere
- Funciones asíncronas con manejo de errores try/catch
- Supabase RLS para toda lógica de permisos en BD
- Notas: NO usar comentarios en el código salvo que se pida expresamente

## Database Conventions

- UUIDs como PK en todas las tablas
- `created_at` con `DEFAULT NOW()` en todas las tablas
- `auth.users` como fuente de verdad para autenticación
- Tabla `profiles` extendida con datos de usuario
- RLS habilitado en TODAS las tablas con políticas por rol
- Migraciones numeradas secuencialmente

## Build & Run Commands

```bash
# Desarrollo local (sin Docker)
npx supabase start          # Levantar Supabase local
npx expo start              # Iniciar Expo dev server

# Producción (Docker)
docker compose up -d        # Levantar todo (Supabase + app)
docker compose logs -f      # Ver logs
docker compose down         # Parar todo

# Build de la app web
npx expo export -p web

# Ver estado de contenedores
docker compose ps
```

## Spec Files

Cada funcionalidad tiene su documentación en `spec/` ordenadas por orden de implementación:

- `spec/00-design/` - Design System y paleta de colores
- `spec/01-database/` - Schema y migraciones
- `spec/02-auth/` - Autenticación
- `spec/03-recipes/` - CRUD de recetas
- `spec/04-groups/` - Gestión de grupos
- `spec/05-replications/` - Replicaciones de recetas
- `spec/06-notifications/` - Notificaciones
- `spec/07-favorites/` - Favoritos y colecciones
- `spec/08-comments/` - Comentarios y valoraciones
- `spec/09-profile/` - Perfil de usuario
- `spec/10-search/` - Búsqueda avanzada
- `spec/11-pwa/` - Configuración PWA
- `spec/12-docker/` - Docker y despliegue local

## Implementation Order

1. `spec/00-design/` - Design System
2. `spec/01-database/` - Schema completo (base para todo)
3. `spec/02-auth/` - Autenticación
3. `spec/03-recipes/` - CRUD recetas + feed
4. `spec/04-groups/` - Grupos + compartir
5. `spec/05-replications/` - Replicaciones
6. `spec/06-notifications/` - Notificaciones (in-app)
7. `spec/07-favorites/` - Favoritos y colecciones
8. `spec/08-comments/` - Comentarios y valoraciones
9. `spec/09-profile/` - Perfil
11. `spec/10-search/` - Búsqueda avanzada
12. `spec/11-pwa/` - PWA
13. `spec/12-docker/` - Docker + despliegue
