<?php

namespace Database\Seeders;

use App\Models\Barbero;
use App\Models\ParametroSistema;
use App\Models\Producto;
use App\Models\Servicio;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Datos de demostración para mostrar el backend funcionando de punta a
 * punta: parámetros de negocio, un administrador, barberos con su horario
 * y servicios habilitados, y un catálogo mínimo de servicios/productos.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->sembrarParametros();

        $admin = User::create([
            'nombres' => 'Admin',
            'apellidos' => 'Studio La Barber',
            'email' => 'admin@studiolabarber.local',
            'telefono' => '90000000',
            'password' => 'password123',
            'rol' => 'administrador',
        ]);

        User::create([
            'nombres' => 'Recepción',
            'apellidos' => 'Caja',
            'email' => 'recepcion@studiolabarber.local',
            'telefono' => '90000001',
            'password' => 'password123',
            'rol' => 'recepcionista',
        ]);

        $servicios = collect([
            ['nombre' => 'Corte clásico', 'categoria' => 'corte', 'duracion_minutos' => 30, 'precio' => 8.00],
            ['nombre' => 'Corte + barba', 'categoria' => 'combo', 'duracion_minutos' => 45, 'precio' => 12.00],
            ['nombre' => 'Arreglo de barba', 'categoria' => 'barba', 'duracion_minutos' => 20, 'precio' => 5.00],
            ['nombre' => 'Tratamiento capilar', 'categoria' => 'tratamiento', 'duracion_minutos' => 40, 'precio' => 15.00],
        ])->map(fn ($datos) => Servicio::create($datos + ['activo' => true]));

        $barberosDatos = [
            ['nombres' => 'Carlos', 'apellidos' => 'Martínez', 'especialidad' => 'Cortes clásicos', 'comision_porcentaje' => 40],
            ['nombres' => 'Luis', 'apellidos' => 'Ramírez', 'especialidad' => 'Barbas y diseño', 'comision_porcentaje' => 45],
        ];

        foreach ($barberosDatos as $i => $datos) {
            $usuario = User::create([
                'nombres' => $datos['nombres'],
                'apellidos' => $datos['apellidos'],
                'email' => strtolower($datos['nombres'])."@studiolabarber.local",
                'telefono' => '9000001'.$i,
                'password' => 'password123',
                'rol' => 'barbero',
            ]);

            $barbero = Barbero::create([
                'user_id' => $usuario->id,
                'especialidad' => $datos['especialidad'],
                'comision_porcentaje' => $datos['comision_porcentaje'],
            ]);

            $barbero->servicios()->attach($servicios->pluck('id'));

            // Horario de lunes (1) a sábado (6), 9:00 a 18:00 (RF-03).
            foreach (range(1, 6) as $diaSemana) {
                $barbero->horarios()->create([
                    'dia_semana' => $diaSemana,
                    'hora_inicio' => '09:00',
                    'hora_fin' => '18:00',
                ]);
            }
        }

        collect([
            ['nombre' => 'Cera modeladora', 'categoria' => 'cuidado_cabello', 'precio' => 6.50, 'existencia' => 20, 'existencia_minima' => 5],
            ['nombre' => 'Aceite para barba', 'categoria' => 'cuidado_barba', 'precio' => 7.00, 'existencia' => 15, 'existencia_minima' => 5],
            ['nombre' => 'Shampoo anticaspa', 'categoria' => 'cuidado_cabello', 'precio' => 9.00, 'existencia' => 10, 'existencia_minima' => 3],
        ])->each(fn ($datos) => Producto::create($datos + ['activo' => true]));

        $this->command?->info("Cuenta admin: {$admin->email} / password123");
    }

    /** Reglas de negocio configurables por defecto (RF-02, PANT-16). */
    private function sembrarParametros(): void
    {
        ParametroSistema::establecer(
            ParametroSistema::HOLGURA_MINUTOS, '10',
            'Minutos de holgura que se suman entre citas consecutivas del mismo barbero.'
        );
        ParametroSistema::establecer(
            ParametroSistema::ANTICIPACION_MINIMA_HORAS, '2',
            'Horas mínimas de anticipación para reservar, cancelar o reagendar en línea.'
        );
        ParametroSistema::establecer(
            ParametroSistema::TOLERANCIA_AUSENCIA_MINUTOS, '15',
            'Minutos de tolerancia antes de poder marcar a un cliente como ausente.'
        );
    }
}
