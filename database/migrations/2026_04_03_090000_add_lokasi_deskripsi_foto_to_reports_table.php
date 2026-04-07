<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->text('lokasi_deskripsi')->nullable()->after('lokasi_kejadian');
            $table->string('foto_path')->nullable()->after('longitude');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn(['lokasi_deskripsi', 'foto_path']);
        });
    }
};
