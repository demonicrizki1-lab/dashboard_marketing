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
  getFormattedCampaigns,
  getCampaignsData,
  syncLiveFromShopee,
  getConfig,
  saveConfig
} = require('./services/shopeeService');
const { parseCurl } = require('./services/curlParser');

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

// 2. Endpoint Data Time Graph & Summary KPI Iklan
app.get('/api/ads/time-graph', (req, res) => {
  try {
    const rawIklan = getLocalIklan();
    if (!rawIklan) {
      return res.status(404).json({ error: 'Data iklan lokal belum tersedia. Silakan lakukan sinkronisasi.' });
    }
    const formatted = getFormattedTimeGraph(rawIklan);
    res.json(formatted);
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
    lastSyncTime: config.lastSyncTime || null
  });
});

app.listen(PORT, () => {
  console.log(`[Dashboard Marketing Server] Berjalan di http://localhost:${PORT}`);
});
