<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Notifikasi Aduan Baru</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            background-color: #f4f4f4;
            padding: 20px;
            border-radius: 5px;
        }
        .header {
            background-color: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .info-section {
            margin-bottom: 15px;
            border-left: 4px solid #dc3545;
            padding-left: 15px;
        }
        .label {
            font-weight: bold;
            color: #dc3545;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Notifikasi Aduan Keamanan Baru</h2>
            <p>Kode Laporan: <strong>{{ $reportCode }}</strong></p>
        </div>

        <div class="content">
            <h3>Detail Aduan</h3>

            <div class="info-section">
                <span class="label">Email Pelapor:</span> {{ $report->email_its }}
            </div>

            <div class="info-section">
                <span class="label">Peran di Kampus:</span> {{ $report->peran_kampus }}
            </div>

            <div class="info-section">
                <span class="label">Lokasi Kejadian:</span>
                {{ $report->lokasi_kejadian }}
                @if($report->lokasi_deskripsi)
                    <br><small>{{ $report->lokasi_deskripsi }}</small>
                @endif
            </div>

            <div class="info-section">
                <span class="label">Koordinat:</span>
                @if($report->latitude && $report->longitude)
                    Lat: {{ $report->latitude }}, Long: {{ $report->longitude }}
                @else
                    Tidak tersedia
                @endif
            </div>

            <div class="info-section">
                <span class="label">Pencahayaan:</span> {{ $report->pencahayaan }}
            </div>

            <div class="info-section">
                <span class="label">Kepadatan Area:</span> {{ $report->kepadatan }}
            </div>

            <div class="info-section">
                <span class="label">CCTV:</span> {{ $report->cctv }}
            </div>

            <div class="info-section">
                <span class="label">Petugas Keamanan:</span> {{ $report->petugas_keamanan }}
            </div>

            <div class="info-section">
                <span class="label">Waktu Rawan:</span> {{ $report->waktu_rawan }}
            </div>

            <div class="info-section">
                <span class="label">Skor Kenyamanan:</span> {{ $report->alasan_tidak_nyaman }}
            </div>

            <div class="info-section">
                <span class="label">Skor Kerawanan:</span> {{ $report->situasi_mencurigakan }}
            </div>

            @if($report->kronologi)
            <div class="info-section">
                <span class="label">Kronologi:</span>
                {{ $report->kronologi }}
            </div>
            @endif

            @if($report->kontak_pelapor)
            <div class="info-section">
                <span class="label">Kontak Pelapor:</span> {{ $report->kontak_pelapor }}
            </div>
            @endif

            <div class="info-section">
                <span class="label">Status:</span> 
                <span style="background-color: #ffc107; padding: 5px 10px; border-radius: 3px; color: black;">
                    {{ ucfirst($report->status) }}
                </span>
            </div>

            <div class="info-section">
                <span class="label">Waktu Pengiriman:</span> {{ $report->created_at->format('d-m-Y H:i:s') }}
            </div>
        </div>

        <div class="footer">
            <p>Email otomatis dari Sistem Informasi Keamanan & Kenyamanan Kampus ITS</p>
            <p>Jangan balas email ini, silakan bergabungi dengan panel admin untuk respons</p>
        </div>
    </div>

    <div class="confirmation">
        <h1>Terima kasih atas pengaduan Anda!</h1>
        <p>Halo,</p>
        <p>Terima kasih telah mengirimkan pengaduan melalui platform ITSafe. Berikut adalah detail pengaduan Anda:</p>
        <ul>
            <li><strong>Kode Laporan:</strong> {{ $reportCode }}</li>
            <li><strong>Lokasi Kejadian:</strong> {{ $reportDetails->lokasi_kejadian }}</li>
            <li><strong>Deskripsi Lokasi:</strong> {{ $reportDetails->lokasi_deskripsi }}</li>
            <li><strong>Skor Kenyamanan:</strong> {{ $reportDetails->alasan_tidak_nyaman }}</li>
            <li><strong>Skor Kerawanan:</strong> {{ $reportDetails->situasi_mencurigakan }}</li>
        </ul>
        <p>Kami akan segera menindaklanjuti laporan Anda. Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi kami melalui email ini.</p>
        <p>Salam hangat,</p>
        <p>Tim ITSafe</p>
    </div>
</body>
</html>
