<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Terimakasih Telah Melapor ke ITSafe</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; background: #f6f7fb; color: #1f2937; padding: 20px; }
        .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 20px rgba(17, 24, 39, 0.08); }
        .header { background: #111827; color: #ffffff; padding: 22px 24px; }
        .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
        .header p { margin: 0; opacity: 0.9; }
        .content { padding: 22px 24px; }
        .badge { display: inline-block; background: #eef2ff; color: #3730a3; padding: 6px 10px; border-radius: 999px; font-weight: 700; letter-spacing: 0.2px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .table td { padding: 10px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        .key { width: 38%; color: #6b7280; font-weight: 700; }
        .val { color: #111827; }
        .muted { color: #6b7280; font-size: 12px; }
        .footer { background: #f3f4f6; padding: 14px 24px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    @php
        $comfortMap = [1 => 'Tidak Nyaman', 2 => 'Kurang Nyaman', 3 => 'Nyaman'];
        $dangerMap = [1 => 'Rendah', 2 => 'Sedang', 3 => 'Tinggi'];

        $comfortLabel = $comfortMap[(int) $report->skor_nyaman] ?? (string) $report->skor_nyaman;
        $dangerLabel = $dangerMap[(int) $report->skor_rawan] ?? (string) $report->skor_rawan;
    @endphp

    <div class="container">
        <div class="header">
            <h1>Terima kasih telah melapor ke ITSafe</h1>
            <p>Kode laporan kamu: <span class="badge">{{ $reportCode ?? $report->report_code }}</span></p>
        </div>

        <div class="content">
            <p>Halo,</p>
            <p>Kami sudah menerima laporan kamu. Berikut ringkasan laporan yang tercatat:</p>

            <table class="table" role="presentation" aria-label="Ringkasan laporan">
                <tr>
                    <td class="key">Lokasi kejadian</td>
                    <td class="val">{{ $report->lokasi_kejadian }}</td>
                </tr>
                <tr>
                    <td class="key">Deskripsi lokasi</td>
                    <td class="val">{{ $report->lokasi_deskripsi }}</td>
                </tr>
                <tr>
                    <td class="key">Kenyamanan saat sendiri</td>
                    <td class="val">{{ $comfortLabel }}</td>
                </tr>
                <tr>
                    <td class="key">Tingkat kerawanan area</td>
                    <td class="val">{{ $dangerLabel }}</td>
                </tr>
                <tr>
                    <td class="key">Waktu rawan</td>
                    <td class="val">{{ $report->waktu_rawan }}</td>
                </tr>
                <tr>
                    <td class="key">Dikirim pada</td>
                    <td class="val">{{ $report->created_at ? $report->created_at->format('d M Y H:i') . ' WIB' : '-' }}</td>
                </tr>
            </table>

            <p style="margin-top:16px;" class="muted">Simpan kode laporan untuk mengecek status validasi melalui menu <strong>History Laporan</strong> di ITSafe.</p>
        </div>

        <div class="footer">
            Email otomatis dari Sistem Informasi Keamanan &amp; Kenyamanan Kampus ITS.
        </div>
    </div>
</body>
</html>
