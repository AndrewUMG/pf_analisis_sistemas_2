<?php

namespace App\Services;

use App\Exceptions\NegocioException;
use App\Models\Barbero;
use App\Models\Cita;
use App\Models\ParametroSistema;
use App\Models\Servicio;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Motor de reservas y agendamiento (RF-02, CU-002, CU-006, CU-011).
 *
 * Concentra toda la lógica de disponibilidad y el control de concurrencia:
 * ninguna otra clase debe insertar filas en "citas" directamente, así se
 * garantiza que dos personas nunca puedan ocupar el mismo horario del mismo
 * barbero (RNF de integridad del negocio).
 */
class ReservaService
{
    public function __construct(private readonly NotificacionService $notificaciones) {}

    /**
     * Calcula las franjas horarias libres de un barbero en una fecha, para
     * la duración total que exigen los servicios seleccionados (CU-002 paso 5).
     *
     * @param  array<int>  $servicioIds
     * @return array<int, string> horas de inicio disponibles, formato H:i
     */
    public function disponibilidad(Barbero $barbero, string $fecha, array $servicioIds): array
    {
        $fechaCarbon = Carbon::parse($fecha)->startOfDay();
        $duracionTotal = $this->duracionTotalMinutos($barbero, $servicioIds);

        $horario = $barbero->horarios()->where('dia_semana', $fechaCarbon->dayOfWeek)->first();
        if (! $horario) {
            return []; // el barbero no labora ese día de la semana
        }

        $ventanaInicio = $fechaCarbon->copy()->setTimeFromTimeString($horario->hora_inicio);
        $ventanaFin = $fechaCarbon->copy()->setTimeFromTimeString($horario->hora_fin);

        $ocupados = $this->intervalosOcupados($barbero, $fechaCarbon);

        $anticipacionMinima = ParametroSistema::obtenerEntero(ParametroSistema::ANTICIPACION_MINIMA_HORAS, 2);
        $noAntesDe = now()->addHours($anticipacionMinima);

        $disponibles = [];
        $granularidad = 15; // minutos entre cada franja candidata
        for ($inicio = $ventanaInicio->copy(); $inicio->copy()->addMinutes($duracionTotal)->lte($ventanaFin); $inicio->addMinutes($granularidad)) {
            $fin = $inicio->copy()->addMinutes($duracionTotal);

            if ($inicio->lt($noAntesDe)) {
                continue;
            }

            if ($this->seSuperponeConOcupados($inicio, $fin, $ocupados)) {
                continue;
            }

            $disponibles[] = $inicio->format('H:i');
        }

        return $disponibles;
    }

    /**
     * Registra una reserva validando disponibilidad dentro de una transacción
     * con bloqueo de filas, para que dos confirmaciones simultáneas del mismo
     * horario no puedan coexistir (CU-002 paso 7 y su excepción por concurrencia).
     *
     * @param  array<int>  $servicioIds
     */
    public function reservar(
        User $cliente,
        Barbero $barbero,
        string $fecha,
        string $horaInicio,
        array $servicioIds,
        string $canalOrigen = 'en_linea',
        ?string $notas = null,
    ): Cita {
        return DB::transaction(function () use ($cliente, $barbero, $fecha, $horaInicio, $servicioIds, $canalOrigen, $notas) {
            $servicios = $this->serviciosValidosParaBarbero($barbero, $servicioIds);
            $duracionTotal = $this->duracionTotalMinutos($barbero, $servicioIds, $servicios);

            $fechaCarbon = Carbon::parse($fecha)->startOfDay();
            $inicio = $fechaCarbon->copy()->setTimeFromTimeString($horaInicio);
            $fin = $inicio->copy()->addMinutes($duracionTotal);

            if ($canalOrigen === 'en_linea') {
                $anticipacionMinima = ParametroSistema::obtenerEntero(ParametroSistema::ANTICIPACION_MINIMA_HORAS, 2);
                if ($inicio->lt(now()->addHours($anticipacionMinima))) {
                    throw new NegocioException(
                        "Debes reservar con al menos {$anticipacionMinima} hora(s) de anticipación."
                    );
                }
            }

            $this->asegurarFranjaLibre($barbero, $fechaCarbon, $inicio, $fin);

            $cita = Cita::create([
                'cliente_id' => $cliente->id,
                'barbero_id' => $barbero->id,
                'fecha' => $fechaCarbon->toDateString(),
                'hora_inicio' => $inicio->format('H:i:s'),
                'hora_fin' => $fin->format('H:i:s'),
                'estado' => 'confirmada',
                'canal_origen' => $canalOrigen,
                'notas' => $notas,
                'monto_estimado' => $servicios->sum('precio'),
            ]);

            foreach ($servicios as $servicio) {
                $cita->detalles()->create([
                    'servicio_id' => $servicio->id,
                    'precio_aplicado' => $servicio->precio,
                    'duracion_aplicada' => $servicio->duracion_minutos,
                ]);
            }

            $this->notificaciones->programarParaCita($cita);

            return $cita->load(['detalles.servicio', 'barbero.user', 'cliente']);
        });
    }

    /**
     * Cancela o reagenda una cita respetando la anticipación mínima
     * configurada (RF-06, CU-006).
     */
    public function cancelarOReagendar(
        Cita $cita,
        string $accion,
        ?string $motivo = null,
        ?string $nuevaFecha = null,
        ?string $nuevaHoraInicio = null,
    ): Cita {
        return DB::transaction(function () use ($cita, $accion, $motivo, $nuevaFecha, $nuevaHoraInicio) {
            $cita = Cita::whereKey($cita->id)->lockForUpdate()->firstOrFail();

            if ($cita->estado !== 'confirmada') {
                throw new NegocioException('La cita ya fue atendida, cancelada o no puede modificarse.');
            }

            $inicioActual = Carbon::parse("{$cita->fecha->toDateString()} {$cita->hora_inicio}");
            $anticipacionMinima = ParametroSistema::obtenerEntero(ParametroSistema::ANTICIPACION_MINIMA_HORAS, 2);
            if ($inicioActual->lt(now()->addHours($anticipacionMinima))) {
                throw new NegocioException(
                    "Ya no es posible modificar esta cita en línea; comunícate directamente con la barbería (mínimo {$anticipacionMinima}h de anticipación)."
                );
            }

            if ($accion === 'cancelar') {
                $cita->update(['estado' => 'cancelada', 'motivo_cambio' => $motivo]);
                $this->notificaciones->descartarPendientes($cita);

                return $cita;
            }

            // Reagendar: misma duración/servicios, nueva fecha y hora.
            $barbero = $cita->barbero;
            $duracionTotal = Carbon::parse($cita->hora_inicio)->diffInMinutes(Carbon::parse($cita->hora_fin));

            $fechaCarbon = Carbon::parse($nuevaFecha)->startOfDay();
            $inicio = $fechaCarbon->copy()->setTimeFromTimeString($nuevaHoraInicio);
            $fin = $inicio->copy()->addMinutes($duracionTotal);

            $this->asegurarFranjaLibre($barbero, $fechaCarbon, $inicio, $fin, citaExcluidaId: $cita->id);

            $cita->update([
                'fecha' => $fechaCarbon->toDateString(),
                'hora_inicio' => $inicio->format('H:i:s'),
                'hora_fin' => $fin->format('H:i:s'),
                'motivo_cambio' => $motivo,
            ]);

            $this->notificaciones->descartarPendientes($cita);
            $this->notificaciones->programarParaCita($cita->fresh());

            return $cita->fresh(['detalles.servicio', 'barbero.user', 'cliente']);
        });
    }

    /**
     * Registro de cita presencial / walk-in (RF-11, CU-011): busca al
     * cliente por teléfono, y agenda en la franja libre más próxima a ahora.
     *
     * @param  array{nombres:string, apellidos:string, telefono:string}  $datosCliente
     * @param  array<int>  $servicioIds
     */
    public function registrarWalkIn(array $datosCliente, Barbero $barbero, array $servicioIds, ?string $notas = null): Cita
    {
        $cliente = User::firstOrCreate(
            ['telefono' => $datosCliente['telefono']],
            [
                'nombres' => $datosCliente['nombres'],
                'apellidos' => $datosCliente['apellidos'] ?? '',
                // Cuenta de solo registro: no inicia sesión, pero cumple la
                // unicidad de "email" exigida por el modelo de usuario (RF-05).
                'email' => 'walkin_'.Str::random(10).'@studiolabarber.local',
                'password' => Str::password(16),
                'rol' => 'cliente',
            ]
        );

        $fecha = now()->toDateString();
        $horaInicio = $this->siguienteFranjaLibreHoy($barbero, $servicioIds);

        if (! $horaInicio) {
            throw new NegocioException('No hay disponibilidad inmediata con este barbero el día de hoy.');
        }

        return $this->reservar($cliente, $barbero, $fecha, $horaInicio, $servicioIds, canalOrigen: 'presencial', notas: $notas);
    }

    /** Primer horario libre de hoy en adelante, usado por el registro walk-in. */
    private function siguienteFranjaLibreHoy(Barbero $barbero, array $servicioIds): ?string
    {
        $disponibles = $this->disponibilidad($barbero, now()->toDateString(), $servicioIds);

        return $disponibles[0] ?? null;
    }

    /**
     * Valida que los servicios existan, estén activos y que el barbero esté
     * habilitado para prestarlos.
     *
     * @param  array<int>  $servicioIds
     * @return \Illuminate\Support\Collection<int, Servicio>
     */
    private function serviciosValidosParaBarbero(Barbero $barbero, array $servicioIds)
    {
        $servicios = Servicio::activos()->whereIn('id', $servicioIds)->get();

        if ($servicios->count() !== count(array_unique($servicioIds))) {
            throw new NegocioException('Uno o más servicios seleccionados no existen o ya no están disponibles.');
        }

        $idsHabilitados = $barbero->servicios()->pluck('servicios.id');
        $noHabilitados = $servicios->pluck('id')->diff($idsHabilitados);

        if ($noHabilitados->isNotEmpty()) {
            throw new NegocioException('El barbero seleccionado no presta uno o más de los servicios elegidos.');
        }

        return $servicios;
    }

    private function duracionTotalMinutos(Barbero $barbero, array $servicioIds, $servicios = null): int
    {
        $servicios ??= $this->serviciosValidosParaBarbero($barbero, $servicioIds);
        $holgura = ParametroSistema::obtenerEntero(ParametroSistema::HOLGURA_MINUTOS, 10);

        return (int) $servicios->sum('duracion_minutos') + $holgura;
    }

    /**
     * Intervalos [inicio, fin] ya ocupados ese día por citas activas y por
     * excepciones de horario del barbero.
     *
     * @return array<int, array{0: Carbon, 1: Carbon}>
     */
    private function intervalosOcupados(Barbero $barbero, Carbon $fechaCarbon): array
    {
        $ocupados = [];

        foreach ($barbero->citas()->activas()->whereDate('fecha', $fechaCarbon)->get() as $cita) {
            $ocupados[] = [
                $fechaCarbon->copy()->setTimeFromTimeString($cita->hora_inicio),
                $fechaCarbon->copy()->setTimeFromTimeString($cita->hora_fin),
            ];
        }

        $inicioDia = $fechaCarbon->copy()->startOfDay();
        $finDia = $fechaCarbon->copy()->endOfDay();

        foreach ($barbero->excepciones()
            ->where('fecha_inicio', '<=', $finDia)
            ->where('fecha_fin', '>=', $inicioDia)
            ->get() as $excepcion) {
            $ocupados[] = [
                $excepcion->fecha_inicio->max($inicioDia),
                $excepcion->fecha_fin->min($finDia),
            ];
        }

        return $ocupados;
    }

    /** @param  array<int, array{0: Carbon, 1: Carbon}>  $ocupados */
    private function seSuperponeConOcupados(Carbon $inicio, Carbon $fin, array $ocupados): bool
    {
        foreach ($ocupados as [$ocupadoInicio, $ocupadoFin]) {
            // Dos intervalos se traslapan si uno empieza antes de que el otro termine.
            if ($inicio->lt($ocupadoFin) && $ocupadoInicio->lt($fin)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verificación definitiva y bajo bloqueo de fila (dentro de una
     * transacción) de que la franja solicitada sigue libre. Es el punto que
     * evita la doble reserva por concurrencia (CU-002, excepción de colisión).
     */
    private function asegurarFranjaLibre(Barbero $barbero, Carbon $fechaCarbon, Carbon $inicio, Carbon $fin, ?int $citaExcluidaId = null): void
    {
        $horario = $barbero->horarios()->where('dia_semana', $fechaCarbon->dayOfWeek)->first();
        if (! $horario) {
            throw new NegocioException('El barbero no labora ese día de la semana.');
        }

        $ventanaInicio = $fechaCarbon->copy()->setTimeFromTimeString($horario->hora_inicio);
        $ventanaFin = $fechaCarbon->copy()->setTimeFromTimeString($horario->hora_fin);
        if ($inicio->lt($ventanaInicio) || $fin->gt($ventanaFin)) {
            throw new NegocioException('La franja horaria seleccionada está fuera del horario laboral del barbero.');
        }

        // SELECT ... FOR UPDATE: mientras esta transacción no cierre, ninguna
        // otra petición concurrente puede leer/insertar sobre estas mismas
        // citas, lo que serializa dos confirmaciones simultáneas del mismo turno.
        $citasBloqueadas = $barbero->citas()
            ->activas()
            ->whereDate('fecha', $fechaCarbon)
            ->when($citaExcluidaId, fn ($q) => $q->whereKeyNot($citaExcluidaId))
            ->lockForUpdate()
            ->get(['hora_inicio', 'hora_fin']);

        $ocupados = $citasBloqueadas->map(fn ($cita) => [
            $fechaCarbon->copy()->setTimeFromTimeString($cita->hora_inicio),
            $fechaCarbon->copy()->setTimeFromTimeString($cita->hora_fin),
        ])->all();

        $inicioDia = $fechaCarbon->copy()->startOfDay();
        $finDia = $fechaCarbon->copy()->endOfDay();
        foreach ($barbero->excepciones()
            ->where('fecha_inicio', '<=', $finDia)
            ->where('fecha_fin', '>=', $inicioDia)
            ->get() as $excepcion) {
            $ocupados[] = [$excepcion->fecha_inicio->max($inicioDia), $excepcion->fecha_fin->min($finDia)];
        }

        if ($this->seSuperponeConOcupados($inicio, $fin, $ocupados)) {
            throw new NegocioException('Ese horario ya no está disponible; por favor elige otra franja.');
        }
    }
}
