# PWA - Configuración

## Descripción

Configuración de la aplicación como Progressive Web App (PWA) funcional. Incluye manifest, service worker, icons. El despliegue se maneja via Docker (ver `spec/12-docker/`).

## Funcionalidades

### 1. PWA Manifest
- `public/manifest.json` con metadatos de la app
- Nombre, descripción, colores, iconos
- Modo `standalone` (sin barra de navegador)
- Display: `standalone`
- Theme color y background color

### 2. Service Worker
- Caching de assets estáticos con Workbox
- Estrategia: Network First para API calls, Cache First para assets
- Offline básico (assets cacheados)
- Actualización automática del SW

### 3. Icons
- Iconos en múltiples tamaños: 192x192, 512x512
- Favicon
- Splash screens (opcional)

### 4. SEO
- Meta tags: título, descripción, Open Graph
- `web.output: "static"` para pre-renderizado
- `+html.tsx` para inyectar meta tags

## Archivos

### `code/public/manifest.json`

```json
{
  "short_name": "Cooking Ama",
  "name": "Cooking Ama - Comparte y cocina recetas",
  "description": "Aplicación para compartir y distribuir recetas entre usuarios",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#FF6B35",
  "background_color": "#FFFFFF",
  "orientation": "portrait"
}
```

### `code/src/app/+html.tsx`

```tsx
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="Cooking Ama - Comparte y cocina recetas" />
        <meta name="theme-color" content="#FF6B35" />
        <meta property="og:title" content="Cooking Ama" />
        <meta property="og:description" content="Comparte y cocina recetas" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### `code/app.json` (configuración Expo)

```json
{
  "expo": {
    "name": "Cooking Ama",
    "slug": "cooking-ama",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "cookingama",
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./public/icons/favicon.ico"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#FF6B35"
        }
      ]
    ]
  }
}
```

### `code/workbox-config.js`

```javascript
module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{js,css,html,png,svg,ico,json,woff,woff2}'
  ],
  swDest: 'dist/sw.js',
  runtimeCaching: [
    {
      urlPattern: /^http:\/\/localhost:8000\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60
        }
      }
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60
        }
      }
    }
  ]
};
```

## Build Commands

```bash
# Build producción web
npx expo export -p web

# Generar service worker
npx workbox-cli generateSW workbox-config.js

# Preview local del build
npx expo serve
```

## Archivos a Crear

```
code/public/
├── manifest.json
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── favicon.ico
code/src/app/+html.tsx
code/workbox-config.js
```
