<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Entidad central del sistema: la reserva (RF-02, CU-002).
        Schema::create('citas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cliente_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('barbero_id')->constrained('barberos')->cascadeOnDelete();
            $table->date('fecha');
            $table->time('hora_inicio');
            // hora_fin = hora_inicio + duración total de servicios + holgura (10 min, RF-02).
            $table->time('hora_fin');
            $table->enum('estado', [
                'confirmada', 'en_atencion', 'completada', 'cancelada', 'ausente',
            ])->default('confirmada');
            $table->enum('canal_origen', ['en_linea', 'presencial'])->default('en_linea');
            $table->string('notas', 255)->nullable();
            $table->string('motivo_cambio', 255)->nullable();
            // Marcas de tiempo reales de la atención (CU-003).
            $table->timestamp('inicio_atencion_at')->nullable();
            $table->timestamp('fin_atencion_at')->nullable();
            // Monto vigente al momento de agendar, para no depender de futuros
            // cambios de precio en el catálogo.
            $table->decimal('monto_estimado', 8, 2)->default(0);
            $table->timestamps();

            // Acelera la búsqueda de disponibilidad y detección de colisiones
            // por barbero/fecha, el filtro más usado por el motor de reservas.
            $table->index(['barbero_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('citas');
    }
};
