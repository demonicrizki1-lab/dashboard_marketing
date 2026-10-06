/**
 * Service: TikTok / Tokopedia Affiliate Sample Curation Engine
 * File: server/services/tiktokAffiliateService.js
 * 
 * Implementasi 7 KPI Monture Brand untuk otomasi approval sample gratis.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data_tiktok_affiliate_samples.json');

// Kategori Monture yang dianggap relevan
const RELEVANT_CATEGORIES = [
  'Menswear & Underwear',
  'Sports & Outdoor',
  'Outerwear',
  'Fashion Accessories',
  'Shoes',
  'Luggage & Bags'
];

// Helper: Parse Rupiah format string to number
function parseRupiah(str) {
  if (!str) return 0;
  if (typeof str === 'number') return str;
  const cleaned = String(str).replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

// Helper: Parse percentage string to number (misal "89.47%" -> 89.47, "0" -> 0)
function parsePercent(str) {
  if (!str) return 0;
  if (typeof str === 'number') return str;
  const cleaned = String(str).replace('%', '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

// 1. Initial State / Data Loader
function loadDatabase() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[TiktokAffiliateService] Error reading database, recreating:', err.message);
    }
  }

  const defaultDb = {
    config: {
      url: "https://affiliate-id.tokopedia.com/api/v1/affiliate/sample/group/list?user_language=id-ID&aid=4331&app_name=i18n_ecom_alliance&oec_seller_id=7494826103548118725&shop_region=ID",
      headers: {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "origin": "https://affiliate-id.tokopedia.com",
        "referer": "https://affiliate-id.tokopedia.com/affiliate/sample/sample-request?tab=10&shop_region=ID&shop_id=7494826103548118725",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
        "cookie": ""
      },
      lastSync: new Date().toISOString(),
      shopId: "7494826103548118725",
      shopRegion: "ID"
    },
    raw_samples: initialItems,
    curated_records: {},
    total_count: initialItems.length,
    updated_at: new Date().toISOString()
  };

  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[TiktokAffiliateService] Failed to save database:', err.message);
  }
}

/**
 * 2a. Audit Keaslian Video (Real Human Creator Try-on vs AI / Bot / Slideshow)
 * Aturan Mutlak Monture: Video WAJIB Real Creator.
 * Creator yang videonya hasil generate AI atau slideshow otomatis TIDAK LOLOS / GUGUR.
 */
function auditVideoAuthenticity(topVideos, creator, sampleItem) {
  // 1. Cek apakah ada override manual dari PIC Marketing
  const manualFlag = sampleItem.manual_ai_flag;
  if (manualFlag !== undefined) {
    if (manualFlag === true) {
      return {
        is_real_human: false,
        confidence: 'Manual Verified by PIC',
        score: 100,
        reason: 'Ditandai manual oleh PIC Marketing: Konten AI / Bot Slideshow (Wajib Real Try-on)',
        signals: ['Admin Manual AI Flag']
      };
    } else {
      return {
        is_real_human: true,
        confidence: 'Manual Verified by PIC',
        score: 0,
        reason: '✓ Terverifikasi manual oleh PIC: Real Human Creator Try-On fisik',
        signals: ['Admin Manual Verified']
      };
    }
  }

  // 2. Jika creator tidak memiliki video sama sekali
  if (!topVideos || topVideos.length === 0) {
    return {
      is_real_human: false,
      confidence: 'High',
      score: 100,
      reason: 'Tidak memiliki sampel video untuk diaudit keasliannya',
      signals: ['No Video Samples']
    };
  }

  let suspiciousScore = 0;
  const signals = [];

  // Sinyal A: Deteksi Durasi Ultra-Pendek (Indikasi foto statis slideshow flyer CapCut)
  const allUltraShort = topVideos.every(v => (v.video?.duration || 0) < 6.5);
  if (allUltraShort) {
    suspiciousScore += 35;
    signals.push('Durasi ultra pendek (< 6.5s) indikasi slideshow foto katalog statis');
  }

  // Sinyal B: Pola Judul Copy-Paste Scraping Pabrik / Bot Generator
  const hasBotSpamTitle = topVideos.some(v => {
    const title = (v.name || '').toLowerCase();
    return /suv|4x4|lampu banjir|wholesale dropship|pabrik cina|sparepart mobil/i.test(title) &&
           !/review|spill|ootd|rekomendasi|coba|fitting|size|racun/i.test(title);
  });
  if (hasBotSpamTitle) {
    suspiciousScore += 30;
    signals.push('Judul terindikasi bot copy-paste spesifikasi barang pabrik');
  }

  // Sinyal C: Anomali Interaksi (Ribuan views tanpa like/komentar manusia asli)
  const hasFakeEngagement = topVideos.some(v => {
    const play = v.play_cnt || 0;
    const likes = v.like_cnt || 0;
    const comments = v.comment_cnt || 0;
    return play >= 5000 && likes < 3 && comments === 0;
  });
  if (hasFakeEngagement) {
    suspiciousScore += 30;
    signals.push('Anomali engagement (Ribuan views tanpa like atau komentar manusia)');
  }

  // Sinyal D: Tagar atau Indikator AI Generator di Caption
  const hasAiHashtag = topVideos.some(v => {
    const title = (v.name || '').toLowerCase();
    return /#ai|#aigenerated|#midjourney|#heygen|#chatgpt|avatar ai|artificial intelligence/i.test(title);
  });
  if (hasAiHashtag) {
    suspiciousScore += 60;
    signals.push('Terdeteksi tagar/label konten AI Generated');
  }

  const isReal = suspiciousScore < 45;
  return {
    is_real_human: isReal,
    confidence: suspiciousScore >= 45 ? 'High (Terindikasi AI/Bot)' : 'Normal (Real Creator Pattern)',
    score: suspiciousScore,
    reason: isReal
      ? '✓ Terverifikasi Asli: Karakteristik video menunjukkan konten kreator manusia nyata (Real Try-on fisik)'
      : `Terindikasi Konten AI / Bot: ${signals.join('; ')}`,
    signals
  };
}

/**
 * 2. Mesin Evaluasi 7 KPI Brand Monture + Quality Gate Keaslian Video
 * Menerima 1 record permohonan sampel (agg_info item)
 * Mengembalikan objek hasil kurasi lengkap dengan reasoning log.
 */
function evaluateMontureKpi(sampleItem) {
  const creator = sampleItem.apply_group?.creator_info || {};
  const applyInfo = sampleItem.apply_deatil?.apply_info || {};
  
  const creatorName = creator.name || 'Unknown';
  const ecomLevel = parseInt(creator.ecom_level || '0', 10);
  const gmvValue = parseRupiah(creator.gmv);
  const itemSold = parseInt(creator.item_sold || '0', 10);
  const avgViews = parseInt(creator.content_video_views || '0', 10);
  const fulfillmentRate = parsePercent(creator.fulfillment_rate);
  const followerCount = parseInt(creator.follower_num || '0', 10);
  
  // Video array
  const topVideos = Array.isArray(creator.ec_top_video_data) ? creator.ec_top_video_data : [];
  const topPlays = topVideos.map(v => v.play_cnt || 0);
  const maxPlay = topPlays.length > 0 ? Math.max(...topPlays) : 0;
  
  // Categories
  const categories = Array.isArray(creator.categories) ? creator.categories.map(c => c.name || '') : [];
  
  // Cek apakah ada video dengan timestamp 30 hari terakhir (release_date in seconds)
  const nowSeconds = Math.floor(Date.now() / 1000);
  const thirtyDaysSeconds = 30 * 24 * 60 * 60;
  const hasRecentVideo = topVideos.some(v => {
    const rel = parseInt(v.release_date || '0', 10);
    return rel > 0 && (nowSeconds - rel) <= (thirtyDaysSeconds * 2); // toleransi aktif
  }) || topVideos.length > 0;

  // --- EVALUASI MASING-MASING KPI ---

  // KPI 1: Jenis Konten (Aktif Video VT) [WAJIB]
  const kpi1Passed = topVideos.length > 0;
  const kpi1Reason = kpi1Passed 
    ? `Aktif membuat video VT (${topVideos.length} video e-commerce unggulan terdeteksi)`
    : `Tidak memiliki riwayat video VT e-commerce aktif`;

  // KPI 2: Level Affiliate (Minimal Level 2, 3, 4, 5, 6) [WAJIB]
  // Jika di bawah Level 2: Opsional lolos jika produk terjual > 1.000 pcs & GMV/buyer > 100rb
  let kpi2Passed = false;
  let kpi2Reason = '';
  if (ecomLevel >= 2) {
    kpi2Passed = true;
    kpi2Reason = `Memenuhi syarat tier level: Level ${ecomLevel}`;
  } else {
    const estGmvPerBuyer = itemSold > 0 ? (gmvValue / itemSold) : 0;
    if (itemSold > 1000 && estGmvPerBuyer >= 100000) {
      kpi2Passed = true;
      kpi2Reason = `Level ${ecomLevel} (Lolos jalur khusus: Terjual ${itemSold} pcs & Rata-rata per pembeli Rp${Math.round(estGmvPerBuyer).toLocaleString('id-ID')})`;
    } else {
      kpi2Passed = false;
      kpi2Reason = `Level di bawah standar (Level ${ecomLevel}) dan belum mencapai batas penjualan khusus (Terjual ${itemSold} pcs)`;
    }
  }

  // KPI 3: Tren Penjualan Cenderung Meningkat [OPSIONAL]
  const kpi3Passed = sampleItem.apply_group?.has_trade_orders === true || itemSold > 10;
  const kpi3Reason = kpi3Passed ? 'Memiliki riwayat transaksi penjualan aktif' : 'Belum memiliki riwayat transaksi signifikan';

  // KPI 4: Omzet / GMV > Rp30.000.000 [OPSIONAL / STAR CREATOR]
  const kpi4Passed = gmvValue >= 30000000;
  const isStarCreator = kpi4Passed;
  const kpi4Reason = kpi4Passed 
    ? `Omzet sangat tinggi (GMV ${creator.gmv || 'Rp' + gmvValue.toLocaleString('id-ID')}) - Star Creator ⭐`
    : `GMV saat ini: ${creator.gmv || 'Rp' + gmvValue.toLocaleString('id-ID')}`;

  // KPI 5: Kategori Produk Relevan (Pakaian Pria, Jaket, Sports/Outdoor) [WAJIB]
  const matchedCategories = categories.filter(cat => 
    RELEVANT_CATEGORIES.some(rel => cat.toLowerCase().includes(rel.toLowerCase()))
  );
  
  // Cek juga relevansi kata kunci keranjang kuning produk creator
  const basketProducts = topVideos.flatMap(v => v.video_products || []).map(p => p.name || '');
  const hasApparelInBasket = basketProducts.some(p => 
    /jaket|rompi|outer|pria|hoodie|kaos|celana|baju|t-shirt|tas|sepatu|sport/i.test(p)
  );

  const kpi5Passed = matchedCategories.length > 0 || hasApparelInBasket;
  const kpi5Reason = kpi5Passed
    ? `Kategori relevan dengan Monture: ${matchedCategories.join(', ') || 'Fashion & Apparel di keranjang'}`
    : `Kategori tidak sesuai niche Monture (${categories.join(', ') || 'Umum/Lainnya'})`;

  // KPI 6: Performa Video Views 500+ [WAJIB]
  const kpi6Passed = avgViews >= 500 || maxPlay >= 500;
  const kpi6Reason = kpi6Passed
    ? `Views memenuhi syarat: Rata-rata ${avgViews} views, Top video ${maxPlay.toLocaleString('id-ID')} views`
    : `Views di bawah 500 (Rata-rata ${avgViews} views, Top video ${maxPlay} views)`;

  // KPI 7: Konsistensi Konten (Solusi 1 Proksi Cerdas 30 Hari) [WAJIB]
  // Post video aktif + fulfillment rate >= 80% + level >= 2
  const kpi7Passed = hasRecentVideo && fulfillmentRate >= 80 && ecomLevel >= 2;
  const kpi7Reason = kpi7Passed
    ? `Konsisten & disiplin: Fulfillment Rate ${fulfillmentRate}%, aktif mengunggah VT di Level ${ecomLevel}`
    : `Tingkat kepatuhan/konsistensi rendah: Fulfillment Rate ${fulfillmentRate}% (minimal 80%)`;

  // AUDIT KEASLIAN VIDEO (REAL HUMAN VS AI/BOT) [WAJIB MUTLAK]
  // Aturan Monture: Video WAJIB Real. Jika video adalah AI atau slideshow bot, OTOMATIS GUGUR.
  const aiAudit = auditVideoAuthenticity(topVideos, creator, sampleItem);
  const kpiRealPassed = aiAudit.is_real_human;
  const kpiRealReason = aiAudit.reason;

  // --- KEPUTUSAN AKHIR (DECISION GATE) ---
  // Syarat Wajib Lolos: KPI 1, KPI 2, KPI 5, KPI 6, KPI 7, DAN WAJIB REAL HUMAN (BUKAN AI)
  const isApproved = kpi1Passed && kpi2Passed && kpi5Passed && kpi6Passed && kpi7Passed && kpiRealPassed;

  // Bangun Narasi Alasan Lengkap (Reasoning Log)
  let reasoning = '';
  if (isApproved) {
    const starText = isStarCreator ? ' [STAR CREATOR ⭐]' : '';
    reasoning = `DIREKOMENDASIKAN APPROVE${starText}: Lolos semua KPI wajib & terverifikasi Real Human Try-On. Level ${ecomLevel}, Kategori ${matchedCategories.join('/') || 'Fashion'}, Rata-rata views ${avgViews}, Fulfillment ${fulfillmentRate}%, GMV ${creator.gmv || 'Rp0'}.`;
  } else {
    const reasonsFail = [];
    if (!kpiRealPassed) reasonsFail.push(`Video terindikasi AI / Bot Slideshow (Wajib Real Creator Try-On)`);
    if (!kpi5Passed) reasonsFail.push(`Kategori tidak relevan (${categories.join(', ') || 'N/A'})`);
    if (!kpi7Passed) reasonsFail.push(`Fulfillment rate rendah (${fulfillmentRate}%)`);
    if (!kpi2Passed) reasonsFail.push(`Level ${ecomLevel} belum memenuhi syarat`);
    if (!kpi6Passed) reasonsFail.push(`Views < 500`);
    if (!kpi1Passed) reasonsFail.push(`Tidak ada video aktif`);
    reasoning = `DITOLAK OTOMATIS: ${reasonsFail.join('; ')}.`;
  }

  // Ringkasan Checklist Termasuk Audit Keaslian Video
  const kpiChecklist = {
    kpi1_video_aktif: { passed: kpi1Passed, label: 'Video VT Aktif', note: kpi1Reason },
    kpi2_level: { passed: kpi2Passed, label: 'Minimal Level 2+', note: kpi2Reason },
    kpi3_tren_penjualan: { passed: kpi3Passed, label: 'Tren Penjualan (Opsional)', note: kpi3Reason },
    kpi4_gmv_30jt: { passed: kpi4Passed, label: 'GMV > Rp30jt (Star Creator)', note: kpi4Reason },
    kpi5_kategori: { passed: kpi5Passed, label: 'Kategori Apparel/Outdoor', note: kpi5Reason },
    kpi6_views_500: { passed: kpi6Passed, label: 'Views Video 500+', note: kpi6Reason },
    kpi7_konsistensi_30d: { passed: kpi7Passed, label: 'Fulfillment 80%+ & Konsisten', note: kpi7Reason },
    kpi_keaslian_video: { passed: kpiRealPassed, label: 'Keaslian Video (Real Try-on)', note: kpiRealReason }
  };

  const skuPrice = parseRupiah(applyInfo.sku_price?.formatted_price || applyInfo.sku_price?.price_value);


  return {
    apply_id: applyInfo.apply_id || sampleItem.apply_group?.group_id,
    creator_id: creator.creator_id,
    creator_name: creatorName,
    creator_nickname: creator.nick_name || creatorName,
    avatar_url: creator.avatar_url || '',
    ecom_level: ecomLevel,
    gmv: creator.gmv || 'Rp0',
    gmv_number: gmvValue,
    item_sold: itemSold,
    follower_num: followerCount,
    fulfillment_rate: fulfillmentRate,
    avg_views: avgViews,
    max_views: maxPlay,
    categories,
    is_star_creator: isStarCreator,
    
    // Status Keputusan
    status: isApproved ? 'APPROVED' : 'REJECTED',
    decision_reason: reasoning,
    kpi_checklist: kpiChecklist,
    
    // Produk yang Diminta
    product_title: applyInfo.product_title || 'Produk Monture',
    sku_desc: applyInfo.sku_desc || '-',
    sku_image: applyInfo.sku_image || '',
    sku_price: skuPrice,
    sku_price_formatted: applyInfo.sku_price?.formatted_price || `Rp${skuPrice.toLocaleString('id-ID')}`,
    commission_rate: (parseInt(applyInfo.commission_rate || '1000', 10) / 100).toFixed(1) + '%',
    create_time: applyInfo.create_time || Date.now(),
    expired_in: applyInfo.expired_in || 0,
    
    // Video showcase
    videos: topVideos.map(v => ({
      item_id: v.item_id,
      title: v.name || '',
      play_cnt: v.play_cnt || 0,
      like_cnt: v.like_cnt || 0,
      comment_cnt: v.comment_cnt || 0,
      duration: v.video?.duration || 0,
      cover_url: v.video?.post_url || '',
      mp4_url: v.video?.video_infos?.[0]?.main_url || v.video?.video_infos?.[0]?.backup_url || '',
      tiktok_web_url: `https://www.tiktok.com/@${creatorName}/video/${v.item_id}`,
      products: (v.video_products || []).map(p => ({
        name: p.name || '',
        image: p.image || '',
        price: p.min_sale_price?.price_value || '0'
      }))
    })),

    // Audit Keaslian Video (AI vs Real Creator)
    is_real_human: kpiRealPassed,
    ai_audit: aiAudit,
    evaluated_at: new Date().toISOString()
  };
}

/**
 * 3. Jalankan Kurasi pada seluruh data
 */
function runCuration(force = false) {
  const db = loadDatabase();
  const rawSamples = db.raw_samples || [];
  
  if (!db.curated_records) {
    db.curated_records = {};
  }

  let newlyCurated = 0;
  rawSamples.forEach(item => {
    const applyId = item.apply_deatil?.apply_info?.apply_id || item.apply_group?.group_id;
    if (!applyId) return;

    // Cek Idempotensi (jika sudah ada dan tidak force, jangan kurasi ulang)
    if (db.curated_records[applyId] && !force) {
      return;
    }

    const evaluation = evaluateMontureKpi(item);
    db.curated_records[applyId] = evaluation;
    newlyCurated++;
  });

  db.updated_at = new Date().toISOString();
  saveDatabase(db);
  console.log(`[TiktokAffiliateService] Kurasi selesai. ${newlyCurated} pengajuan baru diproses.`);
  return {
    total: Object.keys(db.curated_records).length,
    newly_curated: newlyCurated
  };
}

/**
 * 4. Get Curated Samples dengan Filter & Search
 */
function getCuratedSamples(filters = {}) {
  const db = loadDatabase();
  
  // Pastikan setidaknya sudah dikurasi sekali
  if (Object.keys(db.curated_records || {}).length === 0 && db.raw_samples?.length > 0) {
    runCuration(true);
  }

  const {
    status = 'all', // all | approved | rejected | star
    search = '',
    category = 'all',
    sortBy = 'default'
  } = filters;

  let list = Object.values(db.curated_records || {});

  // Filter Status
  if (status === 'approved') {
    list = list.filter(item => item.status === 'APPROVED');
  } else if (status === 'rejected') {
    list = list.filter(item => item.status === 'REJECTED');
  } else if (status === 'star') {
    list = list.filter(item => item.is_star_creator === true);
  }

  // Filter Kategori
  if (category !== 'all') {
    list = list.filter(item => 
      (item.categories || []).some(c => c.toLowerCase().includes(category.toLowerCase()))
    );
  }

  // Filter Search
  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    list = list.filter(item => 
      item.creator_name.toLowerCase().includes(q) ||
      item.creator_nickname.toLowerCase().includes(q) ||
      item.product_title.toLowerCase().includes(q) ||
      item.sku_desc.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sortBy === 'gmv_desc') {
    list.sort((a, b) => b.gmv_number - a.gmv_number);
  } else if (sortBy === 'views_desc') {
    list.sort((a, b) => b.max_views - a.max_views);
  } else if (sortBy === 'level_desc') {
    list.sort((a, b) => b.ecom_level - a.ecom_level);
  } else if (sortBy === 'fulfillment_desc') {
    list.sort((a, b) => b.fulfillment_rate - a.fulfillment_rate);
  } else {
    // Default: Approved dulu, lalu Star Creator, lalu GMV
    list.sort((a, b) => {
      if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
      if (a.status !== 'APPROVED' && b.status === 'APPROVED') return 1;
      if (a.is_star_creator && !b.is_star_creator) return -1;
      if (!a.is_star_creator && b.is_star_creator) return 1;
      return b.gmv_number - a.gmv_number;
    });
  }

  return list;
}

/**
 * 5. Get Summary KPI Cards
 */
function getSummaryMetrics() {
  const db = loadDatabase();
  const list = Object.values(db.curated_records || {});

  const total = list.length;
  const approved = list.filter(i => i.status === 'APPROVED').length;
  const rejected = list.filter(i => i.status === 'REJECTED').length;
  const starCreators = list.filter(i => i.is_star_creator).length;

  // Hitung total HPP terselamatkan (nilai produk dari creator yang ditolak)
  const savedHpp = list
    .filter(i => i.status === 'REJECTED')
    .reduce((sum, item) => sum + (item.sku_price || 0), 0);

  const passRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return {
    total_samples: total,
    approved_count: approved,
    rejected_count: rejected,
    star_creators_count: starCreators,
    saved_hpp_amount: savedHpp,
    saved_hpp_formatted: `Rp${savedHpp.toLocaleString('id-ID')}`,
    pass_rate: passRate,
    last_sync: db.config?.lastSync || db.updated_at
  };
}

/**
 * 6. Update Manual Status oleh User (Override)
 */
function updateSampleStatus(applyId, newStatus, note = '') {
  const db = loadDatabase();
  if (!db.curated_records || !db.curated_records[applyId]) {
    throw new Error(`Permohonan dengan ID ${applyId} tidak ditemukan.`);
  }

  db.curated_records[applyId].status = newStatus;
  if (note) {
    db.curated_records[applyId].manual_note = note;
  }
  db.curated_records[applyId].status_updated_at = new Date().toISOString();

  saveDatabase(db);
  return db.curated_records[applyId];
}

/**
 * 7. Smart cURL Parser untuk TikTok
 */
function parseTiktokCurl(curlString) {
  if (!curlString || typeof curlString !== 'string') {
    throw new Error('Perintah cURL tidak boleh kosong.');
  }

  // Ekstrak URL (Mendukung --url 'https://...', curl 'https://...', atau direct URL)
  const urlMatch = curlString.match(/--url\s+['"]([^'"]+)['"]/i) ||
                   curlString.match(/curl\s+['"](https?:\/\/[^'"]+)['"]/i) || 
                   curlString.match(/curl\s+(https?:\/\/[^\s]+)/i) ||
                   curlString.match(/https?:\/\/[^\s'"\\]+/i);
  if (!urlMatch) {
    throw new Error('Gagal mendeteksi URL dari perintah cURL.');
  }
  const url = urlMatch[1] || urlMatch[0];

  // Ekstrak Headers
  const headers = {};
  const headerRegex = /-H\s+['"]([^'"]+)['"]/gi;
  let match;
  while ((match = headerRegex.exec(curlString)) !== null) {
    const line = match[1];
    const colonIdx = line.indexOf(':');
    if (colonIdx > -1) {
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const val = line.slice(colonIdx + 1).trim();
      headers[key] = val;
    }
  }

  // Jika cookie ada di -b / --cookie
  const cookieMatch = curlString.match(/--cookie\s+['"]([^'"]+)['"]/i) ||
                      curlString.match(/-b\s+['"]([^'"]+)['"]/i);
  if (cookieMatch) {
    headers['cookie'] = cookieMatch[1];
  }

  return { url, headers };
}

/**
 * 8. Simpan Sesi Baru dari cURL
 */
function updateTiktokSessionFromCurl(curlString) {
  const db = loadDatabase();
  const parsed = parseTiktokCurl(curlString);

  if (!db.config) db.config = {};
  db.config.url = parsed.url;
  db.config.headers = { ...db.config.headers, ...parsed.headers };
  db.config.lastSync = new Date().toISOString();

  saveDatabase(db);
  return {
    success: true,
    message: 'Sesi cURL TikTok berhasil disimpan dan diperbarui!',
    url: parsed.url.slice(0, 100) + '...'
  };
}

/**
 * 9. Fetch Live dari TikTok API
 */
async function syncLiveFromTiktok(page = 1, pageSize = 50) {
  const db = loadDatabase();
  const config = db.config || {};

  if (!config.url) {
    throw new Error('URL TikTok API belum dikonfigurasi. Silakan paste cURL di pengaturan.');
  }

  const payload = {
    tab: 10,
    cur_page: page,
    page_size: pageSize,
    search_params: [{ search_key: 1, search_type: 2, value: "" }],
    order_params: [{ order_key: 7, order_type: 2 }]
  };

  console.log(`[TiktokAffiliateService] Mengirim request ke TikTok API (halaman ${page})...`);
  
  const response = await fetch(config.url, {
    method: 'POST',
    headers: config.headers || {},
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`TikTok API error: HTTP ${response.status} ${response.statusText}`);
  }

  const resJson = await response.json();
  if (resJson.code !== 0 && resJson.code !== '0') {
    throw new Error(`TikTok API error: Code ${resJson.code} - ${resJson.message || 'Signature / Sesi kadaluarsa'}`);
  }

  const newItems = Array.isArray(resJson.agg_info) ? resJson.agg_info : [];
  console.log(`[TiktokAffiliateService] Berhasil menarik ${newItems.length} permohonan.`);

  // Gabungkan ke db.raw_samples dengan deduplikasi apply_id
  const existingMap = new Map();
  (db.raw_samples || []).forEach(item => {
    const id = item.apply_deatil?.apply_info?.apply_id || item.apply_group?.group_id;
    if (id) existingMap.set(id, item);
  });

  newItems.forEach(item => {
    const id = item.apply_deatil?.apply_info?.apply_id || item.apply_group?.group_id;
    if (id) existingMap.set(id, item);
  });

  db.raw_samples = Array.from(existingMap.values());
  db.total_count = resJson.total_count || db.raw_samples.length;
  db.config.lastSync = new Date().toISOString();

  saveDatabase(db);

  // Otomatis kurasi data baru
  runCuration(false);

  return {
    success: true,
    total_fetched: newItems.length,
    total_in_db: db.raw_samples.length,
    has_more: resJson.has_more
  };
}

/**
 * 6b. Update Status Audit Keaslian Video (AI vs Real Creator)
 * JIKA TERINDIKASI AI -> OTOMATIS GUGUR / REJECTED
 */
function updateAiAudit(applyId, isAi, note = '') {
  const db = loadDatabase();
  if (!db.curated_records || !db.curated_records[applyId]) {
    throw new Error(`Permohonan dengan ID ${applyId} tidak ditemukan.`);
  }

  const record = db.curated_records[applyId];
  const isReal = !isAi;

  // Update AI Flag & Status
  record.is_real_human = isReal;
  record.manual_ai_flag = isAi;
  record.ai_audit = {
    is_real_human: isReal,
    confidence: 'Manual Verified by PIC',
    score: isAi ? 100 : 0,
    reason: isAi
      ? (note || 'Ditandai manual oleh PIC: Konten terindikasi AI / Bot Slideshow (Wajib Real Try-on)')
      : (note || 'Diverifikasi manual oleh PIC: Konten asli real creator (Try-on fisik)'),
    verified_at: new Date().toISOString()
  };

  // Update Checklist KPI Keaslian
  if (record.kpi_checklist) {
    record.kpi_checklist.kpi_keaslian_video = {
      passed: isReal,
      label: 'Keaslian Video (Real Try-on)',
      note: record.ai_audit.reason
    };
  }

  // ATURAN MUTLAK MONTURE: JIKA AI -> OTOMATIS GUGUR / REJECTED
  if (isAi) {
    record.status = 'REJECTED';
    record.decision_reason = `DITOLAK OTOMATIS: Konten video terindikasi hasil generate AI / Bot Slideshow. Monture mewajibkan creator real human try-on fisik. (${note || 'Audit PIC Marketing'})`;
  } else {
    // Jika ditandai Real Human, evaluasi apakah KPI wajib lainnya terpenuhi
    const checks = record.kpi_checklist || {};
    const otherKpisPassed = 
      checks.kpi1_video_aktif?.passed &&
      checks.kpi2_level?.passed &&
      checks.kpi5_kategori?.passed &&
      checks.kpi6_views_500?.passed &&
      checks.kpi7_konsistensi_30d?.passed;

    if (otherKpisPassed) {
      record.status = 'APPROVED';
      record.decision_reason = `DIREKOMENDASIKAN APPROVE: Lolos semua 7 KPI & terverifikasi Real Human Try-On.`;
    }
  }

  record.status_updated_at = new Date().toISOString();
  saveDatabase(db);
  return record;
}

module.exports = {
  loadDatabase,
  evaluateMontureKpi,
  auditVideoAuthenticity,
  runCuration,
  getCuratedSamples,
  getSummaryMetrics,
  updateSampleStatus,
  updateAiAudit,
  parseTiktokCurl,
  updateTiktokSessionFromCurl,
  syncLiveFromTiktok
};

