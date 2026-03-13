---
id: SPEC-001
status: IN_PROGRESS
feature: add-dark-mode
created: 2026-03-13
updated: 2026-03-13
author: spec-generator
version: "1.0"
related-specs: []
---

# Spec: Dark Mode Implementation for Chat

> **Estado:** `IN_PROGRESS`
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Implementar dark mode en el chat de UIGen permitiendo a los usuarios intercambiar entre modo claro y oscuro. La preferencia de tema debe persisterse en el usuario y aplicarse automáticamente en futuras sesiones.

### Requerimiento de Negocio
Se requiere implementar el dark mode en el chat con el fin de poder intercambiar entre modos y visualizarlo de forma correcta y clara en cada uno de ellos.

### Historias de Usuario

#### HU-01: Usuario puede alternar entre modo claro y oscuro

```
Como:        Usuario autenticado
Quiero:      Tener un botón para cambiar entre modo claro y oscuro en el chat
Para:        Reducir fatiga visual según mis preferencias de iluminación

Prioridad:   Alta
Estimación:  M
Dependencias: Ninguna
Capa:        Frontend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Mostrar botón de alternancia de tema en header del chat
  Dado que:  El usuario está en la pantalla principal del chat
  Cuando:    Carga la página
  Entonces:  Aparece un botón de alternancia (ícono sol/luna) en la esquina superior derecha

CRITERIO-1.2: Cambiar de modo claro a oscuro
  Dado que:  El usuario está en modo claro
  Cuando:    Hace clic en el botón de alternancia
  Entonces:  La interfaz completa cambia a modo oscuro con colores invertidos correctamente

CRITERIO-1.3: Cambiar de modo oscuro a claro
  Dado que:  El usuario está en modo oscuro
  Cuando:    Hace clic en el botón de alternancia
  Entonces:  La interfaz completa cambia a modo claro
```

---

#### HU-02: La preferencia de tema persiste entre sesiones

```
Como:        Usuario autenticado
Quiero:      Que mi preferencia de tema se guarde automáticamente
Para:        No tener que cambiar el tema cada vez que ingreso

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01
Capa:        Backend + Frontend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Guardar preferencia en base de datos
  Dado que:  El usuario ha seleccionado modo oscuro
  Cuando:    Hace clic en el botón de alternancia
  Entonces:  La preferencia se guarda en la tabla User (columna theme_preference)

CRITERIO-2.2: Cargar preferencia al iniciar sesión
  Dado que:  El usuario ha guardado "dark" como preferencia
  Cuando:    Inicia sesión nuevamente
  Entonces:  La aplicación carga automáticamente en modo oscuro

CRITERIO-2.3: Fallback a modo claro si no hay preferencia
  Dado que:  Es un usuario nuevo sin preferencia guardada
  Cuando:    Inicia sesión
  Entonces:  La aplicación carga en modo claro por defecto
```

---

#### HU-03: Todos los componentes del chat respetan el tema activo

```
Como:        Usuario
Quiero:      Que toda la interfaz (chat, editor, preview) cambie de tema consistentemente
Para:        Tener una experiencia visual coherente

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: Chat respeta el tema
  Dado que:  El usuario está en modo oscuro
  Cuando:    Escribe y envía mensajes
  Entonces:  Los mensajes se muestran con colores oscuros legibles (fondo oscuro, texto claro)

CRITERIO-3.2: Editor de código respeta el tema
  Dado que:  El usuario está en modo oscuro
  Cuando:    Visualiza el código en el panel de editor
  Entonces:  El editor de código (Monaco) muestra tema oscuro con sintaxis resaltada correctamente

CRITERIO-3.3: Preview respeta el tema
  Dado que:  El usuario está en modo oscuro
  Cuando:    Ve el preview del componente generado
  Entonces:  El componente genera su propio tema (no hereda)

CRITERIO-3.4: Header y UI chromes respetan el tema
  Dado que:  El usuario cambia de tema
  Cuando:    Observa botones, inputs, tabs, separadores
  Entonces:  Todos usan las variables CSS de tema (--color-*) correctamente
```

---

### Reglas de Negocio

1. **Tema por defecto:** El modo claro es el tema por defecto para usuarios nuevos.
2. **Persistencia:** La preferencia se guarda en el modelo `User` en la columna `themePreference` (valores: `"light"` o `"dark"`).
3. **Aplicación global:** El tema se aplica a toda la aplicación (layout.tsx debe tener la clase `.dark` en el `html` cuando esté activo).
4. **Sincronización:** Los cambios de tema son inmediatos en el frontend y se sincronizan con el backend de forma asincrónica (sin bloquear la UI).
5. **Variables CSS:** Se usan las variables de tema ya definidas en `globals.css` (`.dark` class).
6. **Preview:** El preview en iframe NO hereda el tema de la aplicación principal (genera sus propios componentes).

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas

| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `User` | Prisma/SQLite `user` | modificada | agregar `themePreference` |

#### Campos del modelo User

| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `themePreference` | enum ('light', 'dark') | no | default: 'light' | Preferencia de tema del usuario |

#### Índices / Constraints

- No se requieren índices adicionales (campo de lectura frecuente, bajo costo de almacenamiento).

---

### API Endpoints

#### PUT /api/user/theme
- **Descripción**: Actualiza la preferencia de tema del usuario
- **Auth requerida**: sí (JWT Bearer token)
- **Request body**:
  ```json
  {
    "themePreference": "dark"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": "user-uuid",
    "email": "user@example.com",
    "themePreference": "dark"
  }
  ```
- **Errores**:
  - `401 Unauthorized` — token inválido o no presente
  - `400 Bad Request` — `themePreference` no es "light" ni "dark"
  - `500 Internal Server Error` — error al guardar en BD

---

#### GET /api/user/theme
- **Descripción**: Obtiene la preferencia de tema actual del usuario
- **Auth requerida**: sí (JWT Bearer token)
- **Response (200 OK)**:
  ```json
  {
    "themePreference": "dark"
  }
  ```
- **Errores**:
  - `401 Unauthorized` — token inválido o no presente
  - `500 Internal Server Error` — error al leer de BD

---

### Diseño Frontend

#### Estructura de archivos

```
src/
  lib/
    contexts/
      theme-context.tsx          ← NEW: contexto de tema global
    hooks/
      use-theme.ts               ← NEW: hook para acceder al tema
    services/
      themeService.ts            ← NEW: llamadas API para guardar/cargar tema
  components/
    ThemeToggle.tsx              ← NEW: botón de alternancia de tema
    HeaderActions.tsx            ← MODIFICAR: incluir ThemeToggle
  app/
    layout.tsx                   ← MODIFICAR: agregar clase .dark al html
    main-content.tsx             ← MODIFICAR: envolver con ThemeProvider
```

#### Componente: ThemeProvider (contexto)

**Responsabilidad**: Gestionar el estado global del tema y sincronizarlo con el backend.

```typescript
// src/lib/contexts/theme-context.tsx
createContext<ThemeContextType>({
  theme: 'light' | 'dark',
  toggleTheme: () => Promise<void>,
  isLoading: boolean,
})
```

**Lógica**:
1. Al montar: cargar preferencia del usuario mediante `GET /api/user/theme`
2. Al hacer toggleTheme: actualizar estado local, actualizar DOM, llamar a `PUT /api/user/theme` (sin bloquear)
3. Aplicar clase `.dark` al elemento `<html>` cuando `theme === 'dark'`

#### Componente: ThemeToggle (botón)

**Responsabilidad**: UI para alternar tema.

```typescript
// src/components/ThemeToggle.tsx
export function ThemeToggle() {
  const { theme, toggleTheme, isLoading } = useTheme();
  return (
    <button 
      onClick={toggleTheme}
      disabled={isLoading}
      aria-label="Alternar tema"
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
```

#### Hook: useTheme

**Responsabilidad**: Acceso simple al contexto de tema.

```typescript
// src/lib/hooks/use-theme.ts
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
}
```

#### Servicio: themeService

**Responsabilidad**: Comunicación con backend.

```typescript
// src/lib/services/themeService.ts
export async function getThemePreference(token: string): Promise<string>
export async function updateThemePreference(theme: 'light' | 'dark', token: string): Promise<string>
```

---

### Cambios en componentes existentes

#### layout.tsx
- Envolver root en `ThemeProvider`
- Agregar clase `.dark` al elemento `<html>` basada en estado del contexto

#### main-content.tsx
- No cambios directos (el ThemeProvider en layout afecta todo)

#### HeaderActions.tsx
- Importar y renderizar `<ThemeToggle />`
- Posición: esquina superior derecha junto a botones de usuario

---

### Consideraciones de CSS

Las variables de tema ya existen en `globals.css`:
```css
:root { /* light mode */ }
.dark { /* dark mode */ }

@custom-variant dark (&:is(.dark *));
```

**No se requieren cambios en CSS** — solo asegurar que los componentes usan las variables correctamente.

**Componentes críticos a revisar**:
- `MessageList`, `MessageInput`, `ChatInterface` — usar `dark:` variants
- `CodeEditor` — requiere tema para Monaco Editor
- Header y borders — usar `border-border` que ya respeta `.dark`

---

## 3. LISTA DE TAREAS

### Backend

- [ ] **DB-01**: Agregar migración Prisma para agregar `themePreference` a modelo `User`
  - Campo: `themePreference: String @default("light")`
  - Ejecutar: `npx prisma migrate dev`
  
- [ ] **API-01**: Crear ruta `PUT /api/user/theme` en `src/app/api/user/theme/route.ts`
  - Validar auth (JWT)
  - Validar payload (themePreference: "light" | "dark")
  - Actualizar DB
  - Retornar 200 con preferencia actualizada
  - Tests: auth inválida, payload inválido, success

- [ ] **API-02**: Crear ruta `GET /api/user/theme` en `src/app/api/user/theme/route.ts`
  - Validar auth (JWT)
  - Retornar tema actual del usuario
  - Tests: auth inválida, usuario no existe, success

- [ ] **TEST-BE-01**: Test unitario para endpoints de tema
  - GET /api/user/theme: success, auth fallida
  - PUT /api/user/theme: success, auth fallida, payload inválido

### Frontend

- [ ] **FE-01**: Crear `ThemeProvider` contexto en `src/lib/contexts/theme-context.tsx`
  - State: `theme`, `isLoading`
  - Métodos: `toggleTheme()`
  - Cargar preferencia al montar
  - Aplicar clase `.dark` al html element
  - Suscribirse a cambios de tema global (localStorage como fallback)

- [ ] **FE-02**: Crear hook `useTheme` en `src/lib/hooks/use-theme.ts`
  - Exportar contexto como hook
  - Validar que se use dentro del provider

- [ ] **FE-03**: Crear servicio `themeService.ts` en `src/lib/services/themeService.ts`
  - `getThemePreference(token: string): Promise<string>`
  - `updateThemePreference(theme: string, token: string): Promise<string>`
  - Manejo de errores (401, 400, 500)

- [ ] **FE-04**: Crear componente `ThemeToggle.tsx` en `src/components/ThemeToggle.tsx`
  - Ícono sol/luna
  - Click alterna tema
  - Deshabilitado mientras isLoading
  - Aria labels accesibles

- [ ] **FE-05**: Modificar `layout.tsx`
  - Envolver root en `ThemeProvider`
  - Asegurar que el provider cubre toda la aplicación

- [ ] **FE-06**: Modificar `HeaderActions.tsx`
  - Importar y renderizar `<ThemeToggle />`
  - Posición a la derecha (antes de otros botones)
  - Estilos consistentes con header

- [ ] **FE-07**: Revisar componentes de chat para oscuridad
  - `ChatInterface`, `MessageList`, `MessageInput` — asegurar legibilidad en dark mode
  - Usar `dark:` variants de Tailwind
  - Probar contraste WCAG AA

- [ ] **TEST-FE-01**: Tests unitarios del contexto de tema
  - Cargar preferencia al montar
  - Alternar tema cambia estado
  - API fallida no cambia estado
  - Clase `.dark` aplicada correctamente

- [ ] **TEST-FE-02**: Tests del componente ThemeToggle
  - Render correcto
  - Click alterna tema
  - Deshabilitado mientras loading
  - Ícono cambia según tema

- [ ] **TEST-FE-03**: Tests de integración
  - Usuario newbie: carga luz por defecto
  - Usuario con preferencia guardada: carga tema correcto
  - Cambiar tema: persiste en DB
  - Múltiples pestañas: sincronizar (localStorage event)

### QA

- [ ] **QA-01**: Test manual de alternancia en todos los navegadores (Chrome, Firefox, Safari, Edge)

- [ ] **QA-02**: Test de persistencia
  - Guardar dark mode, recargar página, verificar que carga oscuro
  - Logout y login nuevo, verificar persistencia

- [ ] **QA-03**: Test de accesibilidad
  - WCAG AA contrast en light y dark mode
  - Screenreader labels
  - Keyboard navigation theme toggle

- [ ] **QA-04**: Test de performance
  - No bloqueo de UI al cambiar tema
  - Latencia de guardado < 500ms
  - No memory leaks en contexto

- [ ] **QA-05**: Test cross-browser de variables CSS
  - Se aplican correctamente en todos los navegadores
  - Transiciones suaves (si aplica)

---

## Attachments

- `.github/specs/add-dark-mode.spec.md` — esta spec
- `.github/requirements/add-dark-mode.md` — requerimiento de negocio original (si existe)
- `src/app/globals.css` — ya contiene `.dark` class y variables

---

## Aprobación

- **Estado actual**: DRAFT
- **Próximo paso**: Revisar con stakeholders y actualizar a `status: APPROVED`
- **Bloqueadores**: Ninguno identificado

