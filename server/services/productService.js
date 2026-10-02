/**
 * Product & SKU Master Data Service
 * File: server/services/productService.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const CONFIG_PATH = path.join(__dirname, '../config.json');
const DATA_PRODUCTS_PATH = path.join(ROOT_DIR, 'data_products.json');
const DATA_MARGINS_PATH = path.join(ROOT_DIR, 'data_sku_margins.json');

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

// Helper membaca data produk lokal
function getLocalProducts() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PRODUCTS_PATH, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Helper membaca data margin lokal
function getLocalMargins() {
  try {
    return JSON.parse(fs.readFileSync(DATA_MARGINS_PATH, 'utf8'));
  } catch (e) {
    return {};
  }
}

// Helper menyimpan data margin lokal
function saveLocalMargins(margins) {
  fs.writeFileSync(DATA_MARGINS_PATH, JSON.stringify(margins, null, 2), 'utf8');
  return margins;
}

// Helper menghitung unit economics per produk / SKU
function calculateUnitEconomics(promoPrice, marginConfig = {}) {
  const promotionPrice = Number(promoPrice || 0);
  const hpp = Number(marginConfig.hpp || 0);
  const shopeeAdminRate = Number(marginConfig.shopeeAdminRate !== undefined ? marginConfig.shopeeAdminRate : 8.5) / 100;
  const serviceFeeRate = Number(marginConfig.serviceFeeRate !== undefined ? marginConfig.serviceFeeRate : 4.0) / 100;
  const voucher = Number(marginConfig.voucher || 0);
  const affiliateFee = Number(marginConfig.affiliateFee || 0);
  const operationalFee = Number(marginConfig.operationalFee !== undefined ? marginConfig.operationalFee : 3500); // Default packaging & overhead
  const adTaxRate = 0.11; // PPN 11% untuk biaya iklan

  // 1. Plafon Biaya Iklan Berdasarkan Kebijakan King
  const cprLimit = Math.round(promotionPrice * 0.25); // 25% dari Promotion Price (CPR Target)
  const cacLimit = Math.round(promotionPrice * 0.40); // 40% dari Promotion Price (Batas Toleransi CAC)

  // 2. Potongan Biaya Pokok Penjualan & Marketplace
  const adminFeeAmount = Math.round(promotionPrice * shopeeAdminRate);
  const serviceFeeAmount = Math.round(promotionPrice * serviceFeeRate);
  const cprTaxAmount = Math.round(cprLimit * adTaxRate);
  const cacTaxAmount = Math.round(cacLimit * adTaxRate);

  // Total Potongan Pokok (HPP + Admin + Layanan + Voucher + Affiliate + Operasional)
  const totalBaseCost = hpp + adminFeeAmount + serviceFeeAmount + voucher + affiliateFee + operationalFee;

  // 3. Estimasi Laba Bersih
  const netProfitWithoutAds = promotionPrice - totalBaseCost;
  const netProfitWithCpr = promotionPrice - totalBaseCost - cprLimit - cprTaxAmount;
  const netProfitWithCac = promotionPrice - totalBaseCost - cacLimit - cacTaxAmount;

  // Margin Percentage
  const netProfitMarginPercent = promotionPrice > 0 ? (netProfitWithCpr / promotionPrice) * 100 : 0;

  return {
    promotionPrice,
    hpp,
    shopeeAdminRate: shopeeAdminRate * 100,
    serviceFeeRate: serviceFeeRate * 100,
    voucher,
    affiliateFee,
    operationalFee,
    adTaxRate: 11,
    adminFeeAmount,
    serviceFeeAmount,
    totalBaseCost,
    cprLimit,
    cacLimit,
    cprTaxAmount,
    cacTaxAmount,
    netProfitWithoutAds,
    netProfitWithCpr,
    netProfitWithCac,
    netProfitMarginPercent: Math.round(netProfitMarginPercent * 10) / 10,
    minRoasCpr: 4.0, // 100% / 25%
    minRoasCac: 2.5, // 100% / 40%
    isConfigured: !!marginConfig.hpp
  };
}

// 1. Sinkronisasi Data Produk dari Shopee API (Live Cursor Pagination)
async function syncProductsFromShopee() {
  const config = getConfig();
  if (!config.cookie) {
    throw new Error('Sesi Shopee belum dikonfigurasi. Silakan import cURL terlebih dahulu.');
  }

  const commonHeaders = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'caller-source': 'local_pc',
    'cookie': config.cookie,
    'locale': 'id',
    'referer': 'https://seller.shopee.co.id/portal/product/list/live/all?operationSortBy=recommend_v2',
    'sc-fe-session': config.scFeSession || 'D60DDA923581811D',
    'sc-fe-ver': config.scFeVer || '21.167990',
    'user-agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36'
  };

  const spcCds = config.spcCds || 'd14c53a6-27f9-4847-a7f7-e25587ee4580';
  const spcCdsVer = config.spcCdsVer || '2';

  let allProducts = [];
  let nextCursor = '';
  let page = 1;
  const maxPages = 5;

  while (page <= maxPages) {
    let url = `https://seller.shopee.co.id/api/v3/opt/mpsku/list/v2/search_product_list?SPC_CDS=${spcCds}&SPC_CDS_VER=${spcCdsVer}&page_size=24&list_type=live_all&request_attribute=&operation_sort_by=recommend_v4&need_ads=true`;
    if (nextCursor) {
      url += `&cursor=${encodeURIComponent(nextCursor)}`;
    }

    const res = await fetch(url, { headers: commonHeaders });
    const json = await res.json();

    if (json.code !== 0 || !json.data) {
      if (allProducts.length > 0) break; // Berhenti jika halaman lanjutan gagal tapi halaman 1 sukses
      throw new Error(json.message || 'Gagal menarik data produk dari Shopee API');
    }

    const products = json.data.products || [];
    allProducts.push(...products);

    const cursor = json.data.page_info?.cursor;
    const total = json.data.page_info?.total || 0;

    if (!cursor || allProducts.length >= total || products.length === 0) {
      break;
    }

    nextCursor = cursor;
    page++;
  }

  // Simpan ke database lokal
  const payload = {
    code: 0,
    syncTime: new Date().toISOString(),
    data: {
      total: allProducts.length,
      products: allProducts
    }
  };

  fs.writeFileSync(DATA_PRODUCTS_PATH, JSON.stringify(payload, null, 2), 'utf8');

  // Update timestamp config
  saveConfig({ lastSyncProductsTime: new Date().toISOString() });

  return {
    success: true,
    totalFetched: allProducts.length,
    syncTime: payload.syncTime
  };
}

// 2. Ambil & Format Master Data Produk beserta Unit Economics
function getProductsWithMargins(options = {}) {
  const { search = '', statusFilter = 'all' } = options;
  const rawData = getLocalProducts();
  if (!rawData || !rawData.data) {
    return {
      summary: { totalProducts: 0, totalSkus: 0, configuredCount: 0, avgNetProfitPercent: 0 },
      products: []
    };
  }

  const rawProducts = rawData.data.products || [];
  const marginsMap = getLocalMargins();

  let formattedProducts = rawProducts.map(p => {
    const itemId = String(p.id);
    const marginConfig = marginsMap[itemId] || {};
    
    const priceDetail = p.price_detail || {};
    const stockDetail = p.stock_detail || {};
    const modelList = p.model_list || [];

    // Tentukan harga representatif produk
    const minSellingPrice = Number(priceDetail.selling_price_min || priceDetail.price_min || 0);
    const maxSellingPrice = Number(priceDetail.selling_price_max || priceDetail.price_max || 0);
    const repPrice = minSellingPrice > 0 ? minSellingPrice : maxSellingPrice;

    // Unit economics produk induk
    const economics = calculateUnitEconomics(repPrice, marginConfig);

    // Format varian SKU
    const models = modelList.map(m => {
      const modelPrice = Number(m.price_detail?.promotion_price || m.price_detail?.origin_price || repPrice);
      const modelEconomics = calculateUnitEconomics(modelPrice, marginConfig);
      return {
        modelId: String(m.id),
        name: m.name,
        sku: m.sku || p.parent_sku || '-',
        image: m.image ? `https://down-id.img.susercontent.com/file/${m.image}` : null,
        availableStock: m.stock_detail?.total_available_stock || 0,
        originPrice: Number(m.price_detail?.origin_price || 0),
        promotionPrice: modelPrice,
        cprLimit: modelEconomics.cprLimit,
        cacLimit: modelEconomics.cacLimit,
        netProfit: modelEconomics.netProfitWithCpr
      };
    });

    return {
      itemId,
      name: p.name,
      parentSku: p.parent_sku || '-',
      coverImage: p.cover_image ? `https://down-id.img.susercontent.com/file/${p.cover_image}` : null,
      status: p.status, // 1 = live/aktif
      availableStock: stockDetail.total_available_stock || 0,
      priceMin: Number(priceDetail.price_min || 0),
      priceMax: Number(priceDetail.price_max || 0),
      sellingPriceMin: minSellingPrice,
      sellingPriceMax: maxSellingPrice,
      representativePrice: repPrice,
      modelsCount: models.length,
      models,
      marginConfig,
      economics,
      isConfigured: economics.isConfigured
    };
  });

  // Filter pencarian nama / SKU
  if (search.trim()) {
    const q = search.toLowerCase();
    formattedProducts = formattedProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.parentSku.toLowerCase().includes(q) ||
      p.itemId.includes(q) ||
      p.models.some(m => m.sku.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
    );
  }

  // Filter status konfigurasi margin
  if (statusFilter === 'configured') {
    formattedProducts = formattedProducts.filter(p => p.isConfigured);
  } else if (statusFilter === 'unconfigured') {
    formattedProducts = formattedProducts.filter(p => !p.isConfigured);
  }

  // Ringkasan Finansial
  const totalProducts = rawProducts.length;
  const totalSkus = rawProducts.reduce((acc, p) => acc + (p.model_list?.length || 0), 0);
  const configuredList = formattedProducts.filter(p => p.isConfigured);
  const configuredCount = configuredList.length;
  const avgNetProfitPercent = configuredCount > 0
    ? configuredList.reduce((acc, p) => acc + p.economics.netProfitMarginPercent, 0) / configuredCount
    : 0;

  return {
    summary: {
      totalProducts,
      totalSkus,
      configuredCount,
      unconfiguredCount: totalProducts - configuredCount,
      avgNetProfitPercent: Math.round(avgNetProfitPercent * 10) / 10
    },
    products: formattedProducts
  };
}

// 3. Simpan Konfigurasi Margin per Produk
function saveProductMargin(itemId, marginData) {
  const margins = getLocalMargins();
  margins[String(itemId)] = {
    hpp: Number(marginData.hpp || 0),
    shopeeAdminRate: Number(marginData.shopeeAdminRate !== undefined ? marginData.shopeeAdminRate : 8.5),
    serviceFeeRate: Number(marginData.serviceFeeRate !== undefined ? marginData.serviceFeeRate : 4.0),
    voucher: Number(marginData.voucher || 0),
    affiliateFee: Number(marginData.affiliateFee || 0),
    operationalFee: Number(marginData.operationalFee !== undefined ? marginData.operationalFee : 3500),
    notes: marginData.notes || '',
    updatedAt: new Date().toISOString()
  };

  saveLocalMargins(margins);
  return margins[String(itemId)];
}

// 4. Helper evaluasi kampanye iklan berbasis profil margin produk
function evaluateCampaignWithEconomics(report = {}, campaignState = 'ongoing', productEconomics = null) {
  // 1. Jika kampanye berstatus Dihapus (Deleted): Sesuai keputusan King, tanpa analisa cerdas
  if (campaignState === 'deleted') {
    return {
      statusKey: 'deleted',
      label: '⚪ Dihapus',
      color: '#6B7280',
      badgeClass: 'badge-deleted',
      advice: 'Kampanye telah dihapus dari Shopee.'
    };
  }

  const cost = (report.cost || 0) / 100000;
  const gmv = (report.broad_gmv || 0) / 100000;
  const orders = report.broad_order || 0;
  const clicks = report.click || 0;
  const roi = report.broad_roi || (cost > 0 ? gmv / cost : 0);

  // 2. Tahap Uji Coba (Testing): Data klik masih di bawah 30 dan pengeluaran masih rendah
  if (clicks < 30 && cost < 30000 && orders <= 1) {
    return {
      statusKey: 'testing',
      label: '⏳ Testing',
      color: '#8B5CF6',
      badgeClass: 'badge-testing',
      advice: 'Data masih sedikit (< 30 klik). Biarkan mengumpulkan data impresi dan konversi.'
    };
  }

  // 3. Ambil batas toleransi CPR (25%) & CAC (40%)
  let cprLimit = productEconomics ? productEconomics.cprLimit : null;
  let cacLimit = productEconomics ? productEconomics.cacLimit : null;

  // Jika produk belum diatur HPP, gunakan estimasi dari rata-rata order value (AOV)
  if (!cprLimit && orders > 0) {
    const aov = gmv / orders;
    cprLimit = aov * 0.25;
    cacLimit = aov * 0.40;
  }

  // CPA Riil per Pesanan
  const cpa = orders > 0 ? cost / orders : cost;

  // 4. Zona Hijau: 🏆 Winning / Super Profit (Biaya di bawah CPR 25% atau ROAS >= 4.0x)
  if (orders >= 2 && (roi >= 4.0 || (cprLimit && cpa <= cprLimit))) {
    return {
      statusKey: 'winning',
      label: '🏆 Winning',
      color: '#10B981',
      badgeClass: 'badge-winning',
      advice: `Super Cuan! Biaya iklan per order (Rp ${Math.round(cpa).toLocaleString('id-ID')}) aman di bawah CPR 25%. Siap scale-up!`
    };
  }

  // 5. Zona Kuning: 🎯 Toleransi Akuisisi (Biaya di zona CAC 25% - 40% atau ROAS 2.5x - 4.0x)
  if (orders >= 1 && (roi >= 2.5 || (cacLimit && cpa <= cacLimit))) {
    return {
      statusKey: 'acquisition',
      label: '🎯 Toleransi Akuisisi',
      color: '#F59E0B',
      badgeClass: 'badge-acquisition',
      advice: `Masuk zona CAC (25%-40%). Margin tipis, pertahankan untuk akuisisi pembeli baru.`
    };
  }

  // 6. Zona Merah: ⚠️ Boncos Kritis (Biaya melebihi CAC 40% atau bakar budget tanpa order)
  if ((cost >= 35000 && orders === 0) || (orders > 0 && roi < 2.5) || (cacLimit && cpa > cacLimit)) {
    return {
      statusKey: 'boncos',
      label: '⚠️ Boncos Kritis',
      color: '#EF4444',
      badgeClass: 'badge-boncos',
      advice: orders === 0 
        ? `Biaya Rp ${Math.round(cost).toLocaleString('id-ID')} terbakar tanpa ada pesanan. Rem atau jeda iklan sekarang!`
        : `Biaya iklan per order (Rp ${Math.round(cpa).toLocaleString('id-ID')}) melampaui batas CAC 40%. Rem segera!`
    };
  }

  // 7. Zona Potensial (CTR tinggi tapi belum order)
  const ctr = report.ctr || 0;
  if (ctr >= 0.02 && orders === 0) {
    return {
      statusKey: 'potential',
      label: '🌱 Potensial',
      color: '#06B6D4',
      badgeClass: 'badge-potential',
      advice: 'CTR iklan bagus (banyak klik), tapi belum ada order. Optimalkan foto, harga, atau voucher produk.'
    };
  }

  // Default Pemantauan
  return {
    statusKey: 'monitoring',
    label: '⚪ Pemantauan',
    color: '#9CA3AF',
    badgeClass: 'badge-monitoring',
    advice: 'Performa stabil dalam batas wajar. Pantau terus konversi.'
  };
}

module.exports = {
  getLocalProducts,
  getLocalMargins,
  saveLocalMargins,
  calculateUnitEconomics,
  syncProductsFromShopee,
  getProductsWithMargins,
  saveProductMargin,
  evaluateCampaignWithEconomics
};
