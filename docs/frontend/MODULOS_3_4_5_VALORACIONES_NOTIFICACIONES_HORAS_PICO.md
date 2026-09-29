# Módulos restantes: Valoraciones (RF-10), Notificaciones (RF-04) y Horas pico (RF-07)

> Cierran los huecos que quedaban frente al DERCAS. Todos se probaron con
> pruebas automáticas (`backend/tests/Feature/ValoracionesNotificacionesReportesTest.php`,
> 12 casos) y en vivo con los roles reales.

## 1. Valoraciones (RF-10)

**Cliente** — en *Mis citas → Historial*, cada cita completada sin valorar muestra **Calificar servicio**. El diálogo usa un selector de estrellas accesible (grupo de radios: flechas del teclado, etiqueta "Excelente/Bueno…", el botón se habilita al elegir) y un comentario opcional que **solo ve el administrador**. La cita valorada muestra sus estrellas.

**Público** — las tarjetas de barbero (catálogo y wizard de reserva) muestran `★ 4.0 (2)` o "Sin valoraciones todavía". El promedio cuenta **solo las valoraciones visibles**.

**Administrador** (`/admin/valoraciones`) — resumen (promedio, total, distribución 1-5 estrellas), filtros por barbero y estrellas, paginación y **Ocultar / Volver a mostrar** (moderación sin borrar el registro). Una valoración oculta deja de influir en el promedio público.

Backend: `GET /valoraciones`, `PUT /valoraciones/{id}` (admin); `promedio_valoracion` y `total_valoraciones` en `GET /barberos`.

## 2. Notificaciones (RF-04)

- **Dos canales reales de programación**: al reservar se encolan confirmación + recordatorios de 24 h y 2 h **por correo y por WhatsApp**, según los datos que tenga el cliente (los clientes presenciales solo reciben WhatsApp; su correo interno inventado se ignora).
- **Envío de correo real**: `MensajeriaPorCanal` envía por el mailer de Laravel (`MAIL_MAILER=log` en desarrollo escribe el correo en el log; con `smtp` sale de verdad). WhatsApp sigue en log hasta contratar la API oficial: basta reemplazar esa implementación de `ProveedorMensajeria`.
- **Trazabilidad**: cada notificación guarda destino, texto enviado, intentos y último error (migración `add_traza_a_notificaciones_table`).
- **Administrador** (`/admin/notificaciones`): totales por estado (clic para filtrar), filtros por tipo y canal, detalle de cada envío, **Enviar pendientes ahora** (en producción lo hace el scheduler cada 5 min) y **Reintentar** en las fallidas.

Backend: `GET /notificaciones`, `POST /notificaciones/procesar`, `POST /notificaciones/{id}/reintentar` (admin).

## 3. Horas pico (RF-07)

Nueva pestaña **Reportes → Horas pico**: tarjetas con la hora pico, el día más ocupado y las citas analizadas, y un **mapa de calor** día × hora (no cuenta canceladas; solo se dibujan las horas con actividad; cada celda tiene su texto para lectores de pantalla). Backend: `GET /reportes/horas-pico`, agregado en PHP para funcionar igual en MySQL y en las pruebas.

Además, **Exportar CSV** (con BOM para que Excel respete los acentos) en Ingresos, Servicios, Comisiones y Horas pico.

## Mejoras transversales

- `ErrorBoundary`: si una pantalla falla al renderizar, se muestra un aviso con "Reintentar" en vez de una pantalla en blanco (en desarrollo, con el mensaje técnico).
- Mensajes de validación **en español** (`backend/lang/es/validation.php`, `APP_LOCALE=es`): "El correo ya está registrado." en vez de "The email has already been taken.".
- Las notificaciones pendientes muestran el destino previsto aunque aún no se hayan enviado.

## Cómo probarlo

1. Como cliente, valora una cita completada (o crea una: barbero *Iniciar/Finalizar* en su agenda).
2. Como administrador: **Valoraciones**, **Notificaciones → Enviar pendientes ahora** y **Reportes → Horas pico** (ajusta el rango de fechas para incluir citas futuras).
