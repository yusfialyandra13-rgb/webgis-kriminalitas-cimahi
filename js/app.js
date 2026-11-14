/* WebGIS Daerah Rawan Kriminalitas Jalanan Kota Cimahi
   Data: GeoJSON (EPSG:4326) hasil ekspor proyek QGIS, dimuat dari folder data/ sebagai variabel DATA.*
   Library: Leaflet.js (peta) dan Chart.js (grafik). */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. Warna dan kelas (disamakan dengan simbologi di QGIS)
  ------------------------------------------------------------------ */
  var JENIS = [
    { kode: 'CURANMOR', nama: 'Curanmor', warna: '#ea580c' },
    { kode: 'CURAT', nama: 'Curat', warna: '#0891b2' },
    { kode: 'CURAS', nama: 'Curas', warna: '#7c3aed' }
  ];
  var WARNA_JENIS = {};
  JENIS.forEach(function (j) { WARNA_JENIS[j.kode] = j.warna; });
  var NAMA_JENIS = { CURANMOR: 'Curanmor', CURAT: 'Curat', CURAS: 'Curas' };
  var TAHUN = [2023, 2024, 2025];
  var WARNA_TAHUN = { 2023: '#1f78b4', 2024: '#6a3d9a', 2025: '#b2182b' };

  var KDE_WARNA = ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'];
  var KDE_NAMA = ['Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'];

  var LAHAN = [
    ['Permukiman', '#f2a477'], ['Bangunan Industri', '#8e44ad'], ['Sawah', '#a6dcf5'],
    ['Ladang/Tegalan', '#f1e05a'], ['Perkebunan Campuran', '#2e8b3d'],
    ['Semak Belukar dan Padang Rumput', '#b5d99c'], ['Lahan Terbuka', '#d9c7a7'], ['Perairan', '#2f6fd6']
  ];
  var WARNA_LAHAN = {};
  LAHAN.forEach(function (l) { WARNA_LAHAN[l[0]] = l[1]; });

  var KEPADATAN = [
    { kelas: 'Rendah', warna: '#fcfbfd', ket: '7.371 – 8.797 jiwa/km²' },
    { kelas: 'Sedang', warna: '#a39fcb', ket: '8.797 – 16.289 jiwa/km²' },
    { kelas: 'Tinggi', warna: '#3f007d', ket: '16.289 – 24.265 jiwa/km²' }
  ];
  var WARNA_KEPADATAN = {};
  KEPADATAN.forEach(function (k) { WARNA_KEPADATAN[k.kelas] = k.warna; });

  var KORIDOR = [
    ['Koridor Jalan Arteri', '#b10026'], ['Koridor Jalan Kolektor', '#fd8d3c'],
    ['Koridor Jalan Lokal Utama', '#fed976'], ['Koridor Jalan Lingkungan', '#c6dbef'], ['Jauh dari Jalan', '#f7f7f7']
  ];
  var WARNA_KORIDOR = {};
  KORIDOR.forEach(function (k) { WARNA_KORIDOR[k[0]] = k[1]; });

  var JALAN = {
    'Jalan Tol': { warna: '#d81b60', tebal: 3.2, utama: true },
    'Jalan Arteri': { warna: '#e65100', tebal: 3, utama: true },
    'Jalan Kolektor': { warna: '#f9a825', tebal: 2.4, utama: true },
    'Jalan Lokal Utama': { warna: '#795548', tebal: 1.6, utama: true },
    'Jalan Lingkungan': { warna: '#757575', tebal: 0.8, utama: false },
    'Jalan Akses/Servis': { warna: '#a0a0a0', tebal: 0.6, utama: false },
    'Jalan Setapak': { warna: '#bdbdbd', tebal: 0.5, utama: false }
  };

  /* ------------------------------------------------------------------
     2. Fungsi bantu
  ------------------------------------------------------------------ */
  function angka(n, d) {
    if (n === null || n === undefined || n === '') return '-';
    d = d || 0;
    return Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function el(id) { return document.getElementById(id); }
  function popup(judul, baris) {
    var h = '<div class="popup"><h4>' + judul + '</h4><table>';
    baris.forEach(function (b) {
      if (b[1] !== null && b[1] !== undefined && b[1] !== '') h += '<tr><td>' + b[0] + '</td><td>' + b[1] + '</td></tr>';
    });
    return h + '</table></div>';
  }

  /* ------------------------------------------------------------------
     3. Peta, panel (pane) urutan layer, dan peta dasar
  ------------------------------------------------------------------ */
  var map = L.map('map', { zoomControl: false, preferCanvas: true, minZoom: 11, maxZoom: 19 });
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

  [['poligon', 410], ['kde', 420], ['jalan', 430], ['batas', 440], ['patroli', 450], ['titik', 460], ['hotspot', 470]]
    .forEach(function (p) { map.createPane(p[0]).style.zIndex = p[1]; });
  var rPoligon = L.canvas({ pane: 'poligon' });
  var rJalan = L.canvas({ pane: 'jalan' });
  var rBatas = L.canvas({ pane: 'batas' });
  var rPatroli = L.canvas({ pane: 'patroli' });
  var rTitik = L.canvas({ pane: 'titik' });
  var rHotspot = L.canvas({ pane: 'hotspot' });

  var BASEMAP = {
    terang: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, maxNativeZoom: 16,
      attribution: 'Peta dasar &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
    }),
    // server ubin OpenStreetMap menolak halaman yang dibuka dari file (tanpa Referer), jadi dipakai peta jalan Esri
    jalan: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: 'Peta dasar &copy; Esri, HERE, Garmin, USGS, &copy; OpenStreetMap contributors'
    }),
    citra: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: 'Citra &copy; Esri, Maxar, Earthstar Geographics'
    })
  };
  var basemapAktif = BASEMAP.terang.addTo(map);
  document.querySelectorAll('input[name="basemap"]').forEach(function (r) {
    r.addEventListener('change', function () {
      map.removeLayer(basemapAktif);
      basemapAktif = BASEMAP[r.value].addTo(map);
    });
  });

  /* ------------------------------------------------------------------
     4. Batas administrasi
  ------------------------------------------------------------------ */
  var kasusPerKel = {};
  DATA.titik_3c.features.forEach(function (f) {
    var k = f.properties.KELURAHAN;
    kasusPerKel[k] = (kasusPerKel[k] || 0) + 1;
  });

  var lyrKota = L.geoJSON(DATA.batas_kota, {
    renderer: rBatas, interactive: false,
    style: { color: '#000', weight: 2.6, dashArray: '10 4 2 4', fill: false }
  });
  var lyrKecamatan = L.geoJSON(DATA.batas_kecamatan, {
    renderer: rBatas, interactive: false,
    style: { color: '#333', weight: 1.8, dashArray: '6 4', fill: false }
  });
  var lyrKelurahan = L.geoJSON(DATA.batas_kelurahan, {
    renderer: rBatas,
    style: { color: '#7a7a7a', weight: 0.9, fill: true, fillOpacity: 0 },
    onEachFeature: function (f, l) {
      var p = f.properties;
      l.bindPopup(popup('Kelurahan ' + p.KELURAHAN, [
        ['Kecamatan', p.KECAMATAN],
        ['Luas', angka(p.LUAS_KM2, 2) + ' km²'],
        ['Kasus 3C 2023–2025', angka(kasusPerKel[p.KELURAHAN] || 0)]
      ]));
      l.bindTooltip(p.KELURAHAN, { permanent: true, direction: 'center', className: 'lbl-kel' });
    }
  });

  /* ------------------------------------------------------------------
     5. RM1 – titik kejadian 3C dengan filter
  ------------------------------------------------------------------ */
  var filter = { jenis: {}, tahun: {}, kec: 'semua' };
  JENIS.forEach(function (j) { filter.jenis[j.kode] = true; });
  TAHUN.forEach(function (t) { filter.tahun[t] = true; });

  function hitung(fitur, kunci) {
    var h = {};
    fitur.forEach(function (f) { h[f.properties[kunci]] = (h[f.properties[kunci]] || 0) + 1; });
    return h;
  }
  var semuaTitik = DATA.titik_3c.features;
  var jmlJenis = hitung(semuaTitik, 'JENIS');
  var jmlTahun = hitung(semuaTitik, 'TAHUN');

  JENIS.forEach(function (j) {
    el('filterJenis').insertAdjacentHTML('beforeend',
      '<label class="cek"><input type="checkbox" data-jenis="' + j.kode + '" checked>' +
      '<span class="titik-warna" style="background:' + j.warna + '"></span>' + j.nama + ' (' + jmlJenis[j.kode] + ')</label>');
  });
  TAHUN.forEach(function (t) {
    el('filterTahun').insertAdjacentHTML('beforeend',
      '<label class="cek"><input type="checkbox" data-tahun="' + t + '" checked>' + t + ' (' + jmlTahun[t] + ')</label>');
  });

  var lyrTitik = L.layerGroup();
  function titikTerfilter() {
    return semuaTitik.filter(function (f) {
      var p = f.properties;
      return filter.jenis[p.JENIS] && filter.tahun[p.TAHUN] && (filter.kec === 'semua' || p.KECAMATAN === filter.kec);
    });
  }
  function sumberTitik(s) {
    return s === 'Wawancara' ? 'Penandaan Kasatreskrim (wawancara)' : (s === 'Berita' ? 'Pemberitaan' : s);
  }
  function gambarTitik() {
    lyrTitik.clearLayers();
    var fitur = titikTerfilter();
    // jenis yang jumlahnya sedikit digambar paling atas
    var urut = { CURANMOR: 0, CURAT: 1, CURAS: 2 };
    fitur.slice().sort(function (a, b) { return urut[a.properties.JENIS] - urut[b.properties.JENIS]; })
      .forEach(function (f) {
        var p = f.properties, c = f.geometry.coordinates;
        L.circleMarker([c[1], c[0]], {
          renderer: rTitik, radius: 4.5, color: '#fff', weight: 1, fillColor: WARNA_JENIS[p.JENIS], fillOpacity: 0.95
        }).bindPopup(popup(NAMA_JENIS[p.JENIS] + ' ' + p.TAHUN, [
          ['Lokasi', p.NAMA_JLN],
          ['Kelurahan', p.KELURAHAN],
          ['Kecamatan', p.KECAMATAN],
          ['Kelas jalan terdekat', p.KELAS_JALAN],
          ['Sumber titik', sumberTitik(p.JENIS_TTK)]
        ])).addTo(lyrTitik);
      });
    el('jumlahTitik').textContent = 'Menampilkan ' + angka(fitur.length) + ' dari ' + angka(semuaTitik.length) + ' kejadian';
    perbaruiGrafikFilter(fitur);
  }

  el('filterJenis').addEventListener('change', function (e) {
    filter.jenis[e.target.dataset.jenis] = e.target.checked; gambarTitik();
  });
  el('filterTahun').addEventListener('change', function (e) {
    filter.tahun[e.target.dataset.tahun] = e.target.checked; gambarTitik();
  });
  el('filterKecamatan').addEventListener('change', function (e) { filter.kec = e.target.value; gambarTitik(); });

  /* ------------------------------------------------------------------
     6. RM2 – KDE dan hotspot per periode
  ------------------------------------------------------------------ */
  var periode = '2023_2025';
  var lyrKde = L.imageOverlay('img/kde_2023_2025.png', DATA.meta.kde_bounds, {
    pane: 'kde', opacity: 0.7, interactive: false, alt: 'Peta kepadatan KDE'
  });
  var lyrHotspot = L.layerGroup();

  function gambarHotspot() {
    lyrHotspot.clearLayers();
    var n = 0;
    DATA.hotspot.features.forEach(function (f) {
      var p = f.properties, c = f.geometry.coordinates;
      if (periode !== '2023_2025' && String(p.TAHUN) !== periode) return;
      n++;
      L.circleMarker([c[1], c[0]], {
        renderer: rHotspot, radius: p.KELAS === 'Sangat Tinggi' ? 10 : 7.5,
        color: '#fff', weight: 2, fillColor: WARNA_TAHUN[p.TAHUN], fillOpacity: 1
      }).bindPopup(popup('Hotspot ' + p.KODE, [
        ['Tahun', p.TAHUN],
        ['Kelas kerawanan', p.KELAS],
        ['Kepadatan KDE', angka(p.KEPADATAN, 1) + ' kasus/km²'],
        ['Kasus dalam radius 500 m', angka(p.KASUS_500M)],
        ['Muncul sebagai zona rawan', p.JML_TAHUN_MUNCUL + ' dari 3 tahun'],
        ['Lokasi', p.RUAS_JALAN],
        ['Kelurahan', p.KELURAHAN + ', ' + p.KECAMATAN],
        ['Penggunaan lahan', p.LAHAN_KELAS],
        ['Kepadatan penduduk', angka(p.PDD_KEPADATAN) + ' jiwa/km² (' + p.PDD_KELAS_KPDT + ')'],
        ['Kelas jalan terdekat', p.JLN_KELAS],
        ['Zona koridor jalan', p.ZONA_KORIDOR],
        ['Jalan utama terdekat', p.JU_NAMA + ' (' + angka(p.JRK_JLN_UTAMA_M) + ' m)']
      ])).bindTooltip(p.KODE, { permanent: true, direction: 'right', offset: [8, 0], className: 'lbl-hotspot' })
        .addTo(lyrHotspot);
    });
    el('jumlahHotspot').textContent = n + ' titik hotspot pada periode ' + teksPeriode();
  }
  function teksPeriode() { return periode === '2023_2025' ? '2023–2025' : periode; }

  el('periode').addEventListener('change', function (e) {
    periode = e.target.value;
    lyrKde.setUrl('img/kde_' + periode + '.png');
    gambarHotspot();
    perbaruiLegenda();
  });
  el('opasitasKde').addEventListener('input', function (e) { lyrKde.setOpacity(Number(e.target.value)); });

  /* ------------------------------------------------------------------
     7. RM3 – penggunaan lahan, kepadatan penduduk, koridor, jalan
  ------------------------------------------------------------------ */
  var lyrLahan = L.geoJSON(DATA.lahan, {
    renderer: rPoligon,
    style: function (f) { return { fillColor: WARNA_LAHAN[f.properties.KELAS], fillOpacity: 0.75, weight: 0 }; },
    onEachFeature: function (f, l) {
      var p = f.properties;
      l.bindPopup(popup(p.KELAS, [
        ['Luas', angka(p.LUAS_HA, 1) + ' ha (' + angka(p.PERSEN, 1) + '%)'],
        ['Kasus 3C', angka(p.KASUS_3C) + ' (' + angka(p.PERSEN_KASUS, 1) + '%)'],
        ['Kepadatan kasus', angka(p.KASUS_PER_KM2, 1) + ' kasus/km²'],
        ['Titik hotspot', angka(p.JML_HOTSPOT) + ' (sangat tinggi: ' + angka(p.JML_HOTSPOT_ST) + ')'],
        ['Porsi zona KDE tinggi–sangat tinggi', angka(p.PORSI_ZONA_TINGGI_ST, 1) + '%']
      ]));
    }
  });

  var lyrKepadatan = L.geoJSON(DATA.kepadatan, {
    renderer: rPoligon,
    style: function (f) {
      return { fillColor: WARNA_KEPADATAN[f.properties.KELAS_KPDT], fillOpacity: 0.8, color: '#555', weight: 0.8 };
    },
    onEachFeature: function (f, l) {
      var p = f.properties;
      l.bindPopup(popup('Kelurahan ' + p.KELURAHAN, [
        ['Jumlah penduduk', angka(p.PENDUDUK) + ' jiwa'],
        ['Luas', angka(p.LUAS_KM2, 2) + ' km²'],
        ['Kepadatan', angka(p.KEPADATAN) + ' jiwa/km² (' + p.KELAS_KPDT + ')'],
        ['Kasus 3C', angka(p.KASUS_3C)],
        ['Kasus per 10.000 penduduk', angka(p.KASUS_PER_10RB, 1)],
        ['Kasus per km²', angka(p.KASUS_PER_KM2, 1)],
        ['Titik hotspot', angka(p.JML_HOTSPOT)]
      ]));
    }
  });

  var lyrKoridor = L.geoJSON(DATA.koridor, {
    renderer: rPoligon,
    style: function (f) {
      return { fillColor: WARNA_KORIDOR[f.properties.ZONA], fillOpacity: 0.6, color: '#636363', weight: 0.4 };
    },
    onEachFeature: function (f, l) {
      var p = f.properties;
      l.bindPopup(popup(p.ZONA, [
        ['Luas', angka(p.LUAS_KM2, 2) + ' km² (' + angka(p.PERSEN_LUAS, 1) + '%)'],
        ['Kasus 3C', angka(p.KASUS_3C) + ' (' + angka(p.PERSEN_KASUS, 1) + '%)'],
        ['Kepadatan kasus', angka(p.KASUS_PER_KM2, 1) + ' kasus/km²'],
        ['Titik hotspot', angka(p.JML_HOTSPOT)],
        ['Luas zona KDE tinggi–sangat tinggi', angka(p.PERSEN_KDE_TINGGI_ST, 1) + '% dari koridor']
      ]));
    }
  });

  function lapisJalan(utama) {
    return L.geoJSON(DATA.jalan, {
      renderer: rJalan,
      filter: function (f) { var j = JALAN[f.properties.KELAS]; return j && j.utama === utama; },
      style: function (f) {
        var j = JALAN[f.properties.KELAS];
        return { color: j.warna, weight: j.tebal, opacity: 0.95 };
      },
      onEachFeature: function (f, l) {
        var p = f.properties;
        l.bindPopup(popup(p.NAMA || 'Jalan tanpa nama', [
          ['Kelas', p.KELAS], ['Panjang segmen', angka(p.PANJANG_M) + ' m']
        ]));
      }
    });
  }
  var lyrJalanUtama = lapisJalan(true);
  var lyrJalanKecil = lapisJalan(false);

  /* ------------------------------------------------------------------
     8. Lainnya – jalur patroli
  ------------------------------------------------------------------ */
  var lyrPatroli = L.layerGroup([
    L.geoJSON(DATA.patroli_jalur, {
      renderer: rPatroli,
      style: { color: '#1f4ed8', weight: 3, opacity: 0.9 },
      onEachFeature: function (f, l) {
        var p = f.properties;
        l.bindPopup(popup('Jalur Patroli ' + p.URUTAN, [
          ['Dari', p.DARI], ['Ke', p.KE], ['Panjang', angka(p.PANJANG_KM, 2) + ' km']
        ]));
      }
    }),
    L.geoJSON(DATA.patroli_titik, {
      pointToLayer: function (f, ll) {
        var mako = f.properties.URUTAN === 0;
        return L.circleMarker(ll, {
          renderer: rPatroli, radius: mako ? 8 : 5,
          color: mako ? '#000' : '#1f4ed8', weight: mako ? 1 : 2,
          fillColor: mako ? '#facc15' : '#fff', fillOpacity: 1
        });
      },
      onEachFeature: function (f, l) {
        var p = f.properties;
        l.bindPopup(popup(p.URUTAN === 0 ? p.NAMA : p.URUTAN + '. ' + p.NAMA, [['Urutan rute', p.URUTAN === 0 ? 'Awal dan akhir' : p.URUTAN]]));
      }
    })
  ]);

  /* ------------------------------------------------------------------
     9. Menyalakan / mematikan layer
  ------------------------------------------------------------------ */
  var SAKLAR = {
    cekTitik: lyrTitik, cekKde: lyrKde, cekHotspot: lyrHotspot,
    cekLahan: lyrLahan, cekKepadatan: lyrKepadatan, cekKoridor: lyrKoridor,
    cekJalan: lyrJalanUtama, cekJalanKecil: lyrJalanKecil,
    cekKota: lyrKota, cekKecamatan: lyrKecamatan, cekKelurahan: lyrKelurahan, cekPatroli: lyrPatroli
  };
  function terapkanSaklar(id) {
    var on = el(id).checked;
    if (id === 'cekJalanKecil') on = on && el('cekJalan').checked;
    if (on) map.addLayer(SAKLAR[id]); else map.removeLayer(SAKLAR[id]);
  }
  Object.keys(SAKLAR).forEach(function (id) {
    el(id).addEventListener('change', function () {
      terapkanSaklar(id);
      if (id === 'cekJalan') terapkanSaklar('cekJalanKecil');
      perbaruiLegenda();
    });
  });

  /* ------------------------------------------------------------------
     10. Legenda dinamis (hanya layer yang sedang tampil)
  ------------------------------------------------------------------ */
  var legenda = L.control({ position: 'bottomright' });
  legenda.onAdd = function () {
    var d = L.DomUtil.create('div', 'legenda');
    if (window.innerWidth <= 760) d.classList.add('tutup'); // di HP legenda dilipat agar peta terlihat
    L.DomEvent.disableClickPropagation(d);
    L.DomEvent.disableScrollPropagation(d);
    return d;
  };
  legenda.addTo(map);

  function baris(simbol, teks) { return '<div class="baris">' + simbol + '<span>' + teks + '</span></div>'; }
  function kotak(w, garisTepi) { return '<span class="kotak" style="background:' + w + (garisTepi ? ';border-color:' + garisTepi : '') + '"></span>'; }
  function bulat(w) { return '<span class="bulat" style="background:' + w + '"></span>'; }
  function garis(w, t, gaya) { return '<span class="garis" style="border-top:' + t + 'px ' + (gaya || 'solid') + ' ' + w + '"></span>'; }

  function perbaruiLegenda() {
    var h = '';
    if (map.hasLayer(lyrTitik)) {
      h += '<div class="judul-leg">Titik Kejadian 3C</div>';
      JENIS.forEach(function (j) { if (filter.jenis[j.kode]) h += baris(bulat(j.warna), j.nama); });
    }
    if (map.hasLayer(lyrHotspot)) {
      h += '<div class="judul-leg">Hotspot ' + teksPeriode() + '</div>';
      TAHUN.forEach(function (t) {
        if (periode === '2023_2025' || String(t) === periode) h += baris(bulat(WARNA_TAHUN[t]), 'Hotspot ' + t);
      });
      h += '<div class="baris kosong">Lingkaran besar = Sangat Tinggi</div>';
    }
    if (map.hasLayer(lyrKde)) {
      var b = periode === '2023_2025' ? DATA.meta.kde_kelas['2023_2025'] : DATA.meta.kde_kelas.tahunan;
      h += '<div class="judul-leg">Kepadatan KDE ' + teksPeriode() + '<br><span class="kosong">(kasus/km²)</span></div>';
      for (var i = 4; i >= 0; i--) {
        var r = i === 0 ? '0 – ' + angka(b[0], 1) : (i === 4 ? '> ' + angka(b[3], 1) : angka(b[i - 1], 1) + ' – ' + angka(b[i], 1));
        h += baris(kotak(KDE_WARNA[i]), KDE_NAMA[i] + ' (' + r + ')');
      }
    }
    if (map.hasLayer(lyrLahan)) {
      h += '<div class="judul-leg">Penggunaan Lahan</div>';
      LAHAN.forEach(function (l) { h += baris(kotak(l[1]), l[0]); });
    }
    if (map.hasLayer(lyrKepadatan)) {
      h += '<div class="judul-leg">Kepadatan Penduduk 2024</div>';
      KEPADATAN.slice().reverse().forEach(function (k) { h += baris(kotak(k.warna), k.kelas + ' (' + k.ket + ')'); });
    }
    if (map.hasLayer(lyrKoridor)) {
      h += '<div class="judul-leg">Koridor Kelas Jalan 100 m</div>';
      KORIDOR.forEach(function (k) { h += baris(kotak(k[1]), k[0]); });
    }
    if (map.hasLayer(lyrJalanUtama)) {
      h += '<div class="judul-leg">Jaringan Jalan</div>';
      Object.keys(JALAN).forEach(function (k) {
        var j = JALAN[k];
        if (j.utama || map.hasLayer(lyrJalanKecil)) h += baris(garis(j.warna, Math.max(1.5, j.tebal)), k);
      });
    }
    if (map.hasLayer(lyrPatroli)) {
      h += '<div class="judul-leg">Lainnya</div>' + baris(garis('#1f4ed8', 3), 'Jalur patroli') + baris(bulat('#facc15'), 'Mako Polres Cimahi');
    }
    if (map.hasLayer(lyrKota) || map.hasLayer(lyrKecamatan) || map.hasLayer(lyrKelurahan)) {
      h += '<div class="judul-leg">Batas Administrasi</div>';
      if (map.hasLayer(lyrKota)) h += baris(garis('#000', 2.5, 'dashed'), 'Batas kota');
      if (map.hasLayer(lyrKecamatan)) h += baris(garis('#333', 2, 'dashed'), 'Batas kecamatan');
      if (map.hasLayer(lyrKelurahan)) h += baris(garis('#7a7a7a', 1), 'Batas kelurahan');
    }
    var wadah = legenda.getContainer();
    var tutup = wadah.classList.contains('tutup');
    wadah.innerHTML = '<div class="legenda-tombol">Legenda ' + (tutup ? '&#9650;' : '&#9660;') + '</div><div class="isi-leg">' +
      (h || '<span class="kosong">Tidak ada layer yang ditampilkan</span>') + '</div>';
    wadah.querySelector('.legenda-tombol').onclick = function () { wadah.classList.toggle('tutup'); perbaruiLegenda(); };
  }

  /* ------------------------------------------------------------------
     11. Kontrol tambahan: tombol kembali, koordinat kursor, label sesuai zoom
  ------------------------------------------------------------------ */
  var batasAwal = lyrKota.getBounds();
  var rumah = L.control({ position: 'topright' });
  rumah.onAdd = function () {
    var d = L.DomUtil.create('div', 'leaflet-bar tombol-rumah');
    d.innerHTML = '<a href="#" title="Kembali ke seluruh Kota Cimahi" role="button" aria-label="Kembali ke tampilan awal">&#8962;</a>';
    L.DomEvent.on(d, 'click', function (e) { L.DomEvent.preventDefault(e); tampilAwal(); });
    return d;
  };
  rumah.addTo(map);

  var koordinat = L.control({ position: 'bottomleft' });
  koordinat.onAdd = function () { return L.DomUtil.create('div', 'kontrol-koordinat'); };
  koordinat.addTo(map);
  map.on('mousemove', function (e) {
    koordinat.getContainer().textContent = 'Lintang ' + e.latlng.lat.toFixed(5) + ', Bujur ' + e.latlng.lng.toFixed(5);
  });

  function aturLabel() {
    var z = map.getZoom(), c = map.getContainer();
    c.classList.toggle('sembunyi-label-hotspot', z < 14);
    c.classList.toggle('sembunyi-label-kel', z < 13);
  }
  map.on('zoomend', aturLabel);

  /* zoom ke kelurahan */
  var pilihKel = el('zoomKelurahan');
  var daftarKel = {};
  lyrKelurahan.eachLayer(function (l) { daftarKel[l.feature.properties.KELURAHAN] = l; });
  Object.keys(daftarKel).sort().forEach(function (k) {
    pilihKel.insertAdjacentHTML('beforeend', '<option>' + k + '</option>');
  });
  pilihKel.addEventListener('change', function () {
    var l = daftarKel[pilihKel.value];
    if (!l) return;
    tutupPanelHp();
    map.fitBounds(l.getBounds(), jarakPanel());
    l.setStyle({ color: '#1e3a5f', weight: 3 });
    setTimeout(function () { lyrKelurahan.resetStyle(l); }, 2500);
  });

  /* ------------------------------------------------------------------
     12. Statistik (Chart.js)
  ------------------------------------------------------------------ */
  Chart.defaults.font.family = '"Inter", "Segoe UI", Roboto, Arial, sans-serif';
  Chart.defaults.font.size = 11;
  Chart.defaults.color = '#3b4148';
  var grafik = {};
  var titikTerakhir = semuaTitik;

  function buatGrafik() {
    if (grafik.tahun) return;
    grafik.tahun = new Chart(el('grafikTahun'), {
      type: 'bar',
      data: { labels: TAHUN.map(String), datasets: JENIS.map(function (j) { return { label: j.nama, data: [0, 0, 0], backgroundColor: j.warna }; }) },
      options: { maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Jumlah kasus' } } } }
    });
    grafik.jenis = new Chart(el('grafikJenis'), {
      type: 'doughnut',
      data: { labels: JENIS.map(function (j) { return j.nama; }), datasets: [{ data: [0, 0, 0], backgroundColor: JENIS.map(function (j) { return j.warna; }) }] },
      options: {
        maintainAspectRatio: false, plugins: {
          legend: { position: 'right' },
          tooltip: { callbacks: { label: function (c) { var t = c.dataset.data.reduce(function (a, b) { return a + b; }, 0); return c.label + ': ' + c.raw + ' (' + angka(t ? c.raw / t * 100 : 0, 1) + '%)'; } } }
        }
      }
    });
    grafik.kelurahan = new Chart(el('grafikKelurahan'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Kasus', data: [], backgroundColor: '#1e3a5f' }] },
      options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
    });

    var ht = {};
    DATA.hotspot.features.forEach(function (f) {
      var p = f.properties;
      ht[p.TAHUN] = ht[p.TAHUN] || { 'Sangat Tinggi': 0, 'Tinggi': 0 };
      ht[p.TAHUN][p.KELAS]++;
    });
    grafik.hotspot = new Chart(el('grafikHotspot'), {
      type: 'bar',
      data: {
        labels: TAHUN.map(String), datasets: [
          { label: 'Sangat Tinggi', data: TAHUN.map(function (t) { return ht[t]['Sangat Tinggi']; }), backgroundColor: '#bd0026' },
          { label: 'Tinggi', data: TAHUN.map(function (t) { return ht[t]['Tinggi']; }), backgroundColor: '#f03b20' }
        ]
      },
      options: { maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } } }
    });

    var lahan = DATA.lahan.features.map(function (f) { return f.properties; }).sort(function (a, b) { return a.KODE - b.KODE; });
    grafik.lahan = new Chart(el('grafikLahan'), {
      type: 'bar',
      data: {
        labels: lahan.map(function (p) { return p.KELAS === 'Semak Belukar dan Padang Rumput' ? 'Semak & Rumput' : p.KELAS; }),
        datasets: [{ label: 'Kasus/km²', data: lahan.map(function (p) { return p.KASUS_PER_KM2; }), backgroundColor: lahan.map(function (p) { return WARNA_LAHAN[p.KELAS]; }) }]
      },
      options: {
        maintainAspectRatio: false, plugins: {
          legend: { display: false },
          tooltip: { callbacks: { afterLabel: function (c) { var p = lahan[c.dataIndex]; return p.KASUS_3C + ' kasus, ' + angka(p.LUAS_HA, 1) + ' ha, ' + p.JML_HOTSPOT + ' hotspot'; } } }
        }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Kasus per km²' } }, x: { ticks: { autoSkip: false, maxRotation: 60, minRotation: 40 } } }
      }
    });

    var kor = DATA.koridor.features.map(function (f) { return f.properties; }).sort(function (a, b) { return a.URUTAN - b.URUTAN; });
    grafik.koridor = new Chart(el('grafikKoridor'), {
      type: 'bar',
      data: {
        labels: kor.map(function (p) { return p.ZONA.replace('Koridor Jalan ', ''); }),
        datasets: [{ label: 'Kasus/km²', data: kor.map(function (p) { return p.KASUS_PER_KM2; }), backgroundColor: kor.map(function (p) { return WARNA_KORIDOR[p.ZONA]; }), borderColor: '#888', borderWidth: 1 }]
      },
      options: {
        maintainAspectRatio: false, plugins: {
          legend: { display: false },
          tooltip: { callbacks: { afterLabel: function (c) { var p = kor[c.dataIndex]; return p.KASUS_3C + ' kasus pada ' + angka(p.LUAS_KM2, 2) + ' km², ' + p.JML_HOTSPOT + ' hotspot'; } } }
        }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Kasus per km²' } } }
      }
    });

    var kp = DATA.kepadatan.features.map(function (f) { return f.properties; });
    grafik.penduduk = new Chart(el('grafikPenduduk'), {
      type: 'scatter',
      data: {
        datasets: KEPADATAN.map(function (k) {
          return {
            label: k.kelas, borderColor: '#555', backgroundColor: k.warna, pointRadius: 6, pointHoverRadius: 8,
            data: kp.filter(function (p) { return p.KELAS_KPDT === k.kelas; }).map(function (p) { return { x: p.KEPADATAN, y: p.KASUS_3C, kel: p.KELURAHAN }; })
          };
        })
      },
      options: {
        maintainAspectRatio: false, plugins: {
          tooltip: { callbacks: { label: function (c) { return c.raw.kel + ': ' + angka(c.raw.x) + ' jiwa/km², ' + c.raw.y + ' kasus'; } } }
        }, scales: {
          x: { title: { display: true, text: 'Kepadatan penduduk (jiwa/km²)' } },
          y: { beginAtZero: true, title: { display: true, text: 'Kasus 3C' } }
        }
      }
    });
    perbaruiGrafikFilter(titikTerakhir);
  }

  function perbaruiGrafikFilter(fitur) {
    titikTerakhir = fitur;
    var jenis = hitung(fitur, 'JENIS');
    el('kartuRingkas').innerHTML = [['Total kasus', fitur.length]].concat(JENIS.map(function (j) { return [j.nama, jenis[j.kode] || 0]; }))
      .map(function (k) { return '<div class="kartu"><div class="angka">' + angka(k[1]) + '</div><div class="ket">' + k[0] + '</div></div>'; }).join('');
    if (!grafik.tahun) return;
    JENIS.forEach(function (j, i) {
      grafik.tahun.data.datasets[i].data = TAHUN.map(function (t) {
        return fitur.filter(function (f) { return f.properties.TAHUN === t && f.properties.JENIS === j.kode; }).length;
      });
    });
    grafik.tahun.update();
    grafik.jenis.data.datasets[0].data = JENIS.map(function (j) { return jenis[j.kode] || 0; });
    grafik.jenis.update();
    var kel = hitung(fitur, 'KELURAHAN');
    var urut = Object.keys(kel).sort(function (a, b) { return kel[b] - kel[a]; });
    grafik.kelurahan.data.labels = urut;
    grafik.kelurahan.data.datasets[0].data = urut.map(function (k) { return kel[k]; });
    grafik.kelurahan.update();
  }

  el('tabelAnn').innerHTML = '<tr><th>Data</th><th>n</th><th>NNI</th><th>Z</th><th>p</th><th>Pola</th></tr>' +
    DATA.meta.ann.map(function (a) {
      return '<tr><td>' + a.data + '</td><td>' + a.n + '</td><td>' + angka(a.nni, 3) + '</td><td>' + angka(a.z, 2) + '</td><td>' + a.p + '</td><td>' + a.pola + '</td></tr>';
    }).join('');

  /* ------------------------------------------------------------------
     13. Tab panel dan tombol panel di HP
  ------------------------------------------------------------------ */
  document.querySelectorAll('.tab button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.tab button').forEach(function (x) { x.classList.toggle('aktif', x === b); });
      document.querySelectorAll('.tab-isi').forEach(function (s) { s.classList.toggle('aktif', s.id === b.dataset.tab); });
      if (b.dataset.tab === 'tabStatistik') {
        buatGrafik();
        Object.keys(grafik).forEach(function (k) { grafik[k].resize(); });
      }
    });
  });
  /* panel mengambang: tombol lipat/buka */
  var panel = el('panel');
  var btnLipat = el('btnLipat');
  function aturLipat(lipat) {
    panel.classList.toggle('lipat', lipat);
    btnLipat.setAttribute('aria-expanded', String(!lipat));
    btnLipat.title = lipat ? 'Buka panel' : 'Lipat panel';
  }
  btnLipat.addEventListener('click', function () { aturLipat(!panel.classList.contains('lipat')); });
  function layarHp() { return window.innerWidth <= 760; }
  function tutupPanelHp() { if (layarHp()) aturLipat(true); }
  if (layarHp()) aturLipat(true); // di HP panel awalnya terlipat agar peta terlihat

  /* jarak tepi peta supaya wilayah tidak tertutup panel (kiri) dan legenda (kanan) */
  function jarakPanel() {
    if (layarHp()) return { paddingTopLeft: [16, panel.offsetHeight + 24], paddingBottomRight: [16, 16] };
    return { paddingTopLeft: [panel.offsetWidth + 36, 20], paddingBottomRight: [230, 20] };
  }
  function tampilAwal() { map.fitBounds(batasAwal, jarakPanel()); }

  /* ------------------------------------------------------------------
     14. Tampilan awal
  ------------------------------------------------------------------ */
  tampilAwal();
  // ukuran wadah peta baru final setelah halaman selesai ditata; tampilan awal diulang
  window.addEventListener('load', function () { map.invalidateSize(); tampilAwal(); });
  gambarTitik();
  gambarHotspot();
  Object.keys(SAKLAR).forEach(terapkanSaklar);
  aturLabel();
  perbaruiLegenda();
})();
