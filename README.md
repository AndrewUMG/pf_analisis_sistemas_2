# Studio La Barber

Sistema web de gestión para una barbería: reservas en línea, agenda de barberos, caja e inventario, valoraciones, notificaciones y reportes. Cubre los requisitos RF-01 a RF-11 del documento DERCAS (`docs/pdf_dercas`).

- **Backend:** Laravel 12 (API REST con Sanctum), MySQL.
- **Frontend:** React + Vite + TypeScript + Tailwind 4.

```
backend/   API Laravel
frontend/  Aplicación React
docs/      Documentación (backend, frontend y sistema de diseño)
```

## Requisitos

PHP 8.2+, Composer, Node 20+ y MySQL (por ejemplo con XAMPP).

## Puesta en marcha

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env        # y configura DB_* con tu base de datos MySQL
php artisan key:generate
php artisan migrate --seed
php artisan storage:link    # necesario para ver las fotos subidas
php artisan serve --port=8000
```

Variables útiles del `.env`: `APP_TIMEZONE` (por defecto `America/Guatemala`), `FRONTEND_URL` (se usa en el enlace de "olvidé mi contraseña") y `MAIL_*` (con `MAIL_MAILER=log` los correos solo se escriben en `storage/logs/laravel.log`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

El frontend se conecta por defecto a `http://127.0.0.1:8000/api`; cámbialo con la variable `VITE_API_URL` (archivo `frontend/.env`).

### 3. Cuentas de prueba (seeder)

Todas con contraseña `password123`:

| Rol | Correo |
|---|---|
| Administrador | admin@studiolabarber.local |
| Barbero | carlos@studiolabarber.local |
| Recepción | recepcion@studiolabarber.local |
| Cliente | ana.cliente@example.com |

## Personalización del sitio

- **Datos del negocio** (dirección, teléfono, correo, horario) y **fotos de portada y de login/registro:** `frontend/src/config/negocio.ts`. Las imágenes se colocan en `frontend/public/imagenes/` (`hero.webp` 1250×1500 px y `local.webp` 1000×1400 px, menos de 300 KB cada una).
- **Fotos de servicios y barberos:** se suben desde el panel Administrador → Catálogo. Se guardan en `backend/storage/app/public` y no forman parte del repositorio.
- **Colores y tipografía:** `frontend/src/index.css` (ver `docs/frontend/SISTEMA_DE_DISENO.md`).

## Pruebas y calidad

```bash
cd backend && php artisan test            # pruebas del backend
cd frontend && npx tsc -b                 # tipos
cd frontend && npm run build              # compilación de producción
cd frontend && node scripts/contraste.mjs # contraste de colores (WCAG AA)
```

En desarrollo, `http://localhost:5173/dev/responsive` muestra cualquier ruta a 360, 768, 1280 y 1920 px.

## Antes de publicar en producción

- `APP_ENV=production` y `APP_DEBUG=false`; nuevo `APP_KEY`.
- Cambiar las contraseñas de las cuentas de prueba (o no ejecutar el seeder de usuarios).
- Configurar un servicio de correo real (`MAIL_*`) y/o el proveedor de WhatsApp; hoy los mensajes se registran en el log.
- Definir `FRONTEND_URL` con el dominio real y la URL de la API en el frontend.
- Completar los datos reales del negocio en `config/negocio.ts`.
- Compilar el frontend (`npm run build`) y servir `frontend/dist`.
