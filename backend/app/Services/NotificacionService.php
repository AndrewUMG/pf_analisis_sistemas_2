<?php

namespace App\Services;

use App\Exceptions\NegocioException;
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

    /**
     * Encola la confirmación y los dos recordatorios de una cita recién creada,
     * por cada canal que el cliente realmente tiene (RF-04: WhatsApp y correo).
     */
    public function programarParaCita(Cita $cita): void
    {
        foreach ($this->canalesDisponibles($cita) as $canal) {
            foreach (['confirmacion', 'recordatorio_24h', 'recordatorio_2h'] as $tipo) {
                Notificacion::create([
                    'cita_id' => $cita->id,
                    'tipo' => $tipo,
                    'canal' => $canal,
                    'estado' => 'pendiente',
                ]);
            }
        }
    }

    /** @return array<int, string> */
    private function canalesDisponibles(Cita $cita): array
    {
        $cliente = $cita->cliente;
        $canales = [];

        // Los clientes presenciales (walk-in) se crean con un correo interno
        // inventado: no tiene sentido enviarles mensajes ahí.
        if ($cliente?->email && ! str_ends_with($cliente->email, '@studiolabarber.local')) {
            $canales[] = 'correo';
        }
        if ($cliente?->telefono) {
            $canales[] = 'whatsapp';
        }

        return $canales;
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

    /**
     * Reintento manual de una notificación fallida (lo dispara el administrador).
     * La deja pendiente con los intentos en cero y la envía de inmediato.
     */
    public function reintentar(Notificacion $notificacion): Notificacion
    {
        if ($notificacion->estado !== 'fallida') {
            throw new NegocioException('Solo se pueden reintentar las notificaciones fallidas.');
        }

        $notificacion->update(['estado' => 'pendiente', 'intentos' => 0, 'ultimo_error' => null]);
        $this->enviar($notificacion->load('cita.cliente', 'cita.barbero.user'));

        return $notificacion->fresh(['cita.cliente', 'cita.barbero.user']);
    }

    private function enviar(Notificacion $notificacion): bool
    {
        $cita = $notificacion->cita;
        $destino = $notificacion->canal === 'whatsapp' ? $cita->cliente->telefono : $cita->cliente->email;

        if (empty($destino)) {
            return $this->marcarFallida($notificacion, 'El cliente no tiene un dato de contacto para este canal.');
        }

        $mensaje = $this->construirMensaje($notificacion, $cita);
        // Se guarda lo que se intentó enviar, para poder auditarlo después.
        $notificacion->update(['destino' => $destino, 'mensaje' => $mensaje]);

        if ($this->proveedor->enviar($notificacion->canal, $destino, $mensaje)) {
            $notificacion->update([
                'estado' => 'enviada',
                'intentos' => $notificacion->intentos + 1,
                'enviado_at' => now(),
                'ultimo_error' => null,
            ]);

            return true;
        }

        return $this->marcarFallida($notificacion, 'El proveedor no pudo entregar el mensaje.');
    }

    private function marcarFallida(Notificacion $notificacion, string $motivo): bool
    {
        $intentos = $notificacion->intentos + 1;
        $notificacion->update([
            'intentos' => $intentos,
            'estado' => $intentos >= self::MAX_INTENTOS ? 'fallida' : 'pendiente',
            'ultimo_error' => $motivo,
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
