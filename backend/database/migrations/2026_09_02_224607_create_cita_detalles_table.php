<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Detalle de los servicios incluidos en cada cita, con su precio y
        // duración vigentes al momento de agendar (RF-02).
        Schema::create('cita_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cita_id')->constrained('citas')->cascadeOnDelete();
            $table->foreignId('servicio_id')->constrained('servicios');
            $table->decimal('precio_aplicado', 8, 2);
            $table->unsignedSmallInteger('duracion_aplicada');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cita_detalles');
    }
};
