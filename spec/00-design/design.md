# Design System - Estilo Visual

## Descripción

Definición del sistema de diseño visual de Cooking Ama. Estilo limpio, minimalista, fácil de usar. Paleta de colores cálida y natural con blancos, marrones claros y verdes.

## Principios de Diseño

### 1. Limpieza
- Mucho espacio en blanco
- Interfaces sin sobrecarga visual
- Pocos elementos por pantalla
- Contenido claro y directo

### 2. Jerarquía Clara
- Títulos grandes y bold
- Contenido bien organizado
- Acciones principales destacadas
- Información secundaria discreta

### 3. Consistencia
- Mismos patrones en todas las pantallas
- Componentes reutilizables
- Espaciados uniformes
- Comportamiento predecible

### 4. Accesibilidad
- Contraste suficiente entre texto y fondo
- Texto legible (mínimo 14px)
- Botones con tamaño mínimo de toque 44x44
- Focus visible en navegación por teclado

### 5. Sencillez
- Pocos elementos por pantalla
- Acciones claras y directos
- Navegación intuitiva
- Sin curva de aprendizaje

## Paleta de Colores

### Colores Principales

| Nombre | Hex | RGB | Uso |
|--------|-----|-----|-----|
| Blanco | `#FFFFFF` | 255, 255, 255 | Fondo principal |
| Crema claro | `#FAF7F2` | 250, 247, 242 | Fondo secundario, headers |
| Blanco hueso | `#F5F0EB` | 245, 240, 235 | Fondo de tarjetas |

### Texto

| Nombre | Hex | RGB | Uso |
|--------|-----|-----|-----|
| Marrón oscuro | `#3D2B1F` | 61, 43, 31 | Texto principal, títulos |
| Marrón medio | `#7A6555` | 122, 101, 85 | Texto secundario |
| Marrón claro | `#A89585` | 168, 149, 133 | Texto muted, captions |

### Acentos

| Nombre | Hex | RGB | Uso |
|--------|-----|-----|-----|
| Verde bosque | `#4A7C59` | 74, 124, 89 | Botones principales, links, activo |
| Verde oscuro | `#3A6247` | 58, 98, 71 | Hover de botones |
| Verde claro | `#E8F5E9` | 232, 245, 233 | Fondos de éxito, tags |

### Bordes y Líneas

| Nombre | Hex | RGB | Uso |
|--------|-----|-----|-----|
| Beige | `#E0D5C8` | 224, 213, 200 | Bordes, divisores |

### Estados

| Nombre | Hex | RGB | Uso |
|--------|-----|-----|-----|
| Rojo suave | `#D32F2F` | 211, 47, 47 | Errores, eliminar |
| Verde medio | `#4CAF50` | 76, 175, 80 | Éxito |
| Ámbar | `#FFA000` | 255, 160, 0 | Advertencias |

## Tipografía

### Fuentes

- **Principal:** System font (SF Pro en iOS, Roboto en Android, system-ui en web)
- **Monoespaciada:** SF Mono / Roboto Mono

### Escala de Tamaños

| Elemento | Tamaño | Peso | Line Height | Uso |
|----------|--------|------|-------------|-----|
| H1 | 28px | Bold (700) | 34px | Títulos de pantalla |
| H2 | 22px | SemiBold (600) | 28px | Secciones |
| H3 | 18px | Medium (500) | 24px | Subtítulos |
| Body | 16px | Regular (400) | 24px | Texto principal |
| Caption | 14px | Regular (400) | 20px | Descripciones, metadatos |
| Small | 12px | Regular (400) | 16px | Tags, timestamps |

## Espaciado

Base: 8px grid

| Token | Valor | Uso |
|-------|-------|-----|
| xs | 4px | Espaciado íntimo |
| sm | 8px | Espaciado pequeño |
| md | 16px | Espaciado estándar |
| lg | 24px | Espaciado grande |
| xl | 32px | Espaciado muy grande |
| 2xl | 48px | Secciones |

## Bordes Redondeados

| Elemento | Radio |
|----------|-------|
| Cards | 12px |
| Botones | 8px |
| Inputs | 8px |
| Avatares pequeños | 16px (circle) |
| Avatares grandes | 24px (circle) |
| Tags | 16px |

## Sombras

```javascript
// Sombra sutil para cards
shadowColor: '#3D2B1F',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.08,
shadowRadius: 8,
elevation: 2,

// Sombra para elementos elevados
shadowColor: '#3D2B1F',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.12,
shadowRadius: 12,
elevation: 4,
```

## Componentes

### Cards

```typescript
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});
```

### Botones

```typescript
// Botón primario
const primaryButton = StyleSheet.create({
  button: {
    backgroundColor: '#4A7C59',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Botón secundario (outline)
const secondaryButton = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: '#4A7C59',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    color: '#4A7C59',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Botón de texto
const textButton = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#4A7C59',
    fontSize: 14,
    fontWeight: '500',
  },
});
```

### Inputs

```typescript
const inputStyles = StyleSheet.create({
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E0D5C8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#3D2B1F',
    minHeight: 44,
  },
  inputFocused: {
    borderColor: '#4A7C59',
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7A6555',
    marginBottom: 8,
  },
  error: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
});
```

### Header

```typescript
const headerStyles = StyleSheet.create({
  header: {
    backgroundColor: '#FAF7F2',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3D2B1F',
  },
});
```

### Tab Bar

```typescript
const tabBarStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0D5C8',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    color: '#A89585',
  },
  tabItemActive: {
    color: '#4A7C59',
  },
});
```

### Tags

```typescript
const tagStyles = StyleSheet.create({
  tag: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A7C59',
  },
});
```

### Rating Stars

```typescript
const ratingStyles = StyleSheet.create({
  starFilled: {
    color: '#FFA000',
  },
  starEmpty: {
    color: '#E0D5C8',
  },
});
```

## Iconografía

- Estilo lineal (outline) para iconos generales
- Estilo filled para iconos de estado (favorito, activo)
- Tamaño estándar: 24x24
- Tamaño pequeño: 20x20
- Tamaño grande: 32x32

Librería recomendada: `@expo/vector-icons` (incluida con Expo)

## Imágenes

- Recetas: aspect ratio 16:9 o 4:3
- Avatares: circulares
- Placeholder: fondo crema `#FAF7F2` con icono marrón claro
- Border radius en imágenes: 12px (cards), 8px (thumbnails)

## Animaciones

- Transiciones suaves: 200-300ms
- Easing: ease-in-out
- Pull-to-refresh: indicador verde
- Loading skeletons: fondo `#F5F0EB` con shimmer

## Archivos a Crear

```
lib/theme.ts               # Constantes de colores, tipografía, espaciado
lib/styles.ts              # Estilos base reutilizables
components/Theme.tsx       # Provider de tema (si se usa nativewind)
```
