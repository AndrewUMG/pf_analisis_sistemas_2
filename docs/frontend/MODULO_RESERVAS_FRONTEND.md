# Frontend — Módulo de reservas del cliente

> Primer módulo visual del proyecto: el flujo completo que usa un cliente para
> registrarse, explorar el catálogo, reservar una cita y gestionarla. Construido
> con **React 18 + TypeScript + Tailwind CSS 4 + Vite**, como cliente
> independiente que consume la API de Laravel (ver `docs/backend/FUNCIONAMIENTO_BACKEND.md`).

## 1. ¿Qué incluye este módulo?

| Pantalla | Ruta | Qué hace |
|---|---|---|
| Catálogo | `/` | Público. Lista servicios (con filtro por categoría) y el equipo de barberos. |
| Iniciar sesión | `/login` | Autentica contra `POST /api/auth/login` y guarda el token. |
| Crear cuenta | `/registro` | Registra un cliente nuevo (`POST /api/auth/registro`). |
| Reservar cita | `/reservar` | Wizard de 4 pasos: servicios → barbero → fecha/hora → confirmar. |
| Mis citas | `/mis-citas` | Lista las citas del cliente autenticado y permite cancelarlas. |

Las rutas `/reservar` y `/mis-citas` están protegidas: si no hay sesión, redirigen a `/login`.

## 2. Arquitectura

```
frontend/
  src/
    api/client.ts        → instancia de axios + token Bearer + traductor de errores
    context/AuthContext.tsx → estado global de sesión (usuario, login, logout)
    types/                → formas de datos que devuelve la API (Servicio, Cita, etc.)
    components/           → piezas reutilizables (Navbar, Spinner, Alerta, EstadoBadge...)
    pages/                 → una página por ruta
```

Es un proyecto **separado** del backend (`backend/`), que se comunica con él únicamente
por HTTP. Así lo dejó previsto el propio backend: `AuthController` ya usa tokens
Bearer (Sanctum) en vez de sesiones "porque el frontend consumirá esta API como
cliente independiente (SPA o app móvil futura)".

**Autenticación:** al iniciar sesión o registrarse, el backend responde con
`{ usuario, token }`. El token se guarda en `localStorage` y `api/client.ts` lo
adjunta automáticamente como header `Authorization: Bearer {token}` en cada
petición. Si el backend responde `401` (token vencido o inválido), la sesión
local se limpia sola.

**Reglas de negocio que vienen del backend, no del frontend:** el wizard de
reserva no inventa disponibilidad ni valida colisiones de horario — solo
llama a `GET /barberos/{id}/disponibilidad` (que ya aplica la anticipación
mínima y el horario del barbero) y a `POST /citas` (que aplica el bloqueo de
fila para evitar dobles reservas). El frontend solo filtra en pantalla qué
barberos ofrecen **todos** los servicios elegidos, para no dejar que el
usuario arme una combinación que el backend rechazaría de todas formas.

## 3. Cómo ponerlo a funcionar

Requiere el backend corriendo (ver `docs/backend/FUNCIONAMIENTO_BACKEND.md`) y
Node.js 18+ instalado.

```bash
# 1) Backend (en una terminal aparte)
cd backend
php artisan serve   # http://127.0.0.1:8000

# 2) Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173
```

La URL de la API se configura en `frontend/.env` (ya viene lista para desarrollo local):

```
VITE_API_URL=http://127.0.0.1:8000/api
```

Abre **http://localhost:5173** en el navegador. Puedes crear una cuenta nueva desde
"Crear cuenta", o iniciar sesión con el cliente de prueba si el backend fue
sembrado con `php artisan migrate:fresh --seed` (ver credenciales demo en la
documentación del backend — nota: el seeder no crea un cliente por defecto,
solo administrador/recepción/barberos, así que para probar el flujo de
reserva regístrate como cliente nuevo desde la pantalla de registro).

No se necesitó configurar CORS aparte: el backend ya trae habilitado por
defecto el acceso a `api/*` desde cualquier origen (`config` interno de
Laravel), suficiente para desarrollo local con tokens Bearer.

## 4. Decisiones de UI/UX

- **Paleta oscura + dorado** (carbón/negro con acentos dorados), acorde a una
  barbería, definida como tokens de Tailwind en `src/index.css` (`--color-carbon-*`,
  `--color-gold-*`) para mantener consistencia en toda la app.
- **Wizard paso a paso** para reservar en vez de un formulario largo: reduce
  la carga cognitiva y en cada paso solo se muestran las opciones válidas
  (p. ej. solo aparecen los barberos que sí ofrecen los servicios elegidos).
- **Botones deshabilitados en vez de ocultos** cuando falta un dato requerido
  (p. ej. "Continuar" se activa hasta elegir un horario), para que el usuario
  siempre entienda qué le falta.
- **Mensajes de error legibles**: `mensajeError()` traduce tanto errores de
  validación de Laravel (`422` con `errors`) como errores de reglas de negocio
  (`NegocioException`, `422` con `mensaje`) a un texto plano en español.
- **Responsive**: layout en grilla de 1 columna en móvil y hasta 3 en pantallas
  grandes; navegación y formularios probados a 400px de ancho.

## 5. Verificado en este avance

Probado end-to-end contra el backend real (no solo revisión de código):
registro de cliente → login → explorar catálogo → completar el wizard de
reserva (servicios → barbero → franja horaria real devuelta por el backend →
confirmación) → ver la cita en "Mis citas" → cancelarla y ver el estado
actualizado a "Cancelada".

## 6. Qué falta (próximos módulos)

Este primer módulo cubre solo el flujo del **cliente** (RF-01, RF-02, RF-06 parcial).
Quedan pendientes como próximos módulos de frontend: panel del barbero (agenda,
iniciar/finalizar atención), panel de recepción (cobro, registro presencial,
inventario) y panel de administrador (catálogo, usuarios, reportes) — todos ya
tienen su API lista en el backend, solo falta construir la interfaz.
