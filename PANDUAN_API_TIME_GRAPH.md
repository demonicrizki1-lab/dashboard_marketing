# Panduan Request API Time Graph Iklan Shopee (PAS Report)

Dokumen ini berisi spesifikasi lengkap cara melakukan request ke endpoint privat **Shopee Performance Advertising Service (PAS)** untuk mengambil grafik performa iklan produk.

---

## 1. Spesifikasi Endpoint

* **URL:** `https://seller.shopee.co.id/api/pas/v1/report/get_time_graph/`
* **Method:** `POST`
* **Query Parameters Wajib:**
  * `SPC_CDS`: Token sesi CDS Shopee (misal: `d14c53a6-27f9-4847-a7f7-e25587ee4580`)
  * `SPC_CDS_VER`: Versi CDS (harus `2`)

Contoh URL lengkap:
```text
https://seller.shopee.co.id/api/pas/v1/report/get_time_graph/?SPC_CDS=d14c53a6-27f9-4847-a7f7-e25587ee4580&SPC_CDS_VER=2
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
| `Referer` | `https://seller.shopee.co.id/portal/marketing/pas/index?type=new_cpc_homepage&from={start_time}&to={end_time}&group=last_month&offset=600` |
| `User-Agent` | Harus identik dengan browser tempat cookie diambil (contoh: Chrome Windows) |
| `af-ac-enc-dat` | Token dinamis Akamai (contoh: `5dda71640de40d16`) |
| `af-ac-enc-sz-token` | Token Shumei Device (harus sama dengan isi cookie `shopee_webUnique_ccd`) |
| `sc-fe-session` | ID sesi frontend (contoh: `C62425B4417CEC63`) |
| `sc-fe-ver` | Versi build frontend (contoh: `21.167990`) |
| `x-sz-sdk-version` | Versi SDK Shumei (contoh: `1.12.33-sc.3`) |

---

## 3. Payload Request (JSON)

```json
{
  "agg_interval": 96,
  "campaign_type": "product_homepage_v2",
  "start_time": 1788282000,
  "end_time": 1790960399,
  "need_roi_target_setting": false,
  "filter_params": {
    "campaign_type": "new_cpc_homepage"
  }
}
```

### Keterangan Parameter Payload:
* `agg_interval`: Interval agregasi waktu data grafik:
  * `96` : Harian (1 hari = 96 interval 15-menit).
  * `12` : Per beberapa jam.
  * `1`  : Data detail per interval terkecil.
* `campaign_type`: Jenis iklan produk (`product_homepage_v2`).
* `start_time` & `end_time`: Rentang waktu dalam format **Unix Epoch Timestamp (detik)**.
* `filter_params`: Filter tipe dashboard iklan (`new_cpc_homepage`).

---

## 4. Format & Rumus Konversi Data Respons

Shopee mengembalikan nilai moneter dengan **pengali 100.000 (10⁵)** untuk menghindari floating-point error.

| Key JSON | Rumus Nilai Riil | Contoh Mentah | Nilai Riil |
| :--- | :--- | :--- | :--- |
| `metrics.cost` | `cost / 100000` | `305882110156` | **Rp 3.058.821** |
| `metrics.broad_gmv` | `broad_gmv / 100000` | `570455900000` | **Rp 5.704.559** |
| `metrics.direct_gmv`| `direct_gmv / 100000`| `534681400000` | **Rp 5.346.814** |
| `metrics.broad_roi` | Nilai langsung | `1.86495...` | **1,86x (ROAS)** |
| `metrics.click` | Nilai langsung | `3268` | **3.268 Klik** |
| `metrics.impression`| Nilai langsung | `148540` | **148.540 Tayangan** |
| `metrics.broad_order`| Nilai langsung | `28` | **28 Pesanan** |
| `metrics.atc` | Nilai langsung | `109` | **109 Add to Cart** |
| `metrics.ctr` | `ctr * 100%` | `0.0220` | **2,20%** |
| `metrics.cr` | `cr * 100%` | `0.0085` | **0,86%** |

---

## 5. Cara Menjalankan Script Otomatis

Script penarik data telah disediakan di dalam file [`fetch_time_graph.js`](file:///c:/Users/Rizki%20Maulana/Documents/Dashboard%20Marketing/fetch_time_graph.js).

Untuk menjalankan:
```bash
node fetch_time_graph.js
```
Hasil respons akan otomatis di-parse dan disimpan ke file [`data_iklan.json`](file:///c:/Users/Rizki%20Maulana/Documents/Dashboard%20Marketing/data_iklan.json).

---

## 6. Penanganan Jika Token Expired (`error: 90309999`)

Jika saat menjalankan script muncul error:
```json
{"action_type": 2, "error": 90309999, "redirect_to_error_page": true}
```
Artinya token Akamai (`af-ac-enc-*`) telah kedaluwarsa. Ikuti 3 langkah mudah ini untuk memperbaruinya:

1. Buka halaman **Iklan Shopee** di browser Chrome Anda.
2. Buka **Inspect (F12) ➡️ Tab Network**, lalu ubah filter tanggal grafik agar request `get_time_graph` muncul kembali.
3. Klik pada request `get_time_graph` terbaru, lalu copy nilai:
   * `af-ac-enc-dat`
   * `af-ac-enc-sz-token`
   * `cookie`
4. Paste nilai tersebut ke dalam objek `CONFIG` pada file [`fetch_time_graph.js`](file:///c:/Users/Rizki%20Maulana/Documents/Dashboard%20Marketing/fetch_time_graph.js).
