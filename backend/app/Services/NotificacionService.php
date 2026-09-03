<?php

namespace App\Services;

use App\Models\Cita;
use App\Models\Notificacion;
use App\Services\Mensajeria\ProveedorMensajeria;
use Carbon\Carbon;

/**
 * Notificaciones y recordatorios automáticos (RF-04, CU-004).
 * No envía nada por sí sola al agendar: solo dosifica el trabajo que hará
 * el proceso programado (ver app/Console/Commands/EnviarNotificacionesPendientes).
 */
class NotificacionService
{
    private const MAX_INTENTOS = 3;

    public function __construct(private readonly ProveedorMensajeria $proveedor) {}

    /** Encola la confirmación y los dos recordatorios de una cita recién creada. */
    public function programarParaCita(Cita $cita): void
    {
        foreach (['confirmacion', 'recordatorio_24h', 'recordatorio_2h'] as $tipo) {
            Notificacion::create([
                'cita_id' => $cita->id,
                'tipo' => $tipo,
                'canal' => 'whatsapp',
                'estado' => 'pendiente',
            ]);
        }
    }

    /** Descarta las notificaciones que ya no aplican (cita cancelada o reagendada). */
    public function descartarPendientes(Cita $cita): void
    {
        $cita->notificaciones()->where('estado', 'pendiente')->delete();
    }

    /**
     * Revisa las notificaciones pendientes y envía las que ya corresponden
     * según el tipo. Pensado para ejecutarse periódicamente (ver routes/console.php).
     *
     * @return array{enviadas:int, fallidas:int, omitidas:int}
     */
    public function procesarPendientes(): array
    {
        $resumen = ['enviadas' => 0, 'fallidas' => 0, 'omitidas' => 0];

        $pendientes = Notificacion::with('cita.cliente', 'cita.barbero.user')
            ->where('estado', 'pendiente')
            ->get();

        foreach ($pendientes as $notificacion) {
            $cita = $notificacion->cita;

            if (! $cita || $cita->estado === 'cancelada') {
                $notificacion->delete();
                $resumen['omitidas']++;

                continue;
            }

            if (! $this->yaCorresponde($notificacion, $cita)) {
                continue;
            }

            $this->enviar($notificacion) ? $resumen['enviadas']++ : $resumen['fallidas']++;
        }

        return $resumen;
    }

    /** Determina si, según su tipo, ya llegó el momento de enviar esta notificación. */
    private function yaCorresponde(Notificacion $notificacion, Cita $cita): bool
    {
        if ($notificacion->tipo === 'confirmacion') {
            return true; // se envía tan pronto el job la procese
        }

        $inicioCita = Carbon::parse("{$cita->fecha->toDateString()} {$cita->hora_inicio}");
        $horasAntes = $notificacion->tipo === 'recordatorio_24h' ? 24 : 2;

        return now()->greaterThanOrEqualTo($inicioCita->copy()->subHours($horasAntes));
    }

    private function enviar(Notificacion $notificacion): bool
    {
        $cita = $notificacion->cita;
        $destino = $notificacion->canal === 'whatsapp' ? $cita->cliente->telefono : $cita->cliente->email;

        if (empty($destino)) {
            return $this->marcarFallida($notificacion);
        }

        $mensaje = $this->construirMensaje($notificacion, $cita);
        $enviado = $this->proveedor->enviar($notificacion->canal, $destino, $mensaje);

        if ($enviado) {
            $notificacion->update([
                'estado' => 'enviada',
                'intentos' => $notificacion->intentos + 1,
                'enviado_at' => now(),
            ]);

            return true;
        }

        return $this->marcarFallida($notificacion);
    }

    private function marcarFallida(Notificacion $notificacion): bool
    {
        $intentos = $notificacion->intentos + 1;
        $notificacion->update([
            'intentos' => $intentos,
            'estado' => $intentos >= self::MAX_INTENTOS ? 'fallida' : 'pendiente',
        ]);

        return false;
    }

    private function construirMensaje(Notificacion $notificacion, Cita $cita): string
    {
        $fechaHora = Carbon::parse("{$cita->fecha->toDateString()} {$cita->hora_inicio}")->translatedFormat('d/m/Y H:i');
        $barbero = $cita->barbero->user->nombre_completo;

        return match ($notificacion->tipo) {
            'confirmacion' => "Studio La Barber: tu cita con {$barbero} el {$fechaHora} quedó confirmada.",
            'recordatorio_24h' => "Studio La Barber: te esperamos mañana {$fechaHora} con {$barbero}. ¡No faltes!",
            'recordatorio_2h' => "Studio La Barber: tu cita con {$barbero} es hoy a las ".Carbon::parse($cita->hora_inicio)->format('H:i').'.',
            default => "Studio La Barber: novedades sobre tu cita del {$fechaHora}.",
        };
    }
}
