#!/bin/sh
set -e

php artisan config:clear
php artisan migrate --force

# Datos de demostración solo si la base está vacía.
USUARIOS=$(php artisan tinker --execute='echo \App\Models\User::count();' 2>/dev/null | tail -1)
if [ "$USUARIOS" = "0" ]; then
  php artisan db:seed --force
fi

php artisan storage:link 2>/dev/null || true

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
