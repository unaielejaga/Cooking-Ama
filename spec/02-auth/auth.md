# Auth - Autenticación

## Descripción

Sistema de autenticación completo: registro, inicio de sesión, cierre de sesión y gestión de sesión persistente. Usa Supabase Auth con email/contraseña como método principal.

## Funcionalidades

### 1. Registro de Usuario
- Formulario con: username, email, contraseña, nombre para mostrar
- Validación: username único (3-20 caracteres), email válido, contraseña mínima 8 caracteres
- Al registrar: crear entrada en `profiles` con el ID del usuario de Supabase Auth
- Trigger SQL: al insertar en `auth.users`, crear automáticamente perfil en `profiles`
- Redirigir a feed después del registro exitoso

### 2. Inicio de Sesión
- Formulario con: email, contraseña
- Opción de "recordarme" (manejado por Supabase con persistSession)
- Manejo de errores: credenciales incorrectas, email no verificado
- Redirigir a feed después del login exitoso

### 3. Cierre de Sesión
- Botón en perfil
- Limpia tokens de sesión
- Redirigir a pantalla de login

### 4. Gestión de Sesión
- Persistencia automática de sesión (Supabase maneja tokens)
- Escuchar cambios de estado de autenticación
- Auto-refresh de tokens
- Manejo de sesión expirada

## Pantallas

### `code/src/app/(auth)/_layout.tsx`
- Layout que envuelve pantallas de autenticación
- Si ya hay sesión activa, redirigir a `(tabs)`

### `code/src/app/(auth)/signup.tsx`
- Header: logo/título "Cooking Ama"
- Campos: username, email, contraseña, nombre display
- Botón "Crear cuenta"
- Enlace "¿Ya tienes cuenta? Inicia sesión"
- Manejo de errores inline

### `code/src/app/(auth)/login.tsx`
- Header: logo/título "Cooking Ama"
- Campos: email, contraseña
- Botón "Iniciar sesión"
- Enlace "¿No tienes cuenta? Regístrate"
- Manejo de errores inline

## Hook: `useAuth.ts`

```typescript
interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error?: string }>;
  signIn: (data: SignInData) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}
```

**Responsabilidades:**
- Mantener estado de usuario y perfil
- Proveer funciones de auth
- Escuchar `onAuthStateChange`
- Cargar perfil desde `profiles` al autenticarse
- Registrar token push al login (llama a `useNotifications`)

## Base de Datos

### Trigger: Perfil automático al registro

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### RLS - profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Dependencias

- `@supabase/supabase-js`
- `expo-sqlite` (para localStorage en nativo)
- `react-native-url-polyfill/auto`
- `expo-notifications` (para registrar token push al login)

## Archivos a Crear

```
code/lib/supabase.ts              # Cliente Supabase universal
code/lib/types.ts                 # Tipos: Profile, User, AuthState
code/hooks/useAuth.ts             # Hook de estado de autenticación
code/src/app/(auth)/_layout.tsx   # Layout de auth
code/src/app/(auth)/signup.tsx    # Pantalla de registro
code/src/app/(auth)/login.tsx     # Pantalla de login
code/src/app/_layout.tsx          # Root layout con auth gate
```
