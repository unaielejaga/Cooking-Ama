# Cooking Ama

Aplicación móvil PWA para compartir y distribuir recetas entre usuarios.

## Stack

- **Frontend:** React Native + Expo SDK 57 + Expo Router
- **Backend:** Supabase self-hosted (Auth, PostgreSQL, Storage, Realtime)
- **Infra:** Docker Compose (todo el stack en local)

## Desarrollo

```bash
# Iniciar Supabase local
npx supabase start

# Iniciar Expo dev server
npx expo start
```

## Producción

```bash
docker compose up -d
```