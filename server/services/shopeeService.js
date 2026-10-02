/**
 * Shopee Data & API Service
 * File: server/services/shopeeService.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const CONFIG_PATH = path.join(__dirname, '../config.json');
const DATA_IKLAN_PATH = path.join(ROOT_DIR, 'data_iklan.json');
const DATA_CAMPAIGN_PATH = path.join(ROOT_DIR, 'data_campaign.json');

// Helper membaca config
function getConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    return {};
  }
}

// Helper menyimpan config
function saveConfig(newConfig) {
  const current = getConfig();
  const merged = { ...current, ...newConfig };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

// Helper membaca data iklan lokal
function getLocalIklan() {
  try {
    return JSON.parse(fs.readFileSync(DATA_IKLAN_PATH, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Helper membaca data campaign lokal
function getLocalCampaigns() {
  try {
    return JSON.parse(fs.readFileSync(DATA_CAMPAIGN_PATH, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Helper evaluasi performa campaign
function evaluateCampaign(report) {
  const cost = (report.cost || 0) / 100000;
  const gmv = (report.broad_gmv || 0) / 100000;
  const orders = report.broad_order || 0;
  const roi = report.broad_roi || (cost > 0 ? gmv / cost : 0);
  const ctr = report.ctr || 0;
  const atc = report.atc || 0;

  if (roi >= 4.0 && orders > 0) {
    return {
      statusKey: 'winning',
      label: '🏆 Winning',
      color: '#10B981',
      badgeClass: 'badge-winning',
      advice: 'Super Untung! Pertahankan dan pertimbangkan tambah budget.'
    };
  } else if (cost >= 30000 && orders === 0) {
    return {
      statusKey: 'boncos',
      label: '⚠️ Boncos',
      color: '#EF4444',
      badgeClass: 'badge-boncos',
      advice: 'Biaya tinggi tanpa penjualan. Segera evaluasi kata kunci atau jeda.'
    };
  } else if (orders > 0) {
    return {
      statusKey: 'profit',
      label: '✅ Profit',
      color: '#3B82F6',
      badgeClass: 'badge-profit',
      advice: 'Iklan menghasilkan penjualan secara stabil.'
    };
  } else if (ctr >= 0.025 || atc > 0) {
    return {
      statusKey: 'potential',
      label: '🌱 Potensial',
      color: '#F59E0B',
      badgeClass: 'badge-potential',
      advice: 'Banyak klik / masuk keranjang. Optimalkan harga dan promo produk.'
    };
  } else {
    return {
      statusKey: 'monitoring',
      label: '⚪ Pemantauan',
      color: '#9CA3AF',
      badgeClass: 'badge-monitoring',
      advice: 'Traffic masih rendah. Berikan waktu untuk mengumpulkan data.'
    };
  }
}

// 1. Cek Info Toko (Health Check)
async function getStoreInfo() {
  const config = getConfig();
  const url = `https://seller.shopee.co.id/api/framework/selleraccount/shop_info/?SPC_CDS=${config.spcCds || ''}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'Cookie': config.cookie,
        'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Referer': 'https://seller.shopee.co.id/'
      }
    });

    const data = await res.json();
    if (data.code === 0 && data.data) {
      return {
        isConnected: true,
        shopId: data.data.shop_id,
        shopName: data.data.name,
        shopRegion: data.data.shop_region,
        isSipPrimary: data.data.is_sip_primary,
        lastSync: config.lastSyncTime
      };
    } else {
      return {
        isConnected: false,
        error: data.message || 'Sesi tidak valid / token not found',
        lastSync: config.lastSyncTime
      };
    }
  } catch (err) {
    return {
      isConnected: false,
      error: err.message,
      lastSync: config.lastSyncTime
    };
  }
}

// 2. Ambil & Format Data Time Graph
function getFormattedTimeGraph(rawJson) {
  const data = rawJson?.data || {};
  const aggregate = data.report_aggregate || {};
  const rawList = data.report_by_time || [];

  const timeSeries = rawList.map(item => {
    const m = item.metrics || {};
    const cost = (m.cost || 0) / 100000;
    const broadGmv = (m.broad_gmv || 0) / 100000;
    const directGmv = (m.direct_gmv || 0) / 100000;
    // Konversi ke zona waktu Indonesia GMT+7 (+7 jam)
    const gmt7Date = new Date(Number(item.key) * 1000 + 7 * 3600 * 1000);
    const dateStr = gmt7Date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const fullDate = gmt7Date.toISOString().split('T')[0];

    return {
      timestamp: Number(item.key),
      dateFormatted: dateStr,
      fullDate: fullDate,
      cost: cost,
      broadGmv: broadGmv,
      directGmv: directGmv,
      orders: m.broad_order || 0,
      clicks: m.click || 0,
      impressions: m.impression || 0,
      ctr: ((m.ctr || 0) * 100),
      cr: ((m.cr || 0) * 100),
      cpc: (m.cpc || 0) / 100000,
      roi: m.broad_roi || (cost > 0 ? broadGmv / cost : 0),
      atc: m.atc || 0
    };
  });

  const totalCost = (aggregate.cost || 0) / 100000;
  const totalBroadGmv = (aggregate.broad_gmv || 0) / 100000;
  const totalDirectGmv = (aggregate.direct_gmv || 0) / 100000;
  const totalOrders = aggregate.broad_order || 0;
  const totalClicks = aggregate.click || 0;
  const totalImpressions = aggregate.impression || 0;
  const totalAtc = aggregate.atc || 0;

  return {
    summary: {
      cost: totalCost,
      totalCost,
      broad_gmv: totalBroadGmv,
      totalBroadGmv,
      direct_gmv: totalDirectGmv,
      totalDirectGmv,
      broad_order: totalOrders,
      totalOrders,
      click: totalClicks,
      totalClicks,
      impression: totalImpressions,
      totalImpressions,
      broad_cart: totalAtc,
      totalAtc,
      roas: aggregate.broad_roi || (totalCost > 0 ? totalBroadGmv / totalCost : 0),
      ctr: ((aggregate.ctr || 0) * 100),
      cr: ((aggregate.cr || 0) * 100),
      avgCpc: (aggregate.cpc || 0) / 100000,
      cpc: (aggregate.cpc || 0) / 100000,
      cir: ((aggregate.broad_cir || 0) * 100)
    },
    timeSeries
  };
}

// 3. Ambil & Format Data Campaign List
function getFormattedCampaigns(rawJson, options = {}) {
  const { stateFilter = 'all', searchTerm = '', sortBy = 'cost', sortOrder = 'desc' } = options;
  const data = rawJson?.data || {};
  const entries = data.entry_list || [];

  let list = entries.map(item => {
    const r = item.report || {};
    const cost = (r.cost || 0) / 100000;
    const gmv = (r.broad_gmv || 0) / 100000;
    const directGmv = (r.direct_gmv || 0) / 100000;
    const orders = r.broad_order || 0;
    const clicks = r.click || 0;
    const impressions = r.impression || 0;
    const roi = r.broad_roi || (cost > 0 ? gmv / cost : 0);
    const evaluation = evaluateCampaign(r);

    return {
      campaignId: item.campaign?.campaign_id,
      itemId: item.manual_product_ads?.item_id || item.item_id,
      title: item.title,
      image: item.image ? `https://down-id.img.susercontent.com/file/${item.image}` : null,
      imageId: item.image,
      state: item.state, // 'ongoing' | 'paused' | 'ended' | 'deleted'
      dailyBudget: (item.campaign?.daily_budget || 0) / 100000,
      totalBudget: (item.campaign?.total_budget || 0) / 100000,
      startTime: item.campaign?.start_time,
      endTime: item.campaign?.end_time,
      editableList: item.editable_list || [],
      campaignDetails: item.campaign || {},
      
      // Keuangan & Omzet
      cost,
      gmv,
      directGmv,
      roi,
      directRoi: r.direct_roi || 0,
      broadCir: (r.broad_cir || 0) * 100,
      directCir: (r.direct_cir || 0) * 100,
      cpc: clicks > 0 ? (cost / clicks) : ((r.cpc || 0) / 100000),
      rawCpc: (r.cpc || 0) / 100000,
      cpdc: (r.cpdc || 0) / 100000,
      cpm: (r.cpm || 0) / 100000,
      voucherSales: (r.voucher_sales || 0) / 100000,
      voucherAmount: (r.voucher_amount || 0) / 100000,

      // Pesanan & Konversi
      orders,
      broadOrderAmount: r.broad_order_amount || 0,
      directOrder: r.direct_order || 0,
      directOrderAmount: r.direct_order_amount || 0,
      checkout: r.checkout || 0,
      checkoutRate: (r.checkout_rate || 0) * 100,
      cr: ((r.cr || 0) * 100),
      directCr: ((r.direct_cr || 0) * 100),

      // Traffic & Funnel
      clicks,
      impressions,
      ctr: ((r.ctr || 0) * 100),
      avgRank: r.avg_rank || 0,
      atc: r.atc || 0,
      atcRate: (r.atc_rate || 0) * 100,
      pageViews: r.page_views || 0,
      view: r.view || 0,
      uniqueVisitors: r.unique_visitors || 0,
      uniqueClickUser: r.unique_click_user || 0,
      reach: r.reach || 0,
      sov: r.sov || 0,
      locationInAds: r.location_in_ads || 0,
      productClick: r.product_click || 0,
      productImpression: r.product_impression || 0,
      productCtr: (r.product_ctr || 0) * 100,

      // Evaluasi Cerdas
      evaluation,

      // Raw unedited Shopee API Report
      rawReport: r
    };
  });

  // Filter Status
  if (stateFilter && stateFilter !== 'all') {
    list = list.filter(item => item.state === stateFilter);
  }

  // Filter Search
  if (searchTerm && searchTerm.trim() !== '') {
    const query = searchTerm.toLowerCase();
    list = list.filter(item => 
      item.title.toLowerCase().includes(query) || 
      String(item.itemId).includes(query)
    );
  }

  // Sorting
  list.sort((a, b) => {
    let valA = a[sortBy] ?? 0;
    let valB = b[sortBy] ?? 0;
    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  // Hitung agregat status
  const counts = {
    all: entries.length,
    ongoing: entries.filter(e => e.state === 'ongoing').length,
    paused: entries.filter(e => e.state === 'paused').length,
    ended: entries.filter(e => e.state === 'ended').length,
    deleted: entries.filter(e => e.state === 'deleted').length
  };

  return {
    total: entries.length,
    filteredCount: list.length,
    counts,
    campaigns: list
  };
}

// 4. Live Sync All dari Shopee API (Tarik hingga 100 campaign)
async function syncLiveFromShopee() {
  const config = getConfig();
  if (!config.cookie || !config.spcCds) {
    throw new Error('Kredensial Shopee belum dikonfigurasi.');
  }

  const commonHeaders = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'content-type': 'application/json;charset=UTF-8',
    'cookie': config.cookie,
    'origin': 'https://seller.shopee.co.id',
    'referer': 'https://seller.shopee.co.id/portal/marketing/pas',
    'sc-fe-session': config.scFeSession || 'C62425B4417CEC63',
    'sc-fe-ver': config.scFeVer || '21.167990',
    'user-agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
    'af-ac-enc-dat': config.afAcEncDat || '',
    'af-ac-enc-sz-token': config.afAcEncSzToken || ''
  };

  // 1. Fetch Time Graph
  const timeGraphUrl = `https://seller.shopee.co.id/api/pas/v1/report/get_time_graph/?SPC_CDS=${config.spcCds}&SPC_CDS_VER=${config.spcCdsVer || '2'}`;
  const timeGraphPayload = {
    agg_interval: 96,
    campaign_type: "product_homepage_v2",
    start_time: 1788282000,
    end_time: 1790960399,
    need_roi_target_setting: false,
    filter_params: { campaign_type: "new_cpc_homepage" }
  };

  const resGraph = await fetch(timeGraphUrl, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify(timeGraphPayload)
  });
  const jsonGraph = await resGraph.json();
  if (jsonGraph.code === 0 && jsonGraph.data) {
    fs.writeFileSync(DATA_IKLAN_PATH, JSON.stringify(jsonGraph, null, 2), 'utf8');
  } else if (jsonGraph.error === 90309999) {
    throw new Error('Token Akamai expired (Error 90309999). Silakan paste cURL baru.');
  }

  // 2. Fetch Campaign Query (Limit 100 agar 66 produk terambil semua)
  const campaignUrl = `https://seller.shopee.co.id/api/pas/v1/homepage/query/?SPC_CDS=${config.spcCds}&SPC_CDS_VER=${config.spcCdsVer || '2'}`;
  const campaignPayload = {
    start_time: 1788282000,
    end_time: 1790960399,
    filter_list: [{ campaign_type: "product_homepage_v3", state: "all", search_term: "", is_valid_rebate_only: false }],
    offset: 0,
    limit: 100,
    use_paid_gmv: false
  };

  const resCamp = await fetch(campaignUrl, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify(campaignPayload)
  });
  const jsonCamp = await resCamp.json();
  if (jsonCamp.code === 0 && jsonCamp.data) {
    fs.writeFileSync(DATA_CAMPAIGN_PATH, JSON.stringify(jsonCamp, null, 2), 'utf8');
  }

  // Update timestamp
  const now = new Date().toISOString();
  saveConfig({ lastSyncTime: now });

  return {
    success: true,
    lastSyncTime: now,
    timeGraphPoints: jsonGraph.data?.report_by_time?.length || 0,
    campaignsCount: jsonCamp.data?.entry_list?.length || 0
  };
}

// 5. Fetch Campaign Query Live untuk Rentang Tanggal Spesifik
async function fetchLiveCampaigns(startTime, endTime) {
  const config = getConfig();
  if (!config.cookie || !config.spcCds) return null;

  const url = `https://seller.shopee.co.id/api/pas/v1/homepage/query/?SPC_CDS=${config.spcCds}&SPC_CDS_VER=${config.spcCdsVer || '2'}`;
  const commonHeaders = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'content-type': 'application/json;charset=UTF-8',
    'cookie': config.cookie,
    'origin': 'https://seller.shopee.co.id',
    'referer': 'https://seller.shopee.co.id/portal/marketing/pas',
    'sc-fe-session': config.scFeSession || 'C62425B4417CEC63',
    'sc-fe-ver': config.scFeVer || '21.167990',
    'user-agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
    'af-ac-enc-dat': config.afAcEncDat || '',
    'af-ac-enc-sz-token': config.afAcEncSzToken || ''
  };

  const payload = {
    start_time: startTime,
    end_time: endTime,
    filter_list: [{ campaign_type: "product_homepage_v3", state: "all", search_term: "", is_valid_rebate_only: false }],
    offset: 0,
    limit: 100,
    use_paid_gmv: false
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.code === 0 && json.data) {
      return json;
    }
  } catch (err) {
    console.error('[Shopee PAS] Gagal mengambil campaign live:', err.message);
  }
  return null;
}

// 6. Router data campaign: Live jika tersedia, fallback ke local
async function getCampaignsData(options = {}) {
  const { startDate, endDate } = options;

  let startTime = 1788282000;
  let endTime = 1790960399;

  if (startDate) {
    startTime = Math.floor(new Date(startDate + 'T00:00:00+07:00').getTime() / 1000);
  }
  if (endDate) {
    endTime = Math.floor(new Date(endDate + 'T23:59:59+07:00').getTime() / 1000);
  }

  // 1. Coba ambil live dari Shopee API sesuai start_time & end_time
  const liveJson = await fetchLiveCampaigns(startTime, endTime);
  if (liveJson && liveJson.data) {
    return {
      ...getFormattedCampaigns(liveJson, options),
      isLiveFiltered: true,
      timeWindow: { startTime, endTime, startDate, endDate }
    };
  }

  // 2. Fallback ke data lokal jika sesi offline
  const rawCampaigns = getLocalCampaigns();
  if (!rawCampaigns) return null;

  return {
    ...getFormattedCampaigns(rawCampaigns, options),
    isLiveFiltered: false,
    timeWindow: { startTime, endTime, startDate, endDate }
  };
}

// 6. Fetch Time Graph Live untuk Rentang Tanggal Spesifik
async function fetchLiveTimeGraph(startTime, endTime) {
  const config = getConfig();
  if (!config.cookie || !config.spcCds) return null;

  const url = `https://seller.shopee.co.id/api/pas/v1/report/get_time_graph/?SPC_CDS=${config.spcCds}&SPC_CDS_VER=${config.spcCdsVer || '2'}`;
  const commonHeaders = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'content-type': 'application/json;charset=UTF-8',
    'cookie': config.cookie,
    'origin': 'https://seller.shopee.co.id',
    'referer': 'https://seller.shopee.co.id/portal/marketing/pas',
    'sc-fe-session': config.scFeSession || 'C62425B4417CEC63',
    'sc-fe-ver': config.scFeVer || '21.167990',
    'user-agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
    'af-ac-enc-dat': config.afAcEncDat || '',
    'af-ac-enc-sz-token': config.afAcEncSzToken || ''
  };

  const payload = {
    agg_interval: 96,
    campaign_type: "product_homepage_v2",
    start_time: startTime,
    end_time: endTime,
    need_roi_target_setting: false,
    filter_params: { campaign_type: "new_cpc_homepage" }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.code === 0 && json.data) {
      return json;
    }
  } catch (err) {
    console.error('[Shopee PAS] Gagal mengambil time graph live:', err.message);
  }
  return null;
}

// 7. Router data time graph: Live jika tersedia, fallback ke local
async function getTimeGraphData(options = {}) {
  const { startDate, endDate } = options;

  let startTime = 1788282000;
  let endTime = 1790960399;

  if (startDate) {
    startTime = Math.floor(new Date(startDate + 'T00:00:00+07:00').getTime() / 1000);
  }
  if (endDate) {
    endTime = Math.floor(new Date(endDate + 'T23:59:59+07:00').getTime() / 1000);
  }

  // 1. Coba ambil live dari Shopee API sesuai start_time & end_time
  const liveJson = await fetchLiveTimeGraph(startTime, endTime);
  if (liveJson && liveJson.data) {
    return {
      ...getFormattedTimeGraph(liveJson),
      isLiveFiltered: true,
      timeWindow: { startTime, endTime, startDate, endDate }
    };
  }

  // 2. Fallback ke data lokal jika sesi offline
  const rawIklan = getLocalIklan();
  if (!rawIklan) return null;

  const baseResult = getFormattedTimeGraph(rawIklan);
  let timeSeries = baseResult.timeSeries;

  if (startDate && endDate) {
    const filtered = timeSeries.filter(item => item.fullDate >= startDate && item.fullDate <= endDate);
    if (filtered.length > 0) {
      const fCost = filtered.reduce((a, b) => a + (b.cost || 0), 0);
      const fGmv = filtered.reduce((a, b) => a + (b.broadGmv || b.directGmv || 0), 0);
      const fOrders = filtered.reduce((a, b) => a + (b.orders || 0), 0);
      const fClicks = filtered.reduce((a, b) => a + (b.clicks || 0), 0);
      const fImp = filtered.reduce((a, b) => a + (b.impressions || 0), 0);
      const fAtc = filtered.reduce((a, b) => a + (b.atc || 0), 0);

      return {
        summary: {
          cost: fCost,
          totalCost: fCost,
          broad_gmv: fGmv,
          totalBroadGmv: fGmv,
          broad_order: fOrders,
          totalOrders: fOrders,
          click: fClicks,
          totalClicks: fClicks,
          impression: fImp,
          totalImpressions: fImp,
          broad_cart: fAtc,
          totalAtc: fAtc,
          roas: fCost > 0 ? fGmv / fCost : 0,
          ctr: fImp > 0 ? (fClicks / fImp) * 100 : 0,
          cpc: fClicks > 0 ? fCost / fClicks : 0,
          avgCpc: fClicks > 0 ? fCost / fClicks : 0
        },
        timeSeries: filtered,
        isLiveFiltered: false,
        timeWindow: { startTime, endTime, startDate, endDate }
      };
    }
  }

  return {
    ...baseResult,
    isLiveFiltered: false,
    timeWindow: { startTime, endTime, startDate, endDate }
  };
}

module.exports = {
  getConfig,
  saveConfig,
  getLocalIklan,
  getLocalCampaigns,
  getStoreInfo,
  getFormattedTimeGraph,
  getTimeGraphData,
  getFormattedCampaigns,
  getCampaignsData,
  syncLiveFromShopee
};
