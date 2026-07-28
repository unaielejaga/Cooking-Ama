# Cooking Ama

> Personal project to learn how to use AI agents effectively — with guardrails, skills, and best practices.

> Share, discover, and replicate recipes — a community-driven cookbook for everyone.

Cooking Ama is a **Progressive Web App (PWA)** built with React Native and Expo. It allows users to create public or private recipes, organize them into groups, replicate recipes from other users, and receive real-time notifications — all running on a self-hosted Supabase backend.

## Features

- **Recipe CRUD** — Create, edit, and delete recipes with rich content
- **Feed** — Browse public recipes from the community
- **Groups** — Organize recipes into shared or private groups
- **Replications** — Fork and adapt any public recipe as your own
- **Favorites & Collections** — Save and organize bookmarked recipes
- **Comments & Ratings** — Leave feedback on any recipe
- **Search** — Advanced search across recipes, groups, and users
- **Notifications** — In-app real-time notifications via Supabase Realtime
- **Push Notifications** — Expo Push Service for native push alerts
- **Authentication** — Email/password auth via Supabase Auth with Row Level Security

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React Native + Expo SDK 57 + Expo Router (file-based routing) |
| **Backend** | Supabase self-hosted (Auth, PostgreSQL, Storage, Realtime, Edge Functions) |
| **Database** | PostgreSQL with Row Level Security |
| **Styling** | StyleSheet (React Native) — clean, minimal, warm color palette |
| **Containerization** | Docker Compose (entire stack runs locally) |
| **PWA** | Metro bundler with `web.output: "static"`, served via nginx |

## Project Structure

```
cooking-ama/
├── code/                        # Application source code
│   ├── src/app/                 # Expo Router screens
│   │   ├── (auth)/              # Login & signup
│   │   ├── (tabs)/              # Feed, search, create, groups, profile
│   │   ├── recipe/[id].tsx      # Recipe detail
│   │   ├── group/[id].tsx       # Group detail
│   │   ├── collections/[id].tsx # Collection detail
│   │   └── _layout.tsx          # Root layout with auth gate
│   ├── components/              # Reusable UI components
│   ├── lib/                     # Supabase client, types, helpers
│   ├── hooks/                   # Custom hooks
│   └── public/                  # PWA manifest, icons
├── supabase/                    # Supabase config, migrations, volumes
├── spec/                        # Feature documentation (ordered by implementation)
├── docker-compose.yml           # Full stack orchestration
└── .env                         # Environment variables
```

## Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Expo CLI (`npx expo`)
- Supabase CLI (`npx supabase`)

## Getting Started

### Development (local)

```bash
# 1. Start Supabase services
npx supabase start

# 2. Start Expo development server
npx expo start
```

### Production (Docker)

```bash
# Build and run the full stack
docker compose up -d

# View logs
docker compose logs -f

# Stop everything
docker compose down
```

### Build web app

```bash
npx expo export -p web
```

## Environment Variables

Configured in `.env` at the project root:

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase instance URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public key for client SDK |

## Design

Clean, minimal, and warm. The palette is inspired by natural earth tones with a forest green accent.

| Role | Color | Hex |
|------|-------|-----|
| Background | White | `#FFFFFF` |
| Cards | Bone white | `#F5F0EB` |
| Primary text | Dark brown | `#3D2B1F` |
| Accent | Forest green | `#4A7C59` |
| Borders | Beige | `#E0D5C8` |

Built on an 8px grid with generous whitespace and clear visual hierarchy.