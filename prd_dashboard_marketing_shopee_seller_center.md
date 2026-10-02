# Product Requirements Document (PRD): Dashboard Marketing Terintegrasi Data Shopee Seller Center

## 1. Pendahuluan

### 1.1 Latar Belakang
Penjual di Shopee saat ini memiliki berbagai sumber pendapatan (organik, iklan, affiliate, live streaming). Namun, data seringkali terpisah-pisah di berbagai menu dalam Shopee Seller Center, sehingga menyulitkan penjual untuk melihat gambaran besar performa marketing dan mengambil keputusan strategis. Diperlukan sebuah dashboard terpusat yang merangkum metrik kunci dari semua saluran pemasaran tersebut.

### 1.2 Tujuan
Membuat sebuah dashboard marketing terpusat yang terintegrasi dengan data Shopee Seller Center, memberikan visibilitas komprehensif terhadap pendapatan dan performa marketing dari berbagai sumber (Keseluruhan, Iklan, SKU, Affiliate, dan Live Streaming), sehingga penjual dapat mengoptimalkan strategi dan alokasi budget dengan lebih efektif.

### 1.3 Target Pengguna
- Pemilik Toko (Business Owner)
- Manager Marketing / Digital Marketer
- Admin Toko / Campaign Specialist

---

## 2. Ringkasan Fitur (Feature Summary)

Dashboard akan terdiri dari 5 modul / halaman utama:
1.  **Dashboard Utama (Overview Toko)**: Omzet total dari awal toko berdiri hingga saat ini.
2.  **Dashboard Performa Iklan**: Analisis biaya vs omzet per campaign iklan.
3.  **Dashboard Performa Produk (Per SKU)**: Peringkat penjualan berdasarkan produk dan variasi (SKU).
4.  **Dashboard Affiliate**: Analisis performa akun affiliator dan metrik konten (video).
5.  **Dashboard Live Streaming**: Performa dan omzet yang dihasilkan dari sesi live penjual.

---

## 3. Detail Persyaratan Fungsional (Functional Requirements)

### 3.1 Fitur Umum (Global Features)
- **Rentang Tanggal (Date Picker)**: Semua dashboard (kecuali Total Omzet Sepanjang Masa) harus memiliki filter rentang tanggal (Hari Ini, Kemarin, 7 Hari Terakhir, 30 Hari Terakhir, Bulan Ini, Bulan Lalu, Kustom).
- **Ekspor Data**: Pengguna harus dapat mengekspor data yang ditampilkan pada setiap tabel atau grafik ke dalam format CSV atau Excel (.xlsx).
- **Sinkronisasi Data**: Dashboard harus tersinkronisasi dengan API Shopee secara berkala (misal: setiap jam, atau *real-time* jika memungkinkan via API).
- **Tampilan Visual (Visualisasi)**: Menggunakan grafik garis (trend), diagram batang, pie chart, dan tabel *data grid* yang mudah dibaca.

### 3.2 Modul 1: Dashboard Utama (Overview Toko - Lifetime)
**Deskripsi:** Menampilkan gambaran besar perjalanan toko sejak pertama kali didirikan hingga saat ini.

**Metrik yang Ditampilkan:**
- **Tanggal Mulai Berdiri (Store Creation Date)**: Tanggal toko pertama kali aktif.
- **Total Omzet Sepanjang Masa (Lifetime Revenue)**: Akumulasi seluruh pendapatan toko dari hari pertama hingga hari ini.
- **Total Pesanan Selesai (Lifetime Orders)**: Jumlah seluruh pesanan yang berhasil diselesaikan.
- **Grafik Tren Omzet**: Grafik garis yang menunjukkan pertumbuhan omzet toko dari bulan ke bulan (atau tahun ke tahun) sejak berdiri.
- **Ringkasan Sumber Omzet (Pie Chart)**: Persentase kontribusi dari Organik vs Iklan vs Affiliate vs Live Stream terhadap total omzet.

### 3.3 Modul 2: Dashboard Performa Iklan
**Deskripsi:** Melacak pengeluaran dan pendapatan yang dihasilkan secara spesifik dari kampanye iklan Shopee.

**Metrik & Fungsionalitas:**
- **Filter**: Rentang Tanggal, Status Kampanye (Aktif, Jeda, Selesai), Jenis Iklan (Iklan Pencarian, Iklan Produk Serupa).
- **Metrik Utama (Summary Cards)**:
  - Total Pengeluaran Iklan (Cost)
  - Total Omzet dari Iklan (Revenue)
  - ROAS (Return on Ad Spend) / Efektivitas Iklan (Revenue / Cost)
  - Jumlah Pesanan dari Iklan
- **Tabel Analisis per Campaign / Produk**:
  - Nama Produk / Nama Campaign
  - Pengeluaran (Biaya)
  - Omzet (GMV Iklan)
  - ROAS
  - Konversi (%)
  - Klik & Tayangan

### 3.4 Modul 3: Master Data Produk & Kalkulator Margin SKU (Unit Economics)
**Deskripsi:** Pusat data acuan katalog produk, rincian varian model SKU, dan kalkulator margin finansial riil toko untuk menentukan batas toleransi biaya iklan otomatis.

**Metrik & Fungsionalitas:**
- **Sinkronisasi Katalog Shopee**: Menarik seluruh produk dan varian SKU aktif langsung via `search_product_list` API Shopee.
- **Kartu Ringkasan Finansial**:
  - Total Produk Toko
  - Total Varian Model SKU
  - Jumlah SKU Terkonfigurasi Margin
  - Rata-rata Estimasi Margin Bersih (%)
- **Input Finansial per SKU (Modal & Potongan)**:
  - HPP Produk (Modal Barang per unit)
  - Biaya Admin Shopee (Default 8.5%)
  - Biaya Layanan Gratis Ongkir / Cashback (Default 4.0%)
  - Beban Voucher Toko per Order (Rp)
  - Alokasi Komisi Affiliate (Rp)
  - Biaya Operasional & Packaging (Default Rp 3.500)
  - Pajak Iklan PPN 11%
- **Hitungan Otomatis Unit Economics**:
  - **Plafon CPR (25%)**: Batas maksimal biaya iklan per order untuk cuan stabil (Target ROAS ≥ 4.0x).
  - **Plafon CAC (40%)**: Batas toleransi maksimal akuisisi pelanggan baru (Batas ROAS ≥ 2.5x).
  - **Estimasi Laba Bersih (Net Profit)** per unit dan persentase margin riil.
- **Integrasi Evaluasi Cerdas Iklan (Modul 2)**:
  - Penjodohan otomatis (*matching*) iklan dengan `item_id` katalog master SKU.
  - Klasifikasi 3 Zona: 🟢 Winning (CPA ≤ CPR 25%), 🟡 Toleransi Akuisisi (CPR < CPA ≤ CAC 40%), 🔴 Boncos Kritis (CPA > CAC 40% / bakar budget), ⏳ Testing (< 30 klik), dan ⚪ Dihapus (strip netral).

### 3.5 Modul 4: Dashboard Affiliate
**Deskripsi:** Mengukur efektivitas kampanye afiliasi dan performa individu dari para affiliator yang mempromosikan produk toko.

**Metrik & Fungsionalitas:**
- **Filter**: Rentang Tanggal.
- **Metrik Utama (Summary)**:
  - Total Omzet dari Affiliate
  - Total Komisi Dibayarkan
  - Total Pesanan Affiliate
- **Tabel Analisis per Akun Affiliator**:
  - Nama / Username Affiliator
  - Jumlah Link / Video yang dipromosikan
  - Omzet yang Dihasilkan
  - Komisi (Estimasi/Aktual)
- **Tabel Analisis Metrik Konten (Video)**:
  - Tautan Video / ID Video
  - Username Affiliator
  - *Views* (Tayangan)
  - *Likes* (Suka)
  - *Comments* (Komentar)
  - *Shares* (Bila data tersedia via API)
  - Omzet dari video tersebut.

### 3.6 Modul 5: Dashboard Live Streaming Penjual
**Deskripsi:** Menganalisis performa sesi live streaming yang dilakukan langsung oleh toko (penjual).

**Metrik & Fungsionalitas:**
- **Filter**: Rentang Tanggal.
- **Metrik Utama (Summary)**:
  - Total Omzet dari Live Stream
  - Total Pesanan dari Live Stream
  - Total Durasi Live (Jam)
- **Tabel Analisis per Sesi Live**:
  - Tanggal & Waktu Live Stream
  - Judul Live Stream
  - Durasi
  - Total Penonton (Peak/Total Viewers)
  - Omzet per sesi
  - Pesanan per sesi
  - Produk paling laku dalam sesi tersebut.

---

## 4. Persyaratan Non-Fungsional (Non-Functional Requirements)

- **Keamanan**: Akses data harus menggunakan metode otentikasi yang aman (OAuth 2.0 untuk Shopee Open API). Data rahasia toko harus dienkripsi.
- **Kinerja**: Waktu muat (load time) dashboard tidak boleh lebih dari 3-5 detik. Sinkronisasi background harus efisien agar tidak memberatkan server.
- **Responsivitas**: Desain antarmuka harus responsif, dapat diakses dengan baik melalui Desktop/Laptop (utama) dan Mobile/Tablet (sekunder).
- **Platform**: Aplikasi berbasis web (Web App).

---

## 5. Ketergantungan dan Asumsi (Dependencies & Assumptions)

- **Ketersediaan API Shopee**: Pengembangan sangat bergantung pada ketersediaan dan kapabilitas dari Shopee Open API. Semua metrik yang disebutkan (khususnya detail metrik sosial video affiliate) diasumsikan dapat ditarik melalui API resmi Shopee. Jika tidak tersedia langsung via API publik, diperlukan metode alternatif atau penyesuaian metrik.
- **Otorisasi**: Pengguna (penjual) bersedia dan berhasil melakukan proses otorisasi (binding) akun Shopee mereka ke sistem aplikasi pihak ketiga ini.

---

## 6. Fase Rilis (Release Plan / Roadmap)

- **Fase 1 (MVP)**: Integrasi API dasar, Dashboard Utama (Lifetime), Dashboard Iklan, dan Dashboard Per SKU.
- **Fase 2**: Penambahan Dashboard Live Streaming Penjual.
- **Fase 3**: Penambahan Dashboard Affiliate (kompleksitas lebih tinggi karena melibatkan metrik pihak ketiga/sosial).
- **Fase 4**: Fitur lanjutan (Prediksi tren, notifikasi otomatis jika ROAS turun, rekomendasi restock berdasarkan data per SKU).