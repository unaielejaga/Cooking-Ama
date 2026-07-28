# Notifications - Notificaciones

## Descripción

Sistema dual de notificaciones: in-app (dentro de la app) y push (notificaciones nativas del dispositivo). Las notificaciones in-app se almacenan en la tabla `notifications` y se sincronizan en tiempo real. Las push se envían via Expo Push Service + FCM V1.

## Funcionalidades

### 1. Notificaciones In-App
- Centro de notificaciones: lista de todas las notificaciones del usuario
- Badge con contador de no leídas
- Marcar como leída al tocar
- Marcar todas como leídas
- Eliminar notificación (swipe to delete)
- Tipos de notificación:
  - `replication`: Alguien cocinó tu receta
  - `comment`: Comentario en tu receta
  - `rating`: Nueva valoración en tu receta
  - `group_invite`: Te invitaron a un grupo
  - `group_share`: Compartieron una receta en tu grupo

### 2. Notificaciones Push
- Registro de token push al login
- Envío de push cuando:
  - Alguien replica tu receta
  - Alguien comenta en tu receta
  - Te invitan a un grupo
- Deep link: al tocar notificación, navegar a la receta/grupo relacionado
- Tokens almacenados en tabla `push_tokens`
- Limpieza de tokens inválidos

### 3. Realtime
- Suscribirse a cambios en tabla `notifications` via Supabase Realtime
- Actualizar badge en tiempo real
- Actualizar lista de notificaciones sin recargar

## Pantallas

### `code/src/app/notifications.tsx`
- Header: "Notificaciones" + botón "Marcar todo leído"
- Lista de notificaciones:
  - Icono según tipo
  - Título en negrita
  - Mensaje
  - Fecha relativa
  - Badge de no leída (punto azul)
  - Tap → navegar a pantalla relacionada
- Empty state: "No tienes notificaciones"
- Pull-to-refresh

## Componentes

### `code/components/NotificationItem.tsx`
- Props: notification, onPress, onMarkRead, onDelete
- Icono según tipo (réplica, comentario, estrella, grupo)
- Título + mensaje
- Fecha relativa ("hace 2 horas")
- Badge de no leída
- Swipe para eliminar

### `code/components/NotificationBadge.tsx`
- Badge con contador de no leídas
- Se muestra en el tab de perfil o en el header
- Actualización en tiempo real

## Hooks

### `code/hooks/useNotifications.ts`

```typescript
interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
```

### `code/hooks/usePushNotifications.ts`

```typescript
interface UsePushNotificationsReturn {
  register: () => Promise<string | null>;
  unregister: () => Promise<void>;
  token: string | null;
}
```

## Edge Function: Send Push

Función de Supabase Edge Function que envía push notifications:

```typescript
// supabase/functions/send-push/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Expo } from "https://esm.sh/expo-server-sdk@14"

serve(async (req) => {
  const { user_id, title, message, data } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Buscar tokens del usuario
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', user_id)

  if (!tokens?.length) return new Response('No tokens')

  const expo = new Expo()
  const messages = tokens.map(t => ({
    to: t.token,
    title,
    body: message,
    data,
    sound: 'default',
  }))

  const chunks = expo.chunkPushNotifications(messages)
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk)
  }

  return new Response('OK')
})
```

## Base de Datos

### Tabla notifications

```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla push_tokens

```sql
CREATE TABLE push_tokens (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, token)
);
```

### RLS

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- notifications: solo propio
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Edge Function inserta con service_role (bypass RLS)

-- push_tokens: solo propio
CREATE POLICY "Users can manage own push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);
```

## Supabase Realtime

```typescript
// En useNotifications.ts
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`,
    },
    (payload) => {
      setNotifications(prev => [payload.new as Notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }
  )
  .subscribe()
```

## Archivos a Crear

```
code/hooks/useNotifications.ts
code/hooks/usePushNotifications.ts
code/components/NotificationItem.tsx
code/components/NotificationBadge.tsx
code/src/app/notifications.tsx
code/lib/notifications.ts               # Helpers de registro/envío
supabase/functions/send-push/           # Edge Function
```
