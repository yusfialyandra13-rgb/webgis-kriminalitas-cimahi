// Metadata WebGIS: batas gambar KDE, batas kelas Jenks (kasus/km2), tabel kasus per kelas jalan
window.DATA = window.DATA || {};
DATA.meta = {
 "kde_bounds": [
  [
   -6.9331711,
   107.5099144
  ],
  [
   -6.8271305,
   107.5764795
  ]
 ],
 "kde_kelas": {
  "2023_2025": [
   9.77,
   24.06,
   43.64,
   72.9
  ],
  "tahunan": [
   3.79,
   9.81,
   17.8,
   29.13
  ]
 },
 "kasus_kelas_jalan": [
  {
   "KELAS_JALAN": "Arteri",
   "PANJANG_KM": 10.31,
   "KASUS_3C": 27,
   "CURAS": 2,
   "CURAT": 4,
   "CURANMOR": 21,
   "HOTSPOT_JLN_TERDEKAT": 1
  },
  {
   "KELAS_JALAN": "Kolektor",
   "PANJANG_KM": 35.51,
   "KASUS_3C": 53,
   "CURAS": 2,
   "CURAT": 4,
   "CURANMOR": 47,
   "HOTSPOT_JLN_TERDEKAT": 2
  },
  {
   "KELAS_JALAN": "Lokal Utama",
   "PANJANG_KM": 53.86,
   "KASUS_3C": 65,
   "CURAS": 2,
   "CURAT": 13,
   "CURANMOR": 50,
   "HOTSPOT_JLN_TERDEKAT": 3
  },
  {
   "KELAS_JALAN": "Lingkungan",
   "PANJANG_KM": 616.56,
   "KASUS_3C": 666,
   "CURAS": 18,
   "CURAT": 117,
   "CURANMOR": 531,
   "HOTSPOT_JLN_TERDEKAT": 22
  },
  {
   "KELAS_JALAN": "Akses/Servis",
   "PANJANG_KM": 81.42,
   "KASUS_3C": 74,
   "CURAS": 1,
   "CURAT": 15,
   "CURANMOR": 58,
   "HOTSPOT_JLN_TERDEKAT": 2
  },
  {
   "KELAS_JALAN": "Setapak",
   "PANJANG_KM": 13.92,
   "KASUS_3C": 8,
   "CURAS": 1,
   "CURAT": 1,
   "CURANMOR": 6,
   "HOTSPOT_JLN_TERDEKAT": 0
  },
  {
   "KELAS_JALAN": "Tol",
   "PANJANG_KM": 25.09,
   "KASUS_3C": 0,
   "CURAS": 0,
   "CURAT": 0,
   "CURANMOR": 0,
   "HOTSPOT_JLN_TERDEKAT": 0
  }
 ],
 "ann": [
  {
   "data": "Seluruh 3C",
   "n": 893,
   "obs": 86.16,
   "exp": 145.39,
   "nni": 0.593,
   "z": -23.29,
   "p": "< 0,001",
   "pola": "Mengelompok"
  },
  {
   "data": "Tahun 2023",
   "n": 251,
   "obs": 181.49,
   "exp": 245.56,
   "nni": 0.739,
   "z": -7.91,
   "p": "< 0,001",
   "pola": "Mengelompok"
  },
  {
   "data": "Tahun 2024",
   "n": 298,
   "obs": 158.24,
   "exp": 224.08,
   "nni": 0.706,
   "z": -9.7,
   "p": "< 0,001",
   "pola": "Mengelompok"
  },
  {
   "data": "Tahun 2025",
   "n": 344,
   "obs": 151.03,
   "exp": 227.98,
   "nni": 0.662,
   "z": -11.98,
   "p": "< 0,001",
   "pola": "Mengelompok"
  },
  {
   "data": "Curas",
   "n": 26,
   "obs": 651.24,
   "exp": 768.58,
   "nni": 0.847,
   "z": -1.49,
   "p": "0,136",
   "pola": "Acak"
  },
  {
   "data": "Curat",
   "n": 154,
   "obs": 230.96,
   "exp": 297.98,
   "nni": 0.775,
   "z": -5.34,
   "p": "< 0,001",
   "pola": "Mengelompok"
  },
  {
   "data": "Curanmor",
   "n": 713,
   "obs": 93.13,
   "exp": 160.29,
   "nni": 0.581,
   "z": -21.4,
   "p": "< 0,001",
   "pola": "Mengelompok"
  }
 ]
};
