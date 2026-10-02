import React, { useState, useEffect } from 'react';
import { 
  Package, 
  RefreshCw, 
  Search, 
  SlidersHorizontal, 
  DollarSign, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Tag, 
  Boxes,
  ShieldCheck,
  Edit3,
  ExternalLink,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import SkuMarginModal from './SkuMarginModal';

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function ProductSkuManager({ showToast }) {
  const [productsData, setProductsData] = useState({ summary: {}, products: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'configured' | 'unconfigured'
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [selectedProductForMargin, setSelectedProductForMargin] = useState(null);

  // Fetch Products Data
  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProductsData(data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      if (showToast) showToast('Gagal memuat katalog produk.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [statusFilter]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  // Sync Products from Shopee API
  const handleSyncProducts = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/products/sync', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        if (showToast) {
          showToast(`Sinkronisasi sukses! Berhasil menarik ${data.totalFetched} produk dari Shopee.`, 'success');
        }
        await loadProducts();
      } else {
        if (showToast) {
          showToast(data.error || 'Gagal sinkronisasi produk. Cek sesi cURL.', 'error');
        }
      }
    } catch (err) {
      if (showToast) showToast('Terjadi kesalahan sinkronisasi: ' + err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Toggle Row Expansion
  const toggleExpand = (itemId) => {
    setExpandedItemId(prev => prev === itemId ? null : itemId);
  };

  const summary = productsData.summary || {};
  const products = productsData.products || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Modul Master SKU */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '16px',
        backgroundColor: 'var(--bg-card)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '10px', 
            backgroundColor: 'rgba(238, 77, 45, 0.12)', 
            color: 'var(--color-brand-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Package size={24} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                Master Data Produk & Kalkulator Margin SKU
              </h2>
              <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '11px', padding: '2px 8px' }}>
                Modul 3
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Atur HPP, potongan fee Shopee, dan operasional per produk sebagai acuan batas aman iklan CPR (25%) & CAC (40%)
            </p>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleSyncProducts}
          disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
          <span>{syncing ? 'Menarik Produk...' : 'Sinkronkan Produk Shopee'}</span>
        </button>
      </div>

      {/* KPI Cards Ringkasan Master Data */}
      <div className="kpi-grid">
        {/* 1. Total Produk */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Produk Toko</span>
            <div className="kpi-icon" style={{ backgroundColor: 'rgba(238, 77, 45, 0.12)', color: 'var(--color-brand-primary)' }}>
              <Boxes size={18} />
            </div>
          </div>
          <div className="kpi-value tabular-nums">
            {summary.totalProducts || 0}
          </div>
          <div className="kpi-subtext">
            <span>Katalog produk aktif terdaftar di Shopee</span>
          </div>
        </div>

        {/* 2. Total Varian SKU */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Varian Model SKU</span>
            <div className="kpi-icon info">
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-value tabular-nums" style={{ color: 'var(--color-info)' }}>
            {summary.totalSkus || 0}
          </div>
          <div className="kpi-subtext">
            <span>Kombinasi warna & ukuran SKU satuan</span>
          </div>
        </div>

        {/* 3. SKU Terkonfigurasi */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Produk Diatur Margin</span>
            <div className="kpi-icon success">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value tabular-nums" style={{ color: 'var(--color-success)' }}>
            {summary.configuredCount || 0} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ {summary.totalProducts || 0}</span>
          </div>
          <div className="kpi-subtext">
            <span>{summary.unconfiguredCount || 0} produk menunggu input HPP</span>
          </div>
        </div>

        {/* 4. Rata-rata Laba Bersih */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Rata-rata Margin Bersih</span>
            <div className="kpi-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value tabular-nums" style={{ color: '#10B981' }}>
            {summary.avgNetProfitPercent || 0}%
          </div>
          <div className="kpi-subtext">
            <span>Estimasi cuan bersih setelah CPR 25%</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '12px',
        backgroundColor: 'var(--bg-card)',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid var(--border-color)'
      }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            STATUS MARGIN:
          </span>
          {[
            { key: 'all', label: `Semua (${summary.totalProducts || 0})` },
            { key: 'configured', label: `Sudah Diisi (${summary.configuredCount || 0})` },
            { key: 'unconfigured', label: `Belum Diisi (${summary.unconfiguredCount || 0})` }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className="badge"
              style={{
                cursor: 'pointer',
                backgroundColor: statusFilter === f.key ? 'var(--color-brand-primary)' : 'rgba(255, 255, 255, 0.05)',
                color: statusFilter === f.key ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${statusFilter === f.key ? 'var(--color-brand-primary)' : 'var(--border-color)'}`,
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Cari nama produk, SKU, atau Item ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '12px' }}>
            Cari
          </button>
        </form>
      </div>

      {/* Tabel Master SKU Produk */}
      <div className="table-responsive" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
            <span>Memuat master data produk...</span>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Tidak ada produk yang cocok dengan pencarian.</p>
          </div>
        ) : (
          <table className="campaign-data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '44px', textAlign: 'center' }}></th>
                <th style={{ minWidth: '260px', textAlign: 'left', fontSize: '11px', letterSpacing: '0.04em' }}>
                  PRODUK & SKU INDUK
                </th>
                <th style={{ width: '90px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em' }}>
                  STOK
                </th>
                <th style={{ width: '130px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em' }}>
                  HARGA PROMO
                </th>
                <th style={{ width: '130px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em' }}>
                  PLAFON CPR (25%)
                </th>
                <th style={{ width: '130px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em' }}>
                  PLAFON CAC (40%)
                </th>
                <th style={{ width: '130px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em' }}>
                  ESTIMASI CUAN
                </th>
                <th style={{ width: '120px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em' }}>
                  STATUS MARGIN
                </th>
                <th style={{ width: '100px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em' }}>
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isExpanded = expandedItemId === p.itemId;
                const eco = p.economics || {};

                // Sort models per warna dan size M -> 4XL/6XL
                const sizeHierarchy = {
                  'xs': 1, 's': 2, 'm': 3, 'l': 4, 'xl': 5, 
                  '2xl': 6, 'xxl': 6, '3xl': 7, 'xxxl': 7, 
                  '4xl': 8, 'xxxxl': 8, '5xl': 9, '6xl': 10
                };
                const parseVar = (name) => {
                  const parts = (name || '').split(',');
                  if (parts.length >= 2) {
                    const p0 = parts[0].trim();
                    const p1 = parts[1].trim();
                    if (sizeHierarchy[p0.toLowerCase()] && !sizeHierarchy[p1.toLowerCase()]) {
                      return { color: p1, size: p0 };
                    }
                    return { color: p0, size: p1 };
                  }
                  return { color: name || '', size: '' };
                };
                const sortedModels = [...(p.models || [])].sort((a, b) => {
                  const varA = parseVar(a.name);
                  const varB = parseVar(b.name);
                  if (varA.color !== varB.color) {
                    return varA.color.localeCompare(varB.color);
                  }
                  const ordA = sizeHierarchy[varA.size.toLowerCase()] || 99;
                  const ordB = sizeHierarchy[varB.size.toLowerCase()] || 99;
                  if (ordA !== ordB) return ordA - ordB;
                  return varA.size.localeCompare(varB.size);
                });

                return (
                  <React.Fragment key={p.itemId}>
                    <tr style={{ backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent' }}>
                      {/* Accordion Expand Button */}
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => toggleExpand(p.itemId)}
                          className="btn-icon"
                          title="Lihat variasi SKU model"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>

                      {/* Info Produk (Left Aligned) */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {p.coverImage ? (
                            <img 
                              src={p.coverImage} 
                              alt={p.name} 
                              style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Package size={20} style={{ color: 'var(--text-muted)' }} />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }} title={p.name}>
                              {p.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '11px', color: 'var(--text-muted)' }}>
                              <span>SKU: <strong style={{ color: 'var(--text-secondary)' }}>{p.parentSku}</strong></span>
                              <span>•</span>
                              <span>ID: <span className="tabular-nums">{p.itemId}</span></span>
                              <span>•</span>
                              <span>{p.modelsCount} Varian</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stok Tersedia (Center Aligned) */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="tabular-nums" style={{ fontSize: '13px', fontWeight: 600, color: p.availableStock > 0 ? 'var(--text-primary)' : 'var(--color-danger)' }}>
                          {p.availableStock} pcs
                        </span>
                      </td>

                      {/* Harga Jual Promo (Center Aligned) */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                            {formatRupiah(p.representativePrice)}
                          </div>
                          {p.sellingPriceMin !== p.sellingPriceMax && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {formatRupiah(p.sellingPriceMin)} - {formatRupiah(p.sellingPriceMax)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Plafon CPR 25% (Center Aligned) */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>
                            {formatRupiah(eco.cprLimit)}
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            ROAS ≥ 4.0x
                          </span>
                        </div>
                      </td>

                      {/* Plafon CAC 40% (Center Aligned) */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>
                            {formatRupiah(eco.cacLimit)}
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            ROAS ≥ 2.5x
                          </span>
                        </div>
                      </td>

                      {/* Estimasi Laba Bersih (Center Aligned) */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          {p.isConfigured ? (
                            <>
                              <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: eco.netProfitWithCpr > 0 ? '#10B981' : '#EF4444' }}>
                                {formatRupiah(eco.netProfitWithCpr)}
                              </div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {eco.netProfitMarginPercent}% Margin
                              </span>
                            </>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Belum diinput HPP
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Konfigurasi Margin (Center Aligned) */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          {p.isConfigured ? (
                            <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '11px', padding: '3px 8px' }}>
                              ✅ Terkonfigurasi
                            </span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '11px', padding: '3px 8px' }}>
                              ⚠️ Belum Diisi
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tombol Aksi (Center Aligned) */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            onClick={() => setSelectedProductForMargin(p)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Edit3 size={13} />
                            <span>Atur Margin</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Accordion Detail: Daftar Varian Model SKU (Urutan Warna & Size M - 4XL/6XL) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                📦 Rincian {sortedModels.length} Varian SKU Model (Urutan Warna & Size M - 4XL):
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Parameter margin dihitung proporsional terhadap harga promo varian
                              </span>
                            </div>

                            <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                                  <tr>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10.5px', letterSpacing: '0.04em' }}>VARIAN</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10.5px', letterSpacing: '0.04em' }}>KODE SKU MODEL</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '10.5px', letterSpacing: '0.04em' }}>STOK</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '10.5px', letterSpacing: '0.04em' }}>HARGA PROMO</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '10.5px', letterSpacing: '0.04em' }}>PLAFON CPR (25%)</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '10.5px', letterSpacing: '0.04em' }}>PLAFON CAC (40%)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sortedModels.map(m => (
                                    <tr key={m.modelId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                      <td style={{ padding: '8px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          {m.image && (
                                            <img src={m.image} alt={m.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                                          )}
                                          <strong style={{ color: 'var(--text-primary)' }}>{m.name}</strong>
                                        </div>
                                      </td>
                                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{m.sku}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'center' }} className="tabular-nums">{m.availableStock}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-brand-primary)' }} className="tabular-nums">
                                        {formatRupiah(m.promotionPrice)}
                                      </td>
                                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#10B981' }} className="tabular-nums">
                                        {formatRupiah(m.cprLimit)}
                                      </td>
                                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#F59E0B' }} className="tabular-nums">
                                        {formatRupiah(m.cacLimit)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Editor Margin Finansial */}
      {selectedProductForMargin && (
        <SkuMarginModal
          product={selectedProductForMargin}
          isOpen={!!selectedProductForMargin}
          onClose={() => setSelectedProductForMargin(null)}
          onSaveSuccess={(itemId, newMargin) => {
            if (showToast) {
              showToast('Parameter margin & batas iklan berhasil disimpan!', 'success');
            }
            loadProducts();
          }}
        />
      )}
    </div>
  );
}
