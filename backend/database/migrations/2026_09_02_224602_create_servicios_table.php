<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Catálogo de servicios y combos promocionales (RF-01).
        Schema::create('servicios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->enum('categoria', ['corte', 'barba', 'tratamiento', 'spa_facial', 'combo'])
                ->default('corte');
            $table->text('descripcion')->nullable();
            $table->unsignedSmallInteger('duracion_minutos'); // debe ser > 0
            $table->decimal('precio', 8, 2); // debe ser >= 0
            $table->string('imagen')->nullable();
            // "Activo" en falso = baja lógica: conserva historial de citas ya
            // registradas con este servicio (integridad referencial, CU-001).
            $table->boolean('activo')->default(true);
            $table->timestamps();

            // El nombre debe ser único dentro de su categoría (CU-001, excepción 6).
            $table->unique(['nombre', 'categoria']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servicios');
    }
};
