<?php

namespace App\Exceptions;

use Exception;

/**
 * Excepción para violaciones de reglas de negocio (no errores técnicos):
 * anticipación insuficiente, colisión de horario, existencia insuficiente, etc.
 * El handler global la traduce a una respuesta HTTP 422 con mensaje claro.
 */
class NegocioException extends Exception
{
    public function __construct(string $mensaje, protected array $detalles = [])
    {
        parent::__construct($mensaje);
    }

    public function detalles(): array
    {
        return $this->detalles;
    }
}
