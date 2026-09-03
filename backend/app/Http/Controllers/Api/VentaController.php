<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\Venta;
use App\Services\VentaService;
use Illuminate\Http\Request;

/** Cobro en caja, recibos digitales y anulaciones (RF-08, CU-008). */
class VentaController extends Controller
{
    public function __construct(private readonly VentaService $ventas) {}

    public function index(Request $request)
    {
        $query = Venta::query()->with(['cliente', 'usuario', 'detalles']);

        if ($request->filled('desde')) {
            $query->whereDate('created_at', '>=', $request->date('desde'));
        }
        if ($request->filled('hasta')) {
            $query->whereDate('created_at', '<=', $request->date('hasta'));
        }

        return $query->orderByDesc('id')->paginate(20);
    }

    public function show(Venta $venta)
    {
        return $venta->load(['cliente', 'usuario', 'detalles.servicio', 'detalles.producto', 'cita']);
    }

    /** Registra el cobro de una cita completada y/o de productos vendidos directamente (CU-008). */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'cita_id' => 'nullable|exists:citas,id',
            'cliente_id' => 'nullable|exists:users,id',
            'productos' => 'sometimes|array',
            'productos.*.producto_id' => 'required_with:productos|exists:productos,id',
            'productos.*.cantidad' => 'required_with:productos|integer|min:1',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia',
            'descuento' => 'sometimes|numeric|min:0',
        ]);

        $venta = $this->ventas->registrarCobro(
            usuario: $request->user(),
            cita: isset($datos['cita_id']) ? Cita::find($datos['cita_id']) : null,
            productos: $datos['productos'] ?? [],
            metodoPago: $datos['metodo_pago'],
            descuento: (float) ($datos['descuento'] ?? 0),
            clienteId: $datos['cliente_id'] ?? null,
        );

        return response()->json($venta, 201);
    }

    /** Solo el administrador puede anular una venta ya emitida (CU-008, excepción 4). */
    public function anular(Request $request, Venta $venta)
    {
        return $this->ventas->anular($venta, $request->user());
    }
}
