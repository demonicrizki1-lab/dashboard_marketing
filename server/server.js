/**
 * Express Backend API Server
 * File: server/server.js
 */

const express = require('express');
const cors = require('cors');
const {
  getStoreInfo,
  getLocalIklan,
  getLocalCampaigns,
  getFormattedTimeGraph,
  getTimeGraphData,
  getFormattedCampaigns,
  getCampaignsData,
  syncLiveFromShopee,
  getConfig,
  saveConfig
} = require('./services/shopeeService');
const { parseCurl } = require('./services/curlParser');
const {
  syncProductsFromShopee,
  getProductsWithMargins,
  saveProductMargin
} = require('./services/productService');
const {
  getOverviewData,
  syncOverviewLiveFromShopee
} = require('./services/overviewService');
const {
  getCuratedSamples,
  getSummaryMetrics,
  runCuration,
  updateSampleStatus,
  updateAiAudit,
  updateTiktokSessionFromCurl,
  syncLiveFromTiktok,
  loadDatabase: loadTiktokDatabase
} = require('./services/tiktokAffiliateService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. Endpoint Info Toko & Health Check
app.get('/api/store/info', async (req, res) => {
  try {
    const info = await getStoreInfo();
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Endpoint Data Time Graph & Summary KPI Iklan (Mendukung Filter Tanggal)
app.get('/api/ads/time-graph', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getTimeGraphData({ startDate, endDate });
    if (!data) {
      return res.status(404).json({ error: 'Data iklan belum tersedia. Silakan lakukan sinkronisasi.' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Endpoint Data Per Campaign Produk (Mendukung Filter Tanggal startDate & endDate)
app.get('/api/ads/campaigns', async (req, res) => {
  try {
    const { 
      state = 'all', 
      search = '', 
      sortBy = 'cost', 
      sortOrder = 'desc',
      startDate,
      endDate 
    } = req.query;

    const formatted = await getCampaignsData({
      stateFilter: state,
      searchTerm: search,
      sortBy,
      sortOrder,
      startDate,
      endDate
    });

    if (!formatted) {
      return res.status(404).json({ error: 'Data campaign belum tersedia.' });
    }

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Endpoint Import cURL (Smart cURL Importer)
const handleImportCurl = async (req, res) => {
  try {
    const rawCurl = req.body.curl || req.body.curlCommand;
    if (!rawCurl) {
      return res.status(400).json({ error: 'Perintah cURL wajib diisi.' });
    }

    const parsed = parseCurl(rawCurl);
    
    // Simpan konfigurasi baru
    saveConfig({
      spcCds: parsed.spcCds,
      spcCdsVer: parsed.spcCdsVer,
      cookie: parsed.cookie,
      afAcEncDat: parsed.afAcEncDat,
      afAcEncSzToken: parsed.afAcEncSzToken,
      scFeSession: parsed.scFeSession,
      scFeVer: parsed.scFeVer,
      userAgent: parsed.userAgent
    });

    // Uji koneksi langsung
    const storeInfo = await getStoreInfo();

    res.json({
      success: true,
      message: 'Kredensial cURL berhasil di-parse dan disimpan.',
      extracted: {
        hasSpcCds: !!parsed.spcCds,
        hasCookie: !!parsed.cookie,
        hasDat: !!parsed.afAcEncDat,
        hasSz: !!parsed.afAcEncSzToken
      },
      storeInfo
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

app.post('/api/settings/import-curl', handleImportCurl);
app.post('/api/config/update-curl', handleImportCurl);

// 5. Endpoint Live Sync dari Shopee
app.post('/api/ads/sync', async (req, res) => {
  try {
    const result = await syncLiveFromShopee();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Endpoint Pengaturan & Metadata Sesi
app.get('/api/settings', (req, res) => {
  const config = getConfig();
  res.json({
    spcCds: config.spcCds || '',
    spcCdsVer: config.spcCdsVer || '2',
    hasCookie: !!config.cookie,
    hasAfAcDat: !!config.afAcEncDat,
    hasAfAcSzToken: !!config.afAcEncSzToken,
    lastSyncTime: config.lastSyncTime || null,
    lastSyncProductsTime: config.lastSyncProductsTime || null
  });
});

// 7. Modul 3: Endpoint Master Data Produk & SKU Margin
app.get('/api/products', (req, res) => {
  try {
    const { search = '', status = 'all' } = req.query;
    const data = getProductsWithMargins({ search, statusFilter: status });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Modul 3: Sinkronisasi Katalog Produk dari Shopee API
app.post('/api/products/sync', async (req, res) => {
  try {
    const result = await syncProductsFromShopee();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Modul 3: Simpan / Perbarui Konfigurasi Margin per SKU
app.post('/api/products/margin', (req, res) => {
  try {
    const { itemId, ...marginData } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: 'itemId wajib disertakan.' });
    }
    const saved = saveProductMargin(itemId, marginData);
    res.json({ success: true, itemId, margin: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Modul 1: Dashboard Utama (Overview Toko - Lifetime & Traffic Sources)
app.get('/api/overview', async (req, res) => {
  try {
    const { period = 'past30days', startTime, endTime, orderType = 'paid', fetchLive, type, startMonth, endMonth } = req.query;
    const data = await getOverviewData({
      period,
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
      orderType,
      fetchLive: fetchLive === 'true',
      type,
      startMonth,
      endMonth
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/overview/sync', async (req, res) => {
  try {
    const result = await syncOverviewLiveFromShopee();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. Modul TikTok Affiliate Sample Curation
// ==========================================

// GET /api/tiktok/samples - Daftar permohonan terkurasi dengan filter
app.get('/api/tiktok/samples', (req, res) => {
  try {
    const list = getCuratedSamples(req.query);
    res.json({ success: true, count: list.length, samples: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tiktok/summary - Ringkasan metrik KPI kurasi
app.get('/api/tiktok/summary', (req, res) => {
  try {
    const summary = getSummaryMetrics();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tiktok/curate - Jalankan kurasi 7 KPI
app.post('/api/tiktok/curate', (req, res) => {
  try {
    const { force = false } = req.body;
    const result = runCuration(force);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tiktok/action - Ubah status manual (Override Approve / Reject)
app.post('/api/tiktok/action', (req, res) => {
  try {
    const { applyId, status, note } = req.body;
    if (!applyId || !status) {
      return res.status(400).json({ error: 'applyId dan status wajib diisi.' });
    }
    const updated = updateSampleStatus(applyId, status, note);
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tiktok/audit-ai - Verifikasi Keaslian Video (Tandai AI / Real Human)
// Aturan Monture: Jika ditandai AI -> OTOMATIS GUGUR / REJECTED
app.post('/api/tiktok/audit-ai', (req, res) => {
  try {
    const { applyId, isAi, note } = req.body;
    if (!applyId || isAi === undefined) {
      return res.status(400).json({ error: 'applyId dan isAi wajib diisi.' });
    }
    const updated = updateAiAudit(applyId, isAi, note);
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tiktok/session - Update sesi dari import cURL
app.post('/api/tiktok/session', (req, res) => {
  try {
    const rawCurl = req.body.curl || req.body.curlCommand;
    if (!rawCurl) {
      return res.status(400).json({ error: 'Perintah cURL TikTok wajib diisi.' });
    }
    const result = updateTiktokSessionFromCurl(rawCurl);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tiktok/session - Cek status sesi TikTok
app.get('/api/tiktok/session', (req, res) => {
  try {
    const db = loadTiktokDatabase();
    const config = db.config || {};
    res.json({
      isConnected: Boolean(config.url && config.headers?.cookie),
      lastSync: config.lastSync,
      shopId: config.shopId || '7494826103548118725',
      shopRegion: config.shopRegion || 'ID',
      hasUrl: Boolean(config.url)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tiktok/sync - Tarik data terbaru dari TikTok API
app.post('/api/tiktok/sync', async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.body;
    const result = await syncLiveFromTiktok(page, pageSize);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Dashboard Marketing Server] Berjalan di http://localhost:${PORT}`);
});
