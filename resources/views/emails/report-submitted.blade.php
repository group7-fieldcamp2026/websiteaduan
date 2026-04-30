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
        .section-title { margin: 18px 0 8px; font-size: 13px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.3px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .table td { padding: 10px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        .key { width: 38%; color: #6b7280; font-weight: 700; }
        .val { color: #111827; }
        .val-pre { white-space: pre-wrap; }
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
            <p>Kami sudah menerima laporan kamu. Berikut detail laporan yang kamu isi:</p>

            <div class="section-title">Identitas Pelapor</div>
            <table class="table" role="presentation" aria-label="Identitas pelapor">
                <tr>
                    <td class="key">Email</td>
                    <td class="val">{{ $report->email_its }}</td>
                </tr>
                <tr>
                    <td class="key">Peran di kampus</td>
                    <td class="val">{{ $report->peran_kampus }}</td>
                </tr>
                @if($report->jenis_kelamin)
                <tr>
                    <td class="key">Jenis kelamin</td>
                    <td class="val">{{ $report->jenis_kelamin }}</td>
                </tr>
                @endif
                @if($report->kontak_pelapor)
                <tr>
                    <td class="key">Kontak pelapor</td>
                    <td class="val">{{ $report->kontak_pelapor }}</td>
                </tr>
                @endif
            </table>

            <div class="section-title">Lokasi</div>
            <table class="table" role="presentation" aria-label="Lokasi">
                <tr>
                    <td class="key">Lokasi kejadian</td>
                    <td class="val">{{ $report->lokasi_kejadian }}</td>
                </tr>
                <tr>
                    <td class="key">Deskripsi lokasi</td>
                    <td class="val val-pre">{{ $report->lokasi_deskripsi }}</td>
                </tr>
                <tr>
                    <td class="key">Koordinat</td>
                    <td class="val">
                        @if($report->latitude && $report->longitude)
                            {{ $report->latitude }}, {{ $report->longitude }}
                        @else
                            Tidak tersedia
                        @endif
                    </td>
                </tr>
                <tr>
                    <td class="key">Foto lokasi</td>
                    <td class="val">{{ $report->foto_path ? 'Terlampir/tersimpan' : 'Tidak ada' }}</td>
                </tr>
            </table>

            <div class="section-title">Kondisi Area</div>
            <table class="table" role="presentation" aria-label="Kondisi area">
                <tr>
                    <td class="key">Pencahayaan</td>
                    <td class="val">{{ $report->pencahayaan }}</td>
                </tr>
                <tr>
                    <td class="key">Kepadatan area</td>
                    <td class="val">{{ $report->kepadatan }}</td>
                </tr>
                <tr>
                    <td class="key">CCTV</td>
                    <td class="val">{{ $report->cctv }}</td>
                </tr>
                <tr>
                    <td class="key">Petugas keamanan</td>
                    <td class="val">{{ $report->petugas_keamanan }}</td>
                </tr>
                @if($report->vegetasi)
                <tr>
                    <td class="key">Vegetasi</td>
                    <td class="val">{{ $report->vegetasi }}</td>
                </tr>
                @endif
                <tr>
                    <td class="key">Waktu rawan</td>
                    <td class="val">{{ $report->waktu_rawan }}</td>
                </tr>
                @if($report->hari_rawan)
                <tr>
                    <td class="key">Hari rawan</td>
                    <td class="val">{{ $report->hari_rawan }}</td>
                </tr>
                @endif
                @if($report->fungsi_ruang)
                <tr>
                    <td class="key">Fungsi ruang</td>
                    <td class="val">{{ $report->fungsi_ruang }}</td>
                </tr>
                @endif
            </table>

            <div class="section-title">Penilaian Subjektif</div>
            <table class="table" role="presentation" aria-label="Penilaian subjektif">
                <tr>
                    <td class="key">Kenyamanan saat sendiri</td>
                    <td class="val">{{ $comfortLabel }}</td>
                </tr>
                <tr>
                    <td class="key">Tingkat kerawanan area</td>
                    <td class="val">{{ $dangerLabel }}</td>
                </tr>
                @if($report->alasan_tidak_nyaman)
                <tr>
                    <td class="key">Alasan tidak nyaman</td>
                    <td class="val val-pre">{{ $report->alasan_tidak_nyaman }}</td>
                </tr>
                @endif
                @if($report->pernah_hindari)
                <tr>
                    <td class="key">Pernah menghindari area ini?</td>
                    <td class="val">{{ $report->pernah_hindari }}</td>
                </tr>
                @endif
                @if($report->orang_lain)
                <tr>
                    <td class="key">Ada orang lain di sekitar?</td>
                    <td class="val">{{ $report->orang_lain }}</td>
                </tr>
                @endif
                @if($report->situasi_mencurigakan)
                <tr>
                    <td class="key">Situasi mencurigakan</td>
                    <td class="val val-pre">{{ $report->situasi_mencurigakan }}</td>
                </tr>
                @endif
            </table>

            @if($report->kronologi)
            <div class="section-title">Kronologi</div>
            <table class="table" role="presentation" aria-label="Kronologi">
                <tr>
                    <td class="key">Cerita singkat</td>
                    <td class="val val-pre">{!! nl2br(e($report->kronologi)) !!}</td>
                </tr>
            </table>
            @endif

            <div class="section-title">Informasi Pengiriman</div>
            <table class="table" role="presentation" aria-label="Informasi pengiriman">
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
