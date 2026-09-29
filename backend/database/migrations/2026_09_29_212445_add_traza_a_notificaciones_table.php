<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Trazabilidad para el administrador (RF-04, CU-004): a quién y qué
        // texto se envió, y el motivo del último fallo.
        Schema::table('notificaciones', function (Blueprint $table) {
            $table->string('destino')->nullable()->after('canal');
            $table->text('mensaje')->nullable()->after('destino');
            $table->string('ultimo_error')->nullable()->after('intentos');
        });
    }

    public function down(): void
    {
        Schema::table('notificaciones', function (Blueprint $table) {
            $table->dropColumn(['destino', 'mensaje', 'ultimo_error']);
        });
    }
};
