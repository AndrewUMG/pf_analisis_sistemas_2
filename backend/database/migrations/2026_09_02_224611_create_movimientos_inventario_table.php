<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Entradas, salidas y ajustes de existencias, para trazabilidad (RF-09, CU-009).
        Schema::create('movimientos_inventario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->enum('tipo', ['entrada', 'salida', 'ajuste']);
            $table->integer('cantidad'); // siempre positiva; el "tipo" define el sentido
            $table->string('motivo', 255)->nullable(); // obligatorio para ajustes (validado en el servicio)
            $table->foreignId('usuario_id')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos_inventario');
    }
};
