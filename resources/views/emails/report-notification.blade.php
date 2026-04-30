<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Notifikasi Aduan Baru</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; background: #f6f7fb; color: #111827; padding: 20px; }
        .container { max-width: 760px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 20px rgba(17, 24, 39, 0.08); }
        .header { background: #dc2626; color: #ffffff; padding: 20px 24px; }
        .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; }
        .header p { margin: 0; opacity: 0.95; }
        .content { padding: 18px 24px; }
        .badge { display: inline-block; background: rgba(255, 255, 255, 0.18); padding: 6px 10px; border-radius: 999px; font-weight: 800; }
        .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .table td { padding: 9px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        .key { width: 34%; color: #6b7280; font-weight: 700; }
        .val { color: #111827; }
        .section-title { margin: 14px 0 8px; font-size: 14px; font-weight: 900; color: #374151; text-transform: uppercase; letter-spacing: 0.3px; }
        .footer { background: #f3f4f6; padding: 12px 24px; font-size: 12px; color: #6b7280; text-align: center; }
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
            <h1>Notifikasi Aduan Baru</h1>
            <p>Kode laporan: <span class="badge">{{ $reportCode ?? $report->report_code }}</span></p>
        </div>

        <div class="content">
            <p>Halo Admin,</p>
            <p>Berikut detail aduan yang baru saja masuk:</p>

            <div class="section-title">Identitas & Lokasi</div>
            <table class="table" role="presentation" aria-label="Identitas & Lokasi">
                <tr>
                    <td class="key">Email pelapor</td>
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
                <tr>
                    <td class="key">Lokasi kejadian</td>
                    <td class="val">{{ $report->lokasi_kejadian }}</td>
                </tr>
                <tr>
                    <td class="key">Deskripsi lokasi</td>
                    <td class="val">{{ $report->lokasi_deskripsi }}</td>
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
            </table>

            <div class="section-title">Kondisi & Penilaian</div>
            <table class="table" role="presentation" aria-label="Kondisi & Penilaian">
                <tr>
                    <td class="key">Pencahayaan</td>
                    <td class="val">{{ $report->pencahayaan }}</td>
                </tr>
                <tr>
                    <td class="key">Kepadatan</td>
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
                <tr>
                    <td class="key">Skor kenyamanan</td>
                    <td class="val">{{ (int) $report->skor_nyaman }}/3 ({{ $comfortLabel }})</td>
                </tr>
                <tr>
                    <td class="key">Skor kerawanan</td>
                    <td class="val">{{ (int) $report->skor_rawan }}/3 ({{ $dangerLabel }})</td>
                </tr>
                @if($report->alasan_tidak_nyaman)
                <tr>
                    <td class="key">Alasan tidak nyaman</td>
                    <td class="val">{{ $report->alasan_tidak_nyaman }}</td>
                </tr>
                @endif
                @if($report->situasi_mencurigakan)
                <tr>
                    <td class="key">Situasi mencurigakan</td>
                    <td class="val">{{ $report->situasi_mencurigakan }}</td>
                </tr>
                @endif
                @if($report->kronologi)
                <tr>
                    <td class="key">Kronologi</td>
                    <td class="val">{{ $report->kronologi }}</td>
                </tr>
                @endif
                @if($report->kontak_pelapor)
                <tr>
                    <td class="key">Kontak pelapor</td>
                    <td class="val">{{ $report->kontak_pelapor }}</td>
                </tr>
                @endif
                <tr>
                    <td class="key">Status</td>
                    <td class="val">{{ $report->status }}</td>
                </tr>
                <tr>
                    <td class="key">Waktu pengiriman</td>
                    <td class="val">{{ $report->created_at ? $report->created_at->format('d M Y H:i') . ' WIB' : '-' }}</td>
                </tr>
            </table>
        </div>

        <div class="footer">
            Email otomatis dari Sistem Informasi Keamanan &amp; Kenyamanan Kampus ITS.
        </div>
    </div>
</body>
</html>
