import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { registerPushToken, unregisterPushToken } from '@/lib/notifications';

interface UsePushNotificationsReturn {
  register: () => Promise<string | null>;
  unregister: () => Promise<void>;
  token: string | null;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!user || registeredRef.current) return;

    register().catch(() => {});
  }, [user]);

  const register = useCallback(async () => {
    if (!user) return null;

    const result = await registerPushToken(user.id);
    if (result) {
      setToken(result);
      registeredRef.current = true;
    }
    return result;
  }, [user]);

  const unregister = useCallback(async () => {
    if (!user) return;

    await unregisterPushToken(user.id);
    setToken(null);
    registeredRef.current = false;
  }, [user]);

  return { register, unregister, token };
}
