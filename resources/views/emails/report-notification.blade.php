<!DOCTYPE html>
<html>
<head>
    <title>Notifikasi Aduan Baru</title>
</head>
<body>
    <h1>Ada Aduan Baru di ITSafe</h1>
    <p>Halo Admin,</p>
    <p>Berikut adalah detail aduan yang baru saja diterima:</p>
    <ul>
        <li><strong>Kode Laporan:</strong> {{ $reportCode }}</li>
        <li><strong>Lokasi Kejadian:</strong> {{ $reportDetails->lokasi_kejadian }}</li>
        <li><strong>Deskripsi Lokasi:</strong> {{ $reportDetails->lokasi_deskripsi }}</li>
        <li><strong>Skor Kenyamanan:</strong> {{ $reportDetails->alasan_tidak_nyaman }}</li>
        <li><strong>Skor Kerawanan:</strong> {{ $reportDetails->situasi_mencurigakan }}</li>
    </ul>
    <p>Silakan login ke panel admin untuk meninjau dan menindaklanjuti laporan ini.</p>
    <p>Salam,</p>
    <p>Tim ITSafe</p>
</body>
</html>