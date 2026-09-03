<?php

namespace App\Console\Commands;

use App\Services\NotificacionService;
use Illuminate\Console\Command;

/**
 * Envía confirmaciones y recordatorios (24h y 2h) que ya llegaron a su
 * momento de disparo (RF-04, CU-004). Se ejecuta periódicamente vía el
 * scheduler de Laravel (ver routes/console.php).
 */
class EnviarNotificacionesPendientes extends Command
{
    protected $signature = 'notificaciones:procesar-pendientes';

    protected $description = 'Envía las notificaciones de citas (confirmación y recordatorios) que ya corresponden.';

    public function handle(NotificacionService $notificaciones): int
    {
        $resumen = $notificaciones->procesarPendientes();

        $this->info("Enviadas: {$resumen['enviadas']} | Fallidas: {$resumen['fallidas']} | Omitidas: {$resumen['omitidas']}");

        return self::SUCCESS;
    }
}
