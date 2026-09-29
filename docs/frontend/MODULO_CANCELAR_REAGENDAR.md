# Módulo 2 — Cancelar y reagendar citas (RF-06)

> Completa el ciclo de la reserva del cliente: después de reservar
> (`MODULO_RESERVAS_FRONTEND.md`), el cliente puede consultar, mover o
> cancelar su cita desde **Mis citas** (`/mis-citas`), respetando la
> anticipación mínima configurable (2 h por defecto).

## Qué hace

| Acción | Cómo se ve | Regla |
|---|---|---|
| Ver mis citas | Pestañas **Próximas** (de la más cercana a la más lejana) e **Historial** (de la más reciente hacia atrás), con contador | — |
| Reagendar | Diálogo con nueva fecha, franjas libres reales, resumen "Nueva cita: …" y motivo opcional | Mismos servicios y barbero; el nuevo horario también exige la anticipación mínima |
| Cancelar | Diálogo de confirmación con motivo opcional (reemplaza al `window.confirm`) | Solo citas `confirmada` y con anticipación suficiente |
| Ya no modificable | La tarjeta explica por qué (faltan menos de X horas) y sugiere llamar a la barbería | El backend lo decide (`puede_modificar`) |

## Decisiones de UI/UX

- **Política visible antes de actuar**: cada cita confirmada dice hasta cuándo se puede cambiar, en vez de mostrar un error después del clic.
- **Diálogos accesibles** (`components/Modal.tsx`): `role="dialog"`, foco atrapado, Esc y clic fuera para cerrar, scroll de fondo bloqueado y foco devuelto al abrirlo. En móvil se ancla abajo como una hoja.
- **Sin sorpresas en reagendar**: el horario actual aparece libre (la cita que se mueve no se bloquea a sí misma), el botón de confirmar se deshabilita hasta elegir una franja distinta, y se protege contra respuestas viejas al cambiar de fecha.
- **Acción destructiva diferenciada**: botón `btn-peligro` solo en la confirmación final; "Mantener mi cita" es la salida segura.
- **Retroalimentación**: aviso de éxito con `role="status"` ("Tu cita se movió al lunes, 5 de octubre a las 15:00") y motivo de cancelación visible en el historial.
- Fechas en español largo (`utils/fechas.ts`); el "hoy" se calcula en la zona del navegador (antes usaba UTC y podía adelantar el día por la noche).

## Backend (lo que cambió)

- **Permisos por dueño** en `GET/POST /citas/{cita}…`: un cliente solo ve/cancela/reagenda **sus** citas; el barbero, las suyas; administración y recepción, todas (`403` en otro caso). Antes cualquier usuario autenticado podía cancelar la cita de otro cambiando el id.
- **Reagendar respeta la anticipación** del *nuevo* horario (antes se podía saltar la regla moviendo la cita a una hora inminente).
- `GET /barberos/{id}/disponibilidad` acepta `excluir_cita_id` para que la cita que se mueve no bloquee su propio horario.
- La cita ahora expone `puede_modificar` y `anticipacion_minima_horas`, calculados con la misma zona horaria que usa el servidor.
- Corrección transversal: el backend devuelve los errores de validación en `errores`; `mensajeError()` ahora los muestra (antes login/registro mostraban solo "Los datos enviados no son válidos.").

## Pruebas

`backend/tests/Feature/CancelarReagendarTest.php` (8 casos, `php artisan test`): cancelar con anticipación, `puede_modificar`, aislamiento entre clientes (403), rechazo dentro del límite, reagendar a franja libre / ocupada / sin anticipación, y disponibilidad con `excluir_cita_id`.
Además se probó en vivo con un cliente real: reagendar, cancelar con motivo y ver el historial.

## Cómo probarlo

1. Backend: `php artisan serve`; frontend: `npm run dev` (ver `MODULO_RESERVAS_FRONTEND.md`).
2. Entra como cliente, reserva con al menos 2 h de anticipación y abre **Mis citas**.
