<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\NegocioException;
use App\Http\Controllers\Controller;
use App\Models\Barbero;
use App\Models\User;
use App\Services\AgendaService;
use App\Services\ReservaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Perfiles de barbero, su horario semanal y su agenda (RF-03, CU-003). */
class BarberoController extends Controller
{
    public function __construct(
        private readonly ReservaService $reservas,
        private readonly AgendaService $agenda,
    ) {}

    /** Listado público para el buscador de citas (PANT-01/02). */
    public function index(Request $request)
    {
        $query = Barbero::query()->with(['user', 'servicios']);

        if ($request->filled('servicio_id')) {
            $query->whereHas('servicios', fn ($q) => $q->where('servicios.id', $request->integer('servicio_id')));
        }

        return $query->whereHas('user', fn ($q) => $q->where('estado', 'activo'))->get();
    }

    public function show(Request $request, Barbero $barbero)
    {
        $relaciones = ['user', 'servicios', 'horarios'];

        // Las excepciones (vacaciones, permisos) solo se exponen al propio
        // barbero o al administrador; el resto del público no necesita el motivo.
        // Esta ruta es pública (sin middleware auth:sanctum), así que hay que
        // pedirle el usuario explícitamente al guard de Sanctum: $request->user()
        // usaría el guard por defecto y siempre devolvería null aquí.
        $usuario = $request->user('sanctum');
        if ($usuario && ($usuario->id === $barbero->user_id || $usuario->esAdministrador())) {
            $relaciones[] = 'excepciones';
        }

        return $barbero->load($relaciones);
    }

    /** El administrador da de alta el perfil profesional de un usuario ya registrado con rol "barbero". */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'user_id' => ['required', 'exists:users,id', Rule::unique('barberos', 'user_id')],
            'especialidad' => 'nullable|string|max:150',
            'comision_porcentaje' => 'required|numeric|min:0|max:100',
            'servicio_ids' => 'sometimes|array',
            'servicio_ids.*' => 'exists:servicios,id',
        ]);

        return DB::transaction(function () use ($datos) {
            $usuario = User::findOrFail($datos['user_id']);
            $usuario->update(['rol' => 'barbero']);

            $barbero = Barbero::create([
                'user_id' => $usuario->id,
                'especialidad' => $datos['especialidad'] ?? null,
                'comision_porcentaje' => $datos['comision_porcentaje'],
            ]);

            if (isset($datos['servicio_ids'])) {
                $barbero->servicios()->sync($datos['servicio_ids']);
            }

            return response()->json($barbero->load(['user', 'servicios']), 201);
        });
    }

    public function update(Request $request, Barbero $barbero)
    {
        $datos = $request->validate([
            'especialidad' => 'nullable|string|max:150',
            'comision_porcentaje' => 'sometimes|numeric|min:0|max:100',
            'servicio_ids' => 'sometimes|array',
            'servicio_ids.*' => 'exists:servicios,id',
        ]);

        $barbero->update(collect($datos)->only(['especialidad', 'comision_porcentaje'])->all());

        if (isset($datos['servicio_ids'])) {
            $barbero->servicios()->sync($datos['servicio_ids']);
        }

        return $barbero->load(['user', 'servicios']);
    }

    /** Define o reemplaza la jornada laboral semanal recurrente (PANT-10). */
    public function actualizarHorarios(Request $request, Barbero $barbero)
    {
        $datos = $request->validate([
            'horarios' => 'required|array',
            'horarios.*.dia_semana' => 'required|integer|min:0|max:6',
            'horarios.*.hora_inicio' => 'required|date_format:H:i',
            'horarios.*.hora_fin' => 'required|date_format:H:i|after:horarios.*.hora_inicio',
        ]);

        DB::transaction(function () use ($barbero, $datos) {
            $barbero->horarios()->delete();
            $barbero->horarios()->createMany($datos['horarios']);
        });

        return $barbero->load('horarios');
    }

    /** Registra un bloqueo puntual: día libre, permiso o vacaciones (CU-003). */
    public function registrarExcepcion(Request $request, Barbero $barbero)
    {
        $datos = $request->validate([
            'tipo' => 'required|in:dia_libre,permiso,vacaciones,otro',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'motivo' => 'nullable|string|max:255',
        ]);

        $excepcion = $this->agenda->registrarExcepcion(
            $barbero, $datos['tipo'], $datos['fecha_inicio'], $datos['fecha_fin'], $datos['motivo'] ?? null
        );

        return response()->json($excepcion, 201);
    }

    /** Franjas horarias libres para una fecha y una combinación de servicios (CU-002 paso 5). */
    public function disponibilidad(Request $request, Barbero $barbero)
    {
        $datos = $request->validate([
            'fecha' => 'required|date',
            'servicio_ids' => 'required|array|min:1',
            'servicio_ids.*' => 'integer|exists:servicios,id',
        ]);

        return response()->json([
            'franjas_disponibles' => $this->reservas->disponibilidad($barbero, $datos['fecha'], $datos['servicio_ids']),
        ]);
    }

    /** Agenda del día con el resumen de comisiones, para el panel del barbero (CU-003). */
    public function agendaDelDia(Request $request, Barbero $barbero)
    {
        $fecha = $request->input('fecha', now()->toDateString());

        return $this->agenda->agendaDelDia($barbero, $fecha);
    }

    /** Sube o reemplaza la foto de perfil; puede hacerlo el administrador o el propio barbero. */
    public function subirFoto(Request $request, Barbero $barbero)
    {
        $usuario = $request->user();
        if (! $usuario->esAdministrador() && $usuario->id !== $barbero->user_id) {
            throw new NegocioException('Solo puedes actualizar tu propia foto de perfil.');
        }

        $request->validate([
            'foto' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        if ($barbero->foto) {
            Storage::disk('public')->delete($this->rutaDesdeUrl($barbero->foto));
        }

        $ruta = $request->file('foto')->store('barberos', 'public');
        $barbero->update(['foto' => Storage::disk('public')->url($ruta)]);

        return $barbero->load(['user', 'servicios']);
    }

    /** Convierte la URL pública guardada de vuelta a la ruta relativa del disco "public". */
    private function rutaDesdeUrl(string $url): string
    {
        return Str::after(parse_url($url, PHP_URL_PATH) ?? '', '/storage/');
    }
}
