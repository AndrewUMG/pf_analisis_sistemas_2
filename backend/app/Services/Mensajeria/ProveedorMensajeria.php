<?php

namespace App\Services\Mensajeria;

/**
 * Contrato para el "Proveedor de mensajería externo" del DERCAS (API de
 * WhatsApp / correo). Aísla al resto del sistema del proveedor concreto,
 * para poder sustituir la implementación de registro (log) por una
 * integración real sin tocar NotificacionService (RNF-05 escalabilidad).
 */
interface ProveedorMensajeria
{
    /** Intenta enviar el mensaje; retorna true si el proveedor lo aceptó. */
    public function enviar(string $canal, string $destino, string $mensaje): bool;
}
