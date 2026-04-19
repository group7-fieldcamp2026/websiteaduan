/* ============================================================
   ITSafe - script.js
   Laravel API + Leaflet (OSM / Satelit / Dark / Topo)
   Heatmap - Titik - Cluster - Basemap switcher
============================================================ */

// --- API CONFIG ---------------------------------------------
const API_BASE = `${window.location.origin}/api`;
const REALTIME_INTERVAL = 15000;

// --- STATE --------------------------------------------------
let reports = [];   // diisi dari API
let realtimeTimer = null;
let isRealtimeRefreshing = false;
let activeLayer = 'semua';
let visHeatmap = true;
let visPoint = false;
let visCluster = false;
let visFixedPin = true;   // toggle pin QR
let visJurusan = true;   // toggle pin fakultas/jurusan

// --- LEAFLET INSTANCES --------------------------------------
let leafletMap = null;
let pickerMap = null;
let pickerMarker = null;
let baseTile = null;
let heatLayer = null;
let pointLayer = null;
let clusterLayer = null;
let fixedLocationLayerMain = null;
let fixedLocationLayerPicker = null;
let boundaryLayerMain = null;
let boundaryLayerPicker = null;
let boundaryGeoJSON = null;
let boundaryPolygons = null;
let currentBm = 'osm';

const BOUNDARY_SRC_CRS = 'EPSG:32749';
const BOUNDARY_SRC_DEF = '+proj=utm +zone=49 +south +datum=WGS84 +units=m +no_defs';
const BOUNDARY_DST_CRS = 'EPSG:4326';
const BOUNDARY_DST_DEF = '+proj=longlat +datum=WGS84 +no_defs';
const BOUNDARY_ZIP_B64 = 'UEsDBBQAAAAIAGJzbFwBUcDk+QQAAJwMAAAQAAAAQmF0YXNXaWxheWFoLnNocO3WaVBTVxQH8EAUbbWxo1NLK6BUgmiqRIZKALcnSsNiAoJIUQgMlLoxhGIDdoBhEctmDUQGhiLSKiqiLSoVRIxxgULUsYKCFlmkbAIK4sIm0v8JOjKOH/pd7peXX17eyb3nnnMTFmveh6x3Dh1RO5vFmoZXcbEeitNfcxmZ2OCaQbwPs/JQw/KnLlxmqjbvqlaCD/P2kyOa0T3y+oq3tBBP9//EwgdZkldxIp3thu87vPns62eveTqkfAHLI4YyLsI2ep1+8+BGJSfzMryxqqTFBM6WLjtWBxuljSxdAt+JCj5cDcf5eioFsDt/QW4tLF8cErQcFjq9KOqHa8y7TRzhzfVBal0hl1lglXLCFZ6T/327GOY7Htb2ovtxvvon4ZrpvVu20X0PP+t2ODli6IUUVu1Q3Km34zIcJd86jOKzQ/M+t+cyUsmkgl/gvz0dJhvAbUkm1w/AuqqNK3XsNetRHxl9XjCM5zd0mbaQ2yeYOz+Gnfak9ebCkcIL+gNw+93jojzYe/5VfjXc90OjqhguuskyqIF9XNdZnoNDHxgH3YY3zWEKyY227NBb8GDEVlYJPNmNs/YmXK/9gZCsa1q3uhKWIO55uh+Vyu6Co1Jt9pDn+D7KMMR8hzYFSJQ033B9dyN4b3Nv6QXKf/9ifx6MPeZcou+botiyGpYFzUq8AptYpeTNhP0874nqRtebPgvuSD0lbISP3rg9cx7cpyORNlE8r/mdFvCPS/JWNcPljyp87eErJxelt8D8kIW/boT1OpuyWmm/3boCg2Emuim5bTTfwmp7zf5lPaB8ma2Xe6C+puecP9BJ+Zli1D4EV7Lq8x/Cggbx2nBHTb4Cu2Gnm8l6vLVc5vTUoEuPaX7eruvK4BiV+voT+v7W33OOibjMJ/oVvD6an0x54GMxl2ldcUjST/uVdDYxEGYlRygGKP7S82atsOc9W58hOF0+LWObE5dxtyyofEH7ZxCblwgn/NwsGyYX7fE/CG/jPU98SfnQKik9B1fIlN+wEjTzDbgNq82urKFeilSpL47AXsV2HuQ75t3pXGfU/9PaNLI0akKOCH663S2G7H3P1uZP5ze9uNm6wbQQ3h9pzB+hesjyqqiAPZ6dVdJ8VJ8az9BZx2XMfyuYS/PvEaw5Ygg/KPzDYhCWlr7stYbDV3zlSC6y6G9yg3cYpbXQ+iOHrJxk8NEN6rBnlD/D2fuK4RhTR0faz/7s76oWuWjih6tf9YscDuvNX3VmjO8u28k/NcanO4LF+dQvqaempsOrvFsyqT+E5ZP0z8C7BdV5uWPOnm8/a+qg/vKWiZc/gWsHIuIO0vo4mTN6XDT7f19B8Vn10Q/h5pisBjmt55+EZZWwcXPMkgSK3zHBleJbFpRvjaPzgfc8JBNez1/QFkvrsZI+yhq9n7ULzt/f/ddxeKf70cvRo/Vq6uui6a+JIeTSANcZsCI3Ong7xfP3L1MiP0m1mzv8KJ6ORLAVxrlm60D1ueujvf9ifwJKX+qJaP5VvBw2nM9uKxNTfuXZofucNP16wpTizwrTqkH9BfbEshfRechZWFkMa/N+Om5M9Zt+7gz5y1sZHC71q26qaxLcpbI8axSvqZe5J0UaV9F5LIgs9L6BfvAxW29iGK+pr4n16J+SHYqE2XR+DGS3mcOTemYO0nn+9vn+7t+h8TE+3q/x9v+n8ev49X28/gdQSwMEFAAAAAgAYnNsXOOCq11BAAAAbAAAABAAAABCYXRhc1dpbGF5YWguc2h4Y2BQ52LADsxeMDMw8AMZHa1Rkze7qzqW+cudketMdHRYct/uS7CqIw+T9mnGrkRHdI3/weD9fxgNFDJiYGCTAABQSwMEFAAAAAgAYnNsXGSr2cVlAAAApwEAABAAAABCYXRhc1dpbGF5YWguZGJmY65j5mFkYGBoZFAFURggOCOxIDXeJzUvncENxBfmxibvWJSaiF3eJ9QxGMp0BhH/0MznVVBQMNWzNDE1NLUwMzUzMU/VNjBWUDDSMzA2tbCwMDQxNDEFCpkhC5hYGFoqjCggBQBQSwMEFAAAAAgAYnNsXHDD/vECAQAAmQEAABAAAABCYXRhc1dpbGF5YWgucHJqbY9ba4QwEIX/S56DGO95FM1al2rEC4WKhOCmbkAixLT9+41bSrtt52EeznxzzkzT0nPWjeCp6BjCScCGvmLPmxIswB2ABaHFMbaNfSEA5mk/VCPIf0hd80BaWubfTgBGfpwgP3Zc6OHE8cLY8/ww8qcJNm1ZEetQaCHUu5yvALqOO8GhLnvrKxar3yQUB6HvYS9EGAf+5yo9k6wvaT2CXnO1vwm9C1YJPXOzaWCJtE0r0pN2BCe+2hnhu5FqATB0jzqC/jD1ps31BiHX/Q/LhDKar0eQvEiuLIjQL6ab+SrYic/HIfZ8jHF0BzxyI83rRTD6wqiWi1R3j1fCCLt42E4fUEsDBBQAAAAIAGJzbFxQPIEOBwAAAAUAAAAQAAAAQmF0YXNXaWxheWFoLmNwZwsNcdO1AABQSwECFAAUAAAACABic2xcAVHA5PkEAACcDAAAEAAAAAAAAAAAAAAAAAAAAAAAQmF0YXNXaWxheWFoLnNocFBLAQIUABQAAAAIAGJzbFzjgqtdQQAAAGwAAAAQAAAAAAAAAAAAAAAAACcFAABCYXRhc1dpbGF5YWguc2h4UEsBAhQAFAAAAAgAYnNsXGSr2cVlAAAApwEAABAAAAAAAAAAAAAAAAAAlgUAAEJhdGFzV2lsYXlhaC5kYmZQSwECFAAUAAAACABic2xccMP+8QIBAACZAQAAEAAAAAAAAAAAAAAAAAApBgAAQmF0YXNXaWxheWFoLnByalBLAQIUABQAAAAIAGJzbFxQPIEOBwAAAAUAAAAQAAAAAAAAAAAAAAAAAFkHAABCYXRhc1dpbGF5YWguY3BnUEsFBgAAAAAFAAUANgEAAI4HAAAAAA==';

// --- BASEMAP CONFIGS ----------------------------------------
const BASEMAPS = {
  osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>', opt: {} },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri', opt: {} },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '© <a href="https://carto.com">CARTO</a>', opt: { subdomains: 'abcd' } },
  topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© <a href="https://opentopomap.org">OpenTopoMap</a>', opt: {} },
};

const ITS = [-7.2756, 112.7951];
const ZOOM = 15;
const QR_URL = 'https://itsafe.geowebgis.id/';

const FACULTY_COLORS = {
  'FSAD': '#4E79A7', // blue
  'FTIRS': '#F28E2B', // orange
  'FTSPK': '#76B7B2', // teal
  'FDKBD': '#59A14F', // green
  'FV': '#E15759', // red
  'FKK': '#B07AA1', // purple
  'FTEIC': '#20B2AA', // cyan
  'FTK': '#BAB0AC', // gray
};

const RISK_COLORS = {
  1: '#10B981', // Hijau (Rawan Rendah)
  2: '#10B981', // Hijau (Rawan Rendah)
  3: '#F59E0B', // Kuning (Rawan Sedang)
  4: '#EF4444', // Merah (Rawan Tinggi)
  5: '#EF4444', // Merah (Rawan Tinggi)
};

let locationFacultyMap = {};

// --- LOCATION DATA ------------------------------------------
const DEFAULT_LOCATIONS = [
  { id: 1, name: 'Perpustakaan Pusat ITS', desc: 'Area parkir dan lobi utama perpustakaan, zona keluar-masuk yang minim pengawasan.', status: 'terpasang', count: 3, icon: 'fa-book-open', lat: -7.2748, lng: 112.7944, gmaps: 'https://maps.google.com/?q=-7.2748,112.7944' },
  { id: 2, name: 'Gedung Teknik Sipil (FTSP)', desc: 'Koridor lantai 2 dan area tangga belakang gedung.', status: 'terpasang', count: 5, icon: 'fa-building-columns', lat: -7.2771, lng: 112.7963, gmaps: 'https://maps.google.com/?q=-7.2771,112.7963' },
  { id: 3, name: 'Kantin Pusat (Food Court)', desc: 'Area sekitar kantin pusat, terutama pada jam-jam sepi.', status: 'terpasang', count: 2, icon: 'fa-utensils', lat: -7.2756, lng: 112.7951, gmaps: 'https://maps.google.com/?q=-7.2756,112.7951' },
  { id: 4, name: 'Asrama Mahasiswa Putra', desc: 'Koridor dan area parkir depan asrama putra ITS.', status: 'terpasang', count: 4, icon: 'fa-house-user', lat: -7.2735, lng: 112.7938, gmaps: 'https://maps.google.com/?q=-7.2735,112.7938' },
  { id: 5, name: 'Asrama Mahasiswa Putri', desc: 'Pintu masuk utama dan taman asrama putri.', status: 'terpasang', count: 4, icon: 'fa-house-user', lat: -7.2745, lng: 112.7955, gmaps: 'https://maps.google.com/?q=-7.2745,112.7955' },
  { id: 6, name: 'Laboratorium Kimia (FMIPA)', desc: 'Lorong penghubung antar laboratorium di gedung FMIPA.', status: 'rencana', count: 1, icon: 'fa-flask', lat: -7.2780, lng: 112.7969, gmaps: 'https://maps.google.com/?q=-7.2780,112.7969' },
  { id: 7, name: 'Lapangan Olahraga / GOR', desc: 'Area tribun dan ruang ganti GOR ITS.', status: 'rencana', count: 0, icon: 'fa-person-running', lat: -7.2790, lng: 112.7920, gmaps: 'https://maps.google.com/?q=-7.2790,112.7920' },
  { id: 8, name: 'Gedung Robotika (Teknik Elektro)', desc: 'Basement dan area parkir motor gedung Teknik Elektro.', status: 'rencana', count: 0, icon: 'fa-microchip', lat: -7.2760, lng: 112.7980, gmaps: 'https://maps.google.com/?q=-7.2760,112.7980' },
  { id: 9, name: 'Masjid Manarul Ilmi ITS', desc: 'Area wudhu dan parkir belakang masjid.', status: 'terpasang', count: 1, icon: 'fa-mosque', lat: -7.2765, lng: 112.7925, gmaps: 'https://maps.google.com/?q=-7.2765,112.7925' },
  { id: 10, name: 'Gedung Rektorat ITS', desc: 'Area lobby dan lorong menuju ruang tunggu layanan mahasiswa.', status: 'rencana', count: 0, icon: 'fa-landmark', lat: -7.2770, lng: 112.7940, gmaps: 'https://maps.google.com/?q=-7.2770,112.7940' },
  { id: 11, name: 'Co-working Space / Ruang Bersama', desc: 'Area kerja bersama yang buka hingga larut malam.', status: 'terpasang', count: 2, icon: 'fa-laptop', lat: -7.2753, lng: 112.7985, gmaps: 'https://maps.google.com/?q=-7.2753,112.7985' },
  { id: 12, name: 'Area Parkir Timur', desc: 'Parkiran motor dan mobil bagian timur kampus, minim pencahayaan malam.', status: 'rencana', count: 0, icon: 'fa-square-parking', lat: -7.2762, lng: 112.7978, gmaps: 'https://maps.google.com/?q=-7.2762,112.7978' },
];
let LOCATIONS = DEFAULT_LOCATIONS.map(l => ({ ...l }));

const TEAM = [
  { name: 'Wisnu Aditya Duane', nrp: '5016221087', initial: 'W', photo: 'assets/Wisnu.png' },
  { name: 'Josephine Novellia A.', nrp: '5016231044', initial: 'J', photo: 'assets/Josephine.png' },
  { name: 'Duta Satrio Wibowo', nrp: '5016231047', initial: 'D', photo: 'assets/Duta.png' },
  { name: 'Muhammad Farid Farhan', nrp: '5016231069', initial: 'M', photo: 'assets/Muhammad.png' },
  { name: 'Farrel Valentino Y.', nrp: '5016231075', initial: 'F', photo: 'assets/Farrel.png' },
  { name: 'Ananda Adellia C. S.', nrp: '5016231092', initial: 'A', photo: 'assets/Adellia.png' },
];

// ============================================================
// INIT
// ============================================================
function itsafeInit() {
  if (window._itsInitDone) return;
  window._itsInitDone = true;
  
  // Navigation & Form
  initNav();
  initForm();
  initPinToggles();
  buildLocationFacultyMap();
  
  // Data Fetching
  fetchReports();       // ambil data dari API
  fetchStats();         // ambil statistik dari API
  fetchLocations();     // ambil lokasi titik pengaduan
  
  // App Logic
  startRealtimeSync();  // sinkronisasi realtime (polling)
  renderTeam();
  generateQR();
  initPickerMap();
  
  // Exposed Globals
  window.navigateTo = navigateTo;
  window.scrollToForm = scrollToForm;
  window.itsafeInit = itsafeInit; 
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', itsafeInit);
} else {
  itsafeInit();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { stopRealtimeSync(); return; }
  refreshRealtime();
  startRealtimeSync();
});

// ============================================================
// API FUNCTIONS
// ============================================================

// Ambil semua laporan dari Laravel
async function fetchReports() {
  try {
    const res = await fetch(`${API_BASE}/reports`);
    const data = await res.json();
    // Sesuaikan field dari API ke format lokal
    reports = data.map(r => ({
      id: r.id,
      createdAt: r.created_at,
      kelamin: r.jenis_kelamin,
      peran: r.peran_kampus,
      pencahayaan: r.pencahayaan,
      kepadatan: r.kepadatan,
      cctv: r.cctv,
      petugas: r.petugas_keamanan,
      vegetasi: r.vegetasi,
      waktu: r.waktu_rawan,
      hariRawan: r.hari_rawan,
      skorNyaman: r.skor_nyaman ? parseInt(r.skor_nyaman, 10) : null,
      skorRawan: r.skor_rawan ? parseInt(r.skor_rawan, 10) : null,
      alasanTidakNyaman: r.alasan_tidak_nyaman,
      pernahHindari: r.pernah_hindari,
      orangLain: r.orang_lain,
      situasiMencurigakan: r.situasi_mencurigakan,
      fungsiRuang: r.fungsi_ruang,
      lokasi: r.lokasi_kejadian,
      lokasiDeskripsi: r.lokasi_deskripsi,
      kronologi: r.kronologi,
      lat: r.latitude ? parseFloat(r.latitude) : null,
      lng: r.longitude ? parseFloat(r.longitude) : null,
      fotoPath: r.foto_path,
      status: r.status,
      fakultas: getFacultyFromLocationName(r.lokasi_kejadian),
    }));
    updateLayerCounts();
    if (leafletMap) renderLeafletMap();
    renderLaporanChart();
  } catch (e) {
    console.error('Gagal ambil data laporan:', e);
  }
}

// Ambil statistik dari Laravel
async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/reports/stats`);
    const data = await res.json();
    document.getElementById('totalLaporan').textContent = data.total || 0;
    document.getElementById('bulanIni').textContent = data.bulan_ini || 0;
    document.getElementById('terverifikasi').textContent = data.terverifikasi || 0;
  } catch (e) {
    console.error('Gagal ambil statistik:', e);
  }
}

// Ambil lokasi titik pengaduan dari API
async function fetchLocations() {
  try {
    const res = await fetch(`${API_BASE}/locations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      LOCATIONS = data.map(l => ({
        id: l.id,
        name: l.name,
        desc: l.desc || '',
        status: l.status || 'rencana',
        count: l.count || 0,
        icon: l.icon || 'fa-location-dot',
        lat: l.lat,
        lng: l.lng,
        gmaps: l.gmaps || '',
        photo: l.photo || null,
      }));
    } else {
      LOCATIONS = [];
    }
  } catch (e) {
    LOCATIONS = [];
    console.error('Gagal ambil titik pengaduan:', e);
  }
  const active = document.querySelector('.loc-filter-btn.active');
  renderLocationCards(active?.dataset.filter || 'all');
  renderAllFixedLocations();
}

// ============================================================
// REALTIME SYNC (polling)
// ============================================================
async function refreshRealtime() {
  if (isRealtimeRefreshing) return;
  isRealtimeRefreshing = true;
  try {
    await Promise.all([fetchReports(), fetchStats(), fetchLocations()]);
  } finally {
    isRealtimeRefreshing = false;
  }
}

function startRealtimeSync() {
  stopRealtimeSync();
  realtimeTimer = setInterval(() => {
    if (document.hidden) return;
    refreshRealtime();
  }, REALTIME_INTERVAL);
}

function stopRealtimeSync() {
  if (realtimeTimer) clearInterval(realtimeTimer);
  realtimeTimer = null;
}

// Kirim laporan ke Laravel
async function submitToAPI(payload) {
  const isFormData = payload instanceof FormData;
  const options = {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: isFormData ? payload : JSON.stringify(payload),
  };
  if (!isFormData) {
    options.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}/reports`, options);
  return await res.json();
}

// ============================================================
// NAVIGATION
// ============================================================
function initNav() {
  if (window._itsNavInit) return;
  window._itsNavInit = true;

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
      document.getElementById('navLinks').classList.remove('open');
    });
  });
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(page)?.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (page === 'peta') {
    updateLayerCounts();
    setTimeout(() => { initLeafletMap(); renderLeafletMap(); }, 100);
  }
}

function scrollToForm() {
  navigateTo('home');
  setTimeout(() => document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' }), 100);
}

// ============================================================
// FORM
// ============================================================
function initForm() {
  document.getElementById('reportForm').addEventListener('submit', handleSubmit);
  document.getElementById('lokasiInsiden')?.addEventListener('change', handleLocationPreset);
}

async function handleSubmit(e) {
  e.preventDefault();
  const required = [
    "emailIts",
    "peranKampus",
    "lokasiInsiden",
    "lokasiDeskripsi",
    "pencahayaan",
    "kepadatan",
    "cctv",
    "petugasKeamanan",
    "waktuInsiden",
    "skorNyaman",
    "skorRawan",
  ];
  let valid = true;
  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) { el.style.borderColor = '#F28482'; valid = false; }
    else el.style.borderColor = '';
  });
  if (!document.getElementById('consent').checked) { showToast('Harap setujui pernyataan persetujuan.', 'error'); return; }
  if (!valid) { showToast('Harap lengkapi semua field wajib.', 'error'); return; }

  const lat = parseFloat(document.getElementById('lat').value);
  const lng = parseFloat(document.getElementById('lng').value);
  const lokasiSelect = document.getElementById('lokasiInsiden');
  const lokasiVal = lokasiSelect.value;
  if (/Lainnya/i.test(lokasiVal) && (isNaN(lat) || isNaN(lng))) {
    showToast('Pin lokasi wajib diisi jika memilih Lainnya.', 'error');
    return;
  }

  const kelaminVal = document.getElementById('jenisKelamin').value.trim();
  const skorNyamanVal = parseInt(document.getElementById('skorNyaman').value, 10);
  const skorRawanVal = parseInt(document.getElementById('skorRawan').value, 10);

  const payload = {
    email_its: document.getElementById('emailIts').value.trim(),
    peran_kampus: document.getElementById('peranKampus').value,
    jenis_kelamin: kelaminVal || null,
    lokasi_kejadian: lokasiVal,
    lokasi_deskripsi: document.getElementById('lokasiDeskripsi').value.trim() || null,
    latitude: isNaN(lat) ? null : lat,
    longitude: isNaN(lng) ? null : lng,
    pencahayaan: document.getElementById('pencahayaan').value,
    kepadatan: document.getElementById('kepadatan').value,
    cctv: document.getElementById('cctv').value,
    petugas_keamanan: document.getElementById('petugasKeamanan').value,
    vegetasi: document.getElementById('vegetasi').value || null,
    waktu_rawan: document.getElementById('waktuInsiden').value,
    hari_rawan: document.getElementById('hariRawan').value || null,
    skor_nyaman: isNaN(skorNyamanVal) ? null : skorNyamanVal,
    alasan_tidak_nyaman: document.getElementById('alasanTidakNyaman').value || null,
    skor_rawan: isNaN(skorRawanVal) ? null : skorRawanVal,
    pernah_hindari: document.getElementById('pernahHindari').value || null,
    orang_lain: document.getElementById('orangLain').value || null,
    situasi_mencurigakan: document.getElementById('situasiMencurigakan').value || null,
    kronologi: document.getElementById('kronologi').value.trim() || null,
    kontak_pelapor: document.getElementById('kontakPelapor').value.trim() || null,
  };
  const fotoInput = document.getElementById('fotoLokasi');
  const fotoFile = fotoInput && fotoInput.files && fotoInput.files[0] ? fotoInput.files[0] : null;
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    formData.append(key, value);
  });
  if (fotoFile) {
    formData.append('foto_lokasi', fotoFile);
  }

  try {
    showToast('Mengirim laporan...', 'success');
    const result = await submitToAPI(formData);
    if (result.success) {
      e.target.reset();
      clearPin();
      await fetchReports();
      await fetchStats();
      if (result.mail_sent === false) {
        showToast(`Laporan tersimpan (kode: ${result.report_code}), tapi email admin belum terkirim.`, 'error');
      } else {
        showToast(`Laporan terkirim! Kode: ${result.report_code}`, 'success');
      }
    } else {
      showToast('Gagal mengirim laporan. Coba lagi.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Tidak dapat terhubung ke server.', 'error');
  }
}

function handleLocationPreset() {
  const sel = document.getElementById('lokasiInsiden');
  if (!sel) return;
  const opt = sel.options[sel.selectedIndex];
  const lat = opt?.dataset?.lat;
  const lng = opt?.dataset?.lng;
  if (lat && lng) {
    setPin(parseFloat(lat), parseFloat(lng), { fromPreset: true });
  } else if (opt && /Lainnya/i.test(opt.value)) {
    clearPin();
  }
}

function setLokasiToLainnya() {
  const sel = document.getElementById('lokasiInsiden');
  if (!sel) return;
  const opt = Array.from(sel.options).find(o => /Lainnya/i.test(o.textContent || o.value));
  if (opt) sel.value = opt.value;
}

function buildLocationFacultyMap() {
  locationFacultyMap = {};
  document.querySelectorAll('#lokasiInsiden option').forEach(opt => {
    if (!opt.value) return;
    locationFacultyMap[opt.value] = getFacultyFromOption(opt);
  });
}

function getFacultyFromOption(opt) {
  const parent = opt?.parentElement;
  if (parent && parent.tagName === 'OPTGROUP') return parent.label;
  return 'Lainnya';
}

function getFacultyColor(faculty) {
  return FACULTY_COLORS[faculty] || FACULTY_COLORS.Lainnya;
}

function getFacultyFromLocationName(name) {
  return locationFacultyMap[name] || 'Lainnya';
}

function createFacultyIcon(color) {
  return L.divIcon({
    className: 'faculty-pin-wrap',
    html: `<div class="faculty-pin" style="--pin-color:${color}">
             <i class="fas fa-building-columns"></i>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function createCaseIcon(color) {
  return L.divIcon({
    className: 'case-dot-wrap',
    html: `<div class="case-dot" style="--case-color:${color}">
             <i class="fas fa-exclamation"></i>
           </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

// ============================================================
// PICKER MAP (mini Leaflet di form)
// ============================================================
function initPickerMap() {
  if (pickerMap) return;
  pickerMap = L.map('pickerMap', { zoomControl: true }).setView(ITS, ZOOM);
  L.tileLayer(BASEMAPS.osm.url, { attribution: BASEMAPS.osm.attr }).addTo(pickerMap);
  fixedLocationLayerPicker = L.layerGroup().addTo(pickerMap);
  renderFixedLocations(fixedLocationLayerPicker);
  loadBoundaryLayer(pickerMap, 'picker');
  pickerMap.on('click', e => setPin(e.latlng.lat, e.latlng.lng, { fromPreset: false }));
}

function setPin(lat, lng, opts = {}) {
  const fromPreset = opts.fromPreset === true;
  if (!fromPreset && !isPointInBoundary(lat, lng)) {
    showToast('Pin berada di luar batas area ITS. Silakan pilih lokasi di dalam boundary.', 'error');
    return;
  }
  document.getElementById('lat').value = lat.toFixed(6);
  document.getElementById('lng').value = lng.toFixed(6);
  document.getElementById('locStatus').textContent = `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  if (pickerMarker) pickerMarker.remove();
  pickerMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'case-dot-wrap',
      html: `<div class="case-dot" style="--case-color:#F28482">
               <i class="fas fa-location-crosshairs"></i>
             </div>`,
      iconAnchor: [10, 10]
    })
  }).addTo(pickerMap);
  pickerMap.setView([lat, lng], Math.max(pickerMap.getZoom(), 16));

  if (!fromPreset) {
    setLokasiToLainnya();
  }
}

function clearPin() {
  document.getElementById('lat').value = '';
  document.getElementById('lng').value = '';
  document.getElementById('locStatus').textContent = '';
  if (pickerMarker) { pickerMarker.remove(); pickerMarker = null; }
}

function getLocation() {
  if (!navigator.geolocation) { showToast('Geolokasi tidak didukung browser ini.', 'error'); return; }
  document.getElementById('locStatus').textContent = 'Mendapatkan lokasi...';
  navigator.geolocation.getCurrentPosition(
    pos => setPin(pos.coords.latitude, pos.coords.longitude, { fromPreset: false }),
    () => { showToast('Gagal mendapatkan lokasi.', 'error'); document.getElementById('locStatus').textContent = ''; }
  );
}

// ============================================================
// MAIN LEAFLET MAP (halaman Peta)
// ============================================================
function initLeafletMap() {
  if (leafletMap) return;
  leafletMap = L.map('leafletMap').setView(ITS, ZOOM);
  baseTile = L.tileLayer(BASEMAPS.osm.url, { attribution: BASEMAPS.osm.attr }).addTo(leafletMap);
  fixedLocationLayerMain = L.layerGroup().addTo(leafletMap);
  renderFixedLocations(fixedLocationLayerMain);
  loadBoundaryLayer(leafletMap, 'main');
  // Pasang event listener toggle pin (lebih andal dari inline onclick)
  initPinToggles();
}

function renderLeafletMap() {
  if (!leafletMap) return;
  renderFixedLocations(fixedLocationLayerMain);

  if (heatLayer) { leafletMap.removeLayer(heatLayer); heatLayer = null; }
  if (pointLayer) { leafletMap.removeLayer(pointLayer); pointLayer = null; }
  if (clusterLayer) { leafletMap.removeLayer(clusterLayer); clusterLayer = null; }

  const filterBulan = document.getElementById('filterBulan')?.value || '';
  const filterWaktu = document.getElementById('filterWaktu')?.value || '';

  let data = reports.filter(r => r.lat && r.lng);
  if (activeLayer !== 'semua') {
    data = data.filter(r => matchesLayer(r, activeLayer));
  }
  if (filterWaktu) data = data.filter(r => r.waktu === filterWaktu);
  if (filterBulan) {
    data = data.filter(r => {
      const d = parseReportDate(r);
      return d && (d.getMonth() + 1) === parseInt(filterBulan);
    });
  }

  updateTopAreas(data);
  updateHeatmapAnalysis(data, filterWaktu, filterBulan);

  const overlay = document.getElementById('mapOverlay');
  const hasFixed = fixedLocationLayerMain && fixedLocationLayerMain.getLayers().length > 0;
  overlay.style.display = (data.length === 0 && !hasFixed) ? 'flex' : 'none';
  if (!data.length) return;

  if (visHeatmap && L.heatLayer) {
    heatLayer = L.heatLayer(
      data.map(r => [r.lat, r.lng, 1]),
      { radius: 35, blur: 22, maxZoom: 18, gradient: { 0.1: '#84A59D', 0.4: '#F6BD60', 0.7: '#F5CAC3', 1.0: '#F28482' } }
    ).addTo(leafletMap);
  }

  if (visPoint) {
    pointLayer = L.layerGroup();
    data.forEach(r => {
      const color = getRiskColor(r.skorRawan);
      L.marker([r.lat, r.lng], {
        icon: createCaseIcon(color)
      }).bindPopup(buildPopup(r)).addTo(pointLayer);
    });
    leafletMap.addLayer(pointLayer);
  }

  if (visCluster && L.markerClusterGroup) {
    clusterLayer = L.markerClusterGroup({ chunkedLoading: true });

    // PETA 3 Logic: Kelayakan Fasilitas
    const isPeta3 = document.getElementById('tab-fasilitas') && document.getElementById('tab-fasilitas').classList.contains('active');

    data.forEach(r => {
      let color = getRiskColor(r.skorRawan);
      let popupHtml = buildPopup(r);

      if (isPeta3) {
        const kel = calcKelayakan(r);
        if (kel.status === 'Layak') color = '#10B981'; // Green
        else if (kel.status === 'Cukup Layak') color = '#F59E0B'; // Orange
        else color = '#EF4444'; // Red

        let badgeClass = kel.status === 'Layak' ? 'badge-safe' : (kel.status === 'Cukup Layak' ? 'badge-warning' : 'badge-danger');
        let badgeIcon = kel.status === 'Layak' ? 'fa-check-circle' : (kel.status === 'Cukup Layak' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle');
        let alasanHtml = kel.alasan.length ? `<div style="margin-top:6px;font-size:10.5px;color:#94a3b8;line-height:1.4">Penyebab: ${kel.alasan.join(', ')}</div>` : '';
        let kelHtml = `<div style="padding:8px 16px 10px;border-top:1px solid rgba(0,0,0,.06)"><div class="popup-status-badge ${badgeClass}"><i class="fas ${badgeIcon}"></i> ${kel.status}</div>${alasanHtml}</div>`;
        popupHtml = popupHtml.replace('</div>\n  </div>', kelHtml + '</div>\n  </div>');
      }

      L.marker([r.lat, r.lng], { icon: createCaseIcon(color) })
        .bindPopup(popupHtml)
        .addTo(clusterLayer);
    });
    leafletMap.addLayer(clusterLayer);
  }

  if (visPoint && !visCluster) {
    // Apply Peta 3 Logic to points too if visCluster is false but visPoint is true
    const isPeta3 = document.getElementById('tab-fasilitas') && document.getElementById('tab-fasilitas').classList.contains('active');
    if (!pointLayer) pointLayer = L.layerGroup().addTo(leafletMap);
    pointLayer.clearLayers();

    data.forEach(r => {
      let color = getRiskColor(r.skorRawan);
      let popupHtml = buildPopup(r);

      if (isPeta3) {
        const kel = calcKelayakan(r);
        if (kel.status === 'Layak') color = '#10B981';
        else if (kel.status === 'Cukup Layak') color = '#F59E0B';
        else color = '#EF4444';

        let badgeClass = kel.status === 'Layak' ? 'badge-safe' : (kel.status === 'Cukup Layak' ? 'badge-warning' : 'badge-danger');
        let badgeIcon = kel.status === 'Layak' ? 'fa-check-circle' : (kel.status === 'Cukup Layak' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle');
        let alasanHtml = kel.alasan.length ? `<div style="margin-top:6px;font-size:10.5px;color:#94a3b8;line-height:1.4">Penyebab: ${kel.alasan.join(', ')}</div>` : '';
        let kelHtml = `<div style="padding:8px 16px 10px;border-top:1px solid rgba(0,0,0,.06)"><div class="popup-status-badge ${badgeClass}"><i class="fas ${badgeIcon}"></i> ${kel.status}</div>${alasanHtml}</div>`;
        popupHtml = popupHtml.replace('</div>\n  </div>', kelHtml + '</div>\n  </div>');
      }

      L.marker([r.lat, r.lng], { icon: createCaseIcon(color) })
        .bindPopup(popupHtml)
        .addTo(pointLayer);
    });
  }
}

async function loadBoundaryLayer(map, target) {
  if (!map || typeof shp === 'undefined') return;
  try {
    if (target === 'main' && boundaryLayerMain) return;
    if (target === 'picker' && boundaryLayerPicker) return;
    let buf = null;
    try {
      const res = await fetch('assets/its_boundary.zip');
      if (res.ok) buf = await res.arrayBuffer();
    } catch (e) {
      console.warn('[boundary] fetch failed', e);
    }
    if (!isZipBuffer(buf)) {
      buf = base64ToArrayBuffer(BOUNDARY_ZIP_B64);
    }
    const gj = await shp(buf);
    let data = gj.type ? gj : gj[Object.keys(gj)[0]];
    if (!data || !data.features || !data.features.length) {
      console.warn('[boundary] empty geojson', gj);
      return;
    }
    data = reprojectGeoJSONIfNeeded(data);
    if (!boundaryGeoJSON) {
      boundaryGeoJSON = data;
      boundaryPolygons = extractPolygonsFromGeoJSON(data);
    }
    const layer = L.geoJSON(data, {
      style: { color: '#EF4444', weight: 3, fill: true, fillOpacity: 0.08, dashArray: '6 4' }
    }).addTo(map);
    layer.bringToFront();
    const bounds = layer.getBounds?.();
    if (bounds && bounds.isValid && bounds.isValid()) {
      if (!map.__boundaryFitted) {
        map.fitBounds(bounds, { padding: [20, 20] });
        map.__boundaryFitted = true;
      }
    }
    if (target === 'main') boundaryLayerMain = layer;
    if (target === 'picker') boundaryLayerPicker = layer;
  } catch (e) {
    console.warn('[boundary] load failed', e);
  }
}

function reprojectGeoJSONIfNeeded(gj) {
  if (!gj || typeof proj4 === 'undefined') return gj;
  const first = getFirstCoord(gj);
  if (!first) return gj;
  const x = first[0];
  const y = first[1];
  const looksProjected = Math.abs(x) > 180 || Math.abs(y) > 90;
  if (!looksProjected) return gj;
  if (!proj4.defs(BOUNDARY_SRC_CRS)) proj4.defs(BOUNDARY_SRC_CRS, BOUNDARY_SRC_DEF);
  if (!proj4.defs(BOUNDARY_DST_CRS)) proj4.defs(BOUNDARY_DST_CRS, BOUNDARY_DST_DEF);
  const from = proj4(BOUNDARY_SRC_CRS);
  const to = proj4(BOUNDARY_DST_CRS);
  return mapGeoJSONCoords(gj, coord => {
    const out = proj4(from, to, coord);
    return [out[0], out[1]];
  });
}

function isZipBuffer(buf) {
  if (!buf || buf.byteLength < 4) return false;
  const b = new Uint8Array(buf, 0, 4);
  return b[0] === 0x50 && b[1] === 0x4B; // 'PK'
}

function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function extractPolygonsFromGeoJSON(gj) {
  const polys = [];
  const addPolygon = coords => {
    if (Array.isArray(coords) && coords.length) polys.push(coords);
  };
  const walk = geom => {
    if (!geom) return;
    if (geom.type === 'FeatureCollection') {
      (geom.features || []).forEach(f => walk(f));
      return;
    }
    if (geom.type === 'Feature') {
      walk(geom.geometry);
      return;
    }
    if (geom.type === 'GeometryCollection') {
      (geom.geometries || []).forEach(g => walk(g));
      return;
    }
    if (geom.type === 'Polygon') {
      addPolygon(geom.coordinates);
      return;
    }
    if (geom.type === 'MultiPolygon') {
      (geom.coordinates || []).forEach(p => addPolygon(p));
    }
  };
  walk(gj);
  return polys;
}

function isPointInBoundary(lat, lng) {
  if (!boundaryPolygons || !boundaryPolygons.length) return true;
  const pt = [lng, lat];
  return boundaryPolygons.some(poly => pointInPolygon(pt, poly));
}

function pointInPolygon(pt, polygon) {
  if (!polygon || !polygon.length) return false;
  if (!pointInRing(pt, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(pt, polygon[i])) return false;
  }
  return true;
}

function pointInRing(pt, ring) {
  let inside = false;
  const x = pt[0];
  const y = pt[1];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 0.0) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getFirstCoord(gj) {
  if (!gj) return null;
  if (gj.type === 'FeatureCollection') {
    for (const f of gj.features || []) {
      const c = getFirstCoord(f);
      if (c) return c;
    }
    return null;
  }
  if (gj.type === 'Feature') return getFirstCoord(gj.geometry);
  if (gj.type === 'GeometryCollection') {
    for (const g of gj.geometries || []) {
      const c = getFirstCoord(g);
      if (c) return c;
    }
    return null;
  }
  const coords = gj.coordinates;
  if (!coords) return null;
  if (gj.type === 'Point') return coords;
  if (gj.type === 'MultiPoint' || gj.type === 'LineString') return coords[0] || null;
  if (gj.type === 'MultiLineString' || gj.type === 'Polygon') return (coords[0] && coords[0][0]) || null;
  if (gj.type === 'MultiPolygon') return (coords[0] && coords[0][0] && coords[0][0][0]) || null;
  return null;
}

function mapGeoJSONCoords(gj, fn) {
  if (!gj) return gj;
  if (gj.type === 'FeatureCollection') {
    return {
      ...gj,
      features: (gj.features || []).map(f => mapGeoJSONCoords(f, fn))
    };
  }
  if (gj.type === 'Feature') {
    return {
      ...gj,
      geometry: gj.geometry ? mapGeoJSONCoords(gj.geometry, fn) : gj.geometry
    };
  }
  if (gj.type === 'GeometryCollection') {
    return {
      ...gj,
      geometries: (gj.geometries || []).map(g => mapGeoJSONCoords(g, fn))
    };
  }
  const coords = gj.coordinates;
  if (!coords) return gj;
  switch (gj.type) {
    case 'Point':
      return { ...gj, coordinates: fn(coords) };
    case 'MultiPoint':
    case 'LineString':
      return { ...gj, coordinates: coords.map(fn) };
    case 'MultiLineString':
    case 'Polygon':
      return { ...gj, coordinates: coords.map(ring => ring.map(fn)) };
    case 'MultiPolygon':
      return { ...gj, coordinates: coords.map(poly => poly.map(ring => ring.map(fn))) };
    default:
      return gj;
  }
}

function getNyamanLabel(val) {
  if (val === 1) return '<div class="popup-status-badge badge-danger"><i class="fas fa-exclamation-circle"></i> Tidak Nyaman</div>';
  if (val === 2) return '<div class="popup-status-badge badge-warning"><i class="fas fa-exclamation-triangle"></i> Kurang Nyaman</div>';
  if (val === 3) return '<div class="popup-status-badge badge-safe"><i class="fas fa-check-circle"></i> Nyaman</div>';
  return '';
}

function getRawanLabel(val) {
  if (val >= 4 || val === 3) return '<div class="popup-status-badge badge-danger"><i class="fas fa-exclamation-circle"></i> Rawan Tinggi</div>';
  if (val === 2) return '<div class="popup-status-badge badge-warning"><i class="fas fa-exclamation-triangle"></i> Rawan Sedang</div>';
  if (val <= 1) return '<div class="popup-status-badge badge-safe"><i class="fas fa-shield-halved"></i> Rawan Rendah</div>';
  return '-';
}

function getScoreHtml(val, type) {
  let color = '#F59E0B';

  if (type === 'pencahayaan') {
    if (val === 'Terang') { color = '#10B981'; }
    else if (val === 'Gelap') { color = '#EF4444'; }
  }
  else if (type === 'kepadatan') {
    if (val === 'Ramai') { color = '#10B981'; }
    else if (val === 'Sepi' || val === 'Sangat sepi') { color = '#EF4444'; }
  }
  else if (type === 'cctv') {
    if ((val || '').includes('jelas')) { color = '#10B981'; }
    else if ((val || '').includes('Tidak ada') || (val || '').includes('Tidak tahu')) { color = '#EF4444'; }
  }
  else if (type === 'petugas') {
    if (val === 'Sering ada') { color = '#10B981'; }
    else if (val === 'Tidak pernah ada') { color = '#EF4444'; }
  }
  else if (type === 'vegetasi') {
    if ((val || '').includes('Terbuka')) { color = '#10B981'; }
    else if ((val || '').includes('Tertutup')) { color = '#EF4444'; }
  }

  if (!val || val === '-') return '<span class="popup-meta-value" style="color:#94a3b8">—</span>';
  return `<span class="popup-meta-value" style="color:${color}">${val}</span>`;
}

function buildPopup(r) {
  const faculty = r.fakultas || getFacultyFromLocationName(r.lokasi);
  const isPeta2 = document.getElementById('tab-heatmap') && document.getElementById('tab-heatmap').classList.contains('active');

  // Header
  let headerHtml = `<div class="popup-header">
    <div class="popup-loc-name">${esc(r.lokasi)}</div>
    <div class="popup-faculty">${esc(faculty)}</div>
    <div class="popup-coords">${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}</div>
  </div>`;

  // Description quote
  let descHtml = r.lokasiDeskripsi
    ? `<div class="popup-desc">${esc(r.lokasiDeskripsi)}</div>`
    : '';

  // Body
  let bodyHtml = '<div class="popup-body">';

  const isPeta3 = document.getElementById('tab-fasilitas') && document.getElementById('tab-fasilitas').classList.contains('active');
  if (isPeta2) {
    bodyHtml += getRawanLabel(r.skorRawan);
  } else if (!isPeta3) {
    bodyHtml += getNyamanLabel(r.skorNyaman);
  }

  bodyHtml += `<div class="popup-meta-grid">
    <div class="popup-meta-row">
      <span class="popup-meta-label">Waktu</span>
      <span class="popup-meta-value" style="color:#64748b">${r.waktu || '—'} ${r.hariRawan ? '(' + r.hariRawan + ')' : ''}</span>
    </div>
    <div class="popup-meta-row">
      <span class="popup-meta-label">Cahaya</span>
      ${getScoreHtml(r.pencahayaan, 'pencahayaan')}
    </div>
    <div class="popup-meta-row">
      <span class="popup-meta-label">Kepadatan</span>
      ${getScoreHtml(r.kepadatan, 'kepadatan')}
    </div>
    <div class="popup-meta-row">
      <span class="popup-meta-label">CCTV</span>
      ${getScoreHtml(r.cctv, 'cctv')}
    </div>
    <div class="popup-meta-row">
      <span class="popup-meta-label">Petugas</span>
      ${getScoreHtml(r.petugas, 'petugas')}
    </div>
    <div class="popup-meta-row">
      <span class="popup-meta-label">Vegetasi</span>
      ${getScoreHtml(r.vegetasi, 'vegetasi')}
    </div>
  </div></div>`;

  // Photo
  let fotoHtml = '';
  if (r.fotoPath && !r.fotoPath.startsWith('HIDDEN_')) {
    const fotoUrl = getPhotoUrl(r.fotoPath);
    const safeUrl = fotoUrl.replace(/'/g, "\\'");
    fotoHtml = `<div class="popup-foto">
      <img src="${fotoUrl}"
        alt="Foto Lokasi"
        onclick="openLightbox('${safeUrl}')"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
        title="Klik untuk memperbesar"/>
      <div style="display:none; font-size:0.74rem; margin-top:4px;">
        <a href="${fotoUrl}" target="_blank" rel="noopener" style="color:#D56A6A; text-decoration:underline;">
          Buka foto di tab baru
        </a>
      </div>
      <div class="popup-foto-caption">Klik foto untuk memperbesar</div>
    </div>`;
  }

  return `<div class="popup-card">
    ${headerHtml}
    ${descHtml}
    ${bodyHtml}
    ${fotoHtml}
  </div>`;
}


// Map 3 Logic (Kelayakan)
function calcKelayakan(r) {
  let score = 0;
  let alasan = [];

  if (r.pencahayaan === 'Terang') score += 3;
  else if (r.pencahayaan === 'Remang-remang') { score += 2; alasan.push('Pencahayaan kurang memadai'); }
  else { score += 1; alasan.push('Area sangat gelap'); }

  if (r.kepadatan === 'Ramai') score += 3;
  else if (r.kepadatan === 'Cukup ramai') score += 2;
  else { score += 1; alasan.push('Area sepi'); }

  if (r.cctv === 'Ada dan terlihat jelas') score += 3;
  else if (r.cctv === 'Ada tapi tidak yakin aktif') { score += 2; alasan.push('CCTV belum pasti aktif'); }
  else { score += 1; alasan.push('Tidak ada pengawasan CCTV'); }

  if (r.petugas === 'Sering ada') score += 3;
  else if (r.petugas === 'Kadang ada' || r.petugas === 'Jarang ada') { score += 2; alasan.push('Jarang ada petugas keamanan'); }
  else { score += 1; alasan.push('Tidak pernah ada petugas keamanan'); }

  if ((r.vegetasi || '').includes('Terbuka')) score += 3;
  else if ((r.vegetasi || '').includes('Tertutup')) { score += 1; alasan.push('Area tertutup / kurang akses pandang'); }
  else score += 2;

  let status = 'Layak';
  if (score < 10) status = 'Kurang Layak';
  else if (score <= 13) status = 'Cukup Layak';

  return { score, status, alasan };
}

function renderFixedLocations(layer) {
  if (!layer) return;
  layer.clearLayers();

  // Pin Jurusan/Fakultas
  if (visJurusan) {
    const sel = document.getElementById('lokasiInsiden');
    if (sel) {
      const opts = Array.from(sel.querySelectorAll('option[data-lat][data-lng]'));
      const seen = new Set();
      opts.forEach(opt => {
        const lat = opt.getAttribute('data-lat');
        const lng = opt.getAttribute('data-lng');
        if (!lat || !lng) return;

        const locName = (opt.textContent || '').trim();
        const key = `${lat},${lng},${locName}`;
        if (seen.has(key)) return;
        seen.add(key);

        const faculty = getFacultyFromOption(opt);
        const color = getFacultyColor(faculty);

        L.marker([parseFloat(lat), parseFloat(lng)], { icon: createFacultyIcon(color) })
          .bindPopup(`<div class="popup-card"><div class="popup-header"><div class="popup-loc-name">${esc(locName)}</div><div class="popup-faculty">${esc(faculty)}</div></div></div>`)
          .addTo(layer);
      });
    }
  }

  // Pin Lokasi QR Aduan
  if (visFixedPin) {
    LOCATIONS.forEach(loc => {
      let lat = parseFloat(loc.lat);
      let lng = parseFloat(loc.lng);

      // Jika tidak ada koordinat, coba parsing dari URL GMaps
      if ((isNaN(lat) || isNaN(lng)) && loc.gmaps) {
        const coords = parseGmapsUrlFromString(loc.gmaps);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      if (isNaN(lat) || isNaN(lng)) {
        console.log('Skipping location (no coords):', loc.name);
        return;
      }

      const status = loc.status === 'terpasang' ? 'Terpasang' : 'Rencana';
      const markerColor = loc.status === 'terpasang' ? '#10B981' : '#F59E0B';
      const badgeCls = loc.status === 'terpasang' ? 'badge-safe' : 'badge-warning';
      const badgeIcon = loc.status === 'terpasang' ? 'fa-circle-check' : 'fa-clock';
      L.circleMarker([lat, lng], {
        radius: 7,
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: 0.85,
        weight: 2
      }).bindPopup(`<div class="popup-card"><div class="popup-header"><div class="popup-loc-name">${esc(loc.name || 'Titik Pengaduan')}</div></div><div class="popup-body"><div class="popup-status-badge ${badgeCls}"><i class="fas ${badgeIcon}"></i> ${status}</div></div></div>`).addTo(layer);
    });
  }
}

// Helper function to parse GMaps URL (same logic as admin.html)
function parseGmapsUrlFromString(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url.trim());
    const params = new URLSearchParams(urlObj.search);
    const q = params.get('q');
    if (q) {
      const parts = q.split(',');
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
      }
    }
    if (urlObj.pathname.includes('@')) {
      const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
    }
  } catch (e) { }
  return null;
}

function renderAllFixedLocations() {
  if (fixedLocationLayerMain) {
    renderFixedLocations(fixedLocationLayerMain);
  }
  if (fixedLocationLayerPicker) {
    renderFixedLocations(fixedLocationLayerPicker);
  }
}

function switchPetaTab(tab) {
  // Update active tab button
  document.querySelectorAll('.peta-tab').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');

  // Update judul & deskripsi panel
  const titles = {
    sebaran: { title: 'Peta 1 — Sebaran Titik Lokasi Rawan', desc: 'Menampilkan sebaran titik lokasi area rawan berdasarkan jumlah laporan masuk dari warga kampus ITS.' },
    heatmap: { title: 'Peta 2 — Heatmap Kerawanan', desc: 'Menampilkan konsentrasi area rawan berdasarkan skor kerawanan yang diberikan oleh pelapor.' },
    fasilitas: { title: 'Peta 3 — Kelayakan Fasilitas', desc: 'Menampilkan penilaian kondisi fisik area berdasarkan parameter pencahayaan, CCTV, kepadatan, petugas keamanan, dan vegetasi.' },
  };

  // Update tampilan layer sesuai tab
  if (tab === 'sebaran') {
    // Titik + Cluster aktif, heatmap off
    visHeatmap = false;
    visPoint = true;
    visCluster = false;
    document.querySelector('#tog-heatmap input').checked = false;
    document.querySelector('#tog-point input').checked = true;
    document.querySelector('#tog-cluster input').checked = false;

    // Tampilkan tombol layer Peta 1
    document.querySelectorAll('.layer-card').forEach(l => l.style.display = 'none');
    document.querySelectorAll('.layer-p1').forEach(l => l.style.display = 'flex');
    activeLayer = 'semua';
    document.querySelector('.layer-p1[data-layer="semua"] input').checked = true;
  } else if (tab === 'heatmap') {
    // Heatmap aktif, titik off
    visHeatmap = true;
    visPoint = false;
    visCluster = false;
    document.querySelector('#tog-heatmap input').checked = true;
    document.querySelector('#tog-point input').checked = false;
    document.querySelector('#tog-cluster input').checked = false;

    // Tampilkan tombol layer Peta 2
    document.querySelectorAll('.layer-card').forEach(l => l.style.display = 'none');
    document.querySelectorAll('.layer-p2').forEach(l => l.style.display = 'flex');
    activeLayer = 'semua-2';
    document.querySelector('.layer-p2[data-layer="semua-2"] input').checked = true;
  } else if (tab === 'fasilitas') {
    // Titik aktif dengan simbologi kondisi fisik
    visHeatmap = false;
    visPoint = true;
    visCluster = false;
    document.querySelector('#tog-heatmap input').checked = false;
    document.querySelector('#tog-point input').checked = true;
    document.querySelector('#tog-cluster input').checked = false;

    // Tampilkan tombol layer Peta 3
    document.querySelectorAll('.layer-card').forEach(l => l.style.display = 'none');
    document.querySelectorAll('.layer-p3').forEach(l => l.style.display = 'flex');
    activeLayer = 'semua-3';
    document.querySelector('.layer-p3[data-layer="semua-3"] input').checked = true;
  }

  renderLeafletMap();
}

function switchBasemap(btn) {
  const bm = btn.dataset.bm;
  currentBm = bm;
  document.querySelectorAll('.bm-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (!leafletMap) return;
  leafletMap.eachLayer(l => { if (l === baseTile) leafletMap.removeLayer(l); });
  const cfg = BASEMAPS[bm];
  baseTile = L.tileLayer(cfg.url, { attribution: cfg.attr, ...cfg.opt }).addTo(leafletMap);
  baseTile.bringToBack();
}

function switchLayer(radio) {
  activeLayer = radio.parentElement.dataset.layer;
  document.querySelectorAll('.layer-card').forEach(c => c.classList.toggle('active', c.dataset.layer === activeLayer));
  const el = document.getElementById('activeLayerName');
  if (el) el.textContent = getLayerLabel(activeLayer);
  renderLeafletMap();
}

function toggleVis(type, cb) {
  if (type === 'heatmap') visHeatmap = cb.checked;
  if (type === 'point') visPoint = cb.checked;
  if (type === 'cluster') visCluster = cb.checked;
  document.getElementById('tog-' + type)?.classList.toggle('active', cb.checked);
  renderLeafletMap();
}

function applyPinToggleVisual(el, isActive) {
  if (!el) return;
  el.dataset.active = isActive ? 'true' : 'false';
  el.setAttribute('aria-pressed', isActive ? 'true' : 'false');

  const icon = el.querySelector('i');
  if (icon) {
    icon.className = isActive ? 'fas fa-check-circle' : 'fas fa-times-circle';
    icon.style.fontSize = '0.85rem';
  }

  if (isActive) {
    el.style.background = 'rgba(242,132,130,.14)';
    el.style.border = '1px solid rgba(242,132,130,.45)';
    el.style.color = '#D56A6A';
    el.style.opacity = '1';
    return;
  }

  el.style.background = 'rgba(0,0,0,.05)';
  el.style.border = '1px solid rgba(0,0,0,.15)';
  el.style.color = '#aaa';
  el.style.opacity = '0.65';
}

function setPinVisibility(type, isActive, opts = {}) {
  const render = opts.render !== false;

  if (type === 'fixedpin') visFixedPin = isActive;
  if (type === 'jurusan') visJurusan = isActive;

  const id = type === 'fixedpin' ? 'tog-fixedpin' : 'tog-jurusan';
  applyPinToggleVisual(document.getElementById(id), isActive);

  if (!render) return;
  if (fixedLocationLayerPicker) {
    renderFixedLocations(fixedLocationLayerPicker);
  }
  if (leafletMap) {
    renderLeafletMap();
  } else if (fixedLocationLayerMain) {
    renderFixedLocations(fixedLocationLayerMain);
  }
}

function handlePinToggle(type, el) {
  const currentlyActive = el.dataset.active !== 'false';
  setPinVisibility(type, !currentlyActive, { render: true });
}

function openLightbox(url) {
  const lb = document.getElementById('photoLightbox');
  const img = document.getElementById('lightboxImg');
  if (!lb || !img) return;
  img.src = url;
  lb.style.display = 'flex';
}

function closeLightbox() {
  const lb = document.getElementById('photoLightbox');
  if (lb) { lb.style.display = 'none'; document.getElementById('lightboxImg').src = ''; }
}

// Identical to admin.html getPhotoUrl — use /media/ route (storage/ blocked on hosting)
function getPhotoUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const clean = String(path)
    .replace(/\\/g, '/')
    .replace(/^\/?storage\//, '')
    .replace(/^\/+/, '');
  const base = (window.location.origin && window.location.origin !== 'null')
    ? window.location.origin
    : '';
  return `${base}/media/${encodeURI(clean)}`;
}

// Init pin toggle buttons via addEventListener (more robust than inline onclick)
function initPinToggles() {
  const defs = [
    { id: 'tog-fixedpin', type: 'fixedpin' },
    { id: 'tog-jurusan', type: 'jurusan' },
  ];

  defs.forEach(({ id, type }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.cursor = 'pointer';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    if (el.dataset.bound === '1') return;
    el.dataset.bound = '1';

    el.addEventListener('click', function (e) {
      e.stopPropagation();
      handlePinToggle(type, this);
    });

    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      e.stopPropagation();
      handlePinToggle(type, this);
    });
  });

  setPinVisibility('fixedpin', visFixedPin, { render: false });
  setPinVisibility('jurusan', visJurusan, { render: false });
}

// ============================================================
// STATS & COUNTS
// ============================================================
function updateStats() {
  fetchStats();
}

function updateLayerCounts() {
  const set = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
  set('cnt-semua', reports.length);
  set('cnt-semua-2', reports.length);
  set('cnt-semua-3', reports.length);
  set('cnt-tinggi', reports.filter(r => isRawanTinggi(r.skorRawan)).length);
  set('cnt-sedang', reports.filter(r => isRawanSedang(r.skorRawan)).length);
  set('cnt-rendah', reports.filter(r => isRawanRendah(r.skorRawan)).length);
  set('cnt-gelap', reports.filter(r => r.pencahayaan === 'Gelap').length);
  set('cnt-sepi', reports.filter(r => isSepi(r.kepadatan)).length);
  set('cnt-nocctv', reports.filter(r => r.cctv === 'Tidak ada').length);
  set('cnt-minim', reports.filter(r => isMinimPetugas(r.petugas)).length);

  set('cnt-layak', reports.filter(r => calcKelayakan(r).status === 'Layak').length);
  set('cnt-cukup-layak', reports.filter(r => calcKelayakan(r).status === 'Cukup Layak').length);
  set('cnt-kurang-layak', reports.filter(r => calcKelayakan(r).status === 'Kurang Layak').length);
}

function updateTopAreas(data) {
  const list = document.getElementById('topAreasList');
  if (!list) return;
  const rows = Array.isArray(data) ? data : reports;
  const counts = {};
  rows.forEach(r => {
    const key = (r.lokasi || '').trim();
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!sorted.length) {
    list.innerHTML = '<li class="analysis-empty">Belum ada data untuk analisis.</li>';
    return;
  }
  list.innerHTML = sorted.map(([name, count], idx) => `
    <li>
      <span class="rank-badge">${idx + 1}</span>
      <span class="area-name">${esc(name)}</span>
      <span class="area-count">${count}</span>
    </li>`).join('');
}

function updateHeatmapAnalysis(data, filterWaktu, filterBulan) {
  const el = document.getElementById('heatmapAnalysis');
  if (!el) return;
  if (!data || data.length === 0) { el.textContent = 'Belum ada data untuk analisis heatmap.'; return; }
  const counts = {};
  data.forEach(r => {
    const key = (r.lokasi || '').trim();
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (!sorted.length) { el.textContent = 'Belum ada lokasi untuk analisis heatmap.'; return; }

  // Menghilangkan angka jumlah laporan (c) sesuai permintaan USER
  const names = sorted.map(([n, c]) => n);

  const period = [];
  if (filterWaktu) period.push(filterWaktu.toLowerCase());
  if (filterBulan) period.push(`bulan ${getMonthName(filterBulan)}`);
  const suffix = period.length ? ` (filter ${period.join(', ')})` : '';

  const scores = data.map(r => r.skorRawan).filter(v => typeof v === 'number' && !isNaN(v));
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  let avgLabel = '';
  if (avg !== null) {
    if (avg >= 3.6) avgLabel = 'Tinggi';
    else if (avg >= 2.1) avgLabel = 'Sedang';
    else avgLabel = 'Rendah';
  }

  const avgText = avgLabel ? ` Tingkat kerawanan rata-rata: ${avgLabel}.` : '';
  el.textContent = `Hotspot tertinggi${suffix}: ${names.join(', ')}.${avgText}`;
}

function getMonthName(n) {
  const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return names[parseInt(n, 10) - 1] || '';
}

// ============================================================
// CHART TREN LAPORAN (Chart.js)
// ============================================================
let laporanChartInstance = null;

if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
  Chart.register(ChartDataLabels);
}

function renderLaporanChart() {
  const ctx = document.getElementById('laporanChart');
  if (!ctx) return;

  const filterWaktu = document.getElementById('laporanChartFilter')?.value || '';
  let data = reports;
  if (filterWaktu) data = data.filter(r => r.waktu === filterWaktu);

  // Hitung jumlah per bulan
  const monthCounts = new Array(12).fill(0);
  data.forEach(r => {
    const d = parseReportDate(r);
    if (d) monthCounts[d.getMonth()]++;
  });

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  if (typeof Chart === 'undefined' || typeof ChartDataLabels === 'undefined') {
    setTimeout(renderLaporanChart, 500);
    return;
  }

  Chart.register(ChartDataLabels);

  if (laporanChartInstance) {
    laporanChartInstance.destroy();
  }

  laporanChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [{
        label: 'Jumlah Laporan',
        data: monthCounts,
        backgroundColor: '#84A59D',
        borderColor: '#4A615C',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#555',
          font: { weight: 'bold' },
          formatter: Math.round
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

// ============================================================
// EXPORT
// ============================================================
function exportGeoJSON() {
  const pts = reports.filter(r => r.lat && r.lng);
  if (!pts.length) { showToast('Tidak ada data koordinat.', 'error'); return; }
  const gj = {
    type: 'FeatureCollection',
    features: pts.map(r => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
      properties: {
        id: r.id,
        peran_kampus: r.peran,
        jenis_kelamin: r.kelamin,
        pencahayaan: r.pencahayaan,
        kepadatan: r.kepadatan,
        cctv: r.cctv,
        petugas_keamanan: r.petugas,
        waktu_rawan: r.waktu,
        skor_rawan: r.skorRawan,
        skor_nyaman: r.skorNyaman,
        lokasi: r.lokasi,
        fakultas: r.fakultas || getFacultyFromLocationName(r.lokasi),
        created_at: r.createdAt,
        status: r.status,
        lokasi_deskripsi: r.lokasiDeskripsi || null,
        foto_path: r.fotoPath || null,
      }
    }))
  };
  dlFile(JSON.stringify(gj, null, 2), 'itsafe_area_rawan.geojson', 'application/json');
  showToast('GeoJSON diunduh - siap buka di QGIS.', 'success');
}

function dlFile(content, filename, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename; a.click();
}

function exportMarkersCSV() {
  const pts = reports.filter(r => r.lat && r.lng);
  if (!pts.length) { showToast('Tidak ada data koordinat.', 'error'); return; }

  // Headers
  let csv = "ID,Peran Kampus,Jenis Kelamin,Pencahayaan,Kepadatan,CCTV,Petugas Keamanan,Waktu Rawan,Skor Rawan,Skor Nyaman,Lokasi,Fakultas,Deskripsi,Status\n";

  pts.forEach(r => {
    const row = [
      r.id,
      r.peran || '',
      r.kelamin || '',
      r.pencahayaan || '',
      r.kepadatan || '',
      r.cctv || '',
      r.petugas || '',
      r.waktu || '',
      r.skorRawan || '',
      r.skorNyaman || '',
      `"${r.lokasi || ''}"`,
      r.fakultas || '',
      `"${(r.lokasiDeskripsi || '').replace(/"/g, '""')}"`,
      r.status || ''
    ];
    csv += row.join(',') + '\n';
  });

  dlFile(csv, 'itsafe_area_rawan.csv', 'text/csv;charset=utf-8;');
  showToast('CSV diunduh.', 'success');
}

// ============================================================
// DEMO DATA (tetap ada untuk testing)
// ============================================================
function loadDemoData() {
  const demo = [];
  const pencahayaanOpts = ['Terang', 'Remang-remang', 'Gelap'];
  const kepadatanOpts = ['Ramai', 'Cukup ramai', 'Sepi', 'Sangat sepi'];
  const cctvOpts = ['Ada dan terlihat jelas', 'Ada tapi tidak yakin aktif', 'Tidak ada'];
  const petugasOpts = ['Sering ada', 'Kadang ada', 'Jarang ada', 'Tidak pernah ada'];
  const waktuOpts = ['Pagi', 'Siang', 'Sore', 'Malam'];
  const lokOpts = ['Gedung Kuliah Bersama', 'Perpustakaan ITS', 'Taman Alumni', 'Area Parkir', 'Koridor Kampus', 'Masjid Manarul Ilmi', 'Fasor ITS', 'Kantin Teknik', 'Jalan Raya Kampus', 'Bundaran ITS'];

  for (let i = 0; i < 40; i++) {
    let lat = -7.283 + (Math.random() * 0.01 - 0.005);
    let lng = 112.795 + (Math.random() * 0.008 - 0.004);
    let attempts = 0;
    while (attempts < 100) {
      lat = -7.283 + (Math.random() * 0.01 - 0.005);
      lng = 112.795 + (Math.random() * 0.008 - 0.004);
      if (typeof isPointInBoundary === 'function' && boundaryPolygons && boundaryPolygons.length) {
        if (isPointInBoundary(lat, lng)) break;
      } else {
        break;
      }
      attempts++;
    }

    demo.push({
      lat: lat,
      lng: lng,
      lokasi: lokOpts[Math.floor(Math.random() * lokOpts.length)],
      waktu: waktuOpts[Math.floor(Math.random() * waktuOpts.length)],
      pencahayaan: pencahayaanOpts[Math.floor(Math.random() * pencahayaanOpts.length)],
      kepadatan: kepadatanOpts[Math.floor(Math.random() * kepadatanOpts.length)],
      cctv: cctvOpts[Math.floor(Math.random() * cctvOpts.length)],
      petugas: petugasOpts[Math.floor(Math.random() * petugasOpts.length)],
      skorRawan: Math.floor(Math.random() * 5) + 1,
      skorNyaman: Math.floor(Math.random() * 3) + 1,
      createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      lokasiDeskripsi: 'Ini adalah data demo tersebar secara acak.',
      fotoPath: Math.random() > 0.5 ? 'https://picsum.photos/seed/' + Math.floor(Math.random() * 1000) + '/400/300' : null
    });
  }

  demo.forEach((d, i) => reports.push({
    id: Date.now() + i,
    createdAt: d.createdAt,
    kelamin: d.kelamin || null,
    peran: d.peran || null,
    pencahayaan: d.pencahayaan,
    kepadatan: d.kepadatan,
    cctv: d.cctv,
    petugas: d.petugas,
    waktu: d.waktu,
    skorRawan: d.skorRawan,
    skorNyaman: d.skorNyaman,
    lokasi: d.lokasi,
    lokasiDeskripsi: d.lokasiDeskripsi,
    fotoPath: d.fotoPath,
    lat: d.lat,
    lng: d.lng,
    fakultas: getFacultyFromLocationName(d.lokasi), isDemo: true,
  }));
  updateLayerCounts();
  if (leafletMap) renderLeafletMap();
  if (typeof renderLaporanChart === 'function') renderLaporanChart();
  showToast(demo.length + ' Data demo disebar.', 'success');
}

function clearDemoData() {
  const before = reports.length;
  reports = reports.filter(r => !r.isDemo);
  const removed = before - reports.length;
  updateLayerCounts();
  if (leafletMap) renderLeafletMap();
  showToast(removed ? 'Data demo dihapus.' : 'Tidak ada data demo.', removed ? 'success' : 'error');
}

// ============================================================
// QR CODE
// ============================================================
let qrInstance = null;
function generateQR() {
  const cont = document.getElementById('qrCodeContainer');
  const url = QR_URL;
  if (!cont) return;
  cont.innerHTML = '';
  try {
    qrInstance = new QRCode(cont, { text: url, width: 220, height: 220, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.H });
  } catch (e) {
    cont.innerHTML = `<div class="qr-placeholder-inner"><i class="fas fa-qrcode"></i><p>QR Code</p></div>`;
  }
  const d = document.getElementById('qrUrlDisplay');
  if (d) d.textContent = url;
}

// ============================================================
// LOCATION CARDS
// ============================================================
function gmapsLink(name) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ITS Surabaya')}`;
}

function renderLocationCards(filter) {
  const grid = document.getElementById('locationGrid');
  if (!grid) return;
  const list = filter === 'all' ? LOCATIONS : LOCATIONS.filter(l => l.status === filter);
  grid.innerHTML = list.map(loc => `
    <div class="location-card" data-status="${loc.status}">
      ${loc.photo
      ? `<div class="location-img"><img src="${loc.photo}" alt="Foto ${esc(loc.name)}" onerror="this.parentElement.innerHTML='<div class=&quot;location-img-placeholder&quot;><i class=&quot;fas ${loc.icon || 'fa-location-dot'}&quot;></i><span>Foto lokasi</span></div>'"/></div>`
      : `<div class="location-img-placeholder"><i class="fas ${loc.icon || 'fa-location-dot'}"></i><span>Foto lokasi</span></div>`
    }
      <div class="location-body">
        <div class="location-name">${loc.name}</div>
        <div class="location-desc">${loc.desc}</div>
        <div class="location-meta">
          <span class="location-status status-${loc.status}">
            <i class="fas ${loc.status === 'terpasang' ? 'fa-circle-check' : 'fa-clock'}"></i>
            ${loc.status === 'terpasang' ? 'Terpasang' : 'Rencana'}
          </span>
          ${loc.count > 0 ? `<span class="location-count"><i class="fas fa-file-lines"></i> ${loc.count} laporan</span>` : ''}
        </div>
        <a href="${loc.gmaps || gmapsLink(loc.name)}" target="_blank" rel="noopener" class="location-gmaps-link"><i class="fas fa-map-location-dot"></i> Buka di Google Maps</a>
      </div>
    </div>`).join('');
}

function filterLocations(btn) {
  document.querySelectorAll('.loc-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLocationCards(btn.dataset.filter);
}

// ============================================================
// TEAM
// ============================================================
function renderTeam() {
  const g = document.getElementById('teamGrid');
  if (!g) return;
  g.innerHTML = TEAM.map(m => `
    <div class="team-card">
      <div class="team-avatar">
        ${m.photo ? `<img src="${m.photo}" alt="Foto ${esc(m.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
        <div class="team-avatar-fallback" ${m.photo ? 'style="display:none"' : ''}>${m.initial}</div>
      </div>
      <div class="team-name">${m.name}</div>
      <div class="team-nrp">${m.nrp}</div>
    </div>`).join('');
}

// ============================================================
// HELPERS
// ============================================================
function getRiskColor(score) {
  const s = parseInt(score, 10);
  return RISK_COLORS[s] || '#A78BFA';
}

function isRawanTinggi(score) {
  const s = parseInt(score, 10);
  return !isNaN(s) && s >= 4;
}

function isRawanSedang(score) {
  const s = parseInt(score, 10);
  return s === 3;
}

function isRawanRendah(score) {
  const s = parseInt(score, 10);
  return !isNaN(s) && s <= 2;
}

function isSepi(val) {
  return val === 'Sepi' || val === 'Sangat sepi';
}

function isMinimPetugas(val) {
  return val === 'Jarang ada' || val === 'Tidak pernah ada';
}

function matchesLayer(r, layer) {
  switch (layer) {
    case 'rawan-tinggi':
      return isRawanTinggi(r.skorRawan);
    case 'rawan-sedang':
      return isRawanSedang(r.skorRawan);
    case 'rawan-rendah':
      return isRawanRendah(r.skorRawan);
    case 'gelap':
      return r.pencahayaan === 'Gelap';
    case 'sepi':
      return isSepi(r.kepadatan);
    case 'nocctv':
      return r.cctv === 'Tidak ada';
    case 'minim-petugas':
      return isMinimPetugas(r.petugas);
    case 'layak':
      return calcKelayakan(r).status === 'Layak';
    case 'cukup-layak':
      return calcKelayakan(r).status === 'Cukup Layak';
    case 'kurang-layak':
      return calcKelayakan(r).status === 'Kurang Layak';
    default:
      return true;
  }
}

function getLayerLabel(layer) {
  const labels = {
    'semua': 'Semua Laporan',
    'semua-2': 'Semua Laporan',
    'semua-3': 'Semua Fasilitas',
    'rawan-tinggi': 'Rawan Tinggi',
    'rawan-sedang': 'Rawan Sedang',
    'rawan-rendah': 'Rawan Rendah',
    'gelap': 'Area Gelap',
    'sepi': 'Area Sepi',
    'nocctv': 'Tanpa CCTV',
    'minim-petugas': 'Minim Petugas',
    'layak': 'Layak',
    'cukup-layak': 'Cukup Layak',
    'kurang-layak': 'Kurang Layak',
  };
  return labels[layer] || layer;
}

function parseReportDate(r) {
  if (r && r.createdAt) {
    const d = new Date(r.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (r && r.tanggal) return parseTanggal(r.tanggal);
  return null;
}

function normalizeTanggalInput(str) {
  const d = parseTanggal(str);
  if (!d || isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseTanggal(str) {
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str + 'T00:00:00');
  const m = String(str).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.className = 'toast'; }, 3500);
}

window.addEventListener('resize', () => {
  if (leafletMap) leafletMap.invalidateSize();
  if (pickerMap) pickerMap.invalidateSize();
});

/* ============================================================
   ITSafe – Form UX Enhancements
   Progress bar · Star ratings · Pill buttons · Fill highlight
============================================================ */

(function () {

  /* ── Progress bar ─────────────────────────────────────── */
  const REQUIRED_IDS = [
    'emailIts', 'peranKampus', 'lokasiInsiden', 'lokasiDeskripsi',
    'pencahayaan', 'kepadatan', 'cctv', 'petugasKeamanan', 'waktuInsiden',
    'skorNyaman', 'skorRawan', 'kronologi'
  ];
  const OPTIONAL_IDS = [
    'jenisKelamin', 'vegetasi', 'hariRawan', 'alasanTidakNyaman',
    'pernahHindari', 'orangLain', 'situasiMencurigakan',
    'kontakPelapor', 'fotoLokasi'
  ];
  const ALL_IDS = [...REQUIRED_IDS, ...OPTIONAL_IDS];

  function isFilled(el) {
    if (!el) return false;
    if (el.type === 'file') return !!(el.files && el.files.length);
    if (el.type === 'checkbox') return el.checked;
    return !!(el.value && el.value.trim() !== '');
  }

  function calcProgress() {
    let filled = 0;
    ALL_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (isFilled(el)) filled++;
    });
    return Math.round((filled / ALL_IDS.length) * 100);
  }

  function updateProgress() {
    const pct = calcProgress();
    const fill = document.getElementById('progressFill');
    const label = document.getElementById('progressPercent');
    if (fill) fill.style.width = pct + '%';
    if (label) {
      let msg = pct === 0 ? '0% terisi' :
        pct < 40 ? `${pct}% — Lanjutkan pengisian.` :
          pct < 70 ? `${pct}% — Sudah mendekati setengah.` :
            pct < 100 ? `${pct}% — Hampir selesai.` :
              `100% — Siap dikirim.`;
      label.textContent = msg;
    }
    /* highlight filled inputs */
    ALL_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (isFilled(el)) {
        el.classList.add('filled');
      } else {
        el.classList.remove('filled');
      }
    });
  }

  /* ── Star ratings ─────────────────────────────────────── */
  function initStarRating(rowEl) {
    const targetId = rowEl.dataset.target;
    const type = rowEl.dataset.type; // 'comfort' | 'danger'
    const btns = rowEl.querySelectorAll('.star-btn');
    const select = document.getElementById(targetId);
    const hintEl = rowEl.closest('.star-rating-group')
      .querySelector('.star-hint');

    const labels = {
      comfort: ['Sangat tidak nyaman', 'Tidak nyaman', 'Cukup nyaman', 'Nyaman', 'Sangat nyaman'],
      danger: ['Tidak rawan', 'Sedikit rawan', 'Cukup rawan', 'Rawan', 'Sangat rawan']
    };

    function paint(val) {
      btns.forEach((b, i) => {
        b.classList.remove('active', 'active-red');
        if (i < val) {
          b.classList.add(type === 'danger' ? 'active-red' : 'active');
        }
      });
      if (hintEl && val > 0) {
        hintEl.textContent = (labels[type] || [])[val - 1] || '';
      }
    }

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.val);
        if (select) { select.value = val; }
        paint(val);
        updateProgress();
      });
      btn.addEventListener('mouseenter', () => paint(parseInt(btn.dataset.val)));
      btn.addEventListener('mouseleave', () => paint(select ? parseInt(select.value) || 0 : 0));
    });
  }

  /* ── Pill buttons ─────────────────────────────────────── */
  function initPillGroup(groupEl) {
    const btns = groupEl.querySelectorAll('.pill-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const val = btn.dataset.val;
        /* deselect all in group */
        btns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        /* sync hidden select */
        const sel = document.getElementById(targetId);
        if (sel) {
          for (let opt of sel.options) {
            if (opt.value === val || opt.text === val) {
              sel.value = opt.value; break;
            }
          }
        }
        /* little bounce animation */
        btn.style.transform = 'scale(1.08)';
        setTimeout(() => btn.style.transform = '', 150);
        updateProgress();
      });
    });
  }

  /* ── Animate panels in on scroll ─────────────────────── */
  function initScrollAnimate() {
    const panels = document.querySelectorAll('.form-col-panel.animate-in');
    if (!panels.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.animationPlayState = 'running';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    panels.forEach(p => {
      p.style.animationPlayState = 'paused';
      obs.observe(p);
    });
  }

  /* ── Pop-up animations on scroll ──────────────────────– */
  function initPopUpAnimations() {
    // Auto-add animate-pop to stat-cards, team-cards, location-cards, etc
    const elementsToAnimate = document.querySelectorAll(
      '.stat-card, .team-card, .location-card, .about-info-card, .hero-content h1, .hero-actions, .info-card'
    );

    let delayCounter = 0;
    elementsToAnimate.forEach(el => {
      if (el.classList.contains('animate-pop')) return; // Skip if already has it
      el.classList.add('animate-pop');
      const delayClass = `delay-${(delayCounter % 5) + 1}`;
      el.classList.add(delayClass);
      delayCounter++;
    });

    // Intersection Observer untuk trigger animasi
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.classList.contains('animate-pop')) {
          // Already animated from CSS, just make sure opacity is 1
          if (window.getComputedStyle(entry.target).opacity !== '1') {
            entry.target.style.opacity = '1';
          }
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    elementsToAnimate.forEach(el => observer.observe(el));
  }

  /* ── Boot ─────────────────────────────────────────────── */
  function boot() {
    /* star rows */
    document.querySelectorAll('.star-row').forEach(initStarRating);
    /* pill groups */
    document.querySelectorAll('.pill-group').forEach(initPillGroup);
    /* progress: listen to all form fields */
    ALL_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', updateProgress);
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        el.addEventListener('input', updateProgress);
      }
    });
    /* scroll animate */
    initScrollAnimate();
    /* pop-up animations */
    initPopUpAnimations();
    /* initial paint */
    updateProgress();
  }

  // Ensure boot is accessible if needed, but we typically call it from the master boot
  window.itsafeBootUI = boot;

})();
