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

/** Una cita completada solo puede cobrarse una vez. */
class CobroCitaTest extends TestCase
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

    public function test_una_cita_no_se_puede_cobrar_dos_veces(): void
    {
        $recepcion = $this->usuario('recepcionista', 'r@test.local');
        $cita = Cita::create([
            'cliente_id' => $this->cliente->id, 'barbero_id' => $this->barbero->id, 'fecha' => self::LUNES,
            'hora_inicio' => '10:00:00', 'hora_fin' => '10:30:00', 'estado' => 'completada',
            'canal_origen' => 'en_linea', 'monto_estimado' => 8,
        ]);
        $cita->detalles()->create(['servicio_id' => $this->servicio->id, 'precio_aplicado' => 8, 'duracion_aplicada' => 30]);

        Sanctum::actingAs($recepcion);
        $datos = ['cita_id' => $cita->id, 'metodo_pago' => 'efectivo', 'descuento' => 0, 'productos' => []];

        $this->postJson('/api/ventas', $datos)->assertCreated();
        $this->postJson('/api/ventas', $datos)->assertStatus(422);

        $this->getJson('/api/citas?estado=completada&sin_cobro=1')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_walkin_cerca_del_cierre_ignora_la_anticipacion_de_reserva_en_linea(): void
    {
        Carbon::setTestNow(self::LUNES.' 17:00:00'); // el barbero cierra a las 18:00
        Sanctum::actingAs($this->usuario('recepcionista', 'r2@test.local'));

        $this->postJson('/api/citas/walkin', [
            'nombres' => 'Luis', 'apellidos' => 'Prueba', 'telefono' => '55599999',
            'barbero_id' => $this->barbero->id, 'servicio_ids' => [$this->servicio->id],
        ])->assertCreated();
    }
}
