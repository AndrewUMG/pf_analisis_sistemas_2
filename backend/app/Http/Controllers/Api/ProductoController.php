<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use App\Services\InventarioService;
use Illuminate\Http\Request;

/** Catálogo de productos e inventario (RF-09, CU-009). */
class ProductoController extends Controller
{
    public function __construct(private readonly InventarioService $inventario) {}

    public function index(Request $request)
    {
        $query = Producto::query();

        // Un cliente solo ve productos activos; el personal ve todo (incluye bajas).
        if (! $request->user() || $request->user()->rol === 'cliente') {
            $query->where('activo', true);
        }

        if ($request->boolean('solo_criticos')) {
            $query->whereColumn('existencia', '<=', 'existencia_minima');
        }

        return $query->orderBy('nombre')->get();
    }

    public function show(Producto $producto)
    {
        return $producto->load('movimientos');
    }

    public function store(Request $request)
    {
        $datos = $this->validarDatos($request);

        return response()->json(Producto::create($datos), 201);
    }

    public function update(Request $request, Producto $producto)
    {
        $datos = $this->validarDatos($request);
        $producto->update($datos);

        return $producto;
    }

    /** Baja lógica: conserva el historial de movimientos y ventas ya registradas. */
    public function destroy(Producto $producto)
    {
        $producto->update(['activo' => false]);

        return response()->json(['mensaje' => 'Producto desactivado del catálogo.']);
    }

    /** Registra entrada, salida o ajuste manual de existencias (CU-009). */
    public function registrarMovimiento(Request $request, Producto $producto)
    {
        $datos = $request->validate([
            'tipo' => 'required|in:entrada,salida,ajuste',
            'cantidad' => 'required|integer',
            'motivo' => 'nullable|string|max:255',
        ]);

        $movimiento = $this->inventario->registrarMovimiento(
            $producto,
            $datos['tipo'],
            (int) $datos['cantidad'],
            $datos['motivo'] ?? null,
            $request->user(),
        );

        return response()->json($movimiento->load('producto'), 201);
    }

    private function validarDatos(Request $request): array
    {
        return $request->validate([
            'nombre' => 'required|string|max:150',
            'categoria' => 'nullable|string|max:100',
            'precio' => 'required|numeric|min:0',
            'existencia' => 'sometimes|integer|min:0',
            'existencia_minima' => 'required|integer|min:0',
            'activo' => 'sometimes|boolean',
        ]);
    }
}
