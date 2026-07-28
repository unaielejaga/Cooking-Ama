# Docker - Despliegue Local

## Descripción

Despliegue completo del sistema en contenedores Docker para entorno local (casa). Un solo `docker-compose.yml` levanta Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions) y la aplicación Expo Web servida via nginx.

## Arquitectura de Contenedores

```
┌─────────────────────────────────────────────┐
│              docker-compose.yml             │
├──────────────────┬──────────────────────────┤
│   cooking-ama    │      supabase-*          │
│   (nginx:alpine) │      (múltiples)         │
│   :3000          │      :8000 (Kong)        │
│                  │      :5432 (Postgres)     │
│   Expo Web app   │      Auth, Storage,       │
│   estática       │      Realtime, Functions  │
└──────────────────┴──────────────────────────┘
```

## Archivos

```
cooking-ama/
├── docker-compose.yml           # Stack completo producción
├── docker-compose.dev.yml       # Override para desarrollo
├── code/
│   ├── Dockerfile               # Build de Expo Web + nginx
│   ├── nginx/
│   │   └── nginx.conf           # Configuración nginx
│   └── .dockerignore
└── supabase/
    └── volumes/                 # Datos persistentes
        ├── api/kong.yml         # Configuración de Kong
        ├── postgres/data/       # Datos de PostgreSQL
        └── storage/             # Archivos subidos
```

## `docker-compose.yml`

```yaml
version: '3.8'

services:
  # ============================================================
  # COOKING AMA - Frontend PWA
  # ============================================================
  cooking-ama:
    build:
      context: .
      dockerfile: code/Dockerfile
      target: production
    container_name: cooking-ama
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      supabase-kong:
        condition: service_started
    networks:
      - cooking-ama-network

  # ============================================================
  # SUPABASE - Backend (Self-hosted)
  # ============================================================

  # PostgreSQL
  supabase-db:
    image: supabase/postgres:15.1.0
    container_name: supabase-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-supersecretpassword}
      POSTGRES_DB: postgres
      JWT_SECRET: ${JWT_SECRET:-super-secret-jwt-token-min-32-chars-long}
      SITE_URL: http://localhost:3000
    volumes:
      - ./supabase/volumes/postgres/data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d:ro
    networks:
      - cooking-ama-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Kong API Gateway
  supabase-kong:
    image: kong:2.8.1
    container_name: supabase-kong
    restart: unless-stopped
    ports:
      - "8000:8000"
      - "8443:8443"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /etc/kong/kong.yml
      KONG_DNS_RESOLVER: 127.0.0.11
      KONG_NGINX_PROXY_PROXY_SET_HEADER: "X-Forwarded-For $proxy_add_x_forwarded_for"
    volumes:
      - ./supabase/volumes/api/kong.yml:/etc/kong/kong.yml:ro
    networks:
      - cooking-ama-network
    depends_on:
      supabase-auth:
        condition: service_started
      supabase-rest:
        condition: service_started
      supabase-storage:
        condition: service_started
      supabase-realtime:
        condition: service_started

  # GoTrue (Auth)
  supabase-auth:
    image: supabase/gotrue:v2.100.0
    container_name: supabase-auth
    restart: unless-stopped
    depends_on:
      supabase-db:
        condition: service_healthy
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD:-supersecretpassword}@supabase-db:5432/postgres
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_SECRET: ${JWT_SECRET:-super-secret-jwt-token-min-32-chars-long}
      GOTRUE_MAILER_AUTOCONFIRM: "true"
      GOTRUE_DISABLE_SIGNUP: "false"
      SITE_URL: http://localhost:3000
      REDIRECT_URL: http://localhost:3000
    networks:
      - cooking-ama-network

  # PostgREST (API REST automática)
  supabase-rest:
    image: postgrest/postgrest:v12.0.2
    container_name: supabase-rest
    restart: unless-stopped
    depends_on:
      supabase-db:
        condition: service_healthy
    environment:
      PGRST_DB_URI: postgres://postgres:${POSTGRES_PASSWORD:-supersecretpassword}@supabase-db:5432/postgres
      PGRST_DB_SCHEMAS: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET:-super-secret-jwt-token-min-32-chars-long}
    networks:
      - cooking-ama-network

  # Storage
  supabase-storage:
    image: supabase/storage-api:v1.11.0
    container_name: supabase-storage
    restart: unless-stopped
    depends_on:
      supabase-db:
        condition: service_healthy
      supabase-rest:
        condition: service_started
    environment:
      ANON_KEY: ${SUPABASE_ANON_KEY:-placeholder-anon-key}
      SERVICE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:-placeholder-service-role-key}
      POSTGREST_URL: http://supabase-rest:3000
      PGRST_DB_URI: postgres://postgres:${POSTGRES_PASSWORD:-supersecretpassword}@supabase-db:5432/postgres
      PGRST_DB_SCHEMAS: storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET:-super-secret-jwt-token-min-32-chars-long}
      FILE_SIZE_LIMIT: 10485760
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
    volumes:
      - ./supabase/volumes/storage:/var/lib/storage
    networks:
      - cooking-ama-network

  # Realtime
  supabase-realtime:
    image: supabase/realtime:v2.25.50
    container_name: supabase-realtime
    restart: unless-stopped
    depends_on:
      supabase-db:
        condition: service_healthy
    environment:
      DB_HOST: supabase-db
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: ${POSTGRES_PASSWORD:-supersecretpassword}
      DB_NAME: postgres
      DB_AFTER_CONNECT_QUERY: SET search_path TO _realtime
      REALTIME_DB_HOST: supabase-db
      REALTIME_DB_PORT: 5432
      REALTIME_DB_USER: postgres
      REALTIME_DB_PASSWORD: ${POSTGRES_PASSWORD:-supersecretpassword}
      REALTIME_DB_NAME: postgres
      JWT_SECRET: ${JWT_SECRET:-super-secret-jwt-token-min-32-chars-long}
    networks:
      - cooking-ama-network

networks:
  cooking-ama-network:
    driver: bridge
```

## `docker-compose.dev.yml` (Override para desarrollo)

```yaml
version: '3.8'

services:
  cooking-ama:
    build:
      context: .
      dockerfile: code/Dockerfile
      target: development
    ports:
      - "3000:80"
      - "8081:8081"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    networks:
      - cooking-ama-network
```

## `code/Dockerfile`

```dockerfile
# ============================================
# Stage 1: Build de la app Expo Web
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000
ARG EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

RUN npx expo export -p web

# ============================================
# Stage 2: Servir con nginx (producción)
# ============================================
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Stage 3: Desarrollo (hot reload)
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 8081

CMD ["npx", "expo", "start", "--web", "--port", "8081", "--host", "0.0.0.0"]
```

## `code/nginx/nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

## `code/.dockerignore`

```
node_modules
.expo
dist
.git
.env
*.md
spec
supabase/volumes
```

## Variables de Entorno

### Archivo `.env` (raíz del proyecto)

```env
# Supabase
POSTGRES_PASSWORD=supersecretpassword
JWT_SECRET=super-secret-jwt-token-min-32-chars-long
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App (las variables EXPO_PUBLIC_ se inyectan en el build)
EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${SUPABASE_ANON_KEY}
```

## Comandos

```bash
# Producción
docker compose up -d                    # Levantar todo
docker compose logs -f                  # Ver logs
docker compose logs cooking-ama         # Logs solo de la app
docker compose ps                       # Ver estado
docker compose down                     # Parar todo
docker compose down -v                  # Parar y eliminar volúmenes
docker compose rebuild                  # Rebuild de imágenes
docker compose exec supabase-db psql -U postgres  # Acceder a PostgreSQL

# Desarrollo (con hot reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## Red Local

Para acceder desde otros dispositivos de la red local (móvil, tablet):

1. Descubrir la IP del ordenador: `hostname -I`
2. Acceder desde el navegador del móvil: `http://192.168.x.x:3000`
3. Actualizar `EXPO_PUBLIC_SUPABASE_URL` en `.env` si es necesario
4. Para Supabase: `http://192.168.x.x:8000`

## Notas Importantes

- **Push Notifications:** Las notificaciones push nativas requieren un servicio de FCM/APNs con certificados, que necesita un dominio público o un servidor push. Para uso local, se puede usar Expo Push Service si se tiene acceso a internet, o limitarse a notificaciones in-app.
- **CORS:** nginx se encarga del proxy para evitar problemas CORS con Supabase Storage.
- **Volúmenes:** Los datos de PostgreSQL y Storage se persisten en `supabase/volumes/`.
- **Backup:** Copiar `supabase/volumes/postgres/data/` para backup de la BD.

## Migraciones de Base de Datos

Las migraciones están en `supabase/migrations/` (numeradas secuencialmente: `001_profiles.sql`, `002_recipes.sql`, etc.).

**Importante:** NO se aplican automáticamente. El contenedor de PostgreSQL solo ejecuta los scripts de infraestructura base en `supabase/volumes/db/`. Las migraciones del proyecto deben ejecutarse manualmente:

```bash
# Aplicar todas las migraciones pendientes en orden
for f in supabase/migrations/*.sql; do
  echo "Aplicando $f..."
  cat "$f" | docker compose exec -T db psql -U postgres -d postgres
done
```

```bash
# Aplicar una migración específica
cat supabase/migrations/011_storage_buckets.sql | docker compose exec -T db psql -U postgres -d postgres
```

El servicio en docker-compose se llama `db` (no `supabase-db`).

## Storage Buckets

Los buckets de Supabase Storage (`recipes`, `replications`) deben crearse explícitamente mediante migraciones SQL que inserten en `storage.buckets`. La migración `011_storage_buckets.sql` se encarga de crear el bucket `recipes` con sus políticas RLS.

**En producción:** Asegurarse de que:
1. La migración `011_storage_buckets.sql` (o equivalente) se ejecute antes de que los usuarios suban imágenes
2. Las políticas RLS de Storage estén correctamente configuradas (son distintas de las RLS de tablas)
3. El backend de Storage esté configurado (local `file` o S3 según el entorno)

## Nota: docker-compose.yml desactualizado en este spec

El `docker-compose.yml` real del proyecto ha evolucionado respecto al que aparece en este spec. Consultar siempre el archivo `docker-compose.yml` real en la raíz del proyecto para el despliegue.
