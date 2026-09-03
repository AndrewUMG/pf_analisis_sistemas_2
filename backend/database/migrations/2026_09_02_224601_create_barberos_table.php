<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Extiende a "users" con el perfil profesional del barbero (RF-03).
        // Un barbero SIEMPRE es un usuario con rol = 'barbero'.
        Schema::create('barberos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('especialidad')->nullable();
            // Porcentaje aplicado sobre el monto de servicios para calcular su comisión (CU-003).
            $table->decimal('comision_porcentaje', 5, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barberos');
    }
};
