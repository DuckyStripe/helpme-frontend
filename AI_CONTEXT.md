# Documentación Técnica - HelpMe Frontend

## 1. CONTEXTO Y PROPÓSITO

### Resumen Ejecutivo
**HelpMe** es una plataforma de identificación médica de emergencia para motociclistas. El sistema permite a los usuarios almacenar información médica crítica (tipo sanguíneo, alergias, contactos de emergencia, datos IMSS) accesible mediante códigos QR/NFC sin necesidad de aplicaciones móviles.

### Propósito del Sistema
- **Problema**: En accidentes de moto, paramédicos no tienen acceso inmediato a información médica vital
- **Solución**: Tags físicos (NFC/QR) que al escanearse muestran ficha médica completa
- **Modelo de Negocio**: Venta de paquetes físicos con tags NFC/QR + servicio de almacenamiento de datos

### Tecnologías Clave
- **Framework**: Next.js 14.2.35 (App Router)
- **Lenguaje**: TypeScript 5
- **UI**: React 18, Tailwind CSS 3.4.1
- **Iconos**: Lucide React
- **Autenticación**: JWT con refresh tokens (almacenamiento en localStorage)
- **API Backend**: REST API externa (https://apihelpme.codelabs.com.mx/)
- **Despliegue**: Docker con output standalone, puerto 3000
- **PWA**: Manifest.json configurado para modo standalone

### Arquitectura General
```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 14 - App Router)                │
├─────────────────────────────────────────────────────┤
│  Landing Page (/)                                   │
│  Viewer (/l/[uuid]) - Ficha médica pública         │
│  Config (/l/[uuid]/config) - Configuración con PIN │
│  Dashboard (/dashboard/*) - Panel admin/vendedor   │
│  Auth (/login, /register)                          │
└─────────────────────────────────────────────────────┘
                      ↓
         API REST (Backend externo)
         - Autenticación JWT
         - Gestión de tags
         - Datos médicos cifrados
         - Métricas y escaneos
```

---

## 2. MAPA DE ESTRUCTURA

### Estructura de Directorios
```
helpme-frontend/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page pública
│   ├── layout.tsx                # Root layout con PWA support
│   ├── globals.css               # Estilos globales
│   ├── login/page.tsx            # Login de vendedores/admins
│   ├── register/page.tsx         # Registro (no usado actualmente)
│   ├── aviso-de-privacidad/      # Página legal
│   ├── terminos-y-condiciones/   # Página legal
│   ├── l/[uuid]/                 # Rutas públicas de tags
│   │   ├── page.tsx              # Viewer de ficha médica
│   │   └── config/page.tsx       # Configuración con PIN
│   └── dashboard/                # Panel administrativo
│       ├── page.tsx              # Dashboard principal (admin)
│       ├── tags/page.tsx         # Gestión de tags
│       ├── sellers/page.tsx      # Gestión de vendedores
│       └── admins/page.tsx       # Gestión de administradores
├── components/
│   ├── dashboard/
│   │   └── DashboardLayout.tsx   # Layout con sidebar
│   ├── ui/                       # Componentes reutilizables
│   │   ├── ActivationChart.tsx
│   │   ├── BulkActionsBar.tsx
│   │   ├── EmptyState.tsx
│   │   ├── FilterBar.tsx
│   │   ├── Modal.tsx
│   │   ├── Pagination.tsx
│   │   ├── Skeleton.tsx
│   │   ├── StatCard.tsx
│   │   └── StatusBadge.tsx
│   └── ToastContainer.tsx        # Sistema de notificaciones
├── lib/
│   ├── api.ts                    # Cliente API completo
│   ├── toast.ts                  # Sistema de toast custom
│   └── utils.ts                  # Utilidades (calculateAge, cn)
├── types/
│   └── index.ts                  # Tipos TypeScript
├── public/
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service Worker (referenciado)
├── middleware.ts                 # Redirect /L/ → /l/
├── next.config.mjs              # Config Next.js (standalone)
├── tailwind.config.ts           # Config Tailwind
├── Dockerfile                   # Build multi-stage
└── docker-compose.yml           # Orquestación
```

### Módulos Principales

#### A. Sistema de Autenticación
- **Archivos**: `lib/api.ts` (authApi, setTokens, getTokens, clearTokens)
- **Roles**: ADMIN, VENDEDOR
- **Flujo**: Login → JWT + Refresh Token → localStorage → Auto-refresh en 401
- **Protección**: Middleware no implementa auth (solo redirect de URLs)

#### B. Gestión de Tags
- **Estados**: VIRGIN → INCOMPLETE → ACTIVE | SUSPENDED
- **Operaciones**: 
  - Crear tags (admin)
  - Asignar a vendedores (bulk assign)
  - Suspender/activar
  - Desbloquear PIN
  - Copiar URL para NFC
- **API Endpoints**: `/tags`, `/tags/:id`, `/tags/:id/assign`, `/tags/bulk/*`

#### C. Viewer de Ficha Médica
- **Ruta**: `/l/[uuid]`
- **Acceso**: Público (sin autenticación)
- **Funcionalidad**: 
  - Mostrar datos médicos
  - Registrar escaneo (geolocalización + reverse geocoding)
  - Botón imprimir/PDF
  - Llamada directa a contactos

#### D. Configuración de Tag con PIN
- **Ruta**: `/l/[uuid]/config`
- **Flujo**:
  1. Tag VIRGIN → Crear PIN (4+ dígitos)
  2. Tag configurado → Login con PIN
  3. Acceso a formulario de datos médicos
  4. Guardado con token temporal del PIN
- **Datos**: userName, dob, bloodType, allergies, conditions, contacts, CURP, NSS, UMF

#### E. Dashboard Administrativo
- **Rutas protegidas por rol**:
  - `/dashboard` - Solo ADMIN (métricas globales)
  - `/dashboard/tags` - ADMIN y VENDEDOR
  - `/dashboard/sellers` - Solo ADMIN
  - `/dashboard/admins` - Solo ADMIN
- **Componentes**: DashboardLayout con sidebar condicional por rol

#### F. Sistema de Vendedores
- **CRUD completo**: Crear, editar, eliminar, resetear contraseña
- **Asignación de tags**: Bulk assign desde página de vendedores
- **Estadísticas**: Tag count, active, virgin, incomplete, suspended
- **Tasa de activación**: Cálculo en frontend

---

## 3. FLUJOS DE DATOS Y LÓGICA CRÍTICA

### Flujo 1: Activación de Tag (Usuario Final)
```
1. Usuario escanea QR/NFC → /l/[uuid]
2. Sistema verifica estado del tag
3. Si VIRGIN:
   → Redirige a /l/[uuid]/config
   → Usuario crea PIN (4+ dígitos)
   → PIN se guarda en backend
   → Login automático con PIN
   → Usuario llena datos médicos
   → Tag cambia a ACTIVE
4. Si ACTIVE:
   → Muestra ficha médica
   → Registra escaneo (geolocalización)
   → Reverse geocoding con OpenStreetMap
```

### Flujo 2: Gestión de Tags (Admin)
```
1. Admin crea lote de tags (1-500)
   → POST /tags { quantity, sellerId? }
   → Tags creados con estado VIRGIN
2. Admin asigna tags a vendedores
   → POST /tags/bulk/assign { tagIds, sellerId }
3. Admin suspende tags
   → DELETE /tags/:id
   → Estado cambia a SUSPENDED
4. Admin desbloquea PIN
   → POST /tags/:id/unlock-pin
```

### Flujo 3: Autenticación y Refresh
```
1. Login → POST /auth/login
   → Retorna { user, token, refresh_token }
   → setTokens() guarda en localStorage
2. Request con token expirado → 401
   → fetchWithAuth detecta 401
   → refreshAccessToken() → POST /auth/refresh
   → Reintenta request con nuevo token
3. Refresh falla → clearTokens() → redirect a /login
```

### Flujo 4: Registro de Escaneos
```
1. Viewer carga ficha médica
2. triggerScanRegistration():
   → Obtiene geolocalización (navigator.geolocation)
   → Reverse geocoding con OpenStreetMap API
   → POST /tags/:uuid/scan { lat, lng, city, country, userAgent }
3. Backend incrementa scanCount
4. Fallo silencioso (no bloquea UI)
```

### Flujo 5: Dashboard de Métricas (Admin)
```
1. Carga inicial → authApi.me() → verifica rol ADMIN
2. metricsApi.get(period) → GET /metrics?period=7d|30d|90d
3. Datos retornados:
   - totalTags, totalSellers, totalScans
   - statusCounts (VIRGIN, ACTIVE, SUSPENDED, INCOMPLETE)
   - recentScans, recentActivations
   - activationSeries (para gráfico)
4. Componente ActivationChart renderiza serie temporal
```

### Lógica Crítica: Control de Acceso por Rol
```typescript
// DashboardLayout.tsx:16-20
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { href: '/dashboard/tags', label: 'Tags', icon: QrCode, roles: ['ADMIN', 'VENDEDOR'] },
  { href: '/dashboard/sellers', label: 'Vendedores', icon: Users, roles: ['ADMIN'] },
  { href: '/dashboard/admins', label: 'Administradores', icon: UserCog, roles: ['ADMIN'] },
];

// Filtrado dinámico según user.role
navItems.filter(item => item.roles.includes(user.role))
```

### Lógica Crítica: Estados de Tag
```typescript
// types/index.ts:2
type TagStatus = 'VIRGIN' | 'INCOMPLETE' | 'ACTIVE' | 'SUSPENDED';

// Transiciones:
// VIRGIN → INCOMPLETE (usuario empieza a configurar)
// INCOMPLETE → ACTIVE (usuario guarda datos completos)
// ACTIVE → SUSPENDED (admin suspende)
// Cualquier estado → SUSPENDED (admin suspende)
```

### Lógica Crítica: PIN de Configuración
```typescript
// Validación: mínimo 4 dígitos numéricos
if (!/^\d{4,}$/.test(value)) {
  return 'El PIN debe tener al menos 4 digitos';
}

// Flujo:
// 1. setPin(uuid, pin) → POST /tags/:uuid/config/pin
// 2. pinLogin(uuid, pin) → POST /tags/:uuid/config/login
//    → Retorna { token, status }
// 3. updateMedicalData(token, medicalData, contacts)
//    → PUT /tags/config/data (con token del PIN)
```

---

## 4. CONVENCIONES Y DECISIONES TÉCNICAS

### Patrones de Diseño

#### A. Cliente API Centralizado
```typescript
// lib/api.ts
// Patrón: Wrapper sobre fetch con autenticación automática
export const api = {
  async get<T>(path: string): Promise<T>
  async post<T>(path: string, body?: unknown): Promise<T>
  async put<T>(path: string, body?: unknown): Promise<T>
  async delete<T>(path: string): Promise<T>
  async getPublic<T>(path: string): Promise<T>  // Sin auth
};

// Módulos especializados:
export const authApi = { register, login, logout, me }
export const tagsApi = { create, assign, bulkAssign, list, get, suspend, ... }
export const usersApi = { create, list, get, update, resetPassword, remove }
export const adminsApi = { list, create, update, remove }
export const metricsApi = { get }
export const pinApi = { setPin, pinLogin, updateMedicalData }
export const scanApi = { registerScan }
```

#### B. Componentes UI Reutilizables
- **Modal**: Sistema de modales con isOpen, onClose, title, size
- **StatusBadge**: Badges de estado con configuración por tipo
- **Skeleton**: Componentes de carga (CardSkeleton, TableSkeleton, PageLoader)
- **EmptyState**: Estados vacíos con icono, título, descripción, acción
- **Pagination**: Paginación reutilizable
- **FilterBar**: Barra de filtros con search, status, seller, date range
- **BulkActionsBar**: Acciones masivas (assign, suspend)

#### C. Sistema de Toast Custom
```typescript
// lib/toast.ts
// Patrón: Pub/Sub sin dependencias externas
export function toast(message: string, type: ToastType = 'info')
toast.success = (message: string) => toast(message, 'success')
toast.error = (message: string) => toast(message, 'error')

// Uso:
import { toast } from '@/lib/toast';
toast.success('Tag creado exitosamente');
toast.error('Error al cargar datos');
```

#### D. Manejo de Errores
```typescript
// Patrón consistente en toda la app:
try {
  const data = await apiCall();
  toast.success('Operación exitosa');
} catch (err: any) {
  toast.error(err.message || 'Error descriptivo');
}
```

#### E. Loading States
```typescript
// Patrón: Skeleton components para loading
if (loading) return <PageLoader />;
if (loading) return <CardSkeleton />;
if (loading) return <TableSkeleton rows={5} />;

// Componentes:
- PageLoader: Spinner centrado
- CardSkeleton: Placeholder de tarjeta con animación
- TableSkeleton: Placeholder de tabla con N filas
```

### Convenciones de Código

#### A. Estructura de Componentes
```typescript
'use client';  // Client components por defecto

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { Type } from '@/types';

export default function ComponentPage() {
  const router = useRouter();
  const [data, setData] = useState<Type | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const result = await apiCall();
      setData(result);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!data) return null;

  return <div>...</div>;
}
```

#### B. Naming Conventions
- **Archivos**: PascalCase para componentes, kebab-case para páginas
- **Variables**: camelCase
- **Constantes**: UPPER_CASE (WHATSAPP_NUMBER, API_BASE)
- **Tipos**: PascalCase (User, Tag, MedicalData)
- **API endpoints**: camelCase en backend, se mapean a métodos

#### C. Estilos
- **Tailwind CSS**: Clases utilitarias directamente en JSX
- **Colores**: Paleta personalizada (red-600 como primario)
- **Dark mode**: Dashboard usa bg-gray-950, bg-gray-800/50
- **Responsive**: Mobile-first con sm:, md:, lg: breakpoints
- **Animaciones**: transition-colors, transition-all, hover:states

#### D. Formularios
```typescript
// Patrón: Controlled components con validación
const [form, setForm] = useState({ field1: '', field2: '' });
const [submitting, setSubmitting] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!validate()) return;
  
  setSubmitting(true);
  try {
    await apiCall(form);
    toast.success('Éxito');
    router.push('/destino');
  } catch (err: any) {
    toast.error(err.message);
  } finally {
    setSubmitting(false);
  }
}
```

### Decisiones de Arquitectura

#### A. Autenticación en Cliente
- **Decisión**: Tokens en localStorage (no cookies)
- **Razón**: Simplicidad, sin problemas de CORS
- **Riesgo**: Vulnerable a XSS (mitigado por HTTPS)
- **Refresh**: Automático en 401 con retry

#### B. Rutas Públicas vs Privadas
- **Públicas**: `/l/[uuid]`, `/l/[uuid]/config`, `/`, `/aviso-de-privacidad`, `/terminos-y-condiciones`
- **Privadas**: `/dashboard/*`, `/login`, `/register`
- **Protección**: No hay middleware de auth, se valida en cada página con `authApi.me()`

#### C. API Externa
- **URL Base**: `process.env.NEXT_PUBLIC_API_URL` o default `https://apihelpme.codelabs.com.mx/`
- **Autenticación**: Bearer token en header Authorization
- **Formato**: JSON con estructura `{ success, data, error }`

#### D. Geolocalización
- **API**: OpenStreetMap Nominatim (reverse geocoding)
- **Timeout**: 10 segundos, maximumAge: 60 segundos
- **Fallback**: Si falla, registra escaneo sin ubicación

#### E. PWA Support
- **Manifest**: Configurado para standalone mode
- **Service Worker**: Registrado pero archivo no presente en repo
- **Icons**: icon-192.png, icon-512.png (referenciados)

### Reglas Estrictas del Proyecto

#### A. No Comentarios
- **Regla**: NO AGREGAR COMENTARIOS a menos que se soliciten explícitamente
- **Excepción**: Comentarios en código existente deben preservarse

#### B. TypeScript Estricto
- Todos los componentes deben estar tipados
- Interfaces en `types/index.ts`
- Evitar `any` cuando sea posible (aunque hay uso extensivo)

#### C. Client Components
- Todas las páginas usan `'use client'`
- No hay Server Components en el proyecto
- Razón: Interactividad completa, autenticación en cliente

#### D. Iconos
- **Librería**: Lucide React exclusivamente
- **No usar**: Heroicons, FontAwesome, SVGs custom

#### E. Modales
- **Componente**: `Modal` reutilizable
- **No usar**: window.confirm, window.alert, dialogs nativos

---

## 5. INVENTARIO DE DEUDA TÉCNICA Y PUNTOS ABIERTOS

### Deuda Técnica Crítica

#### 1. Service Worker Faltante
- **Problema**: `layout.tsx:39` registra `/sw.js` pero el archivo no existe en `/public`
- **Impacto**: PWA no funciona correctamente, offline mode no disponible
- **Prioridad**: ALTA
- **Solución**: Crear `public/sw.js` con estrategias de cache

#### 2. Registro No Utilizado
- **Problema**: `/register` existe pero no se usa (mensaje dice "Contacta al administrador")
- **Impacto**: Código muerto, confusión para desarrolladores
- **Prioridad**: BAJA
- **Solución**: Eliminar página o implementar registro público

#### 3. Tipos `any` Excesivos
- **Problema**: Uso extensivo de `any` en `app/dashboard/*/page.tsx`
- **Ejemplos**: 
  - `const [metrics, setMetrics] = useState<any>(null)`
  - `const [tags, setTags] = useState<any[]>([])`
- **Impacto**: Pérdida de type safety, errores en runtime
- **Prioridad**: MEDIA
- **Solución**: Definir interfaces específicas (MetricsData, Tag[], etc.)

#### 4. Validación de PIN Débil
- **Problema**: Solo valida longitud mínima (4 dígitos)
- **Falta**: Validación de complejidad, no permite PINs como "1234" o "0000"
- **Impacto**: Seguridad débil
- **Prioridad**: MEDIA
- **Solución**: Agregar validación de patrones comunes

#### 5. Error Handling en Viewer
- **Problema**: `app/l/[uuid]/page.tsx:56-61` maneja errores de forma genérica
- **Falta**: Diferenciar entre "tag no encontrado" vs "error de red" vs "tag suspendido"
- **Impacto**: UX confusa para usuarios
- **Prioridad**: MEDIA
- **Solución**: Manejar errores específicos con mensajes claros

### Áreas Frágiles

#### 1. Middleware de Redirect
```typescript
// middleware.ts
if (pathname.startsWith('/L/')) {
  const newPath = pathname.replace('/L/', '/l/');
  return NextResponse.redirect(new URL(newPath, request.url));
}
```
- **Problema**: Solo maneja `/L/` → `/l/`, no otros casos
- **Riesgo**: URLs en mayúsculas de NFC/QR antiguos
- **Mitigación**: Funcional, pero limitado

#### 2. Cálculo de Edad
```typescript
// lib/utils.ts:1-20
export function calculateAge(dob: string): number {
  const parts = dob.split('/');
  if (parts.length !== 3) return 0;
  // ...
}
```
- **Problema**: Asume formato DD/MM/YYYY, falla con otros formatos
- **Riesgo**: Edad incorrecta si backend cambia formato
- **Mitigación**: Validar formato en backend

#### 3. Geolocalización Silenciosa
```typescript
// app/l/[uuid]/page.tsx:67-101
function triggerScanRegistration() {
  // ...
  scanApi.registerScan(uuid, { latitude, longitude, city, country, userAgent });
}
```
- **Problema**: Fallo silencioso si usuario deniega permisos
- **Riesgo**: Datos de ubicación incompletos
- **Mitigación**: Aceptable para caso de uso (no crítico)

#### 4. Refresh Token en localStorage
- **Problema**: Vulnerable a ataques XSS
- **Riesgo**: Robo de sesión si hay vulnerabilidad XSS
- **Mitigación**: HTTPS obligatorio, CSP headers (no configurados)
- **Prioridad**: MEDIA
- **Solución**: Considerar httpOnly cookies (requiere cambios en backend)

### Puntos Abiertos

#### 1. Iconos de PWA Faltantes
- **Problema**: `manifest.json` referencia `/icon-192.png` y `/icon-512.png` pero no existen
- **Impacto**: PWA no muestra icono personalizado
- **Acción**: Crear iconos o actualizar manifest

#### 2. Variables de Entorno
- **Problema**: `.env.example` solo tiene `NEXT_PUBLIC_API_URL`
- **Falta**: Documentación de otras variables potenciales
- **Acción**: Expandir `.env.example` con comentarios

#### 3. Tests
- **Problema**: No hay tests en el proyecto
- **Impacto**: Regresiones no detectadas
- **Acción**: Implementar test suite (Jest, React Testing Library)

#### 4. Error Boundaries
- **Problema**: No hay React Error Boundaries
- **Impacto**: Errores en componentes rompen toda la app
- **Acción**: Agregar error boundaries en rutas principales

#### 5. Accesibilidad (a11y)
- **Problema**: Faltan atributos ARIA en algunos componentes
- **Ejemplos**: 
  - Modales sin `aria-labelledby`
  - Botones icono sin `aria-label` (aunque algunos lo tienen)
- **Acción**: Auditoría de accesibilidad completa

#### 6. Performance
- **Problema**: No hay optimización de imágenes
- **Falta**: Next.js Image component no se usa
- **Acción**: Migrar a `next/image` para optimización automática

#### 7. Internacionalización
- **Problema**: Textos hardcodeados en español
- **Falta**: Sistema de i18n
- **Acción**: Considerar si se necesita multi-idioma

### Componentes que Requieren Atención Especial

#### 1. `app/l/[uuid]/config/page.tsx` (1168+ líneas)
- **Problema**: Archivo muy largo, difícil de mantener
- **Solución**: Dividir en componentes más pequeños:
  - PinInput (ya existe como componente interno)
  - MedicalDataForm
  - ContactList
  - AllergySelector
  - HereditaryConditionsSelector

#### 2. `app/dashboard/tags/page.tsx` (499 líneas)
- **Problema**: Lógica de negocio mezclada con UI
- **Solución**: Extraer hooks custom:
  - useTags()
  - useTagFilters()
  - useBulkActions()

#### 3. `lib/api.ts` (332 líneas)
- **Problema**: Todo en un archivo
- **Solución**: Dividir en módulos:
  - lib/api/client.ts (fetchWithAuth, api object)
  - lib/api/auth.ts (authApi)
  - lib/api/tags.ts (tagsApi)
  - lib/api/users.ts (usersApi, adminsApi)
  - lib/api/metrics.ts (metricsApi)

---

## RESUMEN EJECUTIVO PARA IA

**HelpMe Frontend** es una aplicación Next.js 14 con App Router que gestiona un sistema de identificación médica de emergencia mediante tags NFC/QR.

**Puntos Clave**:
- **Autenticación**: JWT con refresh tokens en localStorage
- **Roles**: ADMIN (control total), VENDEDOR (gestiona sus tags)
- **Flujo principal**: Usuario escanea QR → ve ficha médica → paramédico accede a datos críticos
- **API externa**: Backend REST en `apihelpme.codelabs.com.mx`
- **Estados de tag**: VIRGIN → INCOMPLETE → ACTIVE | SUSPENDED
- **PIN**: Configuración protegida por PIN de 4+ dígitos
- **PWA**: Configurada pero service worker faltante
- **UI**: Tailwind CSS, Lucide icons, componentes reutilizables
- **Deuda técnica**: Tipos `any`, service worker faltante, archivo de config muy largo

**Archivos Críticos**:
1. `lib/api.ts` - Cliente API completo
2. `app/l/[uuid]/config/page.tsx` - Configuración de tag (1168 líneas)
3. `app/dashboard/tags/page.tsx` - Gestión de tags
4. `components/dashboard/DashboardLayout.tsx` - Layout con control de roles
5. `types/index.ts` - Definiciones de tipos

**Convenciones Importantes**:
- NO agregar comentarios
- Usar `'use client'` en todas las páginas
- Sistema de toast custom (`lib/toast.ts`)
- Componentes UI reutilizables en `components/ui/`
- Tailwind CSS para estilos
- TypeScript con tipos en `types/index.ts`
