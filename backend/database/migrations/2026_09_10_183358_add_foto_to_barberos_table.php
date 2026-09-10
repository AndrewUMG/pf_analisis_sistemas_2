<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barberos', function (Blueprint $table) {
            $table->string('foto')->nullable()->after('especialidad');
        });
    }

    public function down(): void
    {
        Schema::table('barberos', function (Blueprint $table) {
            $table->dropColumn('foto');
        });
    }
};
