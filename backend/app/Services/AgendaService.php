<?php

namespace App\Services;

use App\Exceptions\NegocioException;
use App\Models\Barbero;
use App\Models\Cita;
use App\Models\ExcepcionHorario;
use App\Models\ParametroSistema;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Panel de gestión y agenda del barbero (RF-03, CU-003).
 */
class AgendaService
{
    public function __construct(private readonly NotificacionService $notificaciones) {}

    /** Citas del día ordenadas cronológicamente, con el resumen de la jornada. */
    public function agendaDelDia(Barbero $barbero, string $fecha): array
    {
        $citas = $barbero->citas()
            ->whereDate('fecha', $fecha)
            ->with(['cliente', 'detalles.servicio'])
            ->orderBy('hora_inicio')
            ->get();

        $completadas = $citas->where('estado', 'completada');

        return [
            'citas' => $citas,
            'citas_atendidas' => $completadas->count(),
            'comision_del_dia' => $barbero->calcularComision((float) $completadas->sum('monto_estimado')),
        ];
    }

    /**
     * Marca el inicio de la atención (CU-003 pasos 3-4).
     *
     * @param  bool  $confirmarInicioTemprano  el barbero ya confirmó que quiere
     *                                         iniciar aunque sea muy anticipado
     */
    public function iniciarAtencion(Cita $cita, bool $confirmarInicioTemprano = false): Cita
    {
        if ($cita->estado !== 'confirmada') {
            throw new NegocioException('Solo una cita confirmada puede pasar a "en atención".');
        }

        $inicioProgramado = Carbon::parse("{$cita->fecha->toDateString()} {$cita->hora_inicio}");
        if (! $confirmarInicioTemprano && now()->diffInMinutes($inicioProgramado, false) > 30) {
            throw new NegocioException(
                'Esta cita inicia con más de 30 minutos de anticipación respecto a lo programado. Confirma para continuar.',
                ['requiere_confirmacion' => true]
            );
        }

        $cita->update(['estado' => 'en_atencion', 'inicio_atencion_at' => now()]);

        return $cita;
    }

    /** Marca la cita como completada y deja lista la comisión para el resumen del día (CU-003 paso 5-6). */
    public function finalizarAtencion(Cita $cita): Cita
    {
        if ($cita->estado !== 'en_atencion') {
            throw new NegocioException('Solo una cita "en atención" puede marcarse como completada.');
        }

        $cita->update(['estado' => 'completada', 'fin_atencion_at' => now()]);

        if (! $cita->barbero->comision_porcentaje || (float) $cita->barbero->comision_porcentaje <= 0) {
            // No bloquea el cierre de la cita; solo deja constancia para el administrador (CU-003, excepción 6).
            throw new NegocioException(
                'Cita completada, pero este barbero no tiene un porcentaje de comisión configurado.',
                ['solo_advertencia' => true, 'cita_id' => $cita->id]
            );
        }

        return $cita;
    }

    /** Libera la franja marcando al cliente como ausente (CU-003, excepción 5). */
    public function marcarAusente(Cita $cita): Cita
    {
        if (! in_array($cita->estado, ['confirmada', 'en_atencion'], true)) {
            throw new NegocioException('Esta cita ya no puede marcarse como ausente.');
        }

        $tolerancia = ParametroSistema::obtenerEntero(ParametroSistema::TOLERANCIA_AUSENCIA_MINUTOS, 15);
        $inicioProgramado = Carbon::parse("{$cita->fecha->toDateString()} {$cita->hora_inicio}");

        if (now()->lt($inicioProgramado->copy()->addMinutes($tolerancia))) {
            throw new NegocioException("Aún no se cumple el margen de tolerancia de {$tolerancia} minutos.");
        }

        $cita->update(['estado' => 'ausente']);
        $this->notificaciones->descartarPendientes($cita);

        return $cita;
    }

    /**
     * Registra un bloqueo de agenda (día libre, permiso, vacaciones). Se
     * rechaza si existen citas confirmadas dentro del rango (CU-003, PANT-10).
     */
    public function registrarExcepcion(Barbero $barbero, string $tipo, string $fechaInicio, string $fechaFin, ?string $motivo = null): ExcepcionHorario
    {
        return DB::transaction(function () use ($barbero, $tipo, $fechaInicio, $fechaFin, $motivo) {
            $inicio = Carbon::parse($fechaInicio);
            $fin = Carbon::parse($fechaFin);

            $citasEnConflicto = $barbero->citas()
                ->activas()
                ->whereBetween('fecha', [$inicio->toDateString(), $fin->toDateString()])
                ->with('cliente')
                ->get();

            if ($citasEnConflicto->isNotEmpty()) {
                throw new NegocioException(
                    'Existen citas confirmadas en ese rango; reagéndalas antes de guardar la excepción.',
                    ['citas_en_conflicto' => $citasEnConflicto->map(fn ($c) => [
                        'id' => $c->id,
                        'cliente' => $c->cliente->nombre_completo,
                        'fecha' => $c->fecha->toDateString(),
                        'hora_inicio' => $c->hora_inicio,
                    ])->all()]
                );
            }

            return $barbero->excepciones()->create([
                'tipo' => $tipo,
                'fecha_inicio' => $inicio,
                'fecha_fin' => $fin,
                'motivo' => $motivo,
            ]);
        });
    }
}
