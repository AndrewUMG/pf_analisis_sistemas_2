<?php

namespace Tests\Feature;

use App\Models\Barbero;
use App\Models\Cita;
use App\Models\Notificacion;
use App\Models\Servicio;
use App\Models\User;
use App\Services\Mensajeria\ProveedorMensajeria;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** RF-10 (valoraciones), RF-04 (notificaciones) y RF-07 (horas pico). */
class ValoracionesNotificacionesReportesTest extends TestCase
{
    use RefreshDatabase;

    private const LUNES = '2026-09-14';

    private Barbero $barbero;

    private Servicio $servicio;

    private User $cliente;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(self::LUNES.' 08:00:00');

        $this->servicio = Servicio::create([
            'nombre' => 'Corte', 'categoria' => 'corte', 'duracion_minutos' => 30, 'precio' => 8, 'activo' => true,
        ]);
        $this->barbero = Barbero::create(['user_id' => $this->usuario('barbero', 'b@test.local')->id, 'comision_porcentaje' => 40]);
        $this->barbero->servicios()->attach($this->servicio->id);
        $this->barbero->horarios()->create(['dia_semana' => 1, 'hora_inicio' => '09:00', 'hora_fin' => '18:00']);

        $this->cliente = $this->usuario('cliente', 'c@test.local', '55511111');
        $this->admin = $this->usuario('administrador', 'a@test.local');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function usuario(string $rol, string $email, ?string $telefono = null): User
    {
        return User::create([
            'nombres' => ucfirst($rol), 'apellidos' => 'Prueba', 'email' => $email,
            'telefono' => $telefono, 'password' => 'password123', 'rol' => $rol,
        ]);
    }

    private function cita(User $cliente, string $hora, string $estado = 'confirmada'): Cita
    {
        return Cita::create([
            'cliente_id' => $cliente->id, 'barbero_id' => $this->barbero->id, 'fecha' => self::LUNES,
            'hora_inicio' => $hora, 'hora_fin' => '23:00:00', 'estado' => $estado,
            'canal_origen' => 'en_linea', 'monto_estimado' => 8,
        ]);
    }

    /** Proveedor de mensajería falso: permite simular éxito o fallo. */
    private function proveedor(bool $ok): object
    {
        $falso = new class($ok) implements ProveedorMensajeria
        {
            public array $enviados = [];

            public function __construct(public bool $ok) {}

            public function enviar(string $canal, string $destino, string $mensaje): bool
            {
                $this->enviados[] = compact('canal', 'destino', 'mensaje');

                return $this->ok;
            }
        };
        $this->app->instance(ProveedorMensajeria::class, $falso);

        return $falso;
    }

    // --- RF-10 ---------------------------------------------------------

    public function test_cliente_valora_una_cita_completada_una_sola_vez(): void
    {
        $cita = $this->cita($this->cliente, '10:00:00', 'completada');
        Sanctum::actingAs($this->cliente);

        $this->postJson("/api/citas/{$cita->id}/valorar", ['calificacion' => 5, 'comentario' => 'Excelente'])->assertCreated();
        $this->postJson("/api/citas/{$cita->id}/valorar", ['calificacion' => 1])->assertUnprocessable();
    }

    public function test_no_se_valora_una_cita_que_no_esta_completada(): void
    {
        $cita = $this->cita($this->cliente, '10:00:00');
        Sanctum::actingAs($this->cliente);

        $this->postJson("/api/citas/{$cita->id}/valorar", ['calificacion' => 5])->assertUnprocessable();
    }

    public function test_admin_ve_resumen_y_puede_ocultar_una_valoracion(): void
    {
        $otro = $this->usuario('cliente', 'c2@test.local');
        foreach ([[$this->cliente, 5, '10:00:00'], [$otro, 3, '11:00:00']] as [$cliente, $nota, $hora]) {
            $cita = $this->cita($cliente, $hora, 'completada');
            Sanctum::actingAs($cliente);
            $this->postJson("/api/citas/{$cita->id}/valorar", ['calificacion' => $nota])->assertCreated();
        }

        Sanctum::actingAs($this->admin);
        $respuesta = $this->getJson('/api/valoraciones')->assertOk()
            ->assertJsonPath('resumen.total', 2)
            ->assertJsonPath('resumen.promedio', 4)
            ->assertJsonPath('resumen.por_estrella.5', 1);
        $idDeLaNota3 = collect($respuesta->json('valoraciones.data'))->firstWhere('calificacion', 3)['id'];

        // Público: el promedio del barbero refleja las visibles; al ocultar la de 3 estrellas sube a 5.
        $this->getJson('/api/barberos')->assertJsonPath('0.promedio_valoracion', 4)->assertJsonPath('0.total_valoraciones', 2);
        $this->putJson("/api/valoraciones/{$idDeLaNota3}", ['visible' => false])->assertOk();
        $this->getJson('/api/barberos')->assertJsonPath('0.promedio_valoracion', 5)->assertJsonPath('0.total_valoraciones', 1);
    }

    public function test_solo_el_administrador_ve_las_valoraciones(): void
    {
        Sanctum::actingAs($this->cliente);
        $this->getJson('/api/valoraciones')->assertForbidden();
    }

    // --- RF-04 ---------------------------------------------------------

    public function test_se_programa_por_correo_y_whatsapp_segun_los_datos_del_cliente(): void
    {
        $this->proveedor(true);
        Sanctum::actingAs($this->cliente);

        $this->postJson('/api/citas', [
            'barbero_id' => $this->barbero->id, 'fecha' => self::LUNES, 'hora_inicio' => '12:00', 'servicio_ids' => [$this->servicio->id],
        ])->assertCreated();

        $this->assertSame(3, Notificacion::where('canal', 'correo')->count());
        $this->assertSame(3, Notificacion::where('canal', 'whatsapp')->count());
    }

    public function test_un_cliente_presencial_solo_recibe_whatsapp(): void
    {
        $walkin = $this->usuario('cliente', 'walkin_abc@studiolabarber.local', '55522222');
        $cita = $this->cita($walkin, '12:00:00');

        app(\App\Services\NotificacionService::class)->programarParaCita($cita);

        $this->assertSame(0, Notificacion::where('canal', 'correo')->count());
        $this->assertSame(3, Notificacion::where('canal', 'whatsapp')->count());
    }

    public function test_procesar_envia_solo_lo_que_corresponde_y_deja_trazabilidad(): void
    {
        $proveedor = $this->proveedor(true);
        $cita = $this->cita($this->cliente, '12:00:00');
        app(\App\Services\NotificacionService::class)->programarParaCita($cita);

        Sanctum::actingAs($this->admin);
        // Hoy 08:00, cita 12:00: solo la confirmación (x2 canales) corresponde; el recordatorio de 24 h ya venció, el de 2 h aún no.
        $this->postJson('/api/notificaciones/procesar')->assertOk()->assertJsonPath('enviadas', 4);

        $this->assertNotContains('recordatorio_2h', Notificacion::where('estado', 'enviada')->pluck('tipo')->all());
        $enviada = Notificacion::where('canal', 'correo')->where('tipo', 'confirmacion')->first();
        $this->assertSame('c@test.local', $enviada->destino);
        $this->assertStringContainsString('confirmada', $enviada->mensaje);
        $this->assertCount(4, $proveedor->enviados);
    }

    public function test_tres_fallos_marcan_fallida_y_el_admin_puede_reintentar(): void
    {
        $this->proveedor(false);
        $cita = $this->cita($this->cliente, '12:00:00');
        app(\App\Services\NotificacionService::class)->programarParaCita($cita);

        Sanctum::actingAs($this->admin);
        foreach (range(1, 3) as $_) {
            $this->postJson('/api/notificaciones/procesar')->assertOk();
        }
        $fallida = Notificacion::where('tipo', 'confirmacion')->where('canal', 'correo')->firstOrFail();
        $this->assertSame('fallida', $fallida->estado);
        $this->assertNotNull($fallida->ultimo_error);

        $this->proveedor(true);
        $this->postJson("/api/notificaciones/{$fallida->id}/reintentar")->assertOk()->assertJsonPath('estado', 'enviada');
        $this->postJson("/api/notificaciones/{$fallida->id}/reintentar")->assertUnprocessable();
    }

    public function test_solo_el_administrador_opera_las_notificaciones(): void
    {
        Sanctum::actingAs($this->cliente);
        $this->getJson('/api/notificaciones')->assertForbidden();
        $this->postJson('/api/notificaciones/procesar')->assertForbidden();
    }

    // --- RF-07 ---------------------------------------------------------

    public function test_horas_pico_cuenta_citas_no_canceladas_por_hora_y_dia(): void
    {
        $this->cita($this->cliente, '10:00:00');
        $this->cita($this->cliente, '10:30:00');
        $this->cita($this->cliente, '15:00:00', 'completada');
        $this->cita($this->cliente, '10:15:00', 'cancelada');

        Sanctum::actingAs($this->admin);
        $r = $this->getJson('/api/reportes/horas-pico?desde=2026-09-01&hasta=2026-09-30')->assertOk();

        $r->assertJsonPath('total_citas', 3)
            ->assertJsonPath('hora_pico', 10)
            ->assertJsonPath('dia_pico', 1)
            ->assertJsonPath('por_hora.10.total', 2)
            ->assertJsonPath('matriz.1.15', 1);
    }
}
