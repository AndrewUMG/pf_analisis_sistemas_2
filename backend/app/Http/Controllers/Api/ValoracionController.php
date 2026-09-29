<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Valoracion;
use Illuminate\Http\Request;

/** Consulta y moderación de valoraciones para el administrador (RF-10). */
class ValoracionController extends Controller
{
    public function index(Request $request)
    {
        $filtros = $request->validate([
            'barbero_id' => 'nullable|integer|exists:barberos,id',
            'calificacion' => 'nullable|integer|min:1|max:5',
        ]);

        $base = Valoracion::query()
            ->when($filtros['barbero_id'] ?? null, fn ($q, $v) => $q->where('barbero_id', $v));

        // El resumen respeta el filtro de barbero pero no el de estrellas, para poder ver la distribución completa.
        $porEstrella = (clone $base)->selectRaw('calificacion, COUNT(*) as total')->groupBy('calificacion')->pluck('total', 'calificacion');
        $total = $porEstrella->sum();
        $promedio = $total ? round($porEstrella->map(fn ($n, $estrellas) => $n * $estrellas)->sum() / $total, 2) : null;

        $lista = (clone $base)
            ->when($filtros['calificacion'] ?? null, fn ($q, $v) => $q->where('calificacion', $v))
            ->with('cliente:id,nombres,apellidos', 'barbero.user:id,nombres,apellidos', 'cita:id,fecha,hora_inicio')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json([
            'valoraciones' => $lista,
            'resumen' => [
                'total' => $total,
                'promedio' => $promedio,
                'por_estrella' => collect(range(5, 1))->mapWithKeys(fn ($e) => [$e => (int) ($porEstrella[$e] ?? 0)]),
            ],
        ]);
    }

    /** Oculta o vuelve a mostrar una valoración (no se borra: queda el registro). */
    public function actualizar(Request $request, Valoracion $valoracion)
    {
        $datos = $request->validate(['visible' => 'required|boolean']);
        $valoracion->update($datos);

        return $valoracion->load('cliente:id,nombres,apellidos', 'barbero.user:id,nombres,apellidos');
    }
}
