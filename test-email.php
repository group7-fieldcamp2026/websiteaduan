<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Mail\ReportSubmittedNotification;
use App\Models\Report;
use Illuminate\Support\Facades\Mail;

// Test 1: Cek konfigurasi mail
echo "=== Email Configuration ===\n";
echo "MAIL_MAILER: " . config('mail.default') . "\n";
echo "MAIL_HOST: " . config('mail.mailers.smtp.host') . "\n";
echo "MAIL_PORT: " . config('mail.mailers.smtp.port') . "\n";
echo "MAIL_USERNAME: " . config('mail.mailers.smtp.username') . "\n";
echo "\n";

// Test 2: Coba kirim email test
echo "=== Sending Test Email ===\n";

try {
    // Buat data dummy (tanpa save ke DB)
    $testReport = new Report([
        'report_code' => 'ITS-TEST123',
        'email_its' => 'test@gmail.com',
        'peran_kampus' => 'Mahasiswa',
        'lokasi_kejadian' => 'Test Location',
        'lokasi_deskripsi' => 'Test Description',
        'pencahayaan' => 'Terang',
        'kepadatan' => 'Ramai',
        'cctv' => 'Ada dan terlihat jelas',
        'petugas_keamanan' => 'Sering ada',
        'waktu_rawan' => 'Pagi',
        'skor_nyaman' => 4,
        'skor_rawan' => 2,
        'status' => 'pending',
        'created_at' => now(),
    ]);

    Mail::to('kelompok7fieldcamp2026@gmail.com')->send(
        new ReportSubmittedNotification($testReport)
    );

    echo "✅ Email sent successfully!\n";
} catch (\Exception $e) {
    echo "❌ Error sending email: " . $e->getMessage() . "\n";
    echo "Stack Trace:\n" . $e->getTraceAsString() . "\n";
}
