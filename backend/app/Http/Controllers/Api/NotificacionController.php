<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notificacion;
use App\Services\NotificacionService;
use Illuminate\Http\Request;

/** Trazabilidad y operación de las notificaciones automáticas (RF-04, CU-004). Solo administrador. */
class NotificacionController extends Controller
{
    public function __construct(private readonly NotificacionService $notificaciones) {}

    public function index(Request $request)
    {
        $filtros = $request->validate([
            'estado' => 'nullable|in:pendiente,enviada,fallida',
            'tipo' => 'nullable|in:confirmacion,recordatorio_24h,recordatorio_2h',
            'canal' => 'nullable|in:whatsapp,correo',
        ]);

        $lista = Notificacion::query()
            ->with('cita.cliente', 'cita.barbero.user')
            ->when($filtros['estado'] ?? null, fn ($q, $v) => $q->where('estado', $v))
            ->when($filtros['tipo'] ?? null, fn ($q, $v) => $q->where('tipo', $v))
            ->when($filtros['canal'] ?? null, fn ($q, $v) => $q->where('canal', $v))
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json([
            'notificaciones' => $lista,
            // Totales globales (sin filtros) para las tarjetas de resumen.
            'resumen' => Notificacion::query()->selectRaw('estado, COUNT(*) as total')->groupBy('estado')->pluck('total', 'estado'),
        ]);
    }

    /** Ejecuta ahora el envío de lo pendiente (en producción lo hace el scheduler cada 5 min). */
    public function procesar()
    {
        return $this->notificaciones->procesarPendientes();
    }

    public function reintentar(Notificacion $notificacion)
    {
        return $this->notificaciones->reintentar($notificacion);
    }
}
