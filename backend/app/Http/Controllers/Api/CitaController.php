<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exceptions\NegocioException;
use App\Models\Barbero;
use App\Models\Cita;
use App\Models\Valoracion;
use App\Services\AgendaService;
use App\Services\ReservaService;
use Illuminate\Http\Request;

/**
 * Reservas y su ciclo de vida completo: crear, cancelar, reagendar,
 * atender y valorar (RF-02, RF-03, RF-06, RF-10, RF-11).
 */
class CitaController extends Controller
{
    public function __construct(
        private readonly ReservaService $reservas,
        private readonly AgendaService $agenda,
    ) {}

    /** Lista las citas visibles según el rol de quien consulta. */
    public function index(Request $request)
    {
        $usuario = $request->user();

        $query = Cita::query()->with(['cliente', 'barbero.user', 'detalles.servicio']);

        // Cada rol solo ve lo que le corresponde; admin y recepcionista ven todo.
        if ($usuario->esCliente()) {
            $query->where('cliente_id', $usuario->id);
        } elseif ($usuario->esBarbero()) {
            $query->where('barbero_id', $usuario->barbero->id);
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }
        if ($request->filled('fecha')) {
            $query->whereDate('fecha', $request->date('fecha'));
        }

        return $query->orderByDesc('fecha')->orderByDesc('hora_inicio')->paginate(20);
    }

    public function show(Cita $cita)
    {
        return $cita->load(['cliente', 'barbero.user', 'detalles.servicio', 'valoracion']);
    }

    /** Reserva en línea hecha por el propio cliente (CU-002). */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'barbero_id' => 'required|exists:barberos,id',
            'fecha' => 'required|date',
            'hora_inicio' => 'required|date_format:H:i',
            'servicio_ids' => 'required|array|min:1',
            'servicio_ids.*' => 'integer|exists:servicios,id',
            'notas' => 'nullable|string|max:500',
        ]);

        $cita = $this->reservas->reservar(
            cliente: $request->user(),
            barbero: Barbero::findOrFail($datos['barbero_id']),
            fecha: $datos['fecha'],
            horaInicio: $datos['hora_inicio'],
            servicioIds: $datos['servicio_ids'],
            canalOrigen: 'en_linea',
            notas: $datos['notas'] ?? null,
        );

        return response()->json($cita, 201);
    }

    /** Registro presencial de un cliente sin cita (RF-11, CU-011). */
    public function walkin(Request $request)
    {
        $datos = $request->validate([
            'nombres' => 'required|string|max:60',
            'apellidos' => 'nullable|string|max:60',
            'telefono' => 'required|string|max:20',
            'barbero_id' => 'required|exists:barberos,id',
            'servicio_ids' => 'required|array|min:1',
            'servicio_ids.*' => 'integer|exists:servicios,id',
            'notas' => 'nullable|string|max:500',
        ]);

        $cita = $this->reservas->registrarWalkIn(
            datosCliente: collect($datos)->only(['nombres', 'apellidos', 'telefono'])->all(),
            barbero: Barbero::findOrFail($datos['barbero_id']),
            servicioIds: $datos['servicio_ids'],
            notas: $datos['notas'] ?? null,
        );

        return response()->json($cita, 201);
    }

    /** Cancela una cita confirmada respetando la anticipación mínima (RF-06, CU-006). */
    public function cancelar(Request $request, Cita $cita)
    {
        $datos = $request->validate(['motivo' => 'nullable|string|max:255']);

        return $this->reservas->cancelarOReagendar($cita, 'cancelar', motivo: $datos['motivo'] ?? null);
    }

    /** Reagenda una cita confirmada a una nueva fecha/hora (RF-06, CU-006). */
    public function reagendar(Request $request, Cita $cita)
    {
        $datos = $request->validate([
            'fecha' => 'required|date',
            'hora_inicio' => 'required|date_format:H:i',
            'motivo' => 'nullable|string|max:255',
        ]);

        return $this->reservas->cancelarOReagendar(
            $cita, 'reagendar', motivo: $datos['motivo'] ?? null,
            nuevaFecha: $datos['fecha'], nuevaHoraInicio: $datos['hora_inicio'],
        );
    }

    /** El barbero marca el inicio de la atención (CU-003). */
    public function iniciar(Request $request, Cita $cita)
    {
        return $this->agenda->iniciarAtencion($cita, $request->boolean('confirmar_inicio_temprano'));
    }

    /** El barbero marca la cita como completada (CU-003). */
    public function finalizar(Cita $cita)
    {
        try {
            return $this->agenda->finalizarAtencion($cita);
        } catch (NegocioException $e) {
            // La falta de comisión configurada no debe bloquear el cierre de la cita,
            // solo se informa como advertencia al barbero (CU-003, excepción 6).
            if (($e->detalles()['solo_advertencia'] ?? false) === true) {
                return response()->json(['cita' => $cita->fresh(), 'advertencia' => $e->getMessage()]);
            }
            throw $e;
        }
    }

    /** Libera el turno cuando el cliente no se presentó (CU-003, excepción 5). */
    public function marcarAusente(Cita $cita)
    {
        return $this->agenda->marcarAusente($cita);
    }

    /** El cliente califica el servicio recibido, una sola vez por cita (RF-10). */
    public function valorar(Request $request, Cita $cita)
    {
        $datos = $request->validate([
            'calificacion' => 'required|integer|min:1|max:5',
            'comentario' => 'nullable|string|max:500',
        ]);

        if ($cita->cliente_id !== $request->user()->id) {
            throw new NegocioException('Solo el cliente de la cita puede valorarla.');
        }
        if ($cita->estado !== 'completada') {
            throw new NegocioException('Solo se puede valorar una cita ya completada.');
        }
        if ($cita->valoracion()->exists()) {
            throw new NegocioException('Esta cita ya fue valorada.');
        }

        $valoracion = Valoracion::create([
            'cita_id' => $cita->id,
            'cliente_id' => $cita->cliente_id,
            'barbero_id' => $cita->barbero_id,
            'calificacion' => $datos['calificacion'],
            'comentario' => $datos['comentario'] ?? null,
            'visible' => true,
        ]);

        return response()->json($valoracion, 201);
    }
}
