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

    /**
     * REP-04: horas pico de atención. Cuenta las citas no canceladas por día de
     * la semana y hora de inicio. Se agrega en PHP (no con funciones SQL) para
     * que funcione igual en MySQL y en la base de pruebas.
     */
    public function horasPico(Request $request)
    {
        [$desde, $hasta] = $this->rango($request);

        $citas = Cita::query()
            ->whereBetween('fecha', [$desde, $hasta])
            ->whereNotIn('estado', ['cancelada'])
            ->get(['fecha', 'hora_inicio']);

        $matriz = []; // [dia_semana 0=domingo..6][hora 0..23] => citas
        $porHora = array_fill(0, 24, 0);
        $porDia = array_fill(0, 7, 0);

        foreach ($citas as $cita) {
            $dia = $cita->fecha->dayOfWeek;
            $hora = (int) substr($cita->hora_inicio, 0, 2);
            $matriz[$dia][$hora] = ($matriz[$dia][$hora] ?? 0) + 1;
            $porHora[$hora]++;
            $porDia[$dia]++;
        }

        $cima = fn (array $valores) => max($valores) > 0 ? array_search(max($valores), $valores) : null;

        return response()->json([
            'rango' => compact('desde', 'hasta'),
            'total_citas' => $citas->count(),
            'por_hora' => collect($porHora)->map(fn ($total, $hora) => ['hora' => $hora, 'total' => $total])->values(),
            'por_dia' => collect($porDia)->map(fn ($total, $dia) => ['dia' => $dia, 'total' => $total])->values(),
            'matriz' => collect(range(0, 6))->map(fn ($dia) => collect(range(0, 23))->map(fn ($hora) => $matriz[$dia][$hora] ?? 0)),
            'hora_pico' => $cima($porHora),
            'dia_pico' => $cima($porDia),
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
