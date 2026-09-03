<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Transacción económica de una cita completada o venta directa (RF-08, CU-008).
        Schema::create('ventas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cita_id')->nullable()->constrained('citas')->nullOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('users')->nullOnDelete();
            // Usuario que realizó el cobro (recepcionista, barbero o administrador).
            $table->foreignId('usuario_id')->constrained('users');
            $table->string('numero_recibo')->unique();
            $table->decimal('subtotal', 8, 2);
            $table->decimal('descuento', 8, 2)->default(0);
            $table->decimal('total', 8, 2);
            $table->enum('metodo_pago', ['efectivo', 'tarjeta', 'transferencia']);
            $table->enum('estado', ['completada', 'anulada'])->default('completada');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ventas');
    }
};
