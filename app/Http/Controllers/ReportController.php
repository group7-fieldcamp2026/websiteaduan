<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReportController extends Controller
{
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
            'skor_nyaman'          => 'required|integer|min:1|max:5',
            'alasan_tidak_nyaman'  => 'nullable|string',
            'skor_rawan'           => 'required|integer|min:1|max:5',
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

        return response()->json([
            'success'     => true,
            'message'     => 'Laporan berhasil dikirim!',
            'report_code' => $report->report_code,
        ], 201);
    }

    // Ambil semua laporan (untuk peta)
    public function index()
    {
        $reports = Report::select(
            'id', 'peran_kampus', 'jenis_kelamin',
            'pencahayaan', 'kepadatan', 'cctv', 'petugas_keamanan',
            'vegetasi', 'waktu_rawan', 'hari_rawan', 'skor_nyaman', 'skor_rawan',
            'alasan_tidak_nyaman', 'pernah_hindari', 'orang_lain', 'situasi_mencurigakan',
            'fungsi_ruang', 'lokasi_kejadian', 'lokasi_deskripsi', 'latitude', 'longitude',
            'foto_path', 'status', 'created_at'
        )->whereNotNull('latitude')->whereNotNull('longitude')->get();

        return response()->json($reports);
    }

    // Ambil semua laporan (untuk admin)
    public function adminIndex()
    {
        $reports = Report::orderBy('created_at', 'desc')->get();
        return response()->json($reports);
    }

    // Cek status laporan by kode
    public function checkStatus($code)
    {
        $report = Report::where('report_code', $code)
            ->select('report_code', 'status', 'skor_rawan', 'waktu_rawan', 'created_at')
            ->first();

        if (!$report) {
            return response()->json(['success' => false, 'message' => 'Kode laporan tidak ditemukan.'], 404);
        }

        return response()->json(['success' => true, 'data' => $report]);
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
            'skor_nyaman'          => 'nullable|integer|min:1|max:5',
            'alasan_tidak_nyaman'  => 'nullable|string',
            'skor_rawan'           => 'nullable|integer|min:1|max:5',
            'pernah_hindari'       => 'nullable|string',
            'orang_lain'           => 'nullable|string',
            'situasi_mencurigakan' => 'nullable|string',
            'fungsi_ruang'         => 'nullable|string',
            'kronologi'            => 'nullable|string',
            'kontak_pelapor'       => 'nullable|string',
            'status'               => 'nullable|in:pending,in_review,resolved,verified,rejected',
        ]);

        if ($request->hasFile('foto_lokasi')) {
            $path = $request->file('foto_lokasi')->store('report-photos', 'public');
            $validated['foto_path'] = $path;
        }
        unset($validated['foto_lokasi']);

        if (array_key_exists('status', $validated)) {
            if ($validated['status'] === 'verified') {
                $validated['status'] = 'resolved';
            } elseif ($validated['status'] === 'rejected') {
                $validated['status'] = 'in_review';
            }
        }

        $report->fill($validated);
        $report->save();

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
}
