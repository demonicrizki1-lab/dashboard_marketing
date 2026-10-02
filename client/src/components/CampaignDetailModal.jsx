import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Eye, 
  MousePointerClick, 
  Target, 
  Zap, 
  Copy, 
  Check, 
  Sparkles,
  Layers,
  HelpCircle,
  FileCode,
  Calendar
} from 'lucide-react';

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const formatNumber = (val) => {
  return new Intl.NumberFormat('id-ID').format(val || 0);
};

export default function CampaignDetailModal({ campaign, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('financial'); // 'financial' | 'conversion' | 'traffic' | 'raw'
  const [copied, setCopied] = useState(false);

  if (!isOpen || !campaign) return null;

  const imageUrl = campaign.image || (campaign.image_id ? `https://down-id.img.susercontent.com/file/${campaign.image_id}` : (campaign.imageId ? `https://down-id.img.susercontent.com/file/${campaign.imageId}` : null));
  const evalInfo = campaign.evaluation || { label: 'Pemantauan', type: 'monitoring', advice: 'Belum cukup data untuk analisis.' };
  const evalType = evalInfo.statusKey || evalInfo.type || 'monitoring';
  const campaignId = campaign.campaign_id || campaign.campaignId || '-';
  const itemId = campaign.item_id || campaign.itemId || '-';
  const state = (campaign.state || '').toLowerCase();

  // Helper copy JSON
  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(campaign.rawReport || campaign, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-content-lg" 
        onClick={(e) => e.stopPropagation()}
        id="campaign-detail-modal"
      >
        {/* Header Modal */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--color-brand-primary)' }} />
            <h3>Rincian Lengkap Metrik Kampanye Iklan</h3>
          </div>
          <button 
            className="btn btn-secondary btn-icon-only" 
            onClick={onClose}
            style={{ borderRadius: '50%', padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-scrollable-body">
          {/* Hero Box Info Produk */}
          <div className="detail-hero-box">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="detail-product-img" />
            ) : (
              <div className="detail-product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No Img</span>
              </div>
            )}
            
            <div className="detail-hero-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className={`badge badge-${state === 'ongoing' ? 'ongoing' : state === 'paused' ? 'paused' : state === 'ended' ? 'ended' : 'deleted'}`}>
                  {state === 'ongoing' ? 'Aktif' : state === 'paused' ? 'Dijeda' : state === 'ended' ? 'Selesai' : 'Dihapus'}
                </span>
                <span className={`badge-eval badge-${evalType}`}>
                  {evalInfo.label}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Campaign ID: <strong style={{ color: 'var(--text-primary)' }}>{campaignId}</strong> • Item ID: <strong style={{ color: 'var(--text-primary)' }}>{itemId}</strong>
                </span>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {campaign.title}
              </h4>

              {evalInfo.advice && (
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} style={{ color: 'var(--color-warning)' }} />
                  <span><strong>Rekomendasi AI:</strong> {evalInfo.advice}</span>
                </p>
              )}

              <div style={{ marginTop: '4px' }}>
                <a
                  href={`https://seller.shopee.co.id/portal/marketing/pas/index?item_id=${itemId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-link"
                  style={{ fontSize: '11px' }}
                >
                  <ExternalLink size={13} />
                  <span>Buka Produk di Shopee Seller Center</span>
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="detail-tabs-nav">
            <button
              className={`detail-tab-btn ${activeTab === 'financial' ? 'active' : ''}`}
              onClick={() => setActiveTab('financial')}
              id="tab-detail-financial"
            >
              <DollarSign size={14} />
              <span>1. Keuangan & Profitabilitas</span>
            </button>
            <button
              className={`detail-tab-btn ${activeTab === 'conversion' ? 'active' : ''}`}
              onClick={() => setActiveTab('conversion')}
              id="tab-detail-conversion"
            >
              <ShoppingCart size={14} />
              <span>2. Pesanan & Konversi</span>
            </button>
            <button
              className={`detail-tab-btn ${activeTab === 'traffic' ? 'active' : ''}`}
              onClick={() => setActiveTab('traffic')}
              id="tab-detail-traffic"
            >
              <Eye size={14} />
              <span>3. Traffic, Posisi & Funnel</span>
            </button>
            <button
              className={`detail-tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
              onClick={() => setActiveTab('raw')}
              id="tab-detail-raw"
            >
              <FileCode size={14} />
              <span>4. Raw JSON Shopee API</span>
            </button>
          </div>

          {/* TAB 1: Keuangan & Profitabilitas */}
          {activeTab === 'financial' && (
            <div className="metrics-detail-grid">
              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Total Biaya Iklan (Cost)</span>
                  <DollarSign size={13} style={{ color: 'var(--color-brand-primary)' }} />
                </span>
                <span className="metric-detail-val tabular-nums" style={{ color: 'var(--color-brand-primary)' }}>
                  {formatRupiah(campaign.cost)}
                </span>
                <span className="metric-detail-sub">Total saldo iklan yang telah dibelanjakan</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Total Omzet (Broad GMV)</span>
                  <TrendingUp size={13} style={{ color: 'var(--color-success)' }} />
                </span>
                <span className="metric-detail-val tabular-nums" style={{ color: 'var(--color-success)' }}>
                  {formatRupiah(campaign.gmv ?? campaign.broad_gmv)}
                </span>
                <span className="metric-detail-sub">Penjualan produk ini & produk toko terkait</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Omzet Langsung (Direct GMV)</span>
                  <Target size={13} style={{ color: 'var(--color-info)' }} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatRupiah(campaign.directGmv ?? campaign.direct_gmv)}
                </span>
                <span className="metric-detail-sub">Penjualan khusus SKU iklan ini saja</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>ROAS / ROI Total (Broad ROI)</span>
                  <Target size={13} />
                </span>
                <span className="metric-detail-val tabular-nums" style={{ color: (campaign.roi ?? campaign.roas) >= 2 ? 'var(--color-success)' : 'inherit' }}>
                  {(campaign.roi ?? campaign.roas ?? 0).toFixed(2)}x
                </span>
                <span className="metric-detail-sub">Rasio pengembalian modal total</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>ROAS Langsung (Direct ROI)</span>
                  <Target size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {(campaign.directRoi ?? 0).toFixed(2)}x
                </span>
                <span className="metric-detail-sub">Rasio dari pembelian produk langsung</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Broad CIR (Cost to Income)</span>
                  <Zap size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {(campaign.broadCir ?? 0).toFixed(2)}%
                </span>
                <span className="metric-detail-sub">Persentase biaya terhadap omzet</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>CPC Rata-rata (Cost Per Click)</span>
                  <MousePointerClick size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatRupiah(campaign.cpc)}
                </span>
                <span className="metric-detail-sub">Biaya per klik riil didapat</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>CPM (Cost per 1.000 Views)</span>
                  <Eye size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatRupiah(campaign.cpm)}
                </span>
                <span className="metric-detail-sub">Biaya per seribu tayangan iklan</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Modal Harian (Daily Budget)</span>
                  <Calendar size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {campaign.dailyBudget > 0 ? formatRupiah(campaign.dailyBudget) : 'Tanpa Batas'}
                </span>
                <span className="metric-detail-sub">Batas anggaran harian campaign</span>
              </div>
            </div>
          )}

          {/* TAB 2: Pesanan & Konversi */}
          {activeTab === 'conversion' && (
            <div className="metrics-detail-grid">
              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Total Pesanan (Broad Order)</span>
                  <ShoppingCart size={13} style={{ color: 'var(--color-warning)' }} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatNumber(campaign.orders ?? campaign.broad_order)} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>order</span>
                </span>
                <span className="metric-detail-sub">Semua order yang teratribusi dari iklan</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Total Barang Terjual (Items)</span>
                  <ShoppingCart size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatNumber(campaign.broadOrderAmount ?? 0)} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>pcs</span>
                </span>
                <span className="metric-detail-sub">Jumlah kuantitas item terjual</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Pesanan Langsung (Direct Order)</span>
                  <ShoppingCart size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatNumber(campaign.directOrder ?? 0)} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>order</span>
                </span>
                <span className="metric-detail-sub">Order pada SKU yang diiklankan</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Conversion Rate (CR)</span>
                  <Target size={13} style={{ color: 'var(--color-success)' }} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {(campaign.cr ?? 0).toFixed(2)}%
                </span>
                <span className="metric-detail-sub">Rasio klik menjadi pesanan</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Direct Conversion Rate</span>
                  <Target size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {(campaign.directCr ?? 0).toFixed(2)}%
                </span>
                <span className="metric-detail-sub">Tingkat konversi langsung produk</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Masuk Keranjang (Add to Cart)</span>
                  <ShoppingCart size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatNumber(campaign.atc ?? 0)} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>item</span>
                </span>
                <span className="metric-detail-sub">Rasio ATC: {(campaign.atcRate ?? 0).toFixed(2)}%</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Checkout</span>
                  <ShoppingCart size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatNumber(campaign.checkout ?? 0)}
                </span>
                <span className="metric-detail-sub">Checkout Rate: {(campaign.checkoutRate ?? 0).toFixed(2)}%</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Penjualan Voucher</span>
                  <DollarSign size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatRupiah(campaign.voucherSales ?? 0)}
                </span>
                <span className="metric-detail-sub">Total transaksi memakai voucher toko</span>
              </div>
            </div>
          )}

          {/* TAB 3: Traffic & Penempatan Iklan */}
          {activeTab === 'traffic' && (
            <div className="metrics-detail-grid">
              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Total Tayangan (Impressions)</span>
                  <Eye size={13} style={{ color: 'var(--color-info)' }} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatNumber(campaign.impressions ?? campaign.impression)}
                </span>
                <span className="metric-detail-sub">Berapa kali iklan muncul di pembeli</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Total Klik (Clicks)</span>
                  <MousePointerClick size={13} style={{ color: 'var(--color-success)' }} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatNumber(campaign.clicks ?? campaign.click)}
                </span>
                <span className="metric-detail-sub">Jumlah klik pembeli ke produk</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Click-Through Rate (CTR)</span>
                  <Zap size={13} style={{ color: 'var(--color-warning)' }} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {(campaign.ctr ?? 0).toFixed(2)}%
                </span>
                <span className="metric-detail-sub">Efektivitas gambar & judul iklan</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Peringkat Rata-rata Iklan</span>
                  <Target size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  #{campaign.avgRank || '-'}
                </span>
                <span className="metric-detail-sub">Posisi rata-rata penempatan di pencarian</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Kunjungan Halaman (Page Views)</span>
                  <Eye size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatNumber(campaign.pageViews ?? 0)}
                </span>
                <span className="metric-detail-sub">Halaman produk dilihat pembeli</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Pengunjung Unik (Visitors)</span>
                  <Eye size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatNumber(campaign.uniqueVisitors ?? 0)}
                </span>
                <span className="metric-detail-sub">User klik unik: {formatNumber(campaign.uniqueClickUser ?? 0)}</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Jangkauan (Reach) & SOV</span>
                  <Eye size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {formatNumber(campaign.reach ?? 0)}
                </span>
                <span className="metric-detail-sub">Share of Voice: {campaign.sov ?? 0}</span>
              </div>

              <div className="metric-detail-box">
                <span className="metric-detail-label">
                  <span>Lokasi Iklan (Location in Ads)</span>
                  <Layers size={13} />
                </span>
                <span className="metric-detail-val tabular-nums">
                  {campaign.locationInAds || '-'}
                </span>
                <span className="metric-detail-sub">Kode penempatan algoritma Shopee</span>
              </div>
            </div>
          )}

          {/* TAB 4: Raw JSON Shopee API */}
          {activeTab === 'raw' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Data mentah asli (exact payload) dari Shopee API response untuk campaign ini:
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={handleCopyJson}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                  id="btn-copy-raw-json"
                >
                  {copied ? <Check size={13} style={{ color: 'var(--color-success)' }} /> : <Copy size={13} />}
                  <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
                </button>
              </div>

              <pre className="json-code-box">
                {JSON.stringify(campaign.rawReport || campaign, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: 'auto' }}>
            Tips: Klik tab untuk melihat rincian keuangan, konversi, atau data JSON lengkap.
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
