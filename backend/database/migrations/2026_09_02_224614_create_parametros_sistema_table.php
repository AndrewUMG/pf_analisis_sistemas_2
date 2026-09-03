<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Reglas de negocio configurables sin tocar código (RF-02, PANT-16).
        // Ej.: holgura_entre_servicios_minutos, anticipacion_minima_horas,
        // tolerancia_ausencia_minutos.
        Schema::create('parametros_sistema', function (Blueprint $table) {
            $table->id();
            $table->string('clave')->unique();
            $table->string('valor');
            $table->string('descripcion')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parametros_sistema');
    }
};
