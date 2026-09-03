<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Jornada laboral semanal recurrente de cada barbero (RF-03).
        // Es la base sobre la que el motor de reservas calcula disponibilidad.
        Schema::create('horarios_barbero', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbero_id')->constrained('barberos')->cascadeOnDelete();
            $table->unsignedTinyInteger('dia_semana'); // 0 = domingo ... 6 = sábado
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->timestamps();

            $table->unique(['barbero_id', 'dia_semana']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('horarios_barbero');
    }
};
