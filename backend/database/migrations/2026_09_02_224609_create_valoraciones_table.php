<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Calificación y comentario del cliente sobre el servicio recibido (RF-10).
        Schema::create('valoraciones', function (Blueprint $table) {
            $table->id();
            // unique(): una cita solo admite una valoración (CU-010, excepción 4).
            $table->foreignId('cita_id')->unique()->constrained('citas')->cascadeOnDelete();
            $table->foreignId('cliente_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('barbero_id')->constrained('barberos')->cascadeOnDelete();
            $table->unsignedTinyInteger('calificacion'); // escala de 1 a 5
            $table->string('comentario', 500)->nullable();
            // Permite ocultar comentarios inapropiados sin perder la calificación numérica.
            $table->boolean('visible')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('valoraciones');
    }
};
