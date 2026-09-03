<?php

namespace App\Services;

use App\Exceptions\NegocioException;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Gestión de inventario de productos e insumos (RF-09, CU-009).
 *
 * Convención de signos: en "entrada" y "salida" la cantidad siempre se
 * captura positiva (el tipo indica el sentido). En "ajuste" se admite un
 * valor negativo para poder corregir el conteo en cualquier dirección
 * (p. ej. una merma detectada en auditoría física).
 */
class InventarioService
{
    public function registrarMovimiento(Producto $producto, string $tipo, int $cantidad, ?string $motivo, User $usuario): MovimientoInventario
    {
        return DB::transaction(function () use ($producto, $tipo, $cantidad, $motivo, $usuario) {
            $producto = Producto::whereKey($producto->id)->lockForUpdate()->firstOrFail();

            if (! $producto->activo) {
                throw new NegocioException('No se pueden registrar movimientos sobre un producto dado de baja.');
            }

            if (in_array($tipo, ['entrada', 'salida'], true) && $cantidad <= 0) {
                throw new NegocioException('La cantidad debe ser mayor que cero.');
            }

            if ($tipo === 'ajuste' && $cantidad === 0) {
                throw new NegocioException('La cantidad del ajuste no puede ser cero.');
            }

            if ($tipo === 'ajuste' && empty($motivo)) {
                throw new NegocioException('Todo ajuste manual de inventario requiere indicar un motivo.');
            }

            $delta = match ($tipo) {
                'entrada' => $cantidad,
                'salida' => -$cantidad,
                'ajuste' => $cantidad,
            };

            $nuevaExistencia = $producto->existencia + $delta;
            if ($nuevaExistencia < 0) {
                throw new NegocioException("Existencia insuficiente: disponible {$producto->existencia}.");
            }

            $producto->update(['existencia' => $nuevaExistencia]);

            return MovimientoInventario::create([
                'producto_id' => $producto->id,
                'tipo' => $tipo,
                'cantidad' => abs($cantidad),
                'motivo' => $motivo,
                'usuario_id' => $usuario->id,
            ]);
        });
    }

    /** Consume existencias de un producto durante una venta (RF-08). Lanza si no alcanza el stock. */
    public function descontarPorVenta(Producto $producto, int $cantidad, User $usuario): void
    {
        $this->registrarMovimiento($producto, 'salida', $cantidad, 'Venta de producto', $usuario);
    }

    /** Revierte existencias al anular una venta (CU-008, excepción 4). */
    public function revertirPorAnulacion(Producto $producto, int $cantidad, User $usuario, string $referencia): void
    {
        $this->registrarMovimiento($producto, 'entrada', $cantidad, "Reversión por anulación: {$referencia}", $usuario);
    }
}
