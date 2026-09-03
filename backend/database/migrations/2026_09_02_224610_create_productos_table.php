<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Productos cosméticos e insumos de trabajo (RF-09).
        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('categoria')->default('cosmetico');
            $table->decimal('precio', 8, 2);
            $table->unsignedInteger('existencia')->default(0);
            // Nivel que dispara la alerta de reabastecimiento (RF-09, CU-009 paso 6).
            $table->unsignedInteger('existencia_minima')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
