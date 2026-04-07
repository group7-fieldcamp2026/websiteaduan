<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class Report extends Model
{
    protected $fillable = [
        'report_code',
        'email_its',
        'peran_kampus',
        'jenis_kelamin',
        'lokasi_kejadian',
        'lokasi_deskripsi',
        'latitude',
        'longitude',
        'foto_path',
        'pencahayaan',
        'kepadatan',
        'cctv',
        'petugas_keamanan',
        'vegetasi',
        'waktu_rawan',
        'hari_rawan',
        'skor_nyaman',
        'alasan_tidak_nyaman',
        'skor_rawan',
        'pernah_hindari',
        'orang_lain',
        'situasi_mencurigakan',
        'fungsi_ruang',
        'kronologi',
        'kontak_pelapor',
        'status',
    ];
}
 
