<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Días libres, permisos y bloqueos temporales de la agenda (RF-03, CU-003 paso 8).
        Schema::create('excepciones_horario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbero_id')->constrained('barberos')->cascadeOnDelete();
            $table->enum('tipo', ['dia_libre', 'permiso', 'vacaciones', 'bloqueo_temporal'])
                ->default('dia_libre');
            $table->dateTime('fecha_inicio');
            $table->dateTime('fecha_fin');
            $table->string('motivo', 150)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('excepciones_horario');
    }
};
