<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\CitaDetalle;
use App\Models\Venta;
use App\Models\VentaDetalle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Reportes gerenciales para el panel del administrador (RF-07).
 * Todas las rutas de este controlador exigen rol administrador.
 */
class ReporteController extends Controller
{
    /** REP-01: ingresos totales agrupados por día, en un rango de fechas. */
    public function ingresos(Request $request)
    {
        [$desde, $hasta] = $this->rango($request);

        $porDia = Venta::query()
            ->where('estado', '!=', 'anulada')
            ->whereBetween(DB::raw('DATE(created_at)'), [$desde, $hasta])
            ->select(DB::raw('DATE(created_at) as fecha'), DB::raw('SUM(total) as total'))
            ->groupBy('fecha')
            ->orderBy('fecha')
            ->get();

        return response()->json([
            'rango' => compact('desde', 'hasta'),
            'total_periodo' => $porDia->sum('total'),
            'por_dia' => $porDia,
        ]);
    }

    /** REP-02: servicios más solicitados, contando las citas activas/completadas del rango. */
    public function serviciosMasDemandados(Request $request)
    {
        [$desde, $hasta] = $this->rango($request);

        $resultado = CitaDetalle::query()
            ->join('citas', 'citas.id', '=', 'cita_detalles.cita_id')
            ->join('servicios', 'servicios.id', '=', 'cita_detalles.servicio_id')
            ->whereBetween('citas.fecha', [$desde, $hasta])
            ->where('citas.estado', '!=', 'cancelada')
            ->select('servicios.nombre', DB::raw('COUNT(*) as veces_solicitado'))
            ->groupBy('servicios.nombre')
            ->orderByDesc('veces_solicitado')
            ->get();

        return response()->json(['rango' => compact('desde', 'hasta'), 'servicios' => $resultado]);
    }

    /** REP-03: comisiones generadas por cada barbero según lo efectivamente cobrado. */
    public function comisionesPorBarbero(Request $request)
    {
        [$desde, $hasta] = $this->rango($request);

        $resultado = VentaDetalle::query()
            ->join('ventas', 'ventas.id', '=', 'venta_detalles.venta_id')
            ->join('barberos', 'barberos.id', '=', 'venta_detalles.barbero_id')
            ->join('users', 'users.id', '=', 'barberos.user_id')
            ->whereNotNull('venta_detalles.barbero_id')
            ->where('ventas.estado', '!=', 'anulada')
            ->whereBetween(DB::raw('DATE(ventas.created_at)'), [$desde, $hasta])
            ->select(
                'barberos.id as barbero_id',
                DB::raw("CONCAT(users.nombres, ' ', users.apellidos) as barbero"),
                DB::raw('SUM(venta_detalles.comision) as comision_total'),
                DB::raw('COUNT(*) as servicios_cobrados'),
            )
            ->groupBy('barberos.id', 'users.nombres', 'users.apellidos')
            ->orderByDesc('comision_total')
            ->get();

        return response()->json(['rango' => compact('desde', 'hasta'), 'comisiones' => $resultado]);
    }

    /** REP-05: tasa de cancelaciones y ausentismo en el rango. */
    public function cancelacionesAusentismo(Request $request)
    {
        [$desde, $hasta] = $this->rango($request);

        $conteos = Cita::query()
            ->whereBetween('fecha', [$desde, $hasta])
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->pluck('total', 'estado');

        $totalCitas = $conteos->sum();

        return response()->json([
            'rango' => compact('desde', 'hasta'),
            'total_citas' => $totalCitas,
            'por_estado' => $conteos,
            'porcentaje_canceladas' => $totalCitas ? round(($conteos['cancelada'] ?? 0) / $totalCitas * 100, 1) : 0,
            'porcentaje_ausentes' => $totalCitas ? round(($conteos['ausente'] ?? 0) / $totalCitas * 100, 1) : 0,
        ]);
    }

    /** Los reportes por defecto cubren los últimos 30 días si no se especifica un rango. */
    private function rango(Request $request): array
    {
        $desde = $request->input('desde', now()->subDays(30)->toDateString());
        $hasta = $request->input('hasta', now()->toDateString());

        return [$desde, $hasta];
    }
}
