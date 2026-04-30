<?php

namespace App\Http\Controllers;

use App\Mail\ReportSubmittedNotification;
use App\Mail\ReportAdminNotification;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    private function mapReportStatusForHistory(?string $status): string
    {
        return match ($status) {
            'resolved', 'verified' => 'valid',
            'in_review' => 'review',
            'rejected' => 'rejected',
            default => $status ?: 'pending',
        };
    }

    private function buildMailErrorHint(string $errorMessage): string
    {
        $msg = strtolower($errorMessage);

        if (str_contains($msg, 'timed out') || str_contains($msg, 'unable to connect') || str_contains($msg, 'connection could not be established')) {
            return 'Koneksi ke SMTP gagal. Cek firewall/hosting, atau coba MAIL_PORT=465 dan MAIL_ENCRYPTION=ssl.';
        }

        if (str_contains($msg, 'authentication') || str_contains($msg, 'username') || str_contains($msg, 'password') || str_contains($msg, '535')) {
            return 'Autentikasi SMTP gagal. Periksa MAIL_USERNAME dan App Password Gmail.';
        }

        if (str_contains($msg, 'certificate') || str_contains($msg, 'tls') || str_contains($msg, 'ssl')) {
            return 'Masalah TLS/SSL. Coba kombinasi port/enkripsi yang sesuai (587+tls atau 465+ssl).';
        }

        return 'Lihat storage/logs/laravel.log untuk detail error SMTP.';
    }

    private function readEnvValueFromFile(string $key): ?string
    {
        $envPath = base_path('.env');
        if (!is_readable($envPath)) {
            return null;
        }

        $contents = file_get_contents($envPath);
        if ($contents === false) {
            return null;
        }

        $pattern = '/^' . preg_quote($key, '/') . '=(.*)$/m';
        if (!preg_match($pattern, $contents, $matches)) {
            return null;
        }

        $value = trim((string) ($matches[1] ?? ''));
        if ($value === '' || strtolower($value) === 'null') {
            return null;
        }

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        return $value;
    }

    private function applySmtpRuntimeFallback(): array
    {
        $smtpHost = (string) config('mail.mailers.smtp.host', '');
        $smtpPort = (int) config('mail.mailers.smtp.port', 0);

        $isDefaultSmtp =
            in_array($smtpHost, ['', '127.0.0.1', 'localhost'], true) ||
            $smtpPort === 0 ||
            $smtpPort === 2525;

        if (!$isDefaultSmtp) {
            return [
                'host' => $smtpHost,
                'port' => $smtpPort,
                'source' => 'config',
            ];
        }

        $envHost = $this->readEnvValueFromFile('MAIL_HOST');
        $envPort = $this->readEnvValueFromFile('MAIL_PORT');
        $envUser = $this->readEnvValueFromFile('MAIL_USERNAME');
        $envPass = $this->readEnvValueFromFile('MAIL_PASSWORD');
        $envEncryption = strtolower((string) ($this->readEnvValueFromFile('MAIL_ENCRYPTION') ?? ''));
        $envFromAddress = $this->readEnvValueFromFile('MAIL_FROM_ADDRESS');
        $envFromName = $this->readEnvValueFromFile('MAIL_FROM_NAME');
        $envNotificationTo = $this->readEnvValueFromFile('MAIL_NOTIFICATION_TO');

        $resolvedHost = $envHost ?: $smtpHost;
        $resolvedPort = is_numeric($envPort ?? null) ? (int) $envPort : $smtpPort;
        $resolvedUser = $envUser ?: (string) config('mail.mailers.smtp.username', '');
        $resolvedPass = $envPass ?: (string) config('mail.mailers.smtp.password', '');
        $resolvedEncryption = $envEncryption ?: 'tls';
        $resolvedFromAddress = $envFromAddress ?: (string) config('mail.from.address', '');
        $resolvedFromName = $envFromName ?: (string) config('mail.from.name', '');
        $resolvedNotificationTo = $envNotificationTo ?: (string) config('mail.notification_to', '');
        $source = $envHost ? 'env_file' : 'config_default';

        // Absolute fallback supaya tetap bisa jalan saat server masih default localhost:2525.
        $stillDefault =
            in_array($resolvedHost, ['', '127.0.0.1', 'localhost'], true) ||
            $resolvedPort === 0 ||
            $resolvedPort === 2525;

        if ($stillDefault) {
            $resolvedHost = 'smtp.gmail.com';
            $resolvedPort = 587;
            $resolvedEncryption = 'tls';
            if ($resolvedUser === '') {
                $resolvedUser = 'kelompok7fieldcamp2026@gmail.com';
            }
            if ($resolvedFromAddress === '') {
                $resolvedFromAddress = $resolvedUser;
            }
            if ($resolvedFromName === '') {
                $resolvedFromName = 'ITS Safe - Sistem Keamanan & Kenyamanan';
            }
            if ($resolvedNotificationTo === '') {
                $resolvedNotificationTo = 'kelompok7fieldcamp2026@gmail.com';
            }
            $source = 'code_fallback';
        }

        $smtpScheme = $resolvedEncryption === 'ssl' ? 'smtps' : 'smtp';

        config([
            'mail.mailers.smtp.host' => $resolvedHost,
            'mail.mailers.smtp.port' => $resolvedPort,
            'mail.mailers.smtp.username' => $resolvedUser,
            'mail.mailers.smtp.password' => $resolvedPass,
            'mail.mailers.smtp.scheme' => $smtpScheme,
        ]);

        config([
            'mail.from.address' => $resolvedFromAddress ?: config('mail.from.address'),
            'mail.from.name' => $resolvedFromName ?: config('mail.from.name'),
            'mail.notification_to' => $resolvedNotificationTo ?: config('mail.notification_to'),
        ]);

        return [
            'host' => (string) config('mail.mailers.smtp.host', ''),
            'port' => (int) config('mail.mailers.smtp.port', 0),
            'source' => $source,
        ];
    }

    // Uji koneksi SMTP + notifikasi email tanpa membuat laporan baru
    public function mailHealthCheck()
    {
        $smtpRuntime = $this->applySmtpRuntimeFallback();
        $mailTo = config('mail.notification_to', 'kelompok7fieldcamp2026@gmail.com');
        $checkedAt = now();
        $smtpHost = (string) ($smtpRuntime['host'] ?? config('mail.mailers.smtp.host', ''));
        $smtpPort = (int) ($smtpRuntime['port'] ?? config('mail.mailers.smtp.port', 0));
        $smtpSource = (string) ($smtpRuntime['source'] ?? 'config');
        $smtpMailer = (string) config('mail.default', 'unknown');
        $smtpPass = (string) config('mail.mailers.smtp.password', '');

        // Strong signal that server .env / config cache is not loading SMTP settings.
        if (in_array($smtpHost, ['127.0.0.1', 'localhost'], true) && $smtpPort === 2525) {
            return response()->json([
                'success' => false,
                'message' => 'Konfigurasi SMTP server belum terbaca (masih default localhost:2525).',
                'hint' => 'Pastikan .env di server terisi MAIL_HOST/MAIL_PORT, lalu jalankan php artisan optimize:clear.',
                'smtp_host' => $smtpHost,
                'smtp_port' => $smtpPort,
                'smtp_source' => $smtpSource,
                'mailer' => $smtpMailer,
            ], 500);
        }

        if (trim($smtpPass) === '') {
            return response()->json([
                'success' => false,
                'message' => 'MAIL_PASSWORD belum terisi untuk SMTP.',
                'hint' => 'Isi App Password Gmail (16 karakter) di .env server.',
                'smtp_host' => $smtpHost,
                'smtp_port' => $smtpPort,
                'smtp_source' => $smtpSource,
                'mailer' => $smtpMailer,
            ], 500);
        }

        try {
            $sentMessage = Mail::mailer('smtp')->raw(
                "ITSafe SMTP health-check berhasil pada {$checkedAt->format('Y-m-d H:i:s')} WIB.",
                function ($message) use ($mailTo, $checkedAt) {
                    $message
                        ->to($mailTo)
                        ->subject('ITSafe SMTP Health Check - ' . $checkedAt->format('Y-m-d H:i:s'));
                }
            );

            return response()->json([
                'success' => true,
                'message' => 'Health-check email berhasil dikirim.',
                'to' => $mailTo,
                'mailer' => 'smtp',
                'smtp_host' => $smtpHost,
                'smtp_port' => $smtpPort,
                'smtp_source' => $smtpSource,
                'message_id' => $sentMessage?->getMessageId(),
                'checked_at' => $checkedAt->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            $hint = $this->buildMailErrorHint($e->getMessage());

            Log::error('SMTP health-check failed', [
                'to' => $mailTo,
                'error' => $e->getMessage(),
                'hint' => $hint,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Health-check email gagal dikirim.',
                'error' => $e->getMessage(),
                'hint' => $hint,
                'smtp_host' => $smtpHost,
                'smtp_port' => $smtpPort,
                'smtp_source' => $smtpSource,
            ], 500);
        }
    }

    // Terima laporan dari form
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email_its'            => 'required|email',
            'peran_kampus'         => 'required|in:Mahasiswa,Dosen,Tenaga Kependidikan,Lainnya (non-ITS)',
            'jenis_kelamin'        => 'nullable|in:Laki-laki,Perempuan,Tidak ingin menyebutkan',
            'lokasi_kejadian'      => 'required|string',
            'lokasi_deskripsi'     => 'required|string|max:1000',
            'latitude'             => 'nullable|numeric',
            'longitude'            => 'nullable|numeric',
            'foto_lokasi'          => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'pencahayaan'          => 'required|in:Terang,Remang-remang,Gelap',
            'kepadatan'            => 'required|in:Ramai,Cukup ramai,Sepi,Sangat sepi',
            'cctv'                 => 'required|in:Ada dan terlihat jelas,Ada tapi tidak yakin aktif,Tidak ada,Tidak tahu',
            'petugas_keamanan'     => 'required|in:Sering ada,Kadang ada,Jarang ada,Tidak pernah ada',
            'vegetasi'             => 'nullable|string',
            'waktu_rawan'          => 'required|in:Pagi,Siang,Malam,Sepanjang Hari',
            'hari_rawan'           => 'nullable|string',
            'skor_nyaman'          => 'required|integer|min:1|max:3',
            'alasan_tidak_nyaman'  => 'nullable|string',
            'skor_rawan'           => 'required|integer|min:1|max:3',
            'pernah_hindari'       => 'nullable|string',
            'orang_lain'           => 'nullable|string',
            'situasi_mencurigakan' => 'nullable|string',
            'fungsi_ruang'         => 'nullable|string',
            'kronologi'            => 'nullable|string',
            'kontak_pelapor'       => 'nullable|string',
        ]);

        if ($request->hasFile('foto_lokasi')) {
            $path = $request->file('foto_lokasi')->store('report-photos', 'public');
            $validated['foto_path'] = $path;
        }
        unset($validated['foto_lokasi']);

        // Generate kode unik laporan
        $validated['report_code'] = 'ITS-' . strtoupper(Str::random(8));
        $validated['status'] = 'pending';

        $report = Report::create($validated);

        $smtpRuntime = $this->applySmtpRuntimeFallback();
        $mailSent = false;
        $mailTo = config('mail.notification_to', 'kelompok7fieldcamp2026@gmail.com');

        // Kirim email notifikasi ke alamat admin (configurable via .env)
        try {
            $sentMessage = Mail::mailer('smtp')->to($mailTo)->send(
                new ReportAdminNotification($report)
            );
            $mailSent = $sentMessage !== null;
        } catch (\Throwable $e) {
            // Log detail agar mudah tracing di hosting production
            Log::error('Failed to send report notification email', [
                'report_id' => $report->id,
                'report_code' => $report->report_code,
                'to' => $mailTo,
                'error' => $e->getMessage(),
                'smtp_host' => $smtpRuntime['host'] ?? null,
                'smtp_port' => $smtpRuntime['port'] ?? null,
                'smtp_source' => $smtpRuntime['source'] ?? null,
            ]);
        }

        // Tambahkan log untuk mencatat email yang tidak valid
        if (!filter_var($validated['email_its'], FILTER_VALIDATE_EMAIL)) {
            Log::error('Email tidak valid', ['email' => $validated['email_its']]);
            return response()->json([
                'success' => false,
                'message' => 'Email yang dimasukkan tidak valid.',
            ], 400);
        }

        // Tambahkan pengiriman email ke pelapor
        try {
            Mail::mailer('smtp')->to($validated['email_its'])->send(
                new ReportSubmittedNotification($report)
            );
        } catch (\Throwable $e) {
            Log::error('Gagal mengirim email ke pelapor', [
                'email' => $validated['email_its'],
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success'     => true,
            'message'     => $mailSent
                ? 'Laporan berhasil dikirim!'
                : 'Laporan tersimpan, tetapi notifikasi email belum terkirim.',
            'report_code' => $report->report_code,
            'mail_sent'   => $mailSent,
        ], 201);
    }

    // Ambil semua laporan (untuk peta publik) - hanya yang sudah terverifikasi
    public function index()
    {
        $reports = Report::select(
            'id', 'peran_kampus', 'jenis_kelamin',
            'pencahayaan', 'kepadatan', 'cctv', 'petugas_keamanan',
            'vegetasi', 'waktu_rawan', 'hari_rawan', 'skor_nyaman', 'skor_rawan',
            'alasan_tidak_nyaman', 'pernah_hindari', 'orang_lain', 'situasi_mencurigakan',
            'fungsi_ruang', 'kronologi', 'lokasi_kejadian', 'lokasi_deskripsi', 'latitude', 'longitude',
            'foto_path', 'status', 'created_at'
        )->whereNotNull('latitude')
          ->whereNotNull('longitude')
          ->where('status', 'resolved')
          ->get();

        return response()->json($reports);
    }

    // Ambil semua laporan (untuk admin)
    public function adminIndex()
    {
        $reports = Report::orderBy('created_at', 'desc')->get();
        return response()->json($reports);
    }

    // Ambil semua laporan berdasarkan email pelapor (untuk fitur History Laporan)
    public function byEmail(Request $request)
    {
        $email = trim((string) $request->query('email', ''));
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak valid.',
            ], 400);
        }

        $reports = Report::query()
            ->where('email_its', $email)
            ->orderByDesc('created_at')
            ->get(['report_code', 'status', 'lokasi_kejadian', 'created_at']);

        return response()->json([
            'success' => true,
            'reports' => $reports->map(function (Report $report) {
                return [
                    'report_code' => $report->report_code,
                    'status' => $this->mapReportStatusForHistory($report->status),
                    'lokasi' => $report->lokasi_kejadian,
                    'created_at' => $report->created_at,
                ];
            }),
        ]);
    }

    // Cek status laporan by kode
    public function checkStatus($code)
    {
        $report = Report::where('report_code', $code)
            ->select('report_code', 'status', 'skor_rawan', 'waktu_rawan', 'lokasi_kejadian', 'created_at')
            ->first();

        if (!$report) {
            return response()->json(['success' => false, 'message' => 'Kode laporan tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            // field top-level untuk frontend (history modal)
            'status' => $this->mapReportStatusForHistory($report->status),
            'lokasi' => $report->lokasi_kejadian,
            'createdAt' => $report->created_at,
            // field legacy
            'data' => $report,
        ]);
    }

    // Statistik untuk hero section
    public function stats()
    {
        $total = Report::count();
        $bulanIni = Report::whereMonth('created_at', now()->month)->count();
        $terverifikasi = Report::where('status', 'resolved')->count();

        return response()->json([
            'total'        => $total,
            'bulan_ini'    => $bulanIni,
            'terverifikasi'=> $terverifikasi,
        ]);
    }

    // Update laporan (admin)
    public function update(Request $request, $id)
    {
        $report = Report::find($id);
        if (!$report) {
            return response()->json(['success' => false, 'message' => 'Laporan tidak ditemukan.'], 404);
        }

        // Dapatkan status yang diminta sebelum validasi/conversion
        $requestedStatus = $request->input('status');

        $validated = $request->validate([
            'email_its'            => 'nullable|email',
            'peran_kampus'         => 'nullable|in:Mahasiswa,Dosen,Tenaga Kependidikan,Lainnya (non-ITS)',
            'jenis_kelamin'        => 'nullable|in:Laki-laki,Perempuan,Tidak ingin menyebutkan',
            'lokasi_kejadian'      => 'nullable|string',
            'lokasi_deskripsi'     => 'nullable|string|max:1000',
            'latitude'             => 'nullable|numeric',
            'longitude'            => 'nullable|numeric',
            'foto_lokasi'          => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'pencahayaan'          => 'nullable|in:Terang,Remang-remang,Gelap',
            'kepadatan'            => 'nullable|in:Ramai,Cukup ramai,Sepi,Sangat sepi',
            'cctv'                 => 'nullable|in:Ada dan terlihat jelas,Ada tapi tidak yakin aktif,Tidak ada,Tidak tahu',
            'petugas_keamanan'     => 'nullable|in:Sering ada,Kadang ada,Jarang ada,Tidak pernah ada',
            'vegetasi'             => 'nullable|string',
            'waktu_rawan'          => 'nullable|in:Pagi,Siang,Malam,Sepanjang Hari',
            'hari_rawan'           => 'nullable|string',
            'skor_nyaman'          => 'nullable|integer|min:1|max:3',
            'alasan_tidak_nyaman'  => 'nullable|string',
            'skor_rawan'           => 'nullable|integer|min:1|max:3',
            'pernah_hindari'       => 'nullable|string',
            'orang_lain'           => 'nullable|string',
            'situasi_mencurigakan' => 'nullable|string',
            'fungsi_ruang'         => 'nullable|string',
            'kronologi'            => 'nullable|string',
            'kontak_pelapor'       => 'nullable|string',
            'status'               => 'nullable|in:pending,in_review,resolved,verified,rejected',
        ]);

        // Handle penolakan (data tidak valid), kirim email, lalu hapus
        if ($requestedStatus === 'rejected') {
            $readableStatus = 'Ditolak/Tidak Valid';
            $mailReport = clone $report;
            $mailReport->status = $readableStatus;
            try {
                if ($report->email_its) {
                    \Illuminate\Support\Facades\Mail::to($report->email_its)->send(new \App\Mail\ReportStatusUpdated($mailReport));
                }
            } catch (\Exception $e) {
                Log::error('Failed to send rejection email: ' . $e->getMessage());
            }
            $report->delete();
            return response()->json(['success' => true, 'message' => 'Laporan ditolak dan dihapus.']);
        }

        // Konversi 'verified' -> 'resolved' untuk kompatibilitas DB
        if (isset($validated['status']) && $validated['status'] === 'verified') {
            $validated['status'] = 'resolved';
        }

        if ($request->hasFile('foto_lokasi')) {
            $path = $request->file('foto_lokasi')->store('report-photos', 'public');
            $validated['foto_path'] = $path;
        }
        unset($validated['foto_lokasi']);

        if ($request->has('foto_path_action')) {
            $action = $request->input('foto_path_action');
            if ($action === 'hide' && $report->foto_path && !str_starts_with($report->foto_path, 'HIDDEN_')) {
                $validated['foto_path'] = 'HIDDEN_' . $report->foto_path;
            } elseif ($action === 'unhide' && $report->foto_path && str_starts_with($report->foto_path, 'HIDDEN_')) {
                $validated['foto_path'] = str_replace('HIDDEN_', '', $report->foto_path);
            }
        }

        $oldStatus = $report->getOriginal('status');
        $report->fill($validated);
        $report->save();

        if (array_key_exists('status', $validated) && $validated['status'] !== $oldStatus) {
            $statusMapping = [
                'pending' => 'Pending',
                'in_review' => 'Dalam Tinjauan',
                'resolved' => 'Terverifikasi',
            ];
            $readableStatus = $statusMapping[$validated['status']] ?? $validated['status'];

            $mailReport = clone $report;
            $mailReport->status = $readableStatus;

            try {
                if ($report->email_its) {
                    \Illuminate\Support\Facades\Mail::to($report->email_its)->send(new \App\Mail\ReportStatusUpdated($mailReport));
                }
            } catch (\Exception $e) {
                Log::error('Failed to send status update email: ' . $e->getMessage());
            }
        }

        return response()->json(['success' => true, 'data' => $report]);
    }

    // Hapus laporan (admin)
    public function destroy($id)
    {
        $report = Report::find($id);
        if (!$report) {
            return response()->json(['success' => false, 'message' => 'Laporan tidak ditemukan.'], 404);
        }

        $report->delete();

        return response()->json(['success' => true]);
    }

    // Sajikan foto laporan via Laravel (fallback bila /storage diblokir hosting)
    public function showPhoto(string $path)
    {
        $normalized = ltrim(str_replace('\\', '/', $path), '/');

        if (
            $normalized === '' ||
            str_contains($normalized, '..') ||
            !str_starts_with($normalized, 'report-photos/')
        ) {
            abort(404);
        }

        $disk = Storage::disk('public');

        if (!$disk->exists($normalized)) {
            abort(404);
        }

        return response()->file(
            $disk->path($normalized),
            [
                'Content-Type' => $disk->mimeType($normalized) ?: 'application/octet-stream',
                'Cache-Control' => 'public, max-age=86400',
            ]
        );
    }
}
