# Panduan Request API Data Performa Per Campaign Iklan Shopee (PAS Query)

Dokumen ini berisi spesifikasi teknis lengkap cara melakukan request ke endpoint privat **Shopee Performance Advertising Service (PAS)** untuk mengambil data performa per produk / per kampanye iklan, sesuai kebutuhan **PRD Modul 2 (Bagian 3.3 - Tabel Analisis per Campaign / Produk)**.

---

## 1. Spesifikasi Endpoint

* **URL:** `https://seller.shopee.co.id/api/pas/v1/homepage/query/`
* **Method:** `POST`
* **Query Parameters Wajib:**
  * `SPC_CDS`: Token sesi CDS Shopee (misal: `d14c53a6-27f9-4847-a7f7-e25587ee4580`)
  * `SPC_CDS_VER`: Versi CDS (harus `2`)

Contoh URL lengkap:
```text
https://seller.shopee.co.id/api/pas/v1/homepage/query/?SPC_CDS=d14c53a6-27f9-4847-a7f7-e25587ee4580&SPC_CDS_VER=2
```

---

## 2. Request Headers

Server Shopee memproteksi endpoint ini dengan **Akamai Bot Manager**. Header berikut wajib disertakan:

| Nama Header | Deskripsi & Nilai Contoh |
| :--- | :--- |
| `Content-Type` | `application/json;charset=UTF-8` |
| `Accept` | `application/json, text/plain, */*` |
| `Cookie` | String cookie lengkap dari browser (harus mencakup `SPC_ST`, `SPC_SC_SESSION`, `shopee_webUnique_ccd`, dll.) |
| `Origin` | `https://seller.shopee.co.id` |
| `Referer` | `https://seller.shopee.co.id/portal/marketing/pas/index?type=new_cpc_homepage&from={start}&to={end}&group=last_month&offset=600` |
| `User-Agent` | Harus identik dengan browser desktop tempat cookie diambil (contoh: Chrome Windows) |
| `af-ac-enc-dat` | Token dinamis Akamai (contoh: `5dda71640de40d16`) |
| `af-ac-enc-sz-token` | Token Shumei Device (sama dengan isi cookie `shopee_webUnique_ccd`) |
| `sc-fe-session` | ID sesi frontend (contoh: `C62425B4417CEC63`) |
| `sc-fe-ver` | Versi build frontend (contoh: `21.167990`) |

---

## 3. Payload Request (JSON)

```json
{
  "start_time": 1788282000,
  "end_time": 1790960399,
  "filter_list": [
    {
      "campaign_type": "product_homepage_v3",
      "state": "all",
      "search_term": "",
      "is_valid_rebate_only": false
    }
  ],
  "offset": 0,
  "limit": 50,
  "use_paid_gmv": false
}
```

### Penjelasan Parameter Payload:
* `start_time` & `end_time`: Rentang waktu dalam format **Unix Epoch Timestamp (detik)**.
* `filter_list`:
  * `campaign_type`: Jenis iklan produk (`product_homepage_v3`).
  * `state`: Filter status kampanye (`all` = semua, `ongoing` = aktif, `paused` = dijeda, `closed` = selesai).
  * `search_term`: Kata kunci pencarian nama produk (kosongkan `""` untuk semua).
* `offset`: Posisi data awal untuk paginasi (mulai dari `0`).
* `limit`: Jumlah kampanye yang ditarik per halaman (misal: `20` atau `50`).

---

## 4. Kamus Data & Mapping Field ke Dashboard

Berikut adalah pemetaan field dari respons JSON `data.entry_list[]` ke tampilan antarmuka dashboard:

### A. Identitas Produk & Status
| Field JSON | Format / Tampilan Dashboard | Keterangan |
| :--- | :--- | :--- |
| `title` | Teks Nama Produk | Nama produk yang diiklankan. |
| `image` | `https://down-id.img.susercontent.com/file/${image}` | URL CDN Foto Produk Shopee asli. |
| `manual_product_ads.item_id` | Teks ID / Link Produk | ID unik produk di Shopee. |
| `state` | Badge: `ongoing` / `paused` / `closed` | Status aktif iklan (Hijau / Kuning / Abu-abu). |
| `campaign.daily_budget` | `daily_budget / 100000` (Rp) | Budget harian yang disetel penjual. |

### B. Metrik Finansial & Konversi
| Field JSON | Rumus Nilai Riil | Keterangan Bisnis |
| :--- | :--- | :--- |
| `report.cost` | `cost / 100000` (Rp) | **Biaya Iklan** yang terserap oleh produk ini. |
| `report.broad_gmv` | `broad_gmv / 100000` (Rp) | **Omzet Penjualan (GMV)** dari iklan. |
| `report.broad_roi` | Nilai langsung (misal: `28.59x`) | **ROAS**: Efisiensi omzet dibanding biaya iklan. |
| `report.broad_cir` | `cir * 100%` (misal: `3.50%`) | **CIR / ACoS**: Rasio biaya terhadap omzet. |
| `report.broad_order` | Nilai langsung (integer) | **Pesanan**: Total order yang dihasilkan. |
| `report.cr` | `cr * 100%` (misal: `9.09%`) | **Conversion Rate**: Rasio klik menjadi pembelian. |
| `report.atc` | Nilai langsung (integer) | **Add to Cart**: Produk dimasukkan ke keranjang. |

### C. Metrik Traffic
| Field JSON | Format Tampilan | Keterangan Bisnis |
| :--- | :--- | :--- |
| `report.impression` | Format ribuan (`995`) | Jumlah produk tampil di layar pembeli. |
| `report.click` | Format ribuan (`11`) | Jumlah klik pengunjung. |
| `report.ctr` | `ctr * 100%` (misal: `1.11%`) | Rasio klik terhadap tayangan. |
| `report.cpc` | `cpc / 100000` (Rp) | Biaya rata-rata per 1 klik. |
| `report.avg_rank` | Angka bulat (`Rank 48`) | Posisi rata-rata iklan di halaman pencarian. |

---

## 5. Logika Cerdas: Klasifikasi Evaluasi Iklan

Di dashboard, kita dapat memberikan label otomatis untuk membantu marketer mengambil keputusan cepat:

```javascript
function getCampaignBadge(report) {
  const cost = report.cost / 100000;
  const orders = report.broad_order || 0;
  const roi = report.broad_roi || 0;

  if (roi >= 4.0 && orders > 0) {
    return { label: '🏆 Winning', class: 'badge-success', advice: 'Tingkatkan budget iklan' };
  } else if (cost > 30000 && orders === 0) {
    return { label: '⚠️ Boncos', class: 'badge-danger', advice: 'Segera pause atau ganti keyword' };
  } else if (orders > 0) {
    return { label: '✅ Profit', class: 'badge-info', advice: 'Performa stabil' };
  } else {
    return { label: '🌱 Monitoring', class: 'badge-warning', advice: 'Pantau klik & konversi' };
  }
}
```

---

## 6. Cara Menjalankan Script Otomatis

Script penarik data telah disediakan di dalam file [`fetch_campaign_query.js`](file:///c:/Users/Rizki%20Maulana/Documents/Dashboard%20Marketing/fetch_campaign_query.js).

Untuk menjalankan:
```bash
node fetch_campaign_query.js
```
Hasil respons akan otomatis di-parse dan disimpan ke file [`data_campaign.json`](file:///c:/Users/Rizki%20Maulana/Documents/Dashboard%20Marketing/data_campaign.json).

---

## 7. Penanganan Jika Token Expired (`error: 90309999`)

Jika saat menjalankan script muncul error:
```json
{"action_type": 2, "error": 90309999, "redirect_to_error_page": true}
```
Ikuti langkah cepat berikut:
1. Buka halaman **Iklan Shopee** di browser Chrome Anda.
2. Buka **Inspect (F12) ➡️ Tab Network**, ganti filter atau tanggal agar request `query` muncul.
3. Klik kanan pada request `query` ➡️ **Copy as cURL (bash)**.
4. Perbarui nilai `afAcEncDat`, `afAcEncSzToken`, dan `cookie` pada file [`fetch_campaign_query.js`](file:///c:/Users/Rizki%20Maulana/Documents/Dashboard%20Marketing/fetch_campaign_query.js).
