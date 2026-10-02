# 📊 Shopee Marketing Analytics Dashboard - Monture Outdoor

Dashboard interaktif intelijen pemasaran dan performa iklan Shopee Seller Center yang dibangun khusus untuk toko **Monture outdoor** (Shop ID: `1575219792`). 

Mengacu penuh pada dokumen PRD [prd_dashboard_marketing_shopee_seller_center.md](prd_dashboard_marketing_shopee_seller_center.md) dan standar estetika **UI UX Pro Max Design System** (Dark theme `#0B0F19`, Shopee coral `#EE4D2D`, font Plus Jakarta Sans & Inter, angka tabular `tnum`).

---

## 🚀 Cara Menjalankan Dashboard (1-Click)

### Cara Paling Mudah:
Cukup klik ganda (double-click) file:
👉 **`start-dashboard.bat`**

Skrip ini akan otomatis:
1. Menjalankan Backend Express di `http://localhost:3001`
2. Menjalankan Frontend Vite di `http://localhost:5173`
3. Membuka browser langsung ke dashboard Anda!

---

### Cara Menjalankan Manual via Terminal:
Jika ingin menjalankan secara terpisah:

**1. Jalankan Backend (Port 3001):**
```powershell
cd "server"
npm install
node server.js
```

**2. Jalankan Frontend (Port 5173):**
```powershell
cd "client"
npm install
npm run dev
```

Buka URL di browser: **`http://localhost:5173/`**

---

## 🌟 Fitur-Fitur Utama (Modul 2: Performa Iklan)

### 1. KPI Scorecards & Metrik Cepat
* **Total Biaya Iklan (Cost):** Terkonversi akurat dalam Rupiah (dibagi divisor Shopee `100.000`).
* **Omzet Iklan (GMV):** Akumulasi pendapatan kotor langsung & terkait (*Broad GMV*).
* **ROAS (Return On Ad Spend):** Indikator efisiensi belanja iklan dengan badge status dinamis:
  * 🟢 **ROAS Prima** (ROAS $\ge 2.0\text{x}$)
  * 🔵 **Balik Modal / Moderat** ($1.0\text{x} \le \text{ROAS} < 2.0\text{x}$)
  * 🔴 **Evaluasi / Boncos** ($\text{ROAS} < 1.0\text{x}$)
* **Total Pesanan & Conversion Rate (CR):** Jumlah order riil dan rasio konversi per klik.
* **Secondary Strip:** CPC rata-rata per klik, Total Tayangan (Impressions), Total Klik & CTR, serta Produk Masuk Keranjang (Add to Cart).

### 2. Grafik Tren Interaktif (Chart.js)
* **Tab 1 - Biaya vs Omzet:** Visualisasi perbandingan belanja harian vs omzet yang dihasilkan dengan area gradient halus.
* **Tab 2 - Tayangan vs Klik:** Grafik dual-axis (kiri: Impressions, kanan: Clicks) untuk memantau traffic funnel.
* **Tab 3 - Tren ROAS Harian:** Tracking konsistensi profitabilitas harian iklan.
* **Filter Rentang Waktu:** Toggle instan antara **7 Hari Terakhir** dan **30 Hari Terakhir**.

### 3. Tabel Kampanye Iklan Produk Terintegrasi
* **Filter Status Campaign Lengkap:**
  * `Semua` (Total 50 campaign)
  * 🟢 `Aktif` (`ongoing`)
  * 🟡 `Dijeda` (`paused`)
  * ⚫ `Selesai` (`ended`)
  * ⚪ `Dihapus` (`deleted`)
* **Filter Evaluasi Cerdas:**
  * 🏆 **Winning:** ROI tinggi ($\ge 4\text{x}$) dan pesanan konsisten.
  * ⚠️ **Boncos:** Biaya iklan tinggi tanpa penjualan sama sekali.
  * 🌱 **Potensial:** CTR tinggi ($\ge 2.5\%$) atau banyak masuk keranjang, butuh optimasi promo.
  * ⚪ **Pemantauan:** Iklan baru / traffic awal.
* **Pencarian Instan:** Filter langsung berdasarkan judul produk atau ID campaign.
* **Sorting Multikolom:** Urutkan berdasarkan Biaya, Omzet, ROAS, Pesanan, atau Klik (Ascending / Descending).
* **Shopee Image CDN Integration:** Thumbnail produk langsung dari server Shopee `https://down-id.img.susercontent.com/file/${imageId}`.
* **Tombol Export CSV:** Unduh seluruh daftar campaign terfilter ke format `.csv` rapi hanya dengan satu klik.

### 4. Rincian Lengkap Metrik per Campaign (Interactive Detail Modal)
* Klik pada baris produk mana saja di tabel untuk membuka popup **Rincian Metrik Lengkap**.
* **Hero Section:** Foto produk, judul, rekomendasi AI, dan link ke Seller Center.
* **Tab 1 Keuangan:** Biaya, Broad GMV, Direct GMV, Broad ROI, Direct ROI, Broad CIR, Direct CIR, CPC, CPM, Modal Harian.
* **Tab 2 Pesanan & Konversi:** Broad Order, Direct Order, Kuantitas Terjual, CR, Direct CR, ATC, ATC Rate, Checkout, Voucher.
* **Tab 3 Traffic & Funnel:** Impressions, Clicks, CTR, Peringkat Rata-rata (Avg Rank), Page Views, Unique Visitors, Reach, SOV.
* **Tab 4 Raw JSON:** Tampilan data mentah asli dari Shopee API + Tombol Salin JSON.

---

## 🔑 Pengaturan Sesi & Smart cURL Importer

Sesi dan token anti-bot Akamai Shopee (`af-ac-enc-dat`, `af-ac-enc-sz-token`, dan `SPC_CDS`) memiliki masa berlaku. Jika badge status di header berubah menjadi **Sesi Offline** atau data perlu diperbarui secara langsung dari Seller Center:

1. Buka halaman **Iklan Shopee** di browser (Google Chrome / Microsoft Edge).
2. Tekan tombol **F12** untuk membuka Developer Tools, lalu klik tab **Network**.
3. Ketik di kolom filter: `time_graph` atau `query`.
4. Lakukan refresh atau klik halaman iklan agar request muncul di tabel Network.
5. Klik kanan pada request tersebut > pilih **Copy** > **Copy as cURL (bash)**.
6. Buka dashboard di `http://localhost:5173/`, klik tombol **Pengaturan Sesi API** (ikon gear di pojok kanan atas atau sidebar).
7. Paste cURL tersebut ke dalam kotak teks dan klik **Simpan & Uji Koneksi**.
8. Sistem akan otomatis mem-parse token, membersihkan typo, menyimpan kredensial baru, dan langsung memvalidasi koneksi ke toko Monture outdoor!

---

## 📁 Struktur Proyek

```
Dashboard Marketing/
├── client/                     # Frontend Vite + React
│   ├── src/
│   │   ├── components/         # Modular Components
│   │   │   ├── Sidebar.jsx     # Navigasi Modul PRD & Toko
│   │   │   ├── Header.jsx      # Header, Status Koneksi & Tombol Sync
│   │   │   ├── KpiGrid.jsx     # 4 Primary & 4 Secondary Metric Cards
│   │   │   ├── AdsCharts.jsx   # Line Charts (Chart.js)
│   │   │   ├── CampaignTable.jsx # Tabel Produk, Filter Status, Evaluasi & CSV
│   │   │   ├── CampaignDetailModal.jsx # Rincian Metrik Lengkap & Raw JSON
│   │   │   └── SettingsModal.jsx # Smart cURL Importer
│   │   ├── styles/
│   │   │   ├── design-tokens.css # UI UX Pro Max Token Standar
│   │   │   └── dashboard.css   # Stylesheet Komprehensif
│   │   ├── App.jsx             # Aplikasi Utama
│   │   └── main.jsx
│   ├── vite.config.js          # Proxy /api -> http://localhost:3001
│   └── package.json
│
├── server/                     # Backend Express.js
│   ├── services/
│   │   ├── curlParser.js       # Smart cURL Parser & Auto-corrector
│   │   └── shopeeService.js    # Currency Divisor (/100000), Evaluator & Fetcher
│   ├── config.example.json     # Template Konfigurasi Sesi
│   ├── server.js               # Express API Endpoints
│   └── package.json
│
├── data_iklan.json             # Snapshot Data Time Graph (31 hari)
├── data_campaign.json          # Snapshot Data Campaign (50+ produk)
├── start-dashboard.bat         # Single-click launcher untuk Windows
└── README.md                   # Dokumentasi Lengkap Proyek
```
