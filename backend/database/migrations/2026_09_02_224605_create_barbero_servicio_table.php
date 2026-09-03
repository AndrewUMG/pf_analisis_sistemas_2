<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla pivote: qué servicios puede prestar cada barbero (RF-01).
        Schema::create('barbero_servicio', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbero_id')->constrained('barberos')->cascadeOnDelete();
            $table->foreignId('servicio_id')->constrained('servicios')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['barbero_id', 'servicio_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barbero_servicio');
    }
};
