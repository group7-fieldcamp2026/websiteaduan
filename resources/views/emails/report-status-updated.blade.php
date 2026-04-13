<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Pembaruan Status Laporan ITSafe</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #374151; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #D56A6A; padding: 25px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; margin-top: 10px; margin-bottom: 20px; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-tinjauan { background-color: #dbeafe; color: #1e40af; }
        .status-terverifikasi { background-color: #d1fae5; color: #065f46; }
        .status-ditolak { background-color: #fee2e2; color: #991b1b; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .details-table th, .details-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .details-table th { width: 35%; color: #6b7280; font-size: 14px; }
        .details-table td { font-weight: 500; font-size: 15px; }
        .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Pembaruan Status ITSafe</h1>
        </div>
        <div class="content">
            <p>Halo,</p>
            <p>Ada pembaruan mengenai laporan kondisi keamanan/kenyamanan yang Anda ajukan di area kampus ITS.</p>
            
            @php
                $statusClass = 'status-pending';
                if ($report->status == 'Dalam Tinjauan') $statusClass = 'status-tinjauan';
                if ($report->status == 'Terverifikasi') $statusClass = 'status-terverifikasi';
                if ($report->status == 'Ditolak') $statusClass = 'status-ditolak';
            @endphp
            
            <div>Status Laporan Anda saat ini:</div>
            <div class="status-badge {{ $statusClass }}">
                {{ mb_strtoupper($report->status) }}
            </div>

            <table class="details-table">
                <tr>
                    <th>Nomor Laporan</th>
                    <td>#{{ $report->id }}</td>
                </tr>
                <tr>
                    <th>Lokasi Kejadian</th>
                    <td>{{ $report->lokasi_kejadian }}</td>
                </tr>
                <tr>
                    <th>Kategori Kerawanan</th>
                    <td>Skor: {{ $report->skor_rawan }}</td>
                </tr>
                <tr>
                    <th>Diperbarui Pada</th>
                    <td>{{ \Carbon\Carbon::parse($report->updated_at)->format('d M Y H:i') }} WIB</td>
                </tr>
            </table>

            @if($report->status == 'Ditolak/Tidak Valid')
            <div style="margin-top: 30px; padding: 15px; border-left: 4px solid #991b1b; background-color: #fee2e2; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
                <strong>Perhatian:</strong> Laporan yang Anda berikan terbukti tidak valid atau menyalahi aturan. Dengan berat hati, pihak tim admin telah menghapus laporan tersebut secara permanen dari sistem kami.
            </div>
            @endif

            <p style="margin-top: 30px; font-size: 14px; line-height: 1.5;">
                Tim Satgas PPKS / Keamanan ITS akan menindaklanjuti data ini sesuai urgensinya. Terima kasih telah berpartisipasi menjaga lingkungan kampus tercinta agar tetap aman dan nyaman.
            </p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} ITSafe x Satgas PPK ITS.<br>
            Email otomatis, mohon tidak membalas email ini.
        </div>
    </div>
</body>
</html>
