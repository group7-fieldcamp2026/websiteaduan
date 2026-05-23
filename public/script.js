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
let visHeatmap = false;
let visPoint = true;
let visCluster = false;
let visFixedPinMain = true;
let visJurusanMain = true;
let visFasumMain = true;
let visFixedPinForm = true;
let visJurusanForm = true;
let visFasumForm = true;

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
let fasumGeoJSON = null;
let fasumAreas = [];
let fasumLoadPromise = null;
let currentBm = 'osm';
let editingReport = null;
let currentHistoryEmail = '';
let reportEmailVerified = false;
let verifiedReportEmail = '';

const BOUNDARY_SRC_CRS = 'EPSG:32749';
const BOUNDARY_SRC_DEF = '+proj=utm +zone=49 +south +datum=WGS84 +units=m +no_defs';
const BOUNDARY_DST_CRS = 'EPSG:4326';
const BOUNDARY_DST_DEF = '+proj=longlat +datum=WGS84 +no_defs';
const BOUNDARY_ZIP_B64 = 'UEsDBBQAAAAIAIVkqlyt0V4Q+AUAAHwPAAAQAAAAQmF0YXNXaWxheWFoLnNocO3WezSUaRgA8GEKbaVOnS3lEmUmNZXJsXJJ+VRyH0oSuS1rUzlIO9TBumRzLZLDWmErSbQJIZdp2tIiSeQyySUZxiWEQop9nm90ajv9sf92ju+fz8873zPv+7zP+3xDoaz9jvLVS5wjoFIoi+Cv0BDr2NzdNILNkquSC3MkdC63bRvdSyMWiDIeioQ7El8+OU1eg9Mf7/AvEYgX+n9iwQcp7Jk46m0sEz9jGnFQnnAfhM82DY323gAzpOJkhsDjGa9zasG86jGtXrCgZnUxB3zdtfXeS7DDYqvfS8BHGG+lO8DlbM6vuWCTkTNhPDCzRbGrFLySa6PGmxnngttYUdp1wnF6NVgvf6T5ycz4I7BnVkTagxk/A59O3y/GFc5HpQvs6j50lgP2KJs6ttiERiRdXLMb7XMybYGj0M0lYPkK/nQlmDovnI9W8o9cMSD0rdIwMq86ZqY0oqbe8ke0joAXmQJW21qaig6oyeVJsGiEPPF6/n1cr3j1gRjwG8MDolXg1MF0ejf4RA/dHuc/nvpzbjDYacDapQnnJ72Q8hjihTrZTnWCa6qqIs3BY2L2qwdm5iMBPpm2wWgE8+G9UUEEvJxXnTmK7vor7Rr4e9kKxpgwHymLIX7X9sv24zi/yNsR7mBKjH/sBFh9a6lKF9j2uZ7jJDghelHiETMaYaWRV/seXCgXkhkBDj/Tyf6ALoxyuWRG7l/EFK5HpKSsGFzB5hygQK1AfbjVgytV7u/C2gngVt6dBtsVGVijm1QHE2jmsL7R5ni0R+CcNFPw6FHLYLTDc70dt8w/1d4hrTblAvCFADpzGr5PKtmuogJs/eY2B+fDXU5fKraHRqhezFuD8x9S35WuAO4puLHlnXC/h7XAftt/MEYXbhnvsAQfV4zn4/oDJjXN2OCr+yt932D+FFadLwIHKxsb84X7U7dpLxnfrxL3w9ZIIhrsO5ytm/+ZedonmDmfObfXi5WN9R+XsyABrOvAT8oE65eLy+aDf1NvyMz47Kz9tKKjNx3rhc3aNgJunvAPvYTrk0xaOrSXPG8vYjE+pTXoFbgzOLktGtfzLFy7FkzvDFYLx/i9cywwvkZe+eFQ8CHGW+8k8D7m+u4QXI+mx0CycDz5FDj7wuA/WeATVlfvBeF5tuxXdgIHxu2Y640uc7NYCo7NCPI6ivFcXB5wID+RzYd6nTGemL36YXBToJeeEdjs1MKzL2F/3MqmZExx/nWMNCo4m9r9gIX5jU71OQ/1MHnQ7boyxpf2FWmE+nMfCqFuAltJbqwtAosyTmfRsX4TivPRG54mStKw/qXiLCLB/VyN24phZL2suWlKum411nNAgcNjOK+OKvuUFMLI+prbCue/5Hhs+CqwxERqtypYfGjZO+x1AeYGH14Yfep9H3thla3ROYwX7T+ZeBe8Q6bPeS24nSOZdA9sU1fCV8L699C+1gJWjJ/eqobrCfS60rCbPL8cdVwPc31GMzh6s7fnNtwfs/eF4+BG1UElY8xnq2ellD6NWK957roF9p/sYwIWmGl8RdQOx0OdZG+CG5cMux7BcWtnLQE4xn/yvQfm93hsU6sBjZDkMLV8MT7VJ3OlIY3wsBfP+2OmHuXA3ZFKj1Lw/HBtdMQMyfVUpgufV/8Az+/vV+ajBXNUzV+DzaLih7E+A/TvyE6ABbwsU6xfh3UPmQ3gsV/auUVYf08oco1gR4s9GsXYT3vonvUGZL0WoNv1qD5Pwe/8D1Own0pYSpo8AbeKztNHSym37KwF20Nc7J8SgXHUfgOy/qLQ8k4DiQqGZL3YY7/m+slaKYLPdg6X3cH8j292YYDhHEn+jd83P9Z1J5jtKR2B/VdJ81zmMrCz7XPTFuF6E6TBvXE5+u3gq4/rl601JPurB76PUu3W9W0Bn1TL1MX+Wz5Q4WQIvn9zUwJf2G//tAHL9HUkdwnPi7sXmAjqiOkW5lu/wZDcv+QezJfKvmhrqK8laaUpfZif+YqCSXAtpTX7VRjZL//zPv36e3/2mr1mr2/h+vJ39ux99j57/3bu/wJQSwMEFAAAAAgAhWSqXOYgv7RBAAAAbAAAABAAAABCYXRhc1dpbGF5YWguc2h4Y2BQ52LADsxeMDMw8AMZHa1Rkze7qzqW+cudketMdHRYct/uS7CqIw+T9mnGrkRHdI3/weD9fxgNFDJiYGDvAABQSwMEFAAAAAgAhWSqXGbouA1lAAAApwEAABAAAABCYXRhc1dpbGF5YWguZGJmY65j5WJkYGBoZFAFURggOCOxIDXeJzUvncENxBfmxibvWJSaiF3eJ9QxGMp0BhH/0MznVVBQMNWzNDE1NLUwMzUzMU/VNjBWUDDSMzA2tbCwMDQxNDEFCpkhC5hYGFoqjCggBQBQSwMEFAAAAAgAhWSqXHDD/vECAQAAmQEAABAAAABCYXRhc1dpbGF5YWgucHJqbY9ba4QwEIX/S56DGO95FM1al2rEC4WKhOCmbkAixLT9+41bSrtt52EeznxzzkzT0nPWjeCp6BjCScCGvmLPmxIswB2ABaHFMbaNfSEA5mk/VCPIf0hd80BaWubfTgBGfpwgP3Zc6OHE8cLY8/ww8qcJNm1ZEetQaCHUu5yvALqOO8GhLnvrKxar3yQUB6HvYS9EGAf+5yo9k6wvaT2CXnO1vwm9C1YJPXOzaWCJtE0r0pN2BCe+2hnhu5FqATB0jzqC/jD1ps31BiHX/Q/LhDKar0eQvEiuLIjQL6ab+SrYic/HIfZ8jHF0BzxyI83rRTD6wqiWi1R3j1fCCLt42E4fUEsDBBQAAAAIAIVkqlxQPIEOBwAAAAUAAAAQAAAAQmF0YXNXaWxheWFoLmNwZwsNcdO1AABQSwECFAAUAAAACACFZKpcrdFeEPgFAAB8DwAAEAAAAAAAAAAAAAAAAAAAAAAAQmF0YXNXaWxheWFoLnNocFBLAQIUABQAAAAIAIVkqlzmIL+0QQAAAGwAAAAQAAAAAAAAAAAAAAAAACYGAABCYXRhc1dpbGF5YWguc2h4UEsBAhQAFAAAAAgAhWSqXGbouA1lAAAApwEAABAAAAAAAAAAAAAAAAAAlQYAAEJhdGFzV2lsYXlhaC5kYmZQSwECFAAUAAAACACFZKpccMP+8QIBAACZAQAAEAAAAAAAAAAAAAAAAAAoBwAAQmF0YXNXaWxheWFoLnByalBLAQIUABQAAAAIAIVkqlxQPIEOBwAAAAUAAAAQAAAAAAAAAAAAAAAAAFgIAABCYXRhc1dpbGF5YWguY3BnUEsFBgAAAAAFAAUANgEAAI0IAAAAAA==';

// --- BASEMAP CONFIGS ----------------------------------------
const BASEMAPS = {
  osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: 'Â© <a href="https://www.openstreetmap.org">OpenStreetMap</a>', opt: {} },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles Â© Esri', opt: {} },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: 'Â© <a href="https://carto.com">CARTO</a>', opt: { subdomains: 'abcd' } },
  topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: 'Â© <a href="https://opentopomap.org">OpenTopoMap</a>', opt: { maxNativeZoom: 17, maxZoom: 20 } },
};

const ITS = [-7.2756, 112.7951];
const ZOOM = 15;
const PICKER_INITIAL_ZOOM = 14;
const PICKER_INITIAL_BOUNDS = [
  [-7.2872, 112.7887],
  [-7.2708, 112.8024],
];
const QR_URL = 'https://itsafe.geowebgis.id/';
const OTHER_LOCATION_LABEL = 'Sekitar Kampus';
const NEARBY_LOCATION_RADIUS_METERS = 50;
const FASUM_GROUP_LABEL = 'Fasilitas Umum';
const FASUM_ZIP_PATH = 'assets/Fasum.zip';
const FASUM_COLOR = '#0EA5A4';

const FACULTY_COLORS = {
  'FSAD': '#4E79A7', // blue
  'FTIRS': '#F28E2B', // orange
  'FTSPK': '#76B7B2', // teal
  'FDKBD': '#59A14F', // green
  'FV': '#E15759', // red
  'FKK': '#B07AA1', // purple
  'FTEIC': '#20B2AA', // cyan
  'FTK': '#BAB0AC', // gray
  'Fasilitas Umum': FASUM_COLOR,
  'Lainnya': '#D4879A',
};

const FASUM_TYPE_COLORS = {
  'Asrama': '#38BDF8', // light blue (biru muda)
  'Fasilitas Akademik': '#8B5CF6', // purple (violet)
  'Fasilitas Umum': '#0EA5A4', // teal
  'Kantin': '#EC4899', // pink
  'Olahraga': '#F97316', // orange
  'Lainnya': '#9CA3AF' // gray
};

const RISK_COLORS = {
  1: '#10B981', // Hijau (Rawan Rendah)
  2: '#F59E0B', // Kuning (Rawan Sedang)
  3: '#EF4444', // Merah (Rawan Tinggi)
};

const MAP_MODE_META = {
  sebaran: {
    label: 'Sebaran Titik Lokasi Rawan',
    shortLabel: 'Sebaran Laporan',
    icon: 'fa-location-dot',
    color: '#D56A6A',
    shape: 'circle',
    note: 'Pin umum untuk semua laporan yang sudah tervalidasi.',
    popupTitle: 'Laporan tervalidasi',
    popupDesc: 'Output ini menunjukkan posisi laporan valid secara titik, tanpa pembobotan tambahan.'
  },
  heatmap: {
    label: 'Heatmap Kerawanan',
    shortLabel: 'Tingkat Kerawanan',
    icon: 'fa-fire-flame-curved',
    color: '#EF4444',
    shape: 'flame',
    note: 'Intensitas heatmap mengikuti total bobot penilaian subjektif pelapor.',
    popupTitle: 'Tingkat kerawanan',
    popupDesc: 'Output ini menonjolkan tingkat rawan dari gabungan skor dan jawaban subjektif pelapor.'
  },
  fasilitas: {
    label: 'Kelayakan Fasilitas',
    shortLabel: 'Kelayakan Fasilitas',
    icon: 'fa-building-shield',
    color: '#0EA5E9',
    shape: 'hex',
    note: 'Pin bangunan/perisai mengikuti hasil pembobotan kondisi fisik area.',
    popupTitle: 'Pembobotan fasilitas',
    popupDesc: 'Output ini membaca pencahayaan, kepadatan, CCTV, petugas, dan vegetasi.'
  }
};

const CONDITION_LAYER_VISUALS = {
  gelap: {
    label: 'Area Gelap',
    icon: 'fa-moon',
    color: '#374151',
    shape: 'diamond',
    desc: 'Ditampilkan karena laporan menyebut pencahayaan area gelap.'
  },
  sepi: {
    label: 'Area Sepi',
    icon: 'fa-person-walking',
    color: '#3B82F6',
    shape: 'square',
    desc: 'Ditampilkan karena kepadatan area sepi atau sangat sepi.'
  },
  nocctv: {
    label: 'Tanpa CCTV',
    icon: 'fa-video-slash',
    color: '#7C3AED',
    shape: 'notch',
    desc: 'Ditampilkan karena tidak ada CCTV pada area laporan.'
  },
  'minim-petugas': {
    label: 'Minim Petugas',
    icon: 'fa-user-shield',
    color: '#EA580C',
    shape: 'shield',
    desc: 'Ditampilkan karena petugas keamanan jarang atau tidak pernah ada.'
  }
};

let locationFacultyMap = {};

const LOGO_PHILOSOPHY_SLIDES = [
  {
    label: 'Identitas',
    title: 'ITSafe',
    img: 'assets/logo/ITSafe.png',
    alt: 'Logo ITSafe',
    glow: 'glow-itsafe',
    desc: 'Platform pelaporan dan pemetaan area berpotensi rawan tindak asusila di lingkungan ITS. Dikembangkan sebagai alat analisis geospasial untuk mengidentifikasi kerawanan area berdasarkan perspektif civitas kampus.'
  },
  {
    label: 'Perlindungan',
    title: 'Perisai',
    img: 'assets/logo/Shield.png',
    alt: 'Perisai',
    glow: 'glow-shield',
    desc: 'Perisai melambangkan perlindungan dan rasa aman bagi seluruh civitas kampus. Elemen ini mencerminkan komitmen ITSafe dalam menjaga keamanan melalui sistem yang terstruktur dan terpercaya.'
  },
  {
    label: 'Lokasi',
    title: 'Pin Lokasi',
    img: 'assets/logo/Pin.png',
    alt: 'Pin Lokasi',
    glow: 'glow-pin',
    desc: 'Pin lokasi merepresentasikan pelaporan berbasis titik atau lokasi kejadian. Simbol ini menegaskan bahwa setiap laporan memiliki konteks spasial yang jelas untuk dianalisis.'
  },
  {
    label: 'Geospasial',
    title: 'Peta',
    img: 'assets/logo/Map.png',
    alt: 'Peta',
    glow: 'glow-map',
    desc: 'Elemen peta menggambarkan visualisasi wilayah dan persebaran area rawan. Hal ini menunjukkan fungsi ITSafe sebagai alat analisis berbasis geospasial untuk mendukung pengambilan keputusan.'
  },
  {
    label: 'Empati',
    title: 'Warna Pink',
    img: 'assets/logo/Pink.png',
    alt: 'Warna Pink',
    glow: 'glow-pink',
    desc: 'Warna pink mencerminkan empati, kepedulian, dan pendekatan humanis terhadap isu keamanan.'
  },
  {
    label: 'Kepercayaan',
    title: 'Warna Biru',
    img: 'assets/logo/Biru.png',
    alt: 'Warna Biru',
    glow: 'glow-blue',
    desc: 'Warna biru melambangkan kepercayaan, stabilitas, dan profesionalitas sistem.'
  },
  {
    label: 'Kenyamanan',
    title: 'Warna Cream',
    img: 'assets/logo/Beige.png',
    alt: 'Warna Cream',
    glow: 'glow-cream',
    desc: 'Warna beige memberikan kesan netral, seimbang, dan nyaman secara visual.'
  }
];

let logoPhilosophyIndex = 0;

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

// ============================================================
// MOBILE SCROLL UX HELPERS
// ============================================================
function itsafeIsMobileLike() {
  try {
    if (typeof L !== 'undefined' && L.Browser && typeof L.Browser.mobile === 'boolean') {
      if (L.Browser.mobile) return true;
    }
  } catch { /* ignore */ }

  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return true;
      if (window.matchMedia('(pointer: coarse)').matches) return true;
    }
  } catch { /* ignore */ }

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.maxTouchPoints === 'number') {
      // Treat touch-enabled smaller viewports as "mobile-like" for map UX.
      if (navigator.maxTouchPoints > 0 && (window.innerWidth || 0) <= 1024) return true;
    }
  } catch { /* ignore */ }

  return false;
}

function itsafeIsIOSLike() {
  try {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    return /iPad|iPhone|iPod/.test(ua)
      || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  } catch {
    return false;
  }
}

function itsafeReleaseIOSScrollState() {
  if (!itsafeIsIOSLike()) return;
  document.documentElement.classList.add('ios-scroll-rescue');
  document.documentElement.style.overflowY = 'auto';
  document.body.style.overflowY = 'auto';
  if (!document.querySelector('.its-modal.open')) {
    document.body.classList.remove('itsafe-scroll-locked');
    document.body.style.position = '';
    document.body.style.top = '';
  }
}

function attachIOSMapScrollGuard(el) {
  if (!el || !itsafeIsIOSLike()) return;
  if (el.dataset.iosScrollGuard === '1') return;
  el.dataset.iosScrollGuard = '1';

  const allowPageScroll = (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    // Let iOS handle the native page scroll before Leaflet can capture it.
    e.stopImmediatePropagation();
    itsafeReleaseIOSScrollState();
  };

  el.addEventListener('touchstart', allowPageScroll, { capture: true, passive: true });
  el.addEventListener('touchmove', allowPageScroll, { capture: true, passive: true });
  el.addEventListener('touchend', (e) => {
    if (e.touches && e.touches.length > 0) return;
    if (!e.changedTouches || e.changedTouches.length !== 1) return;
    e.stopImmediatePropagation();
    itsafeReleaseIOSScrollState();
  }, { capture: true, passive: true });
}

function attachIOSNavbarScrollProxy() {
  if (!itsafeIsIOSLike()) return;
  const nav = document.getElementById('navbar');
  if (!nav || nav.dataset.iosScrollProxy === '1') return;
  nav.dataset.iosScrollProxy = '1';

  let startY = 0;
  let lastY = 0;
  let dragging = false;

  nav.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    startY = e.touches[0].clientY;
    lastY = startY;
    dragging = false;
  }, { passive: true });

  nav.addEventListener('touchmove', (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    const y = e.touches[0].clientY;
    const total = startY - y;
    const step = lastY - y;
    if (Math.abs(total) > 8) {
      dragging = true;
      window.scrollBy(0, step);
      e.preventDefault();
      e.stopPropagation();
    }
    lastY = y;
  }, { passive: false });

  nav.addEventListener('touchend', (e) => {
    if (!dragging) return;
    e.stopPropagation();
    dragging = false;
  }, { capture: true, passive: true });
}

function attachTwoFingerHint(el) {
  if (!el) return;
  if (el.dataset.twoFingerHint === '1') return;
  el.dataset.twoFingerHint = '1';

  const show = () => {
    el.classList.add('two-finger-hint');
  };
  const hide = () => el.classList.remove('two-finger-hint');

  // Passive listeners so page scroll stays smooth.
  el.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) show();
    else hide();
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length === 1) show();
    else hide();
  }, { passive: true });
  el.addEventListener('touchend', hide, { passive: true });
  el.addEventListener('touchcancel', hide, { passive: true });
}

function initLogoPhilosophyCarousel() {
  const carousel = document.getElementById('logoPhilosophyCarousel');
  const card = document.getElementById('logoCarouselCard');
  const dots = document.getElementById('logoCarouselDots');
  if (!carousel || !card) return;
  if (carousel.dataset.carouselReady === '1') return;
  carousel.dataset.carouselReady = '1';

  if (dots) {
    dots.innerHTML = LOGO_PHILOSOPHY_SLIDES.map((slide, index) => `
      <button type="button" class="logo-carousel-dot" onclick="goLogoPhilosophy(${index})" aria-label="Tampilkan ${slide.title}" title="${slide.title}"></button>
    `).join('');
  }

  card.addEventListener('click', (e) => {
    if (e.target.closest('.logo-carousel-btn, .logo-carousel-dot')) return;
    const rect = card.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    moveLogoPhilosophy(clickX >= rect.width / 2 ? 1 : -1);
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveLogoPhilosophy(-1);
    }
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      moveLogoPhilosophy(1);
    }
  });

  showLogoPhilosophySlide(logoPhilosophyIndex);
}

function showLogoPhilosophySlide(index) {
  const total = LOGO_PHILOSOPHY_SLIDES.length;
  const normalizedIndex = ((index % total) + total) % total;
  const slide = LOGO_PHILOSOPHY_SLIDES[normalizedIndex];
  logoPhilosophyIndex = normalizedIndex;

  const card = document.getElementById('logoCarouselCard');
  const img = document.getElementById('logoCarouselImg');
  const glow = document.getElementById('logoCarouselGlow');
  const count = document.getElementById('logoCarouselCount');
  const label = document.getElementById('logoCarouselLabel');
  const title = document.getElementById('logoCarouselTitle');
  const desc = document.getElementById('logoCarouselDesc');
  const dots = document.querySelectorAll('.logo-carousel-dot');

  if (img) {
    img.src = slide.img;
    img.alt = slide.alt;
  }
  if (glow) {
    glow.className = `logo-phil-glow ${slide.glow}`;
  }
  if (count) {
    count.textContent = `${String(normalizedIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  }
  if (label) label.textContent = slide.label;
  if (title) title.textContent = slide.title;
  if (desc) desc.textContent = slide.desc;

  dots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === normalizedIndex;
    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  if (card) {
    card.classList.remove('is-changing');
    void card.offsetWidth;
    card.classList.add('is-changing');
  }
}

function moveLogoPhilosophy(delta) {
  showLogoPhilosophySlide(logoPhilosophyIndex + delta);
}

function goLogoPhilosophy(index) {
  showLogoPhilosophySlide(index);
}

// ============================================================
// INIT
// ============================================================
function itsafeInit() {
  if (window._itsInitDone) return;
  window._itsInitDone = true;
  itsafeReleaseIOSScrollState();
  attachIOSNavbarScrollProxy();

  // Navigation & Form
  initNav();
  initForm();
  buildLocationFacultyMap();
  loadFasumAreas();

  // Data Fetching
  fetchReports();       // ambil data dari API
  fetchStats();         // ambil statistik dari API
  fetchLocations();     // ambil lokasi titik pengaduan

  // App Logic
  startRealtimeSync();  // sinkronisasi realtime (polling)

  generateQR();
  schedulePickerMapInit();
  initLogoPhilosophyCarousel();
  initFloatingMapControls();

  // Exposed Globals
  window.navigateTo = navigateTo;
  window.scrollToForm = scrollToForm;
  window.itsafeInit = itsafeInit;
  window.openHistoryModal = openHistoryModal;
  window.openEditReportModal = openEditReportModal;
  window.closeHistoryModal = closeHistoryModal;
  window.switchHistoryTab = switchHistoryTab;
  window.checkReportsByEmail = checkReportsByEmail;
  window.showReportDetail = showReportDetail;
  window.closeHistoryDetail = closeHistoryDetail;
  window.checkReportStatus = checkReportStatus;
  window.startReportEdit = startReportEdit;
  window.startReportEditFromInputs = startReportEditFromInputs;
  window.checkEditableReportsByEmail = checkEditableReportsByEmail;
  window.openReportEditFromSuccess = openReportEditFromSuccess;
  window.cancelReportEdit = cancelReportEdit;
  window.verifyReportEmail = verifyReportEmail;
  window.moveLogoPhilosophy = moveLogoPhilosophy;
  window.goLogoPhilosophy = goLogoPhilosophy;
  window.toggleMapControls = toggleMapControls;
  window.toggleMapFullscreen = toggleMapFullscreen;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', itsafeInit);
} else {
  itsafeInit();
}

// ============================================================
// FLOATING MAP CONTROLS & FULLSCREEN
// ============================================================
function getMapFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}

function invalidateMainMapSoon() {
  [80, 260, 620].forEach(delay => {
    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize();
    }, delay);
  });
}

function setMapFullscreenState(active) {
  const container = document.getElementById('mapContainer');
  const btn = document.getElementById('mapFullscreenBtn');
  if (!container) return;

  container.classList.toggle('is-fullscreen', active);
  document.body.classList.toggle('map-fullscreen-open', active);

  if (leafletMap?.scrollWheelZoom) {
    if (active) {
      leafletMap.scrollWheelZoom.enable();
    } else {
      leafletMap.scrollWheelZoom.disable();
    }
  }

  if (btn) {
    btn.setAttribute('aria-pressed', String(active));
    btn.title = active ? 'Keluar fullscreen' : 'Fullscreen peta';
    btn.innerHTML = active
      ? '<i class="fas fa-compress"></i><span>Keluar</span>'
      : '<i class="fas fa-expand"></i><span>Fullscreen</span>';
  }

  invalidateMainMapSoon();
}

function toggleMapControls(forceOpen) {
  const container = document.getElementById('mapContainer');
  const panel = document.getElementById('floatingMapPanel');
  const toggle = document.getElementById('mapControlsToggle');
  if (!container || !panel) return;

  const shouldCollapse = typeof forceOpen === 'boolean'
    ? !forceOpen
    : !container.classList.contains('map-controls-collapsed');

  container.classList.toggle('map-controls-collapsed', shouldCollapse);
  panel.hidden = shouldCollapse;

  if (toggle) {
    toggle.setAttribute('aria-expanded', String(!shouldCollapse));
    toggle.title = shouldCollapse ? 'Tampilkan kontrol peta' : 'Sembunyikan kontrol peta';
  }
}

async function toggleMapFullscreen() {
  const container = document.getElementById('mapContainer');
  if (!container) return;

  const currentFullscreen = getMapFullscreenElement();
  const requestFullscreen = container.requestFullscreen || container.webkitRequestFullscreen || container.msRequestFullscreen;
  const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;

  try {
    if (currentFullscreen === container) {
      if (exitFullscreen) await exitFullscreen.call(document);
      setMapFullscreenState(false);
      return;
    }

    if (requestFullscreen) {
      await requestFullscreen.call(container);
      setMapFullscreenState(true);
      return;
    }
  } catch (error) {
    console.warn('Fullscreen API gagal, memakai fallback fixed map.', error);
  }

  setMapFullscreenState(!container.classList.contains('is-fullscreen'));
}

async function togglePickerFullscreen() {
  const container = document.getElementById('pickerMapContainer');
  const btn = document.getElementById('pickerFullscreenBtn');
  if (!container || !btn) return;

  const getFs = () => document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
  const currentFs = getFs();
  const requestFs = container.requestFullscreen || container.webkitRequestFullscreen || container.msRequestFullscreen;
  const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;

  try {
    if (currentFs === container) {
      if (exitFs) await exitFs.call(document);
    } else {
      if (requestFs) await requestFs.call(container);
    }
  } catch (error) {
    console.warn('Fullscreen API gagal', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ['fullscreenchange', 'webkitfullscreenchange', 'MSFullscreenChange'].forEach(eventName => {
    document.addEventListener(eventName, () => {
      const container = document.getElementById('pickerMapContainer');
      const btn = document.getElementById('pickerFullscreenBtn');
      if (!container || !btn) return;
      
      const getFs = () => document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
      const active = getFs() === container;
      
      container.classList.toggle('is-fullscreen', active);
      container.style.height = active ? '100vh' : '';
      container.style.width = active ? '100vw' : '';
      const mapEl = document.getElementById('pickerMap');
      if (mapEl) {
        mapEl.style.height = active ? '100%' : '';
      }
      btn.innerHTML = active
        ? '<i class="fas fa-compress"></i> Keluar'
        : '<i class="fas fa-expand"></i> Fullscreen';
      
      setTimeout(() => { if (window.pickerMap) window.pickerMap.invalidateSize(); }, 200);
    });
  });
});

function initFloatingMapControls() {
  const container = document.getElementById('mapContainer');
  const panel = document.querySelector('.map-panel');
  if (!container || !panel || container.dataset.floatingControlsReady === 'true') return;

  container.dataset.floatingControlsReady = 'true';
  container.classList.add('has-floating-map-controls');
  panel.id = 'floatingMapPanel';
  panel.classList.add('floating-map-panel');

  const header = document.createElement('div');
  header.className = 'floating-map-panel-head';
  header.innerHTML = `
    <div class="floating-map-panel-title">
      <i class="fas fa-sliders"></i>
      <span>Kontrol Peta</span>
    </div>
    <button type="button" class="map-icon-btn" id="mapPanelCloseBtn" aria-label="Sembunyikan kontrol peta" title="Sembunyikan kontrol peta">
      <i class="fas fa-xmark"></i>
    </button>
  `;
  panel.prepend(header);

  const toolbar = document.createElement('div');
  toolbar.className = 'map-floating-toolbar';
  toolbar.setAttribute('aria-label', 'Aksi peta');
  toolbar.innerHTML = `
    <button type="button" class="map-tool-btn" id="mapControlsToggle" aria-controls="floatingMapPanel" aria-expanded="true" title="Sembunyikan kontrol peta">
      <i class="fas fa-sliders"></i><span>Kontrol</span>
    </button>
    <button type="button" class="map-tool-btn" id="mapFullscreenBtn" aria-pressed="false" title="Fullscreen peta">
      <i class="fas fa-expand"></i><span>Fullscreen</span>
    </button>
  `;

  container.appendChild(panel);
  container.appendChild(toolbar);

  document.getElementById('mapControlsToggle')?.addEventListener('click', () => toggleMapControls());
  document.getElementById('mapPanelCloseBtn')?.addEventListener('click', () => toggleMapControls(false));
  document.getElementById('mapFullscreenBtn')?.addEventListener('click', toggleMapFullscreen);

  if (window.matchMedia('(max-width: 820px)').matches) {
    toggleMapControls(false);
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'MSFullscreenChange'].forEach(eventName => {
    document.addEventListener(eventName, () => {
      const active = getMapFullscreenElement() === container;
      setMapFullscreenState(active);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (container.classList.contains('is-fullscreen') && getMapFullscreenElement() !== container) {
      setMapFullscreenState(false);
    }
  });
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
    reports = data.map(r => {
      const lat = r.latitude ? parseFloat(r.latitude) : null;
      const lng = r.longitude ? parseFloat(r.longitude) : null;
      const lokasi = resolveReportLocationName(r.lokasi_kejadian, lat, lng);
      return {
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
        lokasi,
        lokasiDeskripsi: r.lokasi_deskripsi,
        kronologi: r.kronologi,
        lat,
        lng,
        fotoPath: r.foto_path,
        status: r.status,
        fakultas: getFacultyFromLocationName(lokasi),
      };
    });
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

async function loadFasumAreas() {
  if (fasumLoadPromise) return fasumLoadPromise;

  fasumLoadPromise = (async () => {
    if (typeof shp === 'undefined') {
      console.warn('[fasum] shpjs belum tersedia');
      return fasumAreas;
    }

    try {
      const assetVersion = window.ITSAFE_ASSET_VERSION || '1.2.9';
      const res = await fetch(`${FASUM_ZIP_PATH}?v=${assetVersion}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const buf = await res.arrayBuffer();
      if (!isZipBuffer(buf)) throw new Error('Fasum.zip bukan file zip valid');

      const parsed = await shp(buf);
      let data = getFirstGeoJSONLayer(parsed);
      if (!data || !data.features || !data.features.length) {
        throw new Error('GeoJSON fasum kosong');
      }

      data = reprojectGeoJSONIfNeeded(data);
      fasumGeoJSON = data;
      fasumAreas = buildFasumAreas(data);
      syncFasumQuickOptions();
      buildLocationFacultyMap();
      reports = reports.map(r => ({
        ...r,
        fakultas: getFacultyFromLocationName(r.lokasi),
      }));
      renderAllFixedLocations();
      if (pickerMap) fitPickerInitialView();
      if (leafletMap) renderLeafletMap();
    } catch (e) {
      console.warn('[fasum] gagal memuat Fasum.zip', e);
    }

    return fasumAreas;
  })();

  return fasumLoadPromise;
}

function getFirstGeoJSONLayer(parsed) {
  if (!parsed) return null;
  if (parsed.type) return parsed;
  if (Array.isArray(parsed)) return parsed.find(item => item && item.type) || null;
  const firstKey = Object.keys(parsed).find(key => parsed[key] && parsed[key].type);
  return firstKey ? parsed[firstKey] : null;
}

function getFasumFeatureName(props, index) {
  const direct = props?.Nama_Lokasi ?? props?.Nama_Lokas ?? props?.NAMA_LOKAS ?? props?.nama_lokas;
  if (direct && String(direct).trim()) return String(direct).trim();

  const key = Object.keys(props || {}).find(k => {
    const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean.includes('nama') && clean.includes('lok');
  });
  const fallback = key ? props[key] : '';
  return fallback && String(fallback).trim()
    ? String(fallback).trim()
    : `${FASUM_GROUP_LABEL} ${index + 1}`;
}

function geometryToPolygons(geom) {
  if (!geom) return [];
  if (geom.type === 'Polygon') return [geom.coordinates];
  if (geom.type === 'MultiPolygon') return geom.coordinates || [];
  if (geom.type === 'GeometryCollection') {
    return (geom.geometries || []).flatMap(g => geometryToPolygons(g));
  }
  return [];
}

function buildFasumAreas(data) {
  const features = data.type === 'FeatureCollection'
    ? (data.features || [])
    : [{ type: 'Feature', properties: {}, geometry: data }];
  const areas = [];

  features.forEach((feature, featureIndex) => {
    const name = getFasumFeatureName(feature.properties || {}, featureIndex);
    const polygons = geometryToPolygons(feature.geometry);
    polygons.forEach((polygon, polygonIndex) => {
      const center = getPolygonCenter(polygon);
      if (!center || !Number.isFinite(center.lat) || !Number.isFinite(center.lng)) return;
      const rawId = feature.properties?.OBJECTID ?? feature.properties?.FID ?? featureIndex + 1;
      const jenisLokasi = feature.properties?.Jenis_Lokasi 
        ?? feature.properties?.jenis_lokasi 
        ?? feature.properties?.Jenis_Loka 
        ?? feature.properties?.jenis_loka 
        ?? 'Lainnya';
      areas.push({
        id: `fasum-${rawId}-${polygonIndex + 1}`,
        name,
        jenis_lokasi: jenisLokasi,
        lat: center.lat,
        lng: center.lng,
        polygon,
        properties: feature.properties || {},
      });
    });
  });

  return areas;
}

function getPolygonCenter(polygon) {
  const ring = polygon?.[0];
  if (!Array.isArray(ring) || ring.length < 3) return null;

  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length; i++) {
    const current = ring[i];
    const next = ring[(i + 1) % ring.length];
    if (!current || !next) continue;
    const x0 = parseFloat(current[0]);
    const y0 = parseFloat(current[1]);
    const x1 = parseFloat(next[0]);
    const y1 = parseFloat(next[1]);
    if (![x0, y0, x1, y1].every(Number.isFinite)) continue;
    const cross = x0 * y1 - x1 * y0;
    twiceArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  let center = null;
  if (Math.abs(twiceArea) > 1e-12) {
    center = {
      lng: cx / (3 * twiceArea),
      lat: cy / (3 * twiceArea),
    };
  }

  if (!center || !pointInPolygon([center.lng, center.lat], polygon)) {
    center = getPolygonBoundsCenter(polygon);
  }
  return center;
}

function getPolygonBoundsCenter(polygon) {
  const ring = polygon?.[0] || [];
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  ring.forEach(coord => {
    const lng = parseFloat(coord?.[0]);
    const lat = parseFloat(coord?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  if (![minLng, minLat, maxLng, maxLat].every(Number.isFinite)) return null;
  return {
    lng: (minLng + maxLng) / 2,
    lat: (minLat + maxLat) / 2,
  };
}

function syncFasumQuickOptions() {
  const sel = document.getElementById('lokasiInsiden');
  if (!sel || !fasumAreas.length) return;

  const selectedValue = sel.value;

  Array.from(sel.querySelectorAll('optgroup[data-location-type="fasum"]')).forEach(el => el.remove());

  const otherOption = Array.from(sel.children)
    .find(child => child.tagName === 'OPTION' && isOtherLocationValue(child.value || child.textContent));

  const groupedFasum = {};
  fasumAreas.forEach(area => {
    const type = area.jenis_lokasi || 'Lainnya';
    if (!groupedFasum[type]) groupedFasum[type] = [];
    groupedFasum[type].push(area);
  });

  Object.keys(groupedFasum).sort().forEach(type => {
    const group = document.createElement('optgroup');
    group.label = `${FASUM_GROUP_LABEL} - ${type}`;
    group.dataset.locationType = 'fasum';

    groupedFasum[type].sort((a, b) => a.name.localeCompare(b.name)).forEach(area => {
      const opt = document.createElement('option');
      opt.value = area.name;
      opt.textContent = area.name;
      opt.dataset.lat = area.lat.toFixed(6);
      opt.dataset.lng = area.lng.toFixed(6);
      opt.dataset.fasumType = type;
      opt.dataset.locationType = 'fasum';
      opt.dataset.fasumId = area.id;
      group.appendChild(opt);
    });

    sel.insertBefore(group, otherOption || null);
  });

  if (selectedValue && sel.querySelector(`option[value="${selectedValue}"]`)) {
    sel.value = selectedValue;
  }
}

function isFasumOption(opt) {
  const parent = opt?.parentElement;
  return opt?.dataset?.locationType === 'fasum'
    || parent?.dataset?.locationType === 'fasum'
    || parent?.label === FASUM_GROUP_LABEL;
}

function getFasumAreaAtPoint(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !fasumAreas.length) return null;
  const pt = [lng, lat];
  return fasumAreas.find(area => pointInPolygon(pt, area.polygon)) || null;
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
  const editContext = editingReport ? { ...editingReport } : null;
  const endpoint = editContext
    ? `${API_BASE}/reports/edit/${encodeURIComponent(editContext.code)}`
    : `${API_BASE}/reports`;

  if (editContext) {
    if (isFormData) {
      payload.append('verification_email', editContext.email);
    } else {
      payload.verification_email = editContext.email;
    }
  }

  const options = {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: isFormData ? payload : JSON.stringify(payload),
  };
  if (!isFormData) {
    options.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(endpoint, options);
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
  
  const target = document.getElementById(page);
  if (target) {
    target.classList.add('active');
  }
  
  const navLink = document.querySelector(`[data-page="${page}"]`);
  if (navLink) {
    navLink.classList.add('active');
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (page === 'peta') {
    updateLayerCounts();
    setTimeout(() => { 
      initLeafletMap(); 
      renderLeafletMap(); 
      if (leafletMap) {
        leafletMap.invalidateSize();
      }
    }, 200);
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
  document.getElementById('emailIts')?.addEventListener('input', handleReportEmailInput);
  updateReportEmailVerificationUi();
  initReportWizard();
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function isReportEmailVerified() {
  const email = normalizeEmail(document.getElementById('emailIts')?.value || '');
  return !!email && isValidEmail(email);
}

function updateReportEmailVerificationUi() {
  const email = normalizeEmail(document.getElementById('emailIts')?.value || '');
  const status = document.getElementById('emailVerifyStatus');
  const verified = isReportEmailVerified();

  if (status) {
    status.classList.toggle('verified', verified);
    status.classList.toggle('invalid', !!email && !verified);
    if (verified) {
      status.textContent = 'Format email valid. Kamu bisa lanjut.';
    } else if (email) {
      status.textContent = 'Format email belum valid.';
    } else {
      status.textContent = 'Format email akan dicek otomatis.';
    }
  }
}

function handleReportEmailInput() {
  const email = normalizeEmail(document.getElementById('emailIts')?.value || '');
  if (email !== verifiedReportEmail) {
    reportEmailVerified = false;
  }
  updateReportEmailVerificationUi();
}

function markReportEmailVerified(email) {
  verifiedReportEmail = normalizeEmail(email);
  reportEmailVerified = !!verifiedReportEmail;
  updateReportEmailVerificationUi();
}

function resetReportEmailVerification() {
  reportEmailVerified = false;
  verifiedReportEmail = '';
  updateReportEmailVerificationUi();
}

function verifyReportEmail() {
  const input = document.getElementById('emailIts');
  const email = normalizeEmail(input?.value || '');

  if (!email) {
    showToast('Isi email terlebih dahulu sebelum lanjut.', 'error');
    input?.focus();
    resetReportEmailVerification();
    return false;
  }

  if (!isValidEmail(email)) {
    showToast('Format email belum valid.', 'error');
    input?.focus();
    resetReportEmailVerification();
    return false;
  }

  markReportEmailVerified(email);
  showToast('Format email valid.', 'success');
  return true;
}

function initReportWizard() {
  const form = document.getElementById('reportForm');
  if (!form || form.dataset.wizardInit === 'true') return;

  const twoCol = form.querySelector('.form-two-col');
  const leftPanel = twoCol?.querySelector('.col-lokasi');
  const subjectivePanel = twoCol?.querySelector('.col-subjektif');
  const footer = form.querySelector('.form-footer-wrap');
  if (!twoCol || !leftPanel || !subjectivePanel || !footer) return;

  const leftParts = Array.from(leftPanel.children);
  const steps = [
    {
      key: 'identitas',
      title: 'Identitas',
      hint: 'Data dasar',
      icon: 'fa-id-card',
      elements: leftParts.slice(0, 2),
    },
    {
      key: 'lokasi',
      title: 'Lokasi',
      hint: 'Titik & deskripsi',
      icon: 'fa-map-location-dot',
      elements: leftParts.slice(2, 4),
    },
    {
      key: 'kondisi',
      title: 'Kondisi Fisik',
      hint: 'Situasi area',
      icon: 'fa-eye',
      elements: leftParts.slice(4, 6),
    },
    {
      key: 'subjektif',
      title: 'Penilaian',
      hint: 'Rasa aman',
      icon: 'fa-clipboard-check',
      elements: [subjectivePanel],
    },
  ];

  if (steps.some(step => step.elements.length === 0 || step.elements.some(el => !el))) return;

  form.dataset.wizardInit = 'true';
  form.classList.add('report-wizard-active');

  steps.forEach((step, idx) => {
    step.elements.forEach(el => {
      el.classList.add('report-step-fragment');
      el.dataset.reportStep = String(idx);
    });
  });

  const stepper = document.createElement('div');
  stepper.className = 'report-wizard-stepper';
  stepper.setAttribute('aria-label', 'Tahapan pengisian laporan');
  stepper.innerHTML = steps.map((step, idx) => `
    <div class="report-step-pill" data-step-pill="${idx}">
      <span class="report-step-index"><i class="fas ${step.icon}"></i></span>
      <span class="report-step-copy">
        <strong>${step.title}</strong>
        <small>${step.hint}</small>
      </span>
    </div>
  `).join('');
  twoCol.before(stepper);

  const nav = document.createElement('div');
  nav.className = 'report-wizard-nav';
  nav.innerHTML = `
    <button type="button" class="btn btn-outline report-wizard-prev">
      <i class="fas fa-arrow-left"></i> Kembali
    </button>
    <button type="button" class="btn btn-primary report-wizard-next">
      Selanjutnya <i class="fas fa-arrow-right"></i>
    </button>
  `;
  footer.before(nav);

  const prevBtn = nav.querySelector('.report-wizard-prev');
  const nextBtn = nav.querySelector('.report-wizard-next');
  const pills = Array.from(stepper.querySelectorAll('.report-step-pill'));
  let activeStep = 0;

  function getStepRequiredFields(stepIndex) {
    const fields = [];
    steps[stepIndex].elements.forEach(el => {
      fields.push(...Array.from(el.querySelectorAll('input[required], select[required], textarea[required]')));
    });
    return fields;
  }

  function clearFieldError(el) {
    if (!el || !el.classList) return;
    el.classList.remove('report-field-error');
    const group = el.closest('.form-group');
    if (group) group.classList.remove('report-step-error');
  }

  function markFieldError(el) {
    if (!el || !el.classList) return;
    el.classList.add('report-field-error');
    const group = el.closest('.form-group');
    if (group) group.classList.add('report-step-error');
  }

  function fieldHasValue(el) {
    if (!el) return false;
    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'file') return !!(el.files && el.files.length);
    return !!(el.value && el.value.trim() !== '');
  }

  function focusField(el) {
    if (!el) return;
    const group = el.closest('.form-group');
    const visibleTarget = group?.querySelector(
      'input:not(.star-select):not([type="hidden"]), select:not(.star-select), textarea, .level-card, .pill-btn, button'
    );
    const target = visibleTarget || el;
    if (target && typeof target.focus === 'function') {
      try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
    }
    group?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function validateStep(stepIndex) {
    let firstInvalid = null;
    getStepRequiredFields(stepIndex).forEach(el => {
      clearFieldError(el);
      const invalid = !fieldHasValue(el) || (typeof el.checkValidity === 'function' && !el.checkValidity());
      if (invalid) {
        markFieldError(el);
        if (!firstInvalid) firstInvalid = el;
      }
    });

    if (steps[stepIndex].key === 'identitas' && !editingReport && !isReportEmailVerified()) {
      const emailEl = document.getElementById('emailIts');
      markFieldError(emailEl);
      focusField(emailEl);
      showToast('Verifikasi email terlebih dahulu sebelum lanjut.', 'error');
      return false;
    }

    if (steps[stepIndex].key === 'lokasi') {
      const lokasiVal = document.getElementById('lokasiInsiden')?.value || '';
      const lat = parseFloat(document.getElementById('lat')?.value || '');
      const lng = parseFloat(document.getElementById('lng')?.value || '');
      if (isOtherLocationValue(lokasiVal) && (isNaN(lat) || isNaN(lng))) {
        const lokasiEl = document.getElementById('lokasiInsiden');
        markFieldError(lokasiEl);
        if (!firstInvalid) firstInvalid = lokasiEl;
        showToast('Pin lokasi wajib diisi jika memilih Sekitar Kampus.', 'error');
      }
    }

    if (firstInvalid) {
      focusField(firstInvalid);
      if (!(steps[stepIndex].key === 'lokasi' && isOtherLocationValue(document.getElementById('lokasiInsiden')?.value || ''))) {
        showToast('Lengkapi bagian ini dulu sebelum lanjut.', 'error');
      }
      return false;
    }
    return true;
  }

  function showStep(stepIndex, opts = {}) {
    activeStep = Math.max(0, Math.min(stepIndex, steps.length - 1));
    const leftActive = activeStep < steps.length - 1;

    leftPanel.hidden = !leftActive;
    subjectivePanel.hidden = activeStep !== steps.length - 1;

    steps.forEach((step, idx) => {
      step.elements.forEach(el => {
        el.hidden = idx !== activeStep;
        el.classList.toggle('is-report-step-active', idx === activeStep);
      });
    });

    pills.forEach((pill, idx) => {
      pill.classList.toggle('active', idx === activeStep);
      pill.classList.toggle('done', idx < activeStep);
    });

    form.classList.toggle('is-final-step', activeStep === steps.length - 1);
    prevBtn.disabled = activeStep === 0;
    nextBtn.hidden = activeStep === steps.length - 1;

    if (steps[activeStep].key === 'lokasi') {
      setTimeout(() => {
        initPickerMap();
        if (pickerMap) pickerMap.invalidateSize();
      }, 80);
    }

    if (opts.scroll !== false) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  prevBtn.addEventListener('click', () => showStep(activeStep - 1));
  nextBtn.addEventListener('click', () => {
    if (validateStep(activeStep)) showStep(activeStep + 1);
  });

  form.addEventListener('input', e => clearFieldError(e.target));
  form.addEventListener('change', e => clearFieldError(e.target));

  window.itsafeResetReportWizard = () => {
    form.querySelectorAll('.report-field-error').forEach(el => el.classList.remove('report-field-error'));
    form.querySelectorAll('.report-step-error').forEach(el => el.classList.remove('report-step-error'));
    showStep(0, { scroll: false });
  };
  showStep(0, { scroll: false });
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
  if (!editingReport && !isReportEmailVerified()) {
    showToast('Verifikasi email terlebih dahulu sebelum mengirim laporan.', 'error');
    document.getElementById('emailIts')?.focus();
    return;
  }

  const lat = parseFloat(document.getElementById('lat').value);
  const lng = parseFloat(document.getElementById('lng').value);
  const lokasiSelect = document.getElementById('lokasiInsiden');
  const lokasiVal = lokasiSelect.value;
  if (isOtherLocationValue(lokasiVal) && (isNaN(lat) || isNaN(lng))) {
    showToast('Pin lokasi wajib diisi jika memilih Sekitar Kampus.', 'error');
    return;
  }

  const kelaminVal = document.getElementById('jenisKelamin').value.trim();
  const skorNyamanVal = parseInt(document.getElementById('skorNyaman').value, 10);
  const skorRawanVal = parseInt(document.getElementById('skorRawan').value, 10);
  const resolvedLokasi = resolveReportLocationName(lokasiVal, lat, lng);

  const payload = {
    email_its: document.getElementById('emailIts').value.trim(),
    peran_kampus: document.getElementById('peranKampus').value,
    jenis_kelamin: kelaminVal || null,
    lokasi_kejadian: resolvedLokasi,
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
    const wasEditing = !!editingReport;
    const editedCode = editingReport?.code || '';
    showToast(wasEditing ? 'Menyimpan perubahan laporan...' : 'Mengirim laporan...', 'success');
    const result = await submitToAPI(formData);
    if (result.success) {
      e.target.reset();
      clearPin();
      resetReportEmailVerification();
      syncReportChoiceButtons();
      exitReportEditMode({ resetForm: false });
      if (typeof window.itsafeResetReportWizard === 'function') window.itsafeResetReportWizard();
      if (typeof window.itsafeBootUI === 'function') window.itsafeBootUI();
      await fetchReports();
      await fetchStats();

      if (wasEditing) {
        showToast(`Perubahan laporan ${editedCode || result.report_code} berhasil disimpan.`, 'success');
      } else {
        openSubmitSuccessModal({
          reportCode: result.report_code,
          reporterEmail: payload.email_its,
          mailSent: result.mail_sent !== false,
        });

        if (result.mail_sent === false) {
          showToast(`Laporan tersimpan (kode: ${result.report_code}), tapi email admin belum terkirim.`, 'error');
        } else {
          showToast(`Laporan terkirim! Kode: ${result.report_code}`, 'success');
        }
      }
    } else {
      showToast(result.message || (editingReport ? 'Gagal menyimpan perubahan laporan.' : 'Gagal mengirim laporan. Coba lagi.'), 'error');
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
    if (!pickerMap) initPickerMap();
    setPin(parseFloat(lat), parseFloat(lng), { fromPreset: true, center: true });
  } else if (opt && isOtherLocationValue(opt.value || opt.textContent)) {
    clearPin();
  }
}

function setReportFieldValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  let cleanValue = value ?? '';
  if (typeof cleanValue === 'string' && cleanValue.startsWith('HIDDEN_')) {
    cleanValue = cleanValue.substring('HIDDEN_'.length);
  }
  el.value = cleanValue;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function syncReportChoiceButtons() {
  document.querySelectorAll('.level-rating-group').forEach(group => {
    const target = document.getElementById(group.dataset.target);
    const value = target?.value || '';
    group.querySelectorAll('.level-card').forEach(card => {
      card.classList.toggle('active', String(card.dataset.val) === String(value));
    });
  });

  document.querySelectorAll('.pill-group').forEach(group => {
    const firstPill = group.querySelector('.pill-btn');
    const target = firstPill ? document.getElementById(firstPill.dataset.target) : null;
    const value = target?.value || '';
    group.querySelectorAll('.pill-btn').forEach(pill => {
      pill.classList.toggle('active', String(pill.dataset.val) === String(value));
    });
  });
}

function updateReportEditUi() {
  const form = document.getElementById('reportForm');
  const notice = document.getElementById('reportEditNotice');
  const codeEl = document.getElementById('reportEditCode');
  const submitIcon = document.getElementById('reportSubmitIcon');
  const submitLabel = document.getElementById('reportSubmitLabel');

  if (form) form.classList.toggle('is-editing-report', !!editingReport);
  if (notice) notice.hidden = !editingReport;
  if (codeEl) codeEl.textContent = editingReport?.code || '-';

  if (submitIcon) {
    submitIcon.className = editingReport ? 'fas fa-floppy-disk' : 'fas fa-paper-plane';
  }
  if (submitLabel) {
    submitLabel.textContent = editingReport ? 'Simpan Perubahan' : 'Kirim Laporan';
  }
}

function exitReportEditMode(opts = {}) {
  editingReport = null;
  if (opts.resetForm) {
    const form = document.getElementById('reportForm');
    if (form) form.reset();
    clearPin();
    resetReportEmailVerification();
    syncReportChoiceButtons();
    if (typeof window.itsafeResetReportWizard === 'function') window.itsafeResetReportWizard();
    if (typeof window.itsafeBootUI === 'function') window.itsafeBootUI();
  }
  updateReportEditUi();
}

function cancelReportEdit() {
  exitReportEditMode({ resetForm: true });
  showToast('Mode edit dibatalkan.', 'success');
}

function fillReportFormForEdit(report, verificationEmail) {
  if (!report || !report.report_code) return;
  editingReport = {
    code: report.report_code,
    email: verificationEmail,
  };

  setReportFieldValue('emailIts', report.email_its);
  setReportFieldValue('peranKampus', report.peran_kampus);
  setReportFieldValue('jenisKelamin', report.jenis_kelamin);
  setReportFieldValue('lokasiDeskripsi', report.lokasi_deskripsi);
  setReportFieldValue('pencahayaan', report.pencahayaan);
  setReportFieldValue('kepadatan', report.kepadatan);
  setReportFieldValue('cctv', report.cctv);
  setReportFieldValue('petugasKeamanan', report.petugas_keamanan);
  setReportFieldValue('vegetasi', report.vegetasi);
  setReportFieldValue('waktuInsiden', report.waktu_rawan);
  setReportFieldValue('hariRawan', report.hari_rawan);
  setReportFieldValue('skorNyaman', report.skor_nyaman);
  setReportFieldValue('alasanTidakNyaman', report.alasan_tidak_nyaman);
  setReportFieldValue('skorRawan', report.skor_rawan);
  setReportFieldValue('pernahHindari', report.pernah_hindari);
  setReportFieldValue('orangLain', report.orang_lain);
  setReportFieldValue('situasiMencurigakan', report.situasi_mencurigakan);
  setReportFieldValue('kronologi', report.kronologi);
  setReportFieldValue('kontakPelapor', report.kontak_pelapor);
  markReportEmailVerified(report.email_its);

  if (!setLocationSelectValue(report.lokasi_kejadian || '')) {
    setLocationSelectValue(getOtherLocationOptionValue());
  }
  document.getElementById('lokasiInsiden')?.dispatchEvent(new Event('change', { bubbles: true }));

  const lat = parseFloat(report.latitude);
  const lng = parseFloat(report.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    document.getElementById('lat').value = lat.toFixed(6);
    document.getElementById('lng').value = lng.toFixed(6);
    setTimeout(() => setPin(lat, lng, { fromPreset: true, center: true }), 120);
  } else {
    handleLocationPreset();
  }

  const consent = document.getElementById('consent');
  if (consent) consent.checked = true;
  const fotoInput = document.getElementById('fotoLokasi');
  if (fotoInput) fotoInput.value = '';

  syncReportChoiceButtons();
  updateReportEditUi();
  if (typeof window.itsafeResetReportWizard === 'function') window.itsafeResetReportWizard();
  if (typeof window.itsafeBootUI === 'function') window.itsafeBootUI();
}

async function startReportEdit(code, opts = {}) {
  const reportCode = String(code || '').trim();
  if (!reportCode) return;

  let email = (opts.email || currentHistoryEmail || document.getElementById('historyEmailInput')?.value || '').trim();
  if (!email && opts.prompt === true) {
    email = (window.prompt('Masukkan email pelapor untuk verifikasi edit laporan:') || '').trim();
  }

  try {
    showToast('Memuat laporan untuk diedit...', 'success');
    const url = `${API_BASE}/reports/edit/${encodeURIComponent(reportCode)}${email ? `?email=${encodeURIComponent(email)}` : ''}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      showToast(data.message || 'Laporan tidak bisa diedit.', 'error');
      return;
    }

    closeHistoryModal();
    navigateTo('home');
    setTimeout(() => {
      fillReportFormForEdit(data.data, email);
      document.getElementById('formSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast(`Mode edit aktif untuk ${reportCode}.`, 'success');
    }, 180);
  } catch (err) {
    console.error(err);
    showToast('Tidak dapat memuat data laporan.', 'error');
  }
}

function startReportEditFromInputs() {
  const codeInput = document.getElementById('editReportCodeInput');
  const code = codeInput?.value.trim() || '';

  if (!code) {
    showToast('Masukkan kode laporan terlebih dahulu.', 'error');
    codeInput?.focus();
    return;
  }

  startReportEdit(code, { prompt: false });
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

function isOtherLocationValue(value) {
  return /Lainnya|Sekitar Kampus/i.test(value || '');
}

function getOtherLocationOptionValue() {
  const sel = document.getElementById('lokasiInsiden');
  if (!sel) return OTHER_LOCATION_LABEL;
  const opt = Array.from(sel.options).find(option => isOtherLocationValue(option.value || option.textContent));
  return opt?.value || OTHER_LOCATION_LABEL;
}

function setLocationSelectValue(value) {
  const sel = document.getElementById('lokasiInsiden');
  if (!sel || !value) return false;
  const match = Array.from(sel.options).find(opt => opt.value === value || opt.textContent.trim() === value);
  if (!match) return false;
  sel.value = match.value;
  return true;
}

function getPresetLocationOptions(opts = {}) {
  const sel = document.getElementById('lokasiInsiden');
  if (!sel) return [];
  const includeFasum = opts.includeFasum !== false;
  const includeJurusan = opts.includeJurusan !== false;
  return Array.from(sel.options)
    .map(opt => {
      const lat = parseFloat(opt.dataset?.lat);
      const lng = parseFloat(opt.dataset?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const type = isFasumOption(opt) ? 'fasum' : 'jurusan';
      if (type === 'fasum' && !includeFasum) return null;
      if (type !== 'fasum' && !includeJurusan) return null;
      return {
        opt,
        name: opt.value || opt.textContent.trim(),
        faculty: getFacultyFromOption(opt),
        type,
        lat,
        lng,
      };
    })
    .filter(Boolean);
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = deg => deg * Math.PI / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getNearestPresetLocation(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return getPresetLocationOptions({ includeFasum: false })
    .map(item => ({ ...item, distance: distanceMeters(lat, lng, item.lat, item.lng) }))
    .sort((a, b) => a.distance - b.distance)[0] || null;
}

function getNearbyPresetLocation(lat, lng) {
  const nearest = getNearestPresetLocation(lat, lng);
  if (!nearest || nearest.distance > NEARBY_LOCATION_RADIUS_METERS) return null;
  return nearest;
}

function resolveReportLocationName(currentValue, lat, lng) {
  if (isOtherLocationValue(currentValue)) {
    return getFasumAreaAtPoint(lat, lng)?.name
      || getNearbyPresetLocation(lat, lng)?.name
      || OTHER_LOCATION_LABEL;
  }
  return currentValue;
}

function getReportAreaName(report) {
  const rawName = report?.lokasi || report?.lokasi_kejadian || '';
  const lat = parseFloat(report?.lat ?? report?.latitude);
  const lng = parseFloat(report?.lng ?? report?.longitude);
  return String(resolveReportLocationName(rawName, lat, lng) || '').trim();
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

function createFasumIcon(type) {
  const color = (type && FASUM_TYPE_COLORS[type]) ? FASUM_TYPE_COLORS[type] : FASUM_TYPE_COLORS['Lainnya'];
  return L.divIcon({
    className: 'fasum-pin-wrap',
    html: `<div class="fasum-pin" style="--fasum-color:${color}">
             <i class="fas fa-tree-city"></i>
           </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
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

function createReportIcon(visual) {
  const cfg = visual || MAP_MODE_META.sebaran;
  const shape = cfg.shape || 'circle';
  const icon = cfg.icon || 'fa-location-dot';
  const color = cfg.color || '#D56A6A';

  return L.divIcon({
    className: `case-dot-wrap report-marker-wrap report-marker-wrap-${shape}`,
    html: `<div class="case-dot report-marker report-marker-${shape}" style="--case-color:${color};--case-glow:${color}">
             <i class="fas ${icon}"></i>
           </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
}

// ============================================================
// PICKER MAP (mini Leaflet di form)
// ============================================================
function schedulePickerMapInit() {
  const formSection = document.getElementById('formSection');
  const pickerEl = document.getElementById('pickerMap');
  if (!formSection || !pickerEl) return;

  const start = () => initPickerMap();
  formSection.addEventListener('focusin', start, { once: true, passive: true });
  formSection.addEventListener('pointerdown', start, { once: true, passive: true });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      io.disconnect();
      start();
    }, { rootMargin: '420px 0px' });
    io.observe(formSection);
  } else {
    setTimeout(start, 1200);
  }
}

function initPickerMap() {
  if (pickerMap) {
    setTimeout(() => pickerMap.invalidateSize(), 300);
    return;
  }
  const container = document.getElementById('pickerMap');
  if (!container) return;

  const isMobile = itsafeIsMobileLike();
  pickerMap = L.map('pickerMap', { 
    zoomControl: true,
    scrollWheelZoom: false,
    keyboard: false,
    // Mobile: one finger scrolls the page, two fingers can zoom the map.
    dragging: !isMobile,
    tap: true,
    touchZoom: true,
    tapTolerance: 15     // Slightly generous for finger accuracy
  }).setView(ITS, PICKER_INITIAL_ZOOM);
  pickerMap.on('dragstart zoomstart', () => {
    if (!pickerMap.__suppressInitialFitFlag) pickerMap.__userAdjustedPickerView = true;
  });
  L.tileLayer(BASEMAPS.osm.url, { attribution: BASEMAPS.osm.attr }).addTo(pickerMap);
  
  fixedLocationLayerPicker = L.layerGroup().addTo(pickerMap);
  renderFixedLocations(fixedLocationLayerPicker);
  fitPickerInitialView({ force: true });
  loadBoundaryLayer(pickerMap, 'picker');

  if (isMobile) {
    attachTwoFingerHint(container);
    attachIOSMapScrollGuard(container);
  }

  pickerMap.on('click', e => {
    // Save scroll position before setPin (mobile browsers sometimes jump on DOM change)
    const savedScroll = window.scrollY || document.documentElement.scrollTop;
    pickerMap.__userAdjustedPickerView = true;
    setPin(e.latlng.lat, e.latlng.lng, { fromPreset: false });
    // Restore instantly after any DOM/focus change triggered by setPin
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedScroll, behavior: 'instant' });
    });
  });

  // Multiple invalidateSize attempts to fix grey box browser quirks
  setTimeout(() => {
    pickerMap.invalidateSize();
    fitPickerInitialView();
  }, 500);
  setTimeout(() => {
    pickerMap.invalidateSize();
    fitPickerInitialView();
  }, 1500);
}

function getPickerOverviewBounds() {
  if (typeof L === 'undefined') return null;
  const bounds = L.latLngBounds(PICKER_INITIAL_BOUNDS);

  if (boundaryLayerPicker?.getBounds) {
    const boundaryBounds = boundaryLayerPicker.getBounds();
    if (boundaryBounds?.isValid?.()) bounds.extend(boundaryBounds);
  }

  getPresetLocationOptions().forEach(item => {
    bounds.extend([item.lat, item.lng]);
  });

  fasumAreas.forEach(area => {
    bounds.extend([area.lat, area.lng]);
  });

  LOCATIONS.forEach(loc => {
    const lat = parseFloat(loc.lat);
    const lng = parseFloat(loc.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) bounds.extend([lat, lng]);
  });

  return bounds.isValid?.() ? bounds : null;
}

function fitPickerInitialView(opts = {}) {
  if (!pickerMap) return false;
  if (!opts.force && pickerMap.__userAdjustedPickerView) return false;
  const bounds = getPickerOverviewBounds();
  if (!bounds) return false;

  pickerMap.__suppressInitialFitFlag = true;
  pickerMap.fitBounds(bounds, {
    padding: [18, 18],
    maxZoom: PICKER_INITIAL_ZOOM,
    animate: false,
  });
  setTimeout(() => {
    if (pickerMap) pickerMap.__suppressInitialFitFlag = false;
  }, 120);
  return true;
}

function setPin(lat, lng, opts = {}) {
  if (!pickerMap) initPickerMap();
  if (!pickerMap) return;
  const fromPreset = opts.fromPreset === true;
  const shouldCenter = opts.center === true;
  if (!fromPreset && !isPointInBoundary(lat, lng)) {
    showToast('Pin berada di luar batas area ITS. Silakan pilih lokasi di dalam boundary.', 'error');
    return;
  }
  const fasumArea = fromPreset ? null : getFasumAreaAtPoint(lat, lng);
  const nearby = (!fromPreset && !fasumArea) ? getNearbyPresetLocation(lat, lng) : null;
  if (!fromPreset) {
    setLocationSelectValue(fasumArea?.name || nearby?.name || getOtherLocationOptionValue());
  }
  document.getElementById('lat').value = lat.toFixed(6);
  document.getElementById('lng').value = lng.toFixed(6);
  const areaStatus = fasumArea
    ? ` | Fasilitas Umum: ${fasumArea.name}`
    : nearby
    ? ` | Area radius ${NEARBY_LOCATION_RADIUS_METERS} m: ${nearby.name} (${Math.round(nearby.distance)} m)`
    : (!fromPreset ? ` | Area: ${OTHER_LOCATION_LABEL}` : '');
  document.getElementById('locStatus').textContent = `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}${areaStatus}`;
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
  if (shouldCenter) {
    pickerMap.__userAdjustedPickerView = true;
    pickerMap.setView([lat, lng], Math.max(pickerMap.getZoom(), 16), { animate: false });
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
  if (!pickerMap) initPickerMap();
  document.getElementById('locStatus').textContent = 'Mendapatkan lokasi...';
  navigator.geolocation.getCurrentPosition(
    pos => setPin(pos.coords.latitude, pos.coords.longitude, { fromPreset: false, center: true }),
    () => { showToast('Gagal mendapatkan lokasi.', 'error'); document.getElementById('locStatus').textContent = ''; }
  );
}

// ============================================================
// MAIN LEAFLET MAP (halaman Peta)
// ============================================================
function initLeafletMap() {
  if (leafletMap) return;
  const isMobile = itsafeIsMobileLike();
  leafletMap = L.map('leafletMap', {
    scrollWheelZoom: false,
    keyboard: false,
    // Mobile: one finger scrolls the page, two fingers can zoom the map.
    dragging: !isMobile,
    tap: true,
    touchZoom: true
  }).setView(ITS, ZOOM);
  baseTile = L.tileLayer(BASEMAPS.osm.url, { attribution: BASEMAPS.osm.attr }).addTo(leafletMap);
  fixedLocationLayerMain = L.layerGroup().addTo(leafletMap);
  renderFixedLocations(fixedLocationLayerMain);
  loadBoundaryLayer(leafletMap, 'main');

  if (isMobile) {
    const mapEl = document.getElementById('leafletMap');
    attachTwoFingerHint(mapEl);
    attachIOSMapScrollGuard(mapEl);
  }
}

function getActivePetaMode() {
  if (document.getElementById('tab-fasilitas')?.classList.contains('active')) return 'fasilitas';
  if (document.getElementById('tab-heatmap')?.classList.contains('active')) return 'heatmap';
  return 'sebaran';
}

function addUniqueReason(reasons, text) {
  if (text && !reasons.includes(text)) reasons.push(text);
}

function shortenReasonText(text, max = 72) {
  const clean = String(text || '').trim().replace(/\s+/g, ' ');
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}...` : clean;
}

function formatReasonList(reasons) {
  const picked = reasons.filter(Boolean).slice(0, 4);
  if (picked.length <= 1) return picked[0] || '';
  if (picked.length === 2) return `${picked[0]} dan ${picked[1]}`;
  return `${picked.slice(0, -1).join(', ')}, dan ${picked[picked.length - 1]}`;
}

function isAffirmativeReportValue(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text || text.includes('tidak')) return false;
  return text === 'ya' || text.includes('pernah') || text.includes('ada');
}

function getAreaRiskAssessment(score) {
  const s = parseInt(score, 10);
  if (isNaN(s)) return { label: 'Tidak tersedia', weight: null, icon: 'fa-circle-question', color: '#94A3B8' };
  if (s >= 3) return { label: 'Tinggi', weight: 3, icon: 'fa-fire-flame-curved', color: '#EF4444' };
  if (s === 2) return { label: 'Sedang', weight: 2, icon: 'fa-temperature-half', color: '#F59E0B' };
  return { label: 'Rendah', weight: 1, icon: 'fa-shield-halved', color: '#10B981' };
}

function getComfortAssessment(score) {
  const s = parseInt(score, 10);
  if (isNaN(s)) return { label: 'Tidak tersedia', weight: null, icon: 'fa-circle-question', color: '#94A3B8' };
  if (s === 1) return { label: 'Tidak Nyaman', weight: 3, icon: 'fa-face-frown', color: '#EF4444' };
  if (s === 2) return { label: 'Kurang Nyaman', weight: 2, icon: 'fa-face-meh', color: '#F59E0B' };
  return { label: 'Nyaman', weight: 1, icon: 'fa-face-smile', color: '#10B981' };
}

function getRiskReasonAssessment(value) {
  const text = String(value || '').trim();
  return {
    label: text || 'Tidak diisi',
    weight: text.toLowerCase().includes('kombinasi') ? 2 : 1
  };
}

function getBinaryRiskAssessment(value) {
  const text = String(value || '').trim().toLowerCase();
  return {
    label: value || 'Tidak diisi',
    weight: (text === 'pernah' || text === 'ya') ? 2 : 1
  };
}

function getRiskWeightBreakdown(reportOrScore, comfortScore) {
  const report = (reportOrScore && typeof reportOrScore === 'object')
    ? reportOrScore
    : { skorRawan: reportOrScore, skorNyaman: comfortScore };
  const isFullReport = reportOrScore && typeof reportOrScore === 'object';
  const area = getAreaRiskAssessment(report.skorRawan);
  const comfort = getComfortAssessment(report.skorNyaman);
  const components = [
    { key: 'skor_rawan', label: 'Tingkat kerawanan area', value: area.label, weight: area.weight },
    { key: 'skor_nyaman', label: 'Kenyamanan saat sendiri', value: comfort.label, weight: comfort.weight },
  ];

  if (isFullReport) {
    const reason = getRiskReasonAssessment(report.alasanTidakNyaman);
    const avoidance = getBinaryRiskAssessment(report.pernahHindari);
    const others = getBinaryRiskAssessment(report.orangLain);
    const suspicious = getBinaryRiskAssessment(report.situasiMencurigakan);
    components.push(
      { key: 'alasan_tidak_nyaman', label: 'Alasan tidak nyaman', value: reason.label, weight: reason.weight },
      { key: 'pernah_hindari', label: 'Pernah menghindari area', value: avoidance.label, weight: avoidance.weight },
      { key: 'orang_lain', label: 'Orang lain tidak nyaman', value: others.label, weight: others.weight },
      { key: 'situasi_mencurigakan', label: 'Situasi mencurigakan', value: suspicious.label, weight: suspicious.weight },
    );
  }

  const weights = components.map(c => c.weight).filter(v => typeof v === 'number' && !isNaN(v));
  return {
    components,
    total: weights.length ? weights.reduce((sum, value) => sum + value, 0) : null
  };
}

function getCombinedRiskScore(reportOrScore, comfortScore) {
  return getRiskWeightBreakdown(reportOrScore, comfortScore).total;
}

function getRiskVisual(reportOrScore, comfortScore) {
  const combined = getCombinedRiskScore(reportOrScore, comfortScore);
  if (combined === null) {
    return { label: 'Rawan Tidak Tersedia', icon: 'fa-circle-question', color: '#94A3B8', shape: 'circle', combinedScore: null };
  }
  if (combined >= 11) {
    return { label: 'Rawan Tinggi', icon: 'fa-fire-flame-curved', color: '#EF4444', shape: 'flame', combinedScore: combined };
  }
  if (combined >= 8) {
    return { label: 'Rawan Sedang', icon: 'fa-temperature-half', color: '#F59E0B', shape: 'triangle', combinedScore: combined };
  }
  return { label: 'Rawan Rendah', icon: 'fa-shield-halved', color: '#10B981', shape: 'circle', combinedScore: combined };
}

function describeAvoidance(value) {
  if (!value) return '';
  return value === 'Pernah' ? 'pelapor pernah menghindari area ini' : 'pelapor tidak pernah menghindari area ini';
}

function describeOtherPeople(value) {
  if (!value) return '';
  if (value === 'Ya') return 'ada orang lain yang juga tidak nyaman';
  if (value === 'Tidak') return 'belum ada orang lain yang diketahui tidak nyaman';
  return 'pelapor tidak tahu apakah orang lain juga tidak nyaman';
}

function describeSuspiciousSituation(value) {
  if (!value) return '';
  return value === 'Pernah' ? 'pelapor pernah melihat situasi mencurigakan' : 'pelapor tidak pernah melihat situasi mencurigakan';
}

function getRiskReasonParts(r) {
  const reasons = [];
  const comfort = getComfortAssessment(r.skorNyaman);
  const area = getAreaRiskAssessment(r.skorRawan);

  if (comfort.weight !== null) addUniqueReason(reasons, `kenyamanan saat sendiri: ${comfort.label.toLowerCase()}`);
  if (area.weight !== null) addUniqueReason(reasons, `tingkat kerawanan area: ${area.label.toLowerCase()}`);
  if (r.alasanTidakNyaman) addUniqueReason(reasons, `alasan pelapor: ${shortenReasonText(r.alasanTidakNyaman)}`);
  addUniqueReason(reasons, describeAvoidance(r.pernahHindari));
  addUniqueReason(reasons, describeOtherPeople(r.orangLain));
  addUniqueReason(reasons, describeSuspiciousSituation(r.situasiMencurigakan));

  return reasons;
}

function getRiskExplanation(r) {
  const risk = getRiskVisual(r);
  const reasonText = formatReasonList(getRiskReasonParts(r));

  if (risk.label === 'Rawan Tinggi') {
    return reasonText
      ? `Masuk kategori tinggi dari gabungan penilaian subjektif: ${reasonText}.`
      : 'Masuk kategori tinggi dari gabungan penilaian subjektif.';
  }

  if (risk.label === 'Rawan Sedang') {
    return reasonText
      ? `Masuk kategori sedang dari gabungan penilaian subjektif: ${reasonText}.`
      : 'Masuk kategori sedang dari gabungan penilaian subjektif.';
  }

  return reasonText
    ? `Masuk kategori rendah dari gabungan penilaian subjektif: ${reasonText}.`
    : 'Masuk kategori rendah dari gabungan penilaian subjektif.';
}

function getFacilityVisual(r) {
  const kel = calcKelayakan(r);
  if (kel.status === 'Layak') {
    return { label: 'Fasilitas Layak', icon: 'fa-check', color: '#10B981', shape: 'hex', kel };
  }
  if (kel.status === 'Cukup Layak') {
    return { label: 'Fasilitas Cukup Layak', icon: 'fa-scale-balanced', color: '#F59E0B', shape: 'hex', kel };
  }
  return { label: 'Fasilitas Kurang Layak', icon: 'fa-xmark', color: '#EF4444', shape: 'hex', kel };
}

function getReportVisual(r) {
  if (CONDITION_LAYER_VISUALS[activeLayer]) return CONDITION_LAYER_VISUALS[activeLayer];

  const mode = getActivePetaMode();
  if (mode === 'heatmap') return getRiskVisual(r);
  if (mode === 'fasilitas') return getFacilityVisual(r);

  return {
    label: MAP_MODE_META.sebaran.shortLabel,
    icon: MAP_MODE_META.sebaran.icon,
    color: MAP_MODE_META.sebaran.color,
    shape: MAP_MODE_META.sebaran.shape
  };
}

function getHeatIntensity(r) {
  const combined = getCombinedRiskScore(r);
  if (combined === null) return 0.5;
  if (combined >= 11) return 1;
  if (combined >= 8) return 0.65;
  return 0.35;
}

function createReportMarker(r) {
  return L.marker([r.lat, r.lng], {
    icon: createReportIcon(getReportVisual(r))
  }).bindPopup(buildPopup(r));
}

function getLayerModeNote() {
  if (CONDITION_LAYER_VISUALS[activeLayer]) return CONDITION_LAYER_VISUALS[activeLayer].desc;
  const mode = getActivePetaMode();
  if (activeLayer === 'rawan-tinggi') return 'Filter aktif: hanya laporan dengan tingkat rawan tinggi.';
  if (activeLayer === 'rawan-sedang') return 'Filter aktif: hanya laporan dengan tingkat rawan sedang.';
  if (activeLayer === 'rawan-rendah') return 'Filter aktif: hanya laporan dengan tingkat rawan rendah.';
  if (activeLayer === 'layak') return 'Filter aktif: hanya area dengan fasilitas layak.';
  if (activeLayer === 'cukup-layak') return 'Filter aktif: hanya area dengan fasilitas cukup layak.';
  if (activeLayer === 'kurang-layak') return 'Filter aktif: hanya area dengan fasilitas kurang layak.';
  return MAP_MODE_META[mode]?.note || '';
}

function updateMapOutputUI() {
  const mode = getActivePetaMode();
  const meta = MAP_MODE_META[mode] || MAP_MODE_META.sebaran;
  const layerVisual = CONDITION_LAYER_VISUALS[activeLayer];
  const display = layerVisual || meta;
  const layerLabel = getLayerLabel(activeLayer);

  const activeName = document.getElementById('activeLayerName');
  if (activeName) activeName.textContent = layerLabel;

  const activeLayerBox = document.getElementById('mapActiveLayer');
  if (activeLayerBox) {
    const icon = activeLayerBox.querySelector('i');
    if (icon) icon.className = `fas ${display.icon || meta.icon}`;
  }

  const note = document.getElementById('mapOutputNote');
  const noteIcon = document.getElementById('mapOutputIcon');
  const noteTitle = document.getElementById('mapOutputTitle');
  const noteDesc = document.getElementById('mapOutputDesc');
  if (note) note.style.setProperty('--output-color', display.color || meta.color);
  if (noteIcon) noteIcon.innerHTML = `<i class="fas ${display.icon || meta.icon}"></i>`;
  if (noteTitle) noteTitle.textContent = layerVisual ? `${meta.label}: ${layerVisual.label}` : meta.label;
  if (noteDesc) noteDesc.textContent = getLayerModeNote();

  const layerPanelTitle = document.getElementById('layerPanelTitle');
  if (layerPanelTitle) {
    const titleText = mode === 'heatmap'
      ? 'Layer Tingkat Kerawanan'
      : (mode === 'fasilitas' ? 'Layer Kelayakan Fasilitas' : 'Layer Berdasarkan Kondisi');
    layerPanelTitle.innerHTML = `<i class="fas fa-layer-group"></i> ${titleText}`;
  }

  updateLegendSymbols(mode, display);
}

function updateLegendSymbols(mode, display) {
  const title = document.getElementById('legendSymbolTitle');
  const list = document.getElementById('legendSymbolList');
  if (!list) return;

  const modeMeta = MAP_MODE_META[mode] || MAP_MODE_META.sebaran;
  if (title) title.textContent = `Simbol ${modeMeta.shortLabel}`;

  let html = '';
  if (mode === 'heatmap') {
    html = `
      <div class="legend-item"><span class="legend-marker legend-marker-flame" style="--case-color:#EF4444"><i class="fas fa-fire-flame-curved"></i></span> Rawan tinggi</div>
      <div class="legend-item"><span class="legend-marker legend-marker-triangle" style="--case-color:#F59E0B"><i class="fas fa-temperature-half"></i></span> Rawan sedang</div>
      <div class="legend-item"><span class="legend-marker legend-marker-circle" style="--case-color:#10B981"><i class="fas fa-shield-halved"></i></span> Rawan rendah</div>`;
  } else if (mode === 'fasilitas') {
    html = `
      <div class="legend-item"><span class="legend-marker legend-marker-hex" style="--case-color:#10B981"><i class="fas fa-check"></i></span> Fasilitas layak</div>
      <div class="legend-item"><span class="legend-marker legend-marker-hex" style="--case-color:#F59E0B"><i class="fas fa-scale-balanced"></i></span> Cukup layak</div>
      <div class="legend-item"><span class="legend-marker legend-marker-hex" style="--case-color:#EF4444"><i class="fas fa-xmark"></i></span> Kurang layak</div>`;
  } else {
    html = `
      <div class="legend-item"><span class="legend-marker legend-marker-circle" style="--case-color:#D56A6A"><i class="fas fa-location-dot"></i></span> Semua laporan tervalidasi</div>
      <div class="legend-item"><span class="legend-marker legend-marker-diamond" style="--case-color:#374151"><i class="fas fa-moon"></i></span> Layer area gelap</div>
      <div class="legend-item"><span class="legend-marker legend-marker-square" style="--case-color:#3B82F6"><i class="fas fa-person-walking"></i></span> Layer area sepi</div>
      <div class="legend-item"><span class="legend-marker legend-marker-notch" style="--case-color:#7C3AED"><i class="fas fa-video-slash"></i></span> Layer tanpa CCTV</div>
      <div class="legend-item"><span class="legend-marker legend-marker-shield" style="--case-color:#EA580C"><i class="fas fa-user-shield"></i></span> Layer minim petugas</div>`;
  }

  html += `<div class="legend-item"><span class="legend-marker legend-marker-square" style="--case-color:${FASUM_COLOR}"><i class="fas fa-tree-city"></i></span> Fasilitas Umum</div>`;
  html += '<div class="legend-item"><span class="legend-line"></span> Batas Kampus ITS</div>';
  list.innerHTML = html;
}

function renderLeafletMap() {
  if (!leafletMap) return;
  updateMapOutputUI();
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
      data.map(r => [r.lat, r.lng, getHeatIntensity(r)]),
      {
        radius: 38,
        blur: 24,
        maxZoom: 18,
        gradient: { 0.12: '#84A59D', 0.38: '#F6BD60', 0.68: '#F97316', 1.0: '#EF4444' }
      }
    ).addTo(leafletMap);
  }

  if (visPoint) {
    pointLayer = L.layerGroup();
    data.forEach(r => {
      createReportMarker(r).addTo(pointLayer);
    });
    leafletMap.addLayer(pointLayer);
  }

  if (visCluster && L.markerClusterGroup) {
    clusterLayer = L.markerClusterGroup({ chunkedLoading: true });
    data.forEach(r => {
      createReportMarker(r).addTo(clusterLayer);
    });
    leafletMap.addLayer(clusterLayer);
  }
}

async function loadBoundaryLayer(map, target) {
  if (!map || typeof shp === 'undefined') return;
  try {
    if (target === 'main' && boundaryLayerMain) return;
    if (target === 'picker' && boundaryLayerPicker) return;
    let buf = null;
    try {
      const assetVersion = window.ITSAFE_ASSET_VERSION || '1.2.9';
      const res = await fetch(`assets/its_boundary.zip?v=${assetVersion}`);
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
    if (target === 'main') boundaryLayerMain = layer;
    if (target === 'picker') boundaryLayerPicker = layer;
    const bounds = layer.getBounds?.();
    if (bounds && bounds.isValid && bounds.isValid()) {
      if (!map.__boundaryFitted) {
        if (target === 'picker') {
          map.__boundaryFitted = fitPickerInitialView();
        } else {
          map.fitBounds(bounds, { padding: [20, 20] });
          map.__boundaryFitted = true;
        }
      }
    }
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
  if (val === 1) return '<div class="popup-status-badge badge-danger"><i class="fas fa-face-frown"></i> Tidak Nyaman Saat Sendiri</div>';
  if (val === 2) return '<div class="popup-status-badge badge-warning"><i class="fas fa-face-meh"></i> Kurang Nyaman Saat Sendiri</div>';
  if (val === 3) return '<div class="popup-status-badge badge-safe"><i class="fas fa-face-smile"></i> Nyaman Saat Sendiri</div>';
  return '';
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

  if (!val || val === '-') return '<span class="popup-meta-value" style="color:#94a3b8">Tidak tersedia</span>';
  return `<span class="popup-meta-value" style="color:${color}">${val}</span>`;
}

function getConditionChips(r) {
  const chips = [];
  if (r.pencahayaan === 'Gelap') chips.push(CONDITION_LAYER_VISUALS.gelap);
  if (isSepi(r.kepadatan)) chips.push(CONDITION_LAYER_VISUALS.sepi);
  if (r.cctv === 'Tidak ada') chips.push(CONDITION_LAYER_VISUALS.nocctv);
  if (isMinimPetugas(r.petugas)) chips.push(CONDITION_LAYER_VISUALS['minim-petugas']);

  if (!chips.length) return '';
  return `<div class="popup-condition-chips">
    ${chips.map(chip => `<span class="popup-condition-chip" style="--chip-color:${chip.color}"><i class="fas ${chip.icon}"></i> ${chip.label}</span>`).join('')}
  </div>`;
}

function buildSubjectiveChoiceRow(label, value, icon, color = '#D56A6A') {
  return `<div class="popup-subjective-row" style="--subjective-color:${color}">
    <span class="popup-subjective-icon"><i class="fas ${icon}"></i></span>
    <span class="popup-subjective-text">
      <span>${esc(label)}</span>
      <strong>${esc(value || 'Tidak diisi')}</strong>
    </span>
    <i class="fas fa-chevron-right popup-subjective-arrow"></i>
  </div>`;
}

function buildSubjectiveChoices(r) {
  const comfort = getComfortAssessment(r.skorNyaman);
  const area = getAreaRiskAssessment(r.skorRawan);
  const rows = [
    buildSubjectiveChoiceRow('Kenyamanan Saat Sendiri', comfort.label, comfort.icon, comfort.color),
    buildSubjectiveChoiceRow('Tingkat Kerawanan Area', area.label, area.icon, area.color),
    buildSubjectiveChoiceRow('Alasan Tidak Nyaman', r.alasanTidakNyaman || 'Tidak diisi', 'fa-comment-dots', '#D56A6A'),
    buildSubjectiveChoiceRow('Pernah Menghindari Area Ini?', r.pernahHindari || 'Tidak diisi', 'fa-route', '#8B5CF6'),
    buildSubjectiveChoiceRow('Tahu Orang Lain Tidak Nyaman?', r.orangLain || 'Tidak diisi', 'fa-users', '#3B82F6'),
    buildSubjectiveChoiceRow('Pernah Lihat Situasi Mencurigakan?', r.situasiMencurigakan || 'Tidak diisi', 'fa-eye', '#F97316'),
  ];

  return `<div class="popup-subjective-panel">
    <div class="popup-subjective-title"><i class="fas fa-clipboard-check"></i> Penilaian Subjektif</div>
    ${rows.join('')}
  </div>`;
}

function getPopupOutputSummary(r) {
  const mode = getActivePetaMode();
  const layerVisual = CONDITION_LAYER_VISUALS[activeLayer];

  if (layerVisual) {
    return {
      icon: layerVisual.icon,
      color: layerVisual.color,
      title: layerVisual.label,
      desc: layerVisual.desc
    };
  }

  if (mode === 'heatmap') {
    const risk = getRiskVisual(r);
    return {
      icon: risk.icon,
      color: risk.color,
      title: risk.label,
      desc: getRiskExplanation(r)
    };
  }

  if (mode === 'fasilitas') {
    const kel = calcKelayakan(r);
    return {
      icon: getFacilityVisual(r).icon,
      color: getFacilityVisual(r).color,
      title: `Fasilitas ${kel.status}`,
      desc: kel.alasan.length
        ? `Faktor pembatas: ${kel.alasan.join(', ')}.`
        : 'Kondisi fisik utama terbaca relatif memadai dari laporan ini.'
    };
  }

  return {
    icon: MAP_MODE_META.sebaran.icon,
    color: MAP_MODE_META.sebaran.color,
    title: 'Laporan tervalidasi',
    desc: 'Ditampilkan sebagai titik lokasi umum karena laporan sudah diverifikasi valid.'
  };
}

function buildPopupOutputCard(summary) {
  return `<div class="popup-output-card" style="--output-color:${summary.color}">
    <span class="popup-output-icon"><i class="fas ${summary.icon}"></i></span>
    <span>
      <strong>${esc(summary.title)}</strong>
      <small>${esc(summary.desc)}</small>
    </span>
  </div>`;
}

function buildPopup(r) {
  const faculty = r.fakultas || getFacultyFromLocationName(r.lokasi);
  const mode = getActivePetaMode();
  const visual = getReportVisual(r);
  const summary = getPopupOutputSummary(r);

  let headerHtml = `<div class="popup-header popup-header-${mode}" style="--popup-accent:${visual.color || summary.color}">
    <div class="popup-output-kicker"><i class="fas ${visual.icon || summary.icon}"></i> ${esc(visual.label || MAP_MODE_META[mode].shortLabel)}</div>
    <div class="popup-loc-name">${esc(r.lokasi)}</div>
    <div class="popup-faculty">${esc(faculty)}</div>
    <div class="popup-coords">${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}</div>
  </div>`;

  const isDescHidden = typeof r.lokasiDeskripsi === 'string' && r.lokasiDeskripsi.startsWith('HIDDEN_');
  const isKronologiHidden = typeof r.kronologi === 'string' && r.kronologi.startsWith('HIDDEN_');

  let descHtml = '';
  if (isDescHidden || isKronologiHidden) {
    descHtml = `<div class="popup-desc text-muted" style="font-style: italic; color: #888;">Detail laporan telah disembunyikan karena terlalu sensitif.</div>`;
  } else if (r.lokasiDeskripsi) {
    descHtml = `<div class="popup-desc">${esc(r.lokasiDeskripsi)}</div>`;
  }

  const summaryHtml = `<div class="popup-output-top">${buildPopupOutputCard(summary)}</div>`;

  let bodyHtml = `<div class="popup-body">`;

  if (mode === 'heatmap') {
    bodyHtml += buildSubjectiveChoices(r);
  }

  if (mode === 'sebaran') {
    bodyHtml += `<div class="popup-status-badge badge-info"><i class="fas fa-circle-check"></i> Laporan Valid</div>`;
    bodyHtml += getNyamanLabel(r.skorNyaman);
  }

  bodyHtml += getConditionChips(r);

  bodyHtml += `<div class="popup-meta-grid">
    <div class="popup-meta-row">
      <span class="popup-meta-label">Waktu Rawan</span>
      <span class="popup-meta-value" style="color:#64748b">${r.waktu || 'Belum diisi'}</span>
    </div>
    <div class="popup-meta-row">
      <span class="popup-meta-label">Hari Rawan</span>
      <span class="popup-meta-value" style="color:#64748b">${r.hariRawan === 'Keduanya sama' ? 'Hari Kerja dan Libur' : (r.hariRawan || 'Belum diisi')}</span>
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
      <span class="popup-meta-label">Keterbukaan</span>
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
    ${summaryHtml}
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

  const isPicker = (layer === fixedLocationLayerPicker);
  const showJurusan = isPicker ? visJurusanForm : visJurusanMain;
  const showFasum = isPicker ? visFasumForm : visFasumMain;
  const showFixed = isPicker ? visFixedPinForm : visFixedPinMain;
  const popupOptions = isPicker ? { autoPan: false, keepInView: false } : undefined;

  // Pin Jurusan/Fakultas
  if (showJurusan) {
    const sel = document.getElementById('lokasiInsiden');
    if (sel) {
      const opts = Array.from(sel.querySelectorAll('option[data-lat][data-lng]'))
        .filter(opt => !isFasumOption(opt));
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
          .bindPopup(`<div class="popup-card"><div class="popup-header"><div class="popup-loc-name">${esc(locName)}</div><div class="popup-faculty">${esc(faculty)}</div></div></div>`, popupOptions)
          .addTo(layer);
      });
    }
  }

  // Pin titik tengah polygon fasilitas umum
  if (showFasum) {
    if (!fasumAreas.length) loadFasumAreas();
    fasumAreas.forEach(area => {
      L.marker([area.lat, area.lng], { icon: createFasumIcon(area.jenis_lokasi) })
        .bindPopup(`<div class="popup-card"><div class="popup-header"><div class="popup-loc-name">${esc(area.name)}</div><div class="popup-faculty">${esc(FASUM_GROUP_LABEL)} - ${esc(area.jenis_lokasi || 'Lainnya')}</div></div></div>`, popupOptions)
        .addTo(layer);
    });
  }

  // Pin Lokasi QR Aduan
  if (showFixed) {
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
      
      const photoPath = loc.photo || '';
      const isHidden = typeof photoPath === 'string' && photoPath.startsWith('HIDDEN_');
      const photoHtml = (photoPath && !isHidden) 
        ? `<div style="margin-top:8px;"><img src="${photoPath}" style="width:100%;border-radius:4px;max-height:100px;object-fit:cover;" alt="Foto Lokasi" onerror="this.style.display='none'"/></div>` 
        : '';

      L.circleMarker([lat, lng], {
        radius: 7,
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: 0.85,
        weight: 2
      }).bindPopup(`<div class="popup-card"><div class="popup-header"><div class="popup-loc-name">${esc(loc.name || 'Titik Pengaduan')}</div></div><div class="popup-body"><div class="popup-status-badge ${badgeCls}"><i class="fas ${badgeIcon}"></i> ${status}</div>${photoHtml}</div></div>`, popupOptions).addTo(layer);
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
    sebaran: { title: 'Peta 1: Sebaran Titik Lokasi Rawan', desc: 'Menampilkan sebaran titik lokasi area rawan berdasarkan jumlah laporan masuk dari warga kampus ITS.' },
    heatmap: { title: 'Peta 2: Heatmap Kerawanan', desc: 'Menampilkan konsentrasi area rawan berdasarkan total bobot penilaian subjektif pelapor.' },
    fasilitas: { title: 'Peta 3: Kelayakan Fasilitas', desc: 'Menampilkan penilaian kondisi fisik area berdasarkan parameter pencahayaan, CCTV, kepadatan, petugas keamanan, dan vegetasi.' },
  };

  const showLayerGroup = (groupClass, defaultLayer) => {
    document.querySelectorAll('.layer-card').forEach(l => {
      l.style.display = 'none';
      l.classList.remove('active');
      const input = l.querySelector('input');
      if (input) input.checked = false;
    });
    document.querySelectorAll(groupClass).forEach(l => l.style.display = 'flex');
    activeLayer = defaultLayer;
    const selected = document.querySelector(`${groupClass}[data-layer="${defaultLayer}"]`);
    if (selected) {
      selected.classList.add('active');
      const input = selected.querySelector('input');
      if (input) input.checked = true;
    }
  };

  const setVisToggleState = (type, checked) => {
    const el = document.getElementById('tog-' + type);
    if (!el) return;
    el.classList.toggle('active', checked);
    const input = el.querySelector('input');
    if (input) input.checked = checked;
  };

  // Update tampilan layer sesuai tab
  if (tab === 'sebaran') {
    // Titik + Cluster aktif, heatmap off
    visHeatmap = false;
    visPoint = true;
    visCluster = false;
    setVisToggleState('heatmap', false);
    setVisToggleState('point', true);
    setVisToggleState('cluster', false);

    showLayerGroup('.layer-p1', 'semua');
  } else if (tab === 'heatmap') {
    // Heatmap aktif, titik off
    visHeatmap = true;
    visPoint = false;
    visCluster = false;
    setVisToggleState('heatmap', true);
    setVisToggleState('point', false);
    setVisToggleState('cluster', false);

    showLayerGroup('.layer-p2', 'semua-2');
  } else if (tab === 'fasilitas') {
    // Titik aktif dengan simbologi kondisi fisik
    visHeatmap = false;
    visPoint = true;
    visCluster = false;
    setVisToggleState('heatmap', false);
    setVisToggleState('point', true);
    setVisToggleState('cluster', false);

    showLayerGroup('.layer-p3', 'semua-3');
  }

  updateMapOutputUI();
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
  
  // Independent visibility for main and form
  if (type === 'jurusan') visJurusanMain = cb.checked;
  if (type === 'fixedpin') visFixedPinMain = cb.checked;
  if (type === 'fasum') visFasumMain = cb.checked;
  if (type === 'jurusan-form') visJurusanForm = cb.checked;
  if (type === 'fixedpin-form') visFixedPinForm = cb.checked;
  if (type === 'fasum-form') visFasumForm = cb.checked;

  const el = document.getElementById('tog-' + type);
  if (el) {
    el.classList.toggle('active', cb.checked);
    const inp = el.querySelector('input');
    if (inp) inp.checked = cb.checked;
  }

  if (type.includes('-form')) {
    if (fixedLocationLayerPicker) renderFixedLocations(fixedLocationLayerPicker);
  } else {
    renderLeafletMap();
  }
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

// Identical to admin.html getPhotoUrl: use /media/ route (storage/ blocked on hosting)
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
  set('cnt-tinggi', reports.filter(r => isRawanTinggi(r)).length);
  set('cnt-sedang', reports.filter(r => isRawanSedang(r)).length);
  set('cnt-rendah', reports.filter(r => isRawanRendah(r)).length);
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
    const key = getReportAreaName(r);
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
    const key = getReportAreaName(r);
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

  const scores = data.map(r => getCombinedRiskScore(r)).filter(v => typeof v === 'number' && !isNaN(v));
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  let avgLabel = '';
  if (avg !== null) {
    if (avg >= 11) avgLabel = 'Tinggi';
    else if (avg >= 8) avgLabel = 'Sedang';
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
      skorRawan: Math.floor(Math.random() * 3) + 1,
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
    if (typeof QRCode !== 'undefined') {
      qrInstance = new QRCode(cont, {
        text: url,
        width: 220,
        height: 220,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      throw new Error('QRCode not loaded');
    }
  } catch (e) {
    // Fallback: use external API image
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}&margin=4`;
    img.alt = 'QR Code ITSafe';
    img.style.cssText = 'width:220px;height:220px;display:block;border-radius:8px;';
    img.onerror = function() {
      cont.innerHTML = `<div class="qr-placeholder-inner"><i class="fas fa-qrcode"></i><p>QR Code</p></div>`;
    };
    cont.appendChild(img);
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
// HELPERS
// ============================================================
function getRiskColor(score) {
  return getRiskVisual(score).color;
}

function isRawanTinggi(reportOrScore, comfortScore) {
  const combined = getCombinedRiskScore(reportOrScore, comfortScore);
  return combined !== null && combined >= 11;
}

function isRawanSedang(reportOrScore, comfortScore) {
  const combined = getCombinedRiskScore(reportOrScore, comfortScore);
  return combined !== null && combined >= 8 && combined <= 10;
}

function isRawanRendah(reportOrScore, comfortScore) {
  const combined = getCombinedRiskScore(reportOrScore, comfortScore);
  return combined !== null && combined <= 7;
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
      return isRawanTinggi(r);
    case 'rawan-sedang':
      return isRawanSedang(r);
    case 'rawan-rendah':
      return isRawanRendah(r);
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

function jsArg(str) {
  return JSON.stringify(String(str || '')).replace(/</g, '\\u003c');
}

// Keep modal helpers from leaving the document in a fixed/locked state on mobile.
let _itsafeScrollLockDepth = 0;

function itsafeLockBodyScroll() {
  _itsafeScrollLockDepth = 0;
  document.body.classList.remove('itsafe-scroll-locked');
  document.body.style.top = '';
}

function itsafeUnlockBodyScroll() {
  _itsafeScrollLockDepth = 0;
  document.body.classList.remove('itsafe-scroll-locked');
  document.body.style.top = '';
}

function itsafeEnsureBodyScrollUnlocked() {
  try {
    const anyOpenModal = document.querySelector('.its-modal.open');
    if (anyOpenModal) return;

    _itsafeScrollLockDepth = 0;
    document.body.classList.remove('itsafe-scroll-locked');
    document.body.style.top = '';
  } catch { /* ignore */ }
}

(function initItsafeScrollUnlockSafety() {
  if (window._itsafeScrollUnlockSafety) return;
  window._itsafeScrollUnlockSafety = true;

  const run = () => itsafeEnsureBodyScrollUnlocked();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  // If the page is restored from bfcache, clean up any stale scroll-lock state.
  window.addEventListener('pageshow', (e) => {
    if (e && e.persisted) run();
  });

  window.addEventListener('orientationchange', () => setTimeout(run, 250), { passive: true });
  document.addEventListener('touchstart', () => itsafeReleaseIOSScrollState(), { passive: true });
})();

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.className = 'toast'; }, 3500);
}

function openSubmitSuccessModal(opts = {}) {
  const modal = document.getElementById('submitSuccessModal');
  if (!modal) return;

  const codeWrap = document.getElementById('submitSuccessCodeWrap');
  const codeEl = document.getElementById('submitSuccessCode');
  const noteEl = document.getElementById('submitSuccessNote');

  const reportCode = opts.reportCode ? String(opts.reportCode) : '';
  const reporterEmail = opts.reporterEmail ? String(opts.reporterEmail) : '';
  const mailSent = opts.mailSent !== false;

  modal.dataset.reportCode = reportCode;
  modal.dataset.reporterEmail = reporterEmail;

  if (codeWrap) {
    if (reportCode) {
      codeWrap.style.display = '';
      if (codeEl) codeEl.textContent = reportCode;
    } else {
      codeWrap.style.display = 'none';
      if (codeEl) codeEl.textContent = 'Tidak tersedia';
    }
  }

  if (noteEl) {
    noteEl.style.display = mailSent ? 'none' : 'block';
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  itsafeLockBodyScroll();

  requestAnimationFrame(() => {
    const btn = modal.querySelector('.its-modal-actions .btn');
    if (btn && typeof btn.focus === 'function') btn.focus();
  });
}

function closeSubmitSuccessModal() {
  const modal = document.getElementById('submitSuccessModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  itsafeUnlockBodyScroll();
}

function openReportEditFromSuccess() {
  const modal = document.getElementById('submitSuccessModal');
  const reportCode = modal?.dataset.reportCode || document.getElementById('submitSuccessCode')?.textContent?.trim() || '';
  const reporterEmail = modal?.dataset.reporterEmail || '';

  closeSubmitSuccessModal();
  openEditReportModal({
    code: reportCode && reportCode !== 'Tidak tersedia' ? reportCode : '',
    email: reporterEmail,
    focus: 'button',
  });
}

function openEditReportModal(opts = {}) {
  openHistoryModal('edit', opts);
}

function copyReportCode() {
  const codeEl = document.getElementById('submitSuccessCode');
  if (!codeEl) return;
  const code = codeEl.textContent.trim();
  if (!code || code === 'Tidak tersedia') return;
  navigator.clipboard.writeText(code).then(() => {
    showToast('Kode laporan berhasil disalin!', 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Kode laporan berhasil disalin!', 'success');
  });
}

function openHistoryModal(defaultTab = 'email', opts = {}) {
  const modal = document.getElementById('historyLaporanModal');
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  itsafeLockBodyScroll();
  const isEditMode = defaultTab === 'edit';
  const title = document.getElementById('historyModalTitle');
  const header = modal.querySelector('.history-modal-header');
  const icon = modal.querySelector('.history-modal-icon i');
  const tabs = modal.querySelector('.history-tab-row');
  const res = document.getElementById('historyResult');
  const inp = document.getElementById('historyEmailInput');
  const codeInp = document.getElementById('historyCodeInput');
  const editCodeInp = document.getElementById('editReportCodeInput');
  const editEmailInp = document.getElementById('editReportEmailInput');
  const editResult = document.getElementById('editReportResult');
  const detailWrap = document.getElementById('historyDetailWrap');
  currentHistoryEmail = '';
  if (title) title.textContent = isEditMode ? 'Edit Laporan' : 'History Laporan Saya';
  if (header) {
    const desc = header.querySelector('p');
    if (desc) {
      desc.textContent = isEditMode
        ? 'Edit laporan menggunakan kode laporan atau email pelapor.'
        : 'Cari riwayat laporan menggunakan email atau kode laporan yang kamu miliki.';
    }
  }
  if (icon) icon.className = isEditMode ? 'fas fa-file-pen' : 'fas fa-clock-rotate-left';
  if (tabs) tabs.style.display = isEditMode ? 'none' : '';
  if (res) { res.style.display = 'none'; res.innerHTML = ''; }
  if (inp) inp.value = '';
  if (codeInp) codeInp.value = '';
  if (editCodeInp) editCodeInp.value = opts.code || '';
  if (editEmailInp) editEmailInp.value = opts.email || '';
  if (editResult) { editResult.style.display = 'none'; editResult.innerHTML = ''; }
  if (detailWrap) detailWrap.style.display = 'none';

  switchHistoryTab(defaultTab);

  requestAnimationFrame(() => {
    if (defaultTab === 'edit') {
      const target = opts.focus === 'button'
        ? document.querySelector('#historyPanelEdit .btn')
        : (opts.focus === 'email' ? editEmailInp : editCodeInp);
      if (target && typeof target.focus === 'function') target.focus();
    }
  });
}

function switchHistoryTab(tab) {
  const tabEmail = document.getElementById('historyTabEmail');
  const tabCode = document.getElementById('historyTabCode');
  const tabEdit = document.getElementById('historyTabEdit');
  const panelEmail = document.getElementById('historyPanelEmail');
  const panelCode = document.getElementById('historyPanelCode');
  const panelEdit = document.getElementById('historyPanelEdit');
  const res = document.getElementById('historyResult');
  const editResult = document.getElementById('editReportResult');
  const detailWrap = document.getElementById('historyDetailWrap');
  if (res) { res.style.display = 'none'; res.innerHTML = ''; }
  if (tab !== 'edit' && editResult) { editResult.style.display = 'none'; editResult.innerHTML = ''; }
  if (detailWrap) detailWrap.style.display = 'none';

  if (tabEmail) tabEmail.classList.toggle('active', tab === 'email');
  if (tabCode) tabCode.classList.toggle('active', tab === 'code');
  if (tabEdit) tabEdit.classList.toggle('active', tab === 'edit');
  if (panelEmail) panelEmail.style.display = tab === 'email' ? '' : 'none';
  if (panelCode) panelCode.style.display = tab === 'code' ? '' : 'none';
  if (panelEdit) panelEdit.style.display = tab === 'edit' ? '' : 'none';

  if (tab === 'email') {
    return;
  }

  if (tab === 'code') {
    currentHistoryEmail = '';
    return;
  }
}

async function checkReportsByEmail() {
  const input = document.getElementById('historyEmailInput');
  const result = document.getElementById('historyResult');
  const detailWrap = document.getElementById('historyDetailWrap');
  if (!input || !result) return;
  const email = input.value.trim();
  if (!email) { showToast('Masukkan email terlebih dahulu.', 'error'); return; }
  currentHistoryEmail = email;
  if (detailWrap) detailWrap.style.display = 'none';
  result.style.display = 'block';
  result.innerHTML = '<div class="history-loading"><i class="fas fa-spinner fa-spin"></i> Mencari laporan...</div>';
  try {
    const res = await fetch(`${API_BASE}/reports/by-email?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      if (!data || !data.reports || data.reports.length === 0) {
        result.innerHTML = `<div class="history-result-card status-pending"><i class="fas fa-inbox"></i> Tidak ada laporan yang ditemukan untuk email <strong>${esc(email)}</strong>. Pastikan email yang kamu masukkan sudah benar.</div>`;
        return;
      }
      const statusMap = {
        'pending':  { cls: 'status-pending',  icon: 'fa-hourglass-half',   label: 'Menunggu Verifikasi' },
        'review':   { cls: 'status-review',   icon: 'fa-magnifying-glass', label: 'Sedang Ditinjau' },
        'valid':    { cls: 'status-valid',    icon: 'fa-check-circle',     label: 'Valid' },
        'rejected': { cls: 'status-rejected', icon: 'fa-circle-xmark',    label: 'Ditolak' },
      };
      let html = `<div class="history-email-list-header"><i class="fas fa-list-check"></i> Ditemukan <strong>${data.reports.length} laporan</strong> untuk <em>${esc(email)}</em></div>`;
      html += '<div class="history-email-list">';
      data.reports.forEach(r => {
        const s = statusMap[r.status] || { cls: 'status-pending', icon: 'fa-question-circle', label: r.status || 'Tidak diketahui' };
        const tgl = r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanggal tidak diketahui';
        html += `<div class="history-email-item" onclick="showReportDetail('${esc(r.report_code)}')">
          <div class="history-email-item-left">
            <span class="history-email-code"><i class="fas fa-barcode"></i> ${esc(r.report_code)}</span>
            <span class="history-email-lokasi">${esc(r.lokasi || 'Lokasi tidak tersedia')}</span>
            <span class="history-email-tgl"><i class="fas fa-calendar-alt"></i> ${tgl}</span>
          </div>
          <div class="history-email-item-right">
            <span class="history-status-badge ${s.cls}"><i class="fas ${s.icon}"></i> ${s.label}</span>
            <i class="fas fa-chevron-right history-chevron"></i>
          </div>
        </div>`;
      });
      html += '</div>';
      result.innerHTML = html;
    } else {
      result.innerHTML = `<div class="history-result-card status-rejected"><i class="fas fa-circle-xmark"></i> Tidak dapat mengambil data. Pastikan email sudah benar atau coba beberapa saat lagi.</div>`;
    }
  } catch {
    result.innerHTML = '<div class="history-result-card status-pending"><i class="fas fa-wifi"></i> Tidak dapat terhubung ke server. Coba beberapa saat lagi.</div>';
  }
}

async function checkEditableReportsByEmail() {
  const input = document.getElementById('editReportEmailInput');
  const result = document.getElementById('editReportResult');
  if (!input || !result) return;

  const email = input.value.trim();
  if (!email) {
    showToast('Masukkan email pelapor terlebih dahulu.', 'error');
    input.focus();
    return;
  }
  if (!isValidEmail(email)) {
    showToast('Format email belum valid.', 'error');
    input.focus();
    return;
  }
  currentHistoryEmail = email;

  result.style.display = 'block';
  result.innerHTML = '<div class="history-loading"><i class="fas fa-spinner fa-spin"></i> Mencari laporan yang bisa diedit...</div>';

  try {
    const res = await fetch(`${API_BASE}/reports/by-email?email=${encodeURIComponent(email)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.reports) {
      result.innerHTML = '<div class="history-result-card status-rejected"><i class="fas fa-circle-xmark"></i> Email tidak ditemukan atau belum memiliki laporan.</div>';
      return;
    }

    const editableReports = data.reports.filter(r => r.can_edit);
    if (editableReports.length === 0) {
      result.innerHTML = '<div class="history-result-card status-review"><i class="fas fa-circle-info"></i> Tidak ada laporan yang masih bisa diedit untuk email ini.</div>';
      return;
    }

    let html = '<div class="history-email-list-header"><i class="fas fa-pen-to-square"></i> Pilih laporan yang ingin diedit</div>';
    html += '<div class="history-email-list">';
    editableReports.forEach(r => {
      const tgl = r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanggal tidak diketahui';
      html += `<button type="button" class="history-email-item history-edit-item" onclick="startReportEdit(${jsArg(r.report_code)}, { email: ${jsArg(email)}, prompt: false })">
        <div class="history-email-item-left">
          <span class="history-email-code"><i class="fas fa-barcode"></i> ${esc(r.report_code)}</span>
          <span class="history-email-lokasi">${esc(r.lokasi || 'Lokasi tidak tersedia')}</span>
          <span class="history-email-tgl"><i class="fas fa-calendar-alt"></i> ${tgl}</span>
        </div>
        <div class="history-email-item-right">
          <span class="history-status-badge status-pending"><i class="fas fa-hourglass-half"></i> Bisa diedit</span>
          <i class="fas fa-pen-to-square history-chevron"></i>
        </div>
      </button>`;
    });
    html += '</div>';
    result.innerHTML = html;
  } catch {
    result.innerHTML = '<div class="history-result-card status-pending"><i class="fas fa-wifi"></i> Tidak dapat terhubung ke server. Coba beberapa saat lagi.</div>';
  }
}

async function showReportDetail(code) {
  const result = document.getElementById('historyResult');
  const detailWrap = document.getElementById('historyDetailWrap');
  const detailResult = document.getElementById('historyDetailResult');
  if (!detailWrap || !detailResult) return;
  if (result) result.style.display = 'none';
  detailWrap.style.display = 'block';
  detailResult.innerHTML = '<div class="history-loading"><i class="fas fa-spinner fa-spin"></i> Memuat detail laporan...</div>';

  try {
    const res = await fetch(`${API_BASE}/reports/status/${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = await res.json();
      const statusMap = {
        'pending':  { cls: 'status-pending',  icon: 'fa-hourglass-half',   label: 'Menunggu Verifikasi' },
        'review':   { cls: 'status-review',   icon: 'fa-magnifying-glass', label: 'Sedang Ditinjau' },
        'valid':    { cls: 'status-valid',    icon: 'fa-check-circle',     label: 'Valid, tampil di peta' },
        'rejected': { cls: 'status-rejected', icon: 'fa-circle-xmark',    label: 'Ditolak' },
      };
      const s = statusMap[data.status] || { cls: 'status-pending', icon: 'fa-question-circle', label: data.status || 'Tidak diketahui' };
      const note = data.status === 'valid' ? 'Laporan kamu sudah tampil di peta persebaran ITSafe.' :
                   data.status === 'rejected' ? 'Laporan tidak memenuhi kriteria. Kamu bisa membuat laporan baru dengan data lebih lengkap.' :
                   data.can_edit ? 'Laporan masih menunggu verifikasi. Kamu masih bisa mengedit sebelum admin mulai meninjau.' :
                   'Tim admin sedang memproses laporanmu. Cek email kamu untuk notifikasi terbaru.';
      const editAction = data.can_edit ? `
        <div class="history-action-row">
          <button type="button" class="btn btn-primary btn-sm" onclick="startReportEdit('${esc(code)}')">
            <i class="fas fa-pen-to-square"></i> Edit Laporan
          </button>
        </div>` : '';
      detailResult.innerHTML = `
        <div class="history-result-card ${s.cls}">
          <div class="history-result-header">
            <i class="fas ${s.icon}"></i>
            <div>
              <strong>Kode: ${esc(code)}</strong>
              <span class="history-status-badge">${s.label}</span>
            </div>
          </div>
          ${data.lokasi ? `<div class="history-result-detail"><i class="fas fa-map-pin"></i> ${esc(data.lokasi)}</div>` : ''}
          ${data.createdAt ? `<div class="history-result-detail"><i class="fas fa-calendar"></i> Dilaporkan pada ${new Date(data.createdAt).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>` : ''}
          <p class="history-result-note">${note}</p>
          ${editAction}
        </div>`;
    } else {
      detailResult.innerHTML = '<div class="history-result-card status-rejected"><i class="fas fa-circle-xmark"></i> Detail laporan tidak dapat dimuat.</div>';
    }
  } catch {
    detailResult.innerHTML = '<div class="history-result-card status-pending"><i class="fas fa-wifi"></i> Tidak dapat terhubung ke server.</div>';
  }
}

function closeHistoryDetail() {
  const result = document.getElementById('historyResult');
  const detailWrap = document.getElementById('historyDetailWrap');
  if (detailWrap) detailWrap.style.display = 'none';
  if (result) result.style.display = 'block';
}

function closeHistoryModal() {
  const modal = document.getElementById('historyLaporanModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  itsafeUnlockBodyScroll();
}

async function checkReportStatus() {
  const input = document.getElementById('historyCodeInput');
  const result = document.getElementById('historyResult');
  if (!input || !result) return;
  const code = input.value.trim();
  if (!code) { showToast('Masukkan kode laporan terlebih dahulu.', 'error'); return; }
  result.style.display = 'block';
  result.innerHTML = '<div class="history-loading"><i class="fas fa-spinner fa-spin"></i> Mengecek status...</div>';
  try {
    const res = await fetch(`${API_BASE}/reports/status/${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = await res.json();
      const statusMap = {
        'pending':  { cls: 'status-pending',  icon: 'fa-hourglass-half',   label: 'Menunggu Verifikasi' },
        'review':   { cls: 'status-review',   icon: 'fa-magnifying-glass', label: 'Sedang Ditinjau' },
        'valid':    { cls: 'status-valid',    icon: 'fa-check-circle',     label: 'Valid – Tampil di Peta' },
        'rejected': { cls: 'status-rejected', icon: 'fa-circle-xmark',    label: 'Ditolak' },
      };
      const s = statusMap[data.status] || { cls: 'status-pending', icon: 'fa-question-circle', label: data.status || 'Tidak diketahui' };
      const note = data.status === 'valid' ? 'Laporan kamu sudah tampil di peta persebaran ITSafe.' :
                   data.status === 'rejected' ? 'Laporan tidak memenuhi kriteria. Kamu bisa membuat laporan baru dengan data lebih lengkap.' :
                   data.can_edit ? 'Laporan masih menunggu verifikasi. Kamu masih bisa mengedit sebelum admin mulai meninjau.' :
                   'Tim admin sedang memproses laporanmu. Cek email kamu untuk notifikasi terbaru.';
      const editAction = data.can_edit ? `
        <div class="history-action-row">
          <button type="button" class="btn btn-primary btn-sm" onclick="startReportEdit('${esc(code)}')">
            <i class="fas fa-pen-to-square"></i> Edit Laporan
          </button>
        </div>` : '';
      result.innerHTML = `
        <div class="history-result-card ${s.cls}">
          <div class="history-result-header">
            <i class="fas ${s.icon}"></i>
            <div>
              <strong>Kode: ${esc(code)}</strong>
              <span class="history-status-badge">${s.label}</span>
            </div>
          </div>
          ${data.lokasi ? `<div class="history-result-detail"><i class="fas fa-map-pin"></i> ${esc(data.lokasi)}</div>` : ''}
          ${data.createdAt ? `<div class="history-result-detail"><i class="fas fa-calendar"></i> Dilaporkan: ${new Date(data.createdAt).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>` : ''}
          <p class="history-result-note">${note}</p>
          ${editAction}
        </div>`;
    } else {
      result.innerHTML = '<div class="history-result-card status-rejected"><i class="fas fa-circle-xmark"></i> Kode laporan tidak ditemukan. Pastikan kode sudah benar.</div>';
    }
  } catch {
    result.innerHTML = '<div class="history-result-card status-pending"><i class="fas fa-wifi"></i> Tidak dapat terhubung ke server. Coba beberapa saat lagi.</div>';
  }
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initSubmitSuccessModal() {
  if (window._itsSubmitModalInit) return;
  window._itsSubmitModalInit = true;

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('submitSuccessModal');
    if (modal && modal.classList.contains('open')) { e.preventDefault(); closeSubmitSuccessModal(); return; }
    const hmodal = document.getElementById('historyLaporanModal');
    if (hmodal && hmodal.classList.contains('open')) { e.preventDefault(); closeHistoryModal(); }
  });
}

initSubmitSuccessModal();

window.addEventListener('resize', () => {
  if (leafletMap) leafletMap.invalidateSize();
  if (pickerMap) pickerMap.invalidateSize();
});

/* ============================================================
   ITSafe â€“ Form UX Enhancements
   Progress bar Â· Star ratings Â· Pill buttons Â· Fill highlight
============================================================ */

(function () {

  /* â”€â”€ Progress bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
        pct < 40 ? `${pct}% yuk lanjutkan pengisian.` :
          pct < 70 ? `${pct}% hampir setengah jalan.` :
            pct < 100 ? `${pct}% hampir selesai, teruskan!` :
              `100% siap dikirim!`;
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

  /* â”€â”€ Unified event delegation (pill + level cards) â”€â”€ */
  function initFormInteractions() {
    if (window._formInteractionsInited) return;
    window._formInteractionsInited = true;
    // Single delegated listener on document - works for all dynamic content
    document.addEventListener('click', function(e) {
      // ---- Level Card ----
      const card = e.target.closest('.level-card');
      if (card) {
        const group = card.closest('.level-rating-group');
        if (!group) return;
        const targetId = group.dataset.target;
        group.querySelectorAll('.level-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const sel = document.getElementById(targetId);
        if (sel) {
          sel.value = card.dataset.val;
          sel.dispatchEvent(new Event('change'));
        }
        updateProgress();
        return;
      }

      // ---- Pill Button ----
      const pill = e.target.closest('.pill-btn');
      if (pill) {
        const group = pill.closest('.pill-group');
        if (!group) return;
        const targetId = pill.dataset.target;
        const val = pill.dataset.val;
        group.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        pill.classList.add('active');
        const sel = document.getElementById(targetId);
        if (sel) {
          for (const opt of sel.options) {
            if (opt.value === val || opt.text === val) {
              sel.value = opt.value;
              break;
            }
          }
          sel.dispatchEvent(new Event('change'));
        }
        updateProgress();
      }
    }, { passive: false });
  }

  /* â”€â”€ Boot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function boot() {
    if (window._itsafeUiBootDone) {
      updateProgress();
      return;
    }
    window._itsafeUiBootDone = true;
    /* unified form interactions (level-card + pill-btn) */
    initFormInteractions();
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
