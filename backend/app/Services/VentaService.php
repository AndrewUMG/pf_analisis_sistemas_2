<?php

namespace App\Services;

use App\Exceptions\NegocioException;
use App\Models\Cita;
use App\Models\Producto;
use App\Models\User;
use App\Models\Venta;
use Illuminate\Support\Facades\DB;

/**
 * Cobro, recibos digitales y control de comisiones (RF-08, CU-008).
 */
class VentaService
{
    public function __construct(private readonly InventarioService $inventario) {}

    /**
     * @param  array<int, array{producto_id:int, cantidad:int}>  $productos
     */
    public function registrarCobro(
        User $usuario,
        ?Cita $cita,
        array $productos,
        string $metodoPago,
        float $descuento,
        ?int $clienteId = null,
    ): Venta {
        return DB::transaction(function () use ($usuario, $cita, $productos, $metodoPago, $descuento, $clienteId) {
            if ($cita && $cita->estado !== 'completada') {
                throw new NegocioException('Solo se puede cobrar una cita en estado Completada.');
            }

            $venta = Venta::create([
                'cita_id' => $cita?->id,
                'cliente_id' => $clienteId ?? $cita?->cliente_id,
                'usuario_id' => $usuario->id,
                'numero_recibo' => 'PENDIENTE', // se fija abajo con el id definitivo
                'subtotal' => 0,
                'descuento' => 0,
                'total' => 0,
                'metodo_pago' => $metodoPago,
            ]);

            $subtotal = 0;

            if ($cita) {
                foreach ($cita->detalles()->with('servicio')->get() as $detalle) {
                    $comision = $cita->barbero->calcularComision((float) $detalle->precio_aplicado);
                    $venta->detalles()->create([
                        'tipo' => 'servicio',
                        'servicio_id' => $detalle->servicio_id,
                        'barbero_id' => $cita->barbero_id,
                        'descripcion' => $detalle->servicio->nombre,
                        'cantidad' => 1,
                        'precio_unitario' => $detalle->precio_aplicado,
                        'subtotal' => $detalle->precio_aplicado,
                        'comision' => $comision,
                    ]);
                    $subtotal += (float) $detalle->precio_aplicado;
                }
            }

            foreach ($productos as $linea) {
                $producto = Producto::findOrFail($linea['producto_id']);
                $cantidad = (int) $linea['cantidad'];

                if (! $producto->activo) {
                    throw new NegocioException("El producto \"{$producto->nombre}\" no está disponible.");
                }
                if ($producto->existencia < $cantidad) {
                    throw new NegocioException("Existencia insuficiente de \"{$producto->nombre}\" (disponible: {$producto->existencia}).");
                }

                $this->inventario->descontarPorVenta($producto, $cantidad, $usuario);

                $lineaSubtotal = (float) $producto->precio * $cantidad;
                $venta->detalles()->create([
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'descripcion' => $producto->nombre,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $producto->precio,
                    'subtotal' => $lineaSubtotal,
                ]);
                $subtotal += $lineaSubtotal;
            }

            if ($venta->detalles()->count() === 0) {
                throw new NegocioException('La venta debe incluir al menos un servicio o un producto.');
            }

            if ($descuento > $subtotal) {
                throw new NegocioException('El descuento no puede ser mayor que el subtotal.');
            }

            $total = round($subtotal - $descuento, 2);
            $venta->update([
                'subtotal' => round($subtotal, 2),
                'descuento' => round($descuento, 2),
                'total' => $total,
                'numero_recibo' => sprintf('R-%s-%06d', now()->format('Y'), $venta->id),
            ]);

            return $venta->fresh(['detalles', 'cita', 'cliente']);
        });
    }

    /** Solo el administrador puede anular; revierte existencias (CU-008, excepción 4). */
    public function anular(Venta $venta, User $usuario): Venta
    {
        return DB::transaction(function () use ($venta, $usuario) {
            if ($venta->estado === 'anulada') {
                throw new NegocioException('Esta venta ya se encuentra anulada.');
            }

            foreach ($venta->detalles()->where('tipo', 'producto')->get() as $detalle) {
                $this->inventario->revertirPorAnulacion(
                    $detalle->producto,
                    $detalle->cantidad,
                    $usuario,
                    "venta {$venta->numero_recibo}"
                );
            }

            $venta->update(['estado' => 'anulada']);

            return $venta;
        });
    }
}
