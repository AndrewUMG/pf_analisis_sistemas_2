# Frontend — Paneles internos (Barbero, Recepción, Administrador)

> Segundo bloque de frontend: las pantallas de trabajo diario del personal.
> Con esto, los cuatro roles del sistema (cliente, barbero, recepcionista,
> administrador) ya tienen una interfaz completa que cubre RF-01 a RF-11.

## 1. ¿Qué se agregó?

Cada rol aterriza en una pantalla distinta justo después de iniciar sesión
(`rutaInicioPara()` en `src/components/RoleRoute.tsx`), y el menú superior
cambia según el rol de quien tiene la sesión abierta.

| Rol | Pantallas | Ruta base |
|---|---|---|
| **Barbero** | Mi agenda (citas del día, iniciar/finalizar atención, marcar ausente) · Mi horario (jornada semanal + días libres/permisos) | `/barbero/*` |
| **Recepcionista** | Caja (cobrar citas completadas y/o productos) · Registro presencial (walk-in) · Inventario | `/recepcion/*` |
| **Administrador** | Catálogo (servicios y barberos) · Usuarios · Inventario (comparte pantalla con recepción) · Reportes (ingresos, servicios, comisiones, cancelaciones, ventas) · Parámetros | `/admin/*` |

Las rutas están protegidas con `RoleRoute`, que redirige a `/login` sin
sesión y a `/` si el rol no coincide — así un cliente no puede entrar a
`/admin/usuarios` cambiando la URL a mano, ni un barbero a la caja de
recepción.

## 2. Piezas nuevas reutilizables

- **`PageHeader`** — título + descripción + acción a la derecha, consistente en todas las pantallas internas.
- **`Tabs`** — pestañas simples (usadas en Catálogo admin y en Reportes).
- **`RoleRoute` / `rutaInicioPara()`** — guardia de rutas por rol y destino post-login.

## 3. Un vistazo a cada panel

**Barbero → Mi agenda**: llama a `GET /barberos/{id}/agenda?fecha=...`
(`AgendaService::agendaDelDia`) y muestra el resumen de comisión del día más
la lista de citas con las acciones válidas según su estado: *Iniciar
atención*, *Finalizar atención*, *Marcar ausente*. Si el barbero intenta
iniciar una cita con mucha anticipación, el backend responde
`requiere_confirmacion` y la pantalla pide confirmar antes de reintentar.

**Barbero → Mi horario**: siete filas (Lunes a Domingo) para definir la
jornada recurrente (`PUT /barberos/{id}/horarios`) y un formulario para
bloquear fechas puntuales — vacaciones, permisos — que llama a
`POST /barberos/{id}/excepciones`.

**Recepción → Caja**: un mismo recibo puede incluir una cita ya completada
*y* productos vendidos aparte, tal como lo permite `VentaService::registrarCobro`.
La pantalla lista las citas en estado `completada` para elegir una, permite
sumar productos con un contador de cantidad, calcula el total en vivo y
muestra el número de recibo generado al confirmar.

**Recepción → Registro presencial**: replica el mismo selector de
servicios/barbero del wizard de reserva del cliente, pero llama a
`POST /citas/walkin`, que agenda al primer horario libre de **hoy**.

**Recepción / Administrador → Inventario**: alta, edición y baja lógica de
productos, más el registro de movimientos (entrada, salida, ajuste) que
`InventarioService` valida (existencia nunca queda negativa, todo ajuste
exige motivo).

**Administrador → Catálogo**: dos pestañas. *Servicios* es un CRUD directo.
*Barberos* es un flujo de dos pasos porque así lo modela el backend: primero
se crea la cuenta de usuario con rol "barbero" (`POST /usuarios`) y luego el
perfil profesional que la referencia (`POST /barberos`, con especialidad,
comisión y los servicios que presta).

**Administrador → Usuarios**: búsqueda y filtro por rol sobre todas las
cuentas del sistema; alta, edición de datos/rol/estado y baja lógica
(desactiva en vez de borrar, para no perder el historial de citas y ventas
asociado).

**Administrador → Reportes**: cuatro reportes gerenciales (`REP-01`,
`REP-02`, `REP-03`, `REP-05` del backend) con selector de rango de fechas,
más una quinta pestaña "Ventas" que lista todos los recibos y permite
anularlos — único punto donde se puede revertir una venta (y su inventario).

**Administrador → Parámetros**: edita en línea las reglas de negocio
configurables (holgura entre citas, anticipación mínima, tolerancia de
ausencia) sin tocar código.

## 4. Bug encontrado y corregido durante esta etapa

Al construir "Mi horario" se detectó que el backend nunca reconocía al
usuario autenticado en las rutas **públicas** que también intentan
comportarse distinto si hay sesión (`GET /servicios`, `GET /productos`,
`GET /barberos/{barbero}`). La causa: esas rutas viven fuera del grupo
`Route::middleware('auth:sanctum')`, así que `$request->user()` sin
argumento siempre devolvía `null`, sin importar que se enviara un token
válido — con eso, un administrador viendo el inventario veía exactamente lo
mismo que un visitante anónimo (solo productos activos, sin poder gestionar
bajas). Se corrigió pidiendo el usuario directamente al guard de Sanctum con
`$request->user('sanctum')` en `ServicioController`, `ProductoController` y
`BarberoController`. Ver también `docs/backend/FUNCIONAMIENTO_BACKEND.md`.

## 5. Verificado en este avance

Probado en vivo con los tres roles reales del seeder (`carlos@studiolabarber.local`,
`recepcion@studiolabarber.local`, `admin@studiolabarber.local`): alta de un
barbero nuevo de punta a punta (usuario + perfil), inicio y cierre de
atención con cálculo de comisión, jornada semanal y bloqueo de fechas,
cobro combinando una cita y un producto con descuento de inventario en
tiempo real, y anulación de venta con reversión de existencias.

## 6. Qué queda pendiente

Con esto el frontend cubre el sistema completo descrito en el DERCAS.
Quedan como posibles siguientes pasos: subir fotos reales para reemplazar
los `ImagenPlaceholder`, paginación visible en listados largos (usuarios,
ventas), y notificaciones push/email reales en vez del proveedor de log
(`LogProveedorMensajeria`) que ya trae el backend.
