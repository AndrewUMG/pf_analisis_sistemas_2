# Cómo funciona el backend — Studio La Barber

> Guion de referencia para una explicación de ~5 minutos. Backend construido con **Laravel 12 + PHP 8.2 + MySQL**, siguiendo los requerimientos del documento DERCAS (`docs/pdf_dercas/`).

## 1. ¿Qué hace este backend? (30 seg)

Es la API que soporta todo el negocio de la barbería: un cliente reserva una cita en línea, el barbero la atiende desde su agenda, recepción cobra y controla el inventario, y el administrador ve reportes y configura las reglas del negocio. El frontend (web o móvil) hablará con esta API por HTTP, nunca contra la base de datos directamente.

## 2. Arquitectura en 4 capas (1 min)

```
Petición HTTP
    │
    ▼
routes/api.php        → decide QUÉ ruta existe y QUIÉN puede usarla (rol)
    │
    ▼
Controllers/           → reciben la petición, validan los datos de entrada
(app/Http/Controllers)   y devuelven la respuesta JSON. No tienen lógica de negocio.
    │
    ▼
Services/               → aquí vive TODA la lógica de negocio y las reglas
(app/Services)            del DERCAS (disponibilidad, comisiones, inventario...)
    │
    ▼
Models/ (Eloquent) →  representan las tablas de MySQL y sus relaciones
(app/Models)
```

**Por qué separar así:** un Controller nunca inserta directamente en la base de datos ni decide si una reserva es válida — eso lo hace el Service correspondiente. Así, si mañana se agrega una app móvil o un bot de WhatsApp, ambos pueden reutilizar los mismos Services sin duplicar reglas de negocio.

Los errores de negocio (ej. "ese horario ya no está disponible") se lanzan como una excepción propia, `NegocioException`, que Laravel traduce automáticamente a una respuesta JSON clara con código `422`, en vez de un error técnico feo.

## 3. La pieza más importante: el motor de reservas (1.5 min)

`app/Services/ReservaService.php` es el corazón del sistema (RF-02). Resuelve el problema real de una barbería: **dos clientes no pueden reservar el mismo horario con el mismo barbero.**

Flujo de una reserva:

1. El cliente pide franjas disponibles → `disponibilidad()` revisa el horario semanal del barbero, le resta las citas ya ocupadas y las excepciones (vacaciones, permisos), y devuelve los huecos libres cada 15 minutos.
2. El cliente elige una franja y confirma → `reservar()` vuelve a verificar que siga libre, pero esta vez **dentro de una transacción con bloqueo de fila** (`lockForUpdate()`). Esto es clave: si dos personas confirman el mismo horario en el mismo instante, la base de datos obliga a que una espere a la otra, así nunca se duplica una cita. Quien llega segundo recibe un error claro ("ese horario ya no está disponible").
3. Se crea la cita y se programan sus notificaciones (confirmación + recordatorios de 24h y 2h antes), que un comando programado (`notificaciones:procesar-pendientes`, cada 5 min) va enviando cuando corresponde.

El mismo Service también maneja cancelaciones/reagendamientos (respetando un mínimo de horas de anticipación) y el registro de clientes que llegan sin cita (walk-in).

## 4. Los demás módulos, en breve (1 min)

- **AgendaService** — el barbero inicia y finaliza la atención de cada cita, marca ausencias, y ve su resumen del día con comisiones.
- **VentaService** — registra el cobro (servicios + productos), genera el número de recibo y calcula la comisión de cada barbero.
- **InventarioService** — entradas, salidas y ajustes de productos, siempre con el mismo control de bloqueo para que el stock nunca quede negativo.
- **NotificacionService** — solo encola y envía mensajes; el proveedor real (WhatsApp, correo) está detrás de una interfaz (`ProveedorMensajeria`), así se puede conectar el API real después sin tocar el resto del código.
- **ReporteController** — ingresos, servicios más pedidos, comisiones por barbero y tasa de cancelaciones/ausentismo, para el panel del administrador.

Todo el acceso a la API requiere iniciar sesión (**Laravel Sanctum**, tokens tipo Bearer), y cada ruta sensible exige un rol específico (`administrador`, `barbero`, `recepcionista`, `cliente`) mediante un middleware propio (`EnsureRole`).

## 5. Cómo probarlo ahora mismo (1 min)

```bash
cd backend
php artisan migrate:fresh --seed   # crea las tablas y datos de demostración
php artisan serve                  # http://127.0.0.1:8000
```

El seeder deja listo un usuario administrador de prueba:

- **admin@studiolabarber.local** / `password123`
- Dos barberos (`carlos@...`, `luis@...`) y una recepcionista, misma contraseña.

Ejemplo rápido con `curl`:

```bash
# Ver el catálogo de servicios (ruta pública)
curl http://127.0.0.1:8000/api/servicios

# Iniciar sesión y obtener un token
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@studiolabarber.local","password":"password123"}'
```

Todas las rutas quedan documentadas y agrupadas por permisos en `routes/api.php`.

## 6. Estado actual y siguiente paso

Implementado y probado de punta a punta: autenticación y roles (RF-05), catálogo (RF-01), reservas con control de concurrencia (RF-02), notificaciones programadas (RF-04), agenda y atención del barbero (RF-03), cancelaciones/reagendamiento (RF-06), inventario (RF-09), cobro y comisiones (RF-08), registro presencial (RF-11), valoraciones (RF-10) y reportes (RF-07).

**Siguiente paso:** construir el frontend que consuma esta API — el backend ya está listo para mostrarse como avance funcional del proyecto.
