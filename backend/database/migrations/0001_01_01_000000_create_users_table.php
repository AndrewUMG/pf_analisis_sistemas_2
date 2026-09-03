<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tabla "usuario" del modelo DERCAS: agrupa clientes, barberos,
        // recepcionistas y administradores (RF-05). El rol determina qué
        // paneles y acciones puede usar cada quien.
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('email')->unique();
            $table->string('telefono', 20)->nullable()->unique(); // usado para WhatsApp (RF-04)
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('rol', ['administrador', 'barbero', 'recepcionista', 'cliente'])
                ->default('cliente');
            $table->enum('estado', ['activo', 'inactivo', 'suspendido'])
                ->default('activo');
            // Soporte para el bloqueo temporal por intentos fallidos (CU-005)
            $table->unsignedTinyInteger('intentos_fallidos')->default(0);
            $table->timestamp('bloqueado_hasta')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
