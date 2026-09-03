<?php

namespace App\Services\Mensajeria;

use Illuminate\Support\Facades\Log;

/**
 * Implementación de referencia para esta primera entrega: en vez de llamar
 * a la API real de WhatsApp Business o a un servidor de correo (fuera del
 * presupuesto de microempresa de esta fase, según el DERCAS Visión),
 * registra el mensaje en el log de la aplicación con trazabilidad completa.
 *
 * Para producción basta con crear otra clase que implemente
 * ProveedorMensajeria (p. ej. WhatsappCloudApiProveedor) y enlazarla en
 * AppServiceProvider.
 */
class LogProveedorMensajeria implements ProveedorMensajeria
{
    public function enviar(string $canal, string $destino, string $mensaje): bool
    {
        Log::channel('single')->info("[notificacion:{$canal}] a {$destino} -> {$mensaje}");

        return true;
    }
}
