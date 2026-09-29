<?php

namespace App\Services\Mensajeria;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Proveedor por defecto (RF-04): el correo sale por el mailer de Laravel
 * (MAIL_MAILER en .env: "log" para desarrollo, "smtp" en producción) y
 * WhatsApp sigue registrándose en el log hasta que el negocio contrate la
 * API oficial; para eso solo hay que reemplazar $whatsapp por otra
 * implementación de ProveedorMensajeria.
 */
class MensajeriaPorCanal implements ProveedorMensajeria
{
    public function __construct(private readonly LogProveedorMensajeria $whatsapp) {}

    public function enviar(string $canal, string $destino, string $mensaje): bool
    {
        if ($canal !== 'correo') {
            return $this->whatsapp->enviar($canal, $destino, $mensaje);
        }

        try {
            Mail::raw($mensaje, fn ($correo) => $correo->to($destino)->subject('Studio La Barber — tu cita'));

            return true;
        } catch (Throwable $e) {
            // El detalle técnico queda en el log; al administrador solo se le informa el fallo.
            Log::error("[notificacion:correo] no se pudo enviar a {$destino}: {$e->getMessage()}");

            return false;
        }
    }
}
