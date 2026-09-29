<?php

namespace Tests\Feature;

use App\Models\Barbero;
use App\Models\Servicio;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * RF-06: cancelar y reagendar respetando la anticipación mínima (2 h por
 * defecto), y que un cliente solo pueda tocar sus propias citas.
 *
 * "Hoy" se fija en un lunes a las 08:00; el barbero trabaja lunes 09:00-18:00
 * y el servicio dura 30 min (+10 de holgura = franjas de 40 min).
 */
class CancelarReagendarTest extends TestCase
{
    use RefreshDatabase;

    private const LUNES = '2026-09-14';

    private Barbero $barbero;

    private Servicio $servicio;

    private User $cliente;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(self::LUNES.' 08:00:00');

        $this->servicio = Servicio::create([
            'nombre' => 'Corte', 'categoria' => 'corte', 'duracion_minutos' => 30, 'precio' => 8, 'activo' => true,
        ]);

        $usuarioBarbero = $this->usuario('barbero', 'barbero@test.local');
        $this->barbero = Barbero::create(['user_id' => $usuarioBarbero->id, 'comision_porcentaje' => 40]);
        $this->barbero->servicios()->attach($this->servicio->id);
        $this->barbero->horarios()->create(['dia_semana' => 1, 'hora_inicio' => '09:00', 'hora_fin' => '18:00']);

        $this->cliente = $this->usuario('cliente', 'cliente@test.local');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function usuario(string $rol, string $email): User
    {
        return User::create([
            'nombres' => ucfirst($rol), 'apellidos' => 'Prueba', 'email' => $email,
            'password' => 'password123', 'rol' => $rol,
        ]);
    }

    private function reservar(User $cliente, string $hora): int
    {
        Sanctum::actingAs($cliente);

        return $this->postJson('/api/citas', [
            'barbero_id' => $this->barbero->id,
            'fecha' => self::LUNES,
            'hora_inicio' => $hora,
            'servicio_ids' => [$this->servicio->id],
        ])->assertCreated()->json('id');
    }

    public function test_cliente_cancela_su_cita_con_anticipacion(): void
    {
        $id = $this->reservar($this->cliente, '12:00');

        $this->postJson("/api/citas/{$id}/cancelar", ['motivo' => 'Imprevisto'])
            ->assertOk()
            ->assertJsonPath('estado', 'cancelada')
            ->assertJsonPath('motivo_cambio', 'Imprevisto');
    }

    public function test_la_cita_informa_si_se_puede_modificar(): void
    {
        $id = $this->reservar($this->cliente, '12:00');

        $this->getJson("/api/citas/{$id}")
            ->assertOk()
            ->assertJsonPath('puede_modificar', true)
            ->assertJsonPath('anticipacion_minima_horas', 2);

        // Ya pasó el límite: faltan 1 h para la cita y se exigen 2 h.
        Carbon::setTestNow(self::LUNES.' 11:00:00');

        $this->getJson("/api/citas/{$id}")->assertJsonPath('puede_modificar', false);
    }

    public function test_un_cliente_no_puede_ver_ni_cancelar_la_cita_de_otro(): void
    {
        $id = $this->reservar($this->cliente, '12:00');

        Sanctum::actingAs($this->usuario('cliente', 'otro@test.local'));

        $this->getJson("/api/citas/{$id}")->assertForbidden();
        $this->postJson("/api/citas/{$id}/cancelar")->assertForbidden();
        $this->postJson("/api/citas/{$id}/reagendar", ['fecha' => self::LUNES, 'hora_inicio' => '15:00'])->assertForbidden();
    }

    public function test_no_se_puede_cancelar_dentro_del_limite_de_anticipacion(): void
    {
        $id = $this->reservar($this->cliente, '12:00');

        Carbon::setTestNow(self::LUNES.' 11:00:00');

        $this->postJson("/api/citas/{$id}/cancelar")
            ->assertUnprocessable()
            ->assertJsonPath('mensaje', fn ($m) => str_contains($m, 'comunícate directamente'));
    }

    public function test_reagenda_a_una_franja_libre(): void
    {
        $id = $this->reservar($this->cliente, '12:00');

        $this->postJson("/api/citas/{$id}/reagendar", ['fecha' => self::LUNES, 'hora_inicio' => '15:00'])
            ->assertOk()
            ->assertJsonPath('hora_inicio', '15:00:00')
            ->assertJsonPath('hora_fin', '15:40:00')
            ->assertJsonPath('estado', 'confirmada');
    }

    public function test_no_reagenda_sobre_una_franja_ocupada(): void
    {
        $this->reservar($this->usuario('cliente', 'otro@test.local'), '15:00');
        $id = $this->reservar($this->cliente, '12:00');

        Sanctum::actingAs($this->cliente);
        $this->postJson("/api/citas/{$id}/reagendar", ['fecha' => self::LUNES, 'hora_inicio' => '15:20'])
            ->assertUnprocessable();
    }

    public function test_no_reagenda_a_un_horario_sin_la_anticipacion_minima(): void
    {
        $id = $this->reservar($this->cliente, '12:00');

        // 09:30 es solo 1 h 30 min después de "ahora" (08:00): menos de las 2 h exigidas.
        $this->postJson("/api/citas/{$id}/reagendar", ['fecha' => self::LUNES, 'hora_inicio' => '09:30'])
            ->assertUnprocessable()
            ->assertJsonPath('mensaje', fn ($m) => str_contains($m, 'anticipación'));
    }

    public function test_la_disponibilidad_puede_excluir_la_cita_que_se_mueve(): void
    {
        $id = $this->reservar($this->cliente, '12:00');
        $parametros = ['fecha' => self::LUNES, 'servicio_ids' => [$this->servicio->id]];

        $sinExcluir = $this->getJson("/api/barberos/{$this->barbero->id}/disponibilidad?".http_build_query($parametros))
            ->assertOk()->json('franjas_disponibles');
        $excluyendo = $this->getJson("/api/barberos/{$this->barbero->id}/disponibilidad?".http_build_query($parametros + ['excluir_cita_id' => $id]))
            ->assertOk()->json('franjas_disponibles');

        $this->assertNotContains('12:00', $sinExcluir);
        $this->assertContains('12:00', $excluyendo);
    }
}
