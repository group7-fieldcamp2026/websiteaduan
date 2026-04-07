<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
                Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_code', 20)->unique(); // kode unik untuk cek status

            // Data Pelapor
            $table->string('email_its');
            $table->enum('peran_kampus', ['Mahasiswa', 'Dosen', 'Tenaga Kependidikan', 'Lainnya (non-ITS)']);
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan', 'Tidak ingin menyebutkan'])->nullable();

            // Lokasi
            $table->string('lokasi_kejadian');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // Kondisi Fisik & Persepsi
            $table->enum('pencahayaan', ['Terang', 'Remang-remang', 'Gelap']);
            $table->enum('kepadatan', ['Ramai', 'Cukup ramai', 'Sepi', 'Sangat sepi']);
            $table->enum('cctv', ['Ada dan terlihat jelas', 'Ada tapi tidak yakin aktif', 'Tidak ada', 'Tidak tahu']);
            $table->enum('petugas_keamanan', ['Sering ada', 'Kadang ada', 'Jarang ada', 'Tidak pernah ada']);
            $table->string('vegetasi')->nullable();
            $table->enum('waktu_rawan', ['Pagi', 'Siang', 'Malam', 'Sepanjang Hari']);
            $table->string('hari_rawan')->nullable();
            $table->unsignedTinyInteger('skor_nyaman');
            $table->string('alasan_tidak_nyaman')->nullable();
            $table->unsignedTinyInteger('skor_rawan');
            $table->string('pernah_hindari')->nullable();
            $table->string('orang_lain')->nullable();
            $table->string('situasi_mencurigakan')->nullable();
            $table->string('fungsi_ruang')->nullable();
            $table->text('kronologi')->nullable();
            $table->string('kontak_pelapor')->nullable();

            // Status penanganan
            $table->enum('status', ['pending', 'in_review', 'resolved'])->default('pending');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
