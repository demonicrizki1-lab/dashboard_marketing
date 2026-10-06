# Dokumentasi API: TikTok / Tokopedia Affiliate Sample Request

Dokumen ini memuat spesifikasi lengkap, kamus data, struktur response JSON, serta panduan integrasi untuk API **TikTok / Tokopedia Shop Affiliate Free Sample Request**.

---

## 1. Ringkasan Endpoint

| Komponen | Spesifikasi |
| :--- | :--- |
| **Endpoint URL** | `https://affiliate-id.tokopedia.com/api/v1/affiliate/sample/group/list` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |
| **Fungsi Utama** | Mengambil daftar permohonan sampel produk gratis (*free sample request*) yang diajukan creator affiliate, lengkap dengan metrik bisnis creator, video konten unggulan, data demografi penonton, serta skor kelayakan AI TikTok. |

---

## 2. Request Parameters & Headers

### A. Query String Parameters
Query parameter bawaan sistem mencakup parameter signature security TikTok (`msToken`, `X-Bogus`, `X-Gnarly`, `X-Tts-Oec-Bsid`), identitas toko, dan browser fingerprint:
- `oec_seller_id`: ID Seller Shop (`7494826103548118725`)
- `shop_region`: Wilayah operasional (`ID`)
- `aid`: Application ID (`4331`)
- `app_name`: Nama aplikasi internal (`i18n_ecom_alliance`)
- `user_language`: Bahasa tampilan (`id-ID`)
- `msToken`, `X-Bogus`, `X-Gnarly`, `X-Tts-Oec-Bsid`: Signature token validasi bot & session

### B. Headers Wajib
```http
accept: application/json, text/plain, */*
content-type: application/json
origin: https://affiliate-id.tokopedia.com
referer: https://affiliate-id.tokopedia.com/affiliate/sample/sample-request?tab=10&shop_region=ID&shop_id=7494826103548118725
user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36
cookie: <SESSION_COOKIES_TIKTOK_SELLER>
```

### C. Payload Body (JSON)
```json
{
  "tab": 10,
  "cur_page": 1,
  "page_size": 50,
  "search_params": [
    {
      "search_key": 1,
      "search_type": 2,
      "value": ""
    }
  ],
  "order_params": [
    {
      "order_key": 7,
      "order_type": 2
    }
  ]
}
```

---

## 3. Kamus Data & Struktur Response

Response data utama berada di dalam objek root:
- `code`: Status code (`0` = Sukses).
- `message`: Pesan status dari server.
- `total_count`: Total seluruh permohonan sampel di toko (misal: `78`).
- `has_more`: Boolean penanda apakah masih ada halaman berikutnya (`true`/`false`).
- `agg_info`: Array daftar permohonan sampel (`apply_group` dan `apply_deatil`).

Setiap elemen dalam `agg_info` terdiri dari blok-blok data berikut:

---

### A. Profil & Identitas Creator (`creator_info`)
| Field | Tipe | Penjelasan | Contoh Nilai |
| :--- | :--- | :--- | :--- |
| `creator_id` / `tt_uid` | String | ID identifikasi unik creator di TikTok | `7496211446107966143` |
| `name` | String | Username TikTok creator | `@warungsparepart0`, `@benyox.id` |
| `nick_name` | String | Nama tampilan akun creator | `WARUNG SPAREPARTS` |
| `avatar_url` | String (URL) | Link foto profil creator resolusi tinggi | URL WebP TikTok CDN |
| `certification` | Boolean | Apakah akun memiliki centang biru resmi | `false` / `true` |
| `region` | String | Region asal creator | `"ID"` |

---

### B. Metrik Performa Bisnis Creator
| Field | Tipe | Penjelasan | Contoh Nilai |
| :--- | :--- | :--- | :--- |
| **`gmv`** | String | Nilai total omset penjualan yang dihasilkan creator | `Rp130.973.930`, `Rp15.141.447` |
| **`item_sold`** | String / Int | Total jumlah produk yang berhasil terjual | `982`, `426`, `134`, `93` pcs |
| **`ecom_level`** | String / Int | Tingkat / level tier e-commerce creator (Tier 1 - 6) | `6` (Tier tertinggi), `3`, `4` |
| **`fulfillment_rate`** | String | Persentase kepatuhan posting konten sampel | `100.00%`, `90.82%`, `89.47%` |
| **`follower_num`** | String / Int | Jumlah pengikut (followers) | `14442`, `6530`, `4726` |
| **`content_video_views`**| String / Int | Rata-rata penayangan video creator | `626`, `510`, `493` views |
| **`categories`** | Array | Niche kategori creator | *Automotive*, *Tools*, *Fashion* |
| **`top_follower_ages`** | Array | Distribusi rentang usia followers | `25-34` (31.2%), `35-44` (28.1%) |
| **`top_follower_gender`** | Array | Distribusi jenis kelamin penonton | Pria: `26.3%`, Wanita: `73.7%` |

---

### C. Konten & Metrik Video Creator (`ec_top_video_data`)
Setiap creator menyertakan video-video e-commerce unggulan mereka:

| Field | Tipe | Penjelasan | Contoh Nilai |
| :--- | :--- | :--- | :--- |
| **`play_cnt`** | Number | **Jumlah Views** penayangan video | `8239`, `2819`, `2054` views |
| **`like_cnt`** | Number | **Jumlah Likes** video | `41`, `32`, `14`, `9` likes |
| **`comment_cnt`** | Number | **Jumlah Komentar** pada video | `4`, `3`, `0` komentar |
| **`name`** | String | Judul/Caption video beserta hashtag | *#twsbluetooth #twsmurah #tws* |
| **`video.duration`** | Number | Durasi video (detik) | `15.634`, `50.922` detik |
| **`release_date`** | String | Tanggal video diupload (Unix timestamp) | `1789820127` |
| **`video.post_url`** | String (URL) | Cover / Thumbnail gambar video | URL file gambar WebP/JPEG |
| **`video_infos[0].main_url`** | String (URL) | **Direct Stream File MP4** | URL streaming MP4 langsung TikTok CDN |
| **`video.video_infos[0].size`** | Number | Ukuran file video dalam bytes | `1267136` bytes (~1.2 MB) |
| **`video_products`** | Array | Produk yang ditautkan di keranjang kuning | Nama produk, gambar, harga min & max |

---

### D. Detail Permohonan Sampel Produk (`apply_info`)
| Field | Tipe | Penjelasan | Contoh Nilai |
| :--- | :--- | :--- | :--- |
| `apply_id` | String | ID unik permohonan sampel | `8071766546124605119` |
| `product_id` & `product_title` | String | ID & Judul produk toko yang diminta | *Monture - Rompi Puffer Pria Big Size* |
| `sku_id` & `sku_desc` | String | ID varian & Deskripsi varian SKU | `Hitam, 2XL`, `Hitam, L` |
| `sku_image` | String (URL) | Foto varian SKU produk | URL gambar produk |
| `sku_price.formatted_price` | String | Harga jual normal produk toko | `Rp455.000` |
| `sku_stock` | Number | Sisa stok barang di etalase toko | `10000` |
| `commission_rate` | String | Tarif komisi yang ditawarkan toko | `1000` (artinya 10.00%) |
| `create_time` | String | Waktu creator mengajukan sampel | Timestamp milidetik |
| `expired_in` | Number | Sisa waktu (ms) sebelum otomatis expired | `60704607` ms |
| `curr_status` | Number | Status permohonan (10: Pending Approval) | `10` |
| `can_be_approved` & `operable` | Boolean | Hak akses seller untuk menyetujui/menolak | `true` |

---

### E. Prediksi Skor AI TikTok Seller (`roi_prediction_data`)
| Field | Tipe | Penjelasan | Contoh Nilai |
| :--- | :--- | :--- | :--- |
| **`predict_roi`** | String | Prediksi return on investment sampel | `0.3000` |
| **`is_roi_low`** | Boolean | Indikator AI apakah risiko ROI rendah | `true` / `false` |
| **`exposure_score`** | String | Skor estimasi jangkauan audiens | `1.0000` |
| **`final_score`** | String | Skor kelayakan gabungan | `0.3000` |
| **`has_trade_orders`** | Boolean | Apakah creator pernah mencetak transaksi | `true` |
| **`is_collaborated`** | Boolean | Apakah seller pernah bekerja sama sebelumnya | `false` |

---

## 4. Contoh Cuplikan JSON Response

```json
{
  "code": 0,
  "message": "",
  "total_count": 78,
  "has_more": true,
  "agg_info": [
    {
      "apply_group": {
        "group_id": "7496211446107966143",
        "has_trade_orders": true,
        "is_collaborated": false,
        "creator_info": {
          "creator_id": "7496211446107966143",
          "name": "warungsparepart0",
          "nick_name": "WARUNG SPAREPARTS",
          "follower_num": "4726",
          "gmv": "Rp130.973.930",
          "item_sold": "426",
          "ecom_level": "6",
          "fulfillment_rate": "100.00%",
          "content_video_views": "510",
          "categories": [
            { "name": "Automotive & Motorcycle" }
          ],
          "top_follower_ages": [
            { "key": "25-34", "value": "0.3119" }
          ],
          "ec_top_video_data": [
            {
              "name": "Lampu LED Spot 4x4 SUV #variasimobil",
              "like_cnt": 41,
              "play_cnt": 8239,
              "comment_cnt": 0,
              "video": {
                "duration": 50.922,
                "post_url": "https://p16-common-sign.tiktokcdn.com/...",
                "video_infos": [
                  {
                    "main_url": "https://v16m-default.tiktokcdn.com/.../video.mp4"
                  }
                ]
              },
              "video_products": [
                {
                  "name": "Lampu LED Spot SUV 40W",
                  "product_id": "1735684398713177549"
                }
              ]
            }
          ]
        }
      },
      "apply_deatil": {
        "apply_info": {
          "apply_id": "8071766546124605119",
          "product_title": "Monture - Rompi Puffer Pria Big Size Jumbo Premium M - 6XL",
          "sku_desc": "Hitam,2XL",
          "sku_price": {
            "formatted_price": "Rp455.000"
          },
          "commission_rate": "1000",
          "predict_roi": "0.3000",
          "exposure_score": "1.0000",
          "final_score": "0.3000",
          "can_be_approved": true
        }
      }
    }
  ]
}
```

---

## 5. Rekomendasi Fitur Dashboard Marketing

1. **Auto-Filter Approval Kriteria Sampel**:
   - Memfilter creator secara otomatis dengan kriteria minimum, contoh:
     - `fulfillment_rate >= 80%`
     - `item_sold >= 50 pcs` atau `gmv >= Rp5.000.000`
     - `ecom_level >= 3`
2. **Video Showcase & Player Inline**:
   - Menampilkan modal pemutar video langsung di web dashboard menggunakan `main_url` (MP4) tanpa harus membuka aplikasi TikTok manual.
3. **Analisis Engagement Rate Video**:
   - Rumus: `Engagement Rate (%) = ((like_cnt + comment_cnt) / play_cnt) * 100`.
4. **Validasi Keselarasan Niche**:
   - Mengecek apakah kategori produk creator (`categories`) atau keranjang kuning riwayat video (`video_products`) sesuai dengan niche produk toko (misal: pakaian / jaket / rompi pria).
