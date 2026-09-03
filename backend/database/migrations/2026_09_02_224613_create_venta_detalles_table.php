<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Detalle de servicios y/o productos cobrados en una venta, junto con
        // la comisión generada para el barbero cuando aplica (RF-08).
        Schema::create('venta_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venta_id')->constrained('ventas')->cascadeOnDelete();
            $table->enum('tipo', ['servicio', 'producto']);
            $table->foreignId('servicio_id')->nullable()->constrained('servicios');
            $table->foreignId('producto_id')->nullable()->constrained('productos');
            $table->foreignId('barbero_id')->nullable()->constrained('barberos');
            $table->string('descripcion'); // nombre del servicio/producto al momento de la venta
            $table->unsignedInteger('cantidad')->default(1);
            $table->decimal('precio_unitario', 8, 2);
            $table->decimal('subtotal', 8, 2);
            $table->decimal('comision', 8, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venta_detalles');
    }
};
