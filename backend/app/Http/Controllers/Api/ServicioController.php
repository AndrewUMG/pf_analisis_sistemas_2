<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Servicio;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Catálogo de servicios y combos promocionales (RF-01, CU-001). */
class ServicioController extends Controller
{
    /** Catálogo público (PANT-01) con buscador y filtro por categoría. */
    public function index(Request $request)
    {
        $query = Servicio::query()->with('barberos.user');

        // Un cliente anónimo o autenticado sin rol de gestión solo ve el catálogo activo.
        if (! $request->user() || $request->user()->rol === 'cliente') {
            $query->activos();
        }

        if ($request->filled('nombre')) {
            $query->where('nombre', 'like', '%'.$request->string('nombre').'%');
        }

        if ($request->filled('categoria')) {
            $query->where('categoria', $request->string('categoria'));
        }

        return $query->orderBy('categoria')->orderBy('nombre')->get();
    }

    public function show(Servicio $servicio)
    {
        return $servicio->load('barberos.user');
    }

    public function store(Request $request)
    {
        $datos = $this->validarDatos($request);

        $servicio = Servicio::create($datos);

        if ($request->has('barbero_ids')) {
            $servicio->barberos()->sync($request->input('barbero_ids', []));
        }

        return response()->json($servicio->load('barberos.user'), 201);
    }

    public function update(Request $request, Servicio $servicio)
    {
        $datos = $this->validarDatos($request, $servicio->id);
        $servicio->update($datos);

        if ($request->has('barbero_ids')) {
            $servicio->barberos()->sync($request->input('barbero_ids', []));
        }

        return $servicio->load('barberos.user');
    }

    /** Baja lógica: conserva el historial de citas ya registradas (CU-001, excepción 3). */
    public function destroy(Servicio $servicio)
    {
        $servicio->update(['activo' => false]);

        return response()->json(['mensaje' => 'Servicio desactivado del catálogo.']);
    }

    private function validarDatos(Request $request, ?int $ignorarId = null): array
    {
        $categoria = $request->input('categoria');

        return $request->validate([
            'nombre' => [
                'required', 'string', 'max:150',
                Rule::unique('servicios', 'nombre')->where('categoria', $categoria)->ignore($ignorarId),
            ],
            'categoria' => 'required|in:corte,barba,tratamiento,spa_facial,combo',
            'descripcion' => 'nullable|string',
            'duracion_minutos' => 'required|integer|min:1',
            'precio' => 'required|numeric|min:0',
            'imagen' => 'nullable|string|max:255',
            'activo' => 'sometimes|boolean',
        ]);
    }
}
