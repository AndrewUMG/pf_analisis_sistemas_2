<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Registro y trazabilidad de confirmaciones y recordatorios (RF-04, CU-004).
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cita_id')->constrained('citas')->cascadeOnDelete();
            $table->enum('tipo', ['confirmacion', 'recordatorio_24h', 'recordatorio_2h'])
                ->default('confirmacion');
            $table->enum('canal', ['whatsapp', 'correo'])->default('whatsapp');
            $table->enum('estado', ['pendiente', 'enviada', 'fallida'])->default('pendiente');
            $table->unsignedTinyInteger('intentos')->default(0); // máximo 3 (CU-004)
            $table->timestamp('enviado_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
    }
};
