import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  RefreshCw, 
  Search, 
  ArrowUpDown,
  SlidersHorizontal, 
  DollarSign, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  TrendingUp, 
  TrendingDown,
  Tag, 
  Boxes,
  ShieldCheck,
  Edit3,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  Plus,
  X
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
  const [sortBy, setSortBy] = useState('default');
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
  const rawProducts = productsData.products || [];

  // Sorting Logic
  const sortedProducts = useMemo(() => {
    const list = [...rawProducts];
    if (sortBy === 'stock_desc') {
      return list.sort((a, b) => (b.availableStock || 0) - (a.availableStock || 0));
    }
    if (sortBy === 'stock_asc') {
      return list.sort((a, b) => (a.availableStock || 0) - (b.availableStock || 0));
    }
    if (sortBy === 'price_desc') {
      return list.sort((a, b) => (b.representativePrice || 0) - (a.representativePrice || 0));
    }
    if (sortBy === 'price_asc') {
      return list.sort((a, b) => (a.representativePrice || 0) - (b.representativePrice || 0));
    }
    if (sortBy === 'models_desc') {
      return list.sort((a, b) => (b.modelsCount || 0) - (a.modelsCount || 0));
    }
    if (sortBy === 'margin_asc') {
      return list.sort((a, b) => {
        const mA = a.isConfigured ? (a.economics?.netProfitMarginPercent || 0) : 999;
        const mB = b.isConfigured ? (b.economics?.netProfitMarginPercent || 0) : 999;
        return mA - mB;
      });
    }
    if (sortBy === 'margin_desc') {
      return list.sort((a, b) => {
        const mA = a.isConfigured ? (a.economics?.netProfitMarginPercent || 0) : -999;
        const mB = b.isConfigured ? (b.economics?.netProfitMarginPercent || 0) : -999;
        return mB - mA;
      });
    }
    return list; // default Shopee recommendation order
  }, [rawProducts, sortBy]);

  // Completion calculation
  const totalCount = summary.totalProducts || 1;
  const configuredCount = summary.configuredCount || 0;
  const completionPercent = Math.round((configuredCount / totalCount) * 100);

  // Profit average status
  const avgMargin = summary.avgNetProfitPercent || 0;
  const isLossMargin = avgMargin < 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Zona 1: Sleek Compact Header Modul Master SKU */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '14px',
        backgroundColor: 'var(--bg-card)',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 20px -8px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            backgroundColor: 'rgba(238, 77, 45, 0.12)', 
            color: 'var(--color-brand-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(238, 77, 45, 0.2)'
          }}>
            <Package size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Master Data SKU & Unit Economics
              </h2>
              <span className="badge" style={{ backgroundColor: 'rgba(238, 77, 45, 0.12)', color: 'var(--color-brand-primary)', border: '1px solid rgba(238, 77, 45, 0.25)', fontSize: '11px', padding: '2px 8px', fontWeight: 600 }}>
                Modul 3
              </span>
              <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '11px', padding: '2px 8px' }}>
                Live Shopee Catalog
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Atur HPP produk & komponen biaya untuk mengunci batas aman iklan CPR (25% • ROAS ≥ 4.0x) dan CAC (40% • ROAS ≥ 2.5x)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            padding: '6px 12px', 
            borderRadius: '8px', 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            border: '1px solid var(--border-color)',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            Total Katalog: <strong style={{ color: 'var(--text-primary)' }}>{summary.totalProducts || 0} Produk</strong>
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleSyncProducts}
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600 }}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Menarik dari Shopee...' : 'Sinkronkan Katalog Shopee'}</span>
          </button>
        </div>
      </div>

      {/* Zona 2: KPI Cards Ringkasan Master Data (Executive Metrics) */}
      <div className="kpi-grid">
        {/* 1. Total Produk Toko */}
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
            <span>Katalog produk aktif di Shopee Seller Center</span>
          </div>
        </div>

        {/* 2. Total Varian Model SKU */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Model Varian SKU</span>
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

        {/* 3. Status Kelengkapan HPP (Gamified Progress Indicator) */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Kelengkapan HPP Produk</span>
            <div className="kpi-icon success">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value tabular-nums" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span>{configuredCount}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
              / {summary.totalProducts || 0} SKU ({completionPercent}%)
            </span>
          </div>
          {/* Progress Bar Visual */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ 
              width: '100%', 
              height: '5px', 
              backgroundColor: 'var(--border-subtle)', 
              borderRadius: '999px', 
              overflow: 'hidden' 
            }}>
              <div style={{ 
                width: `${Math.max(4, completionPercent)}%`, 
                height: '100%', 
                background: completionPercent >= 80 ? '#10B981' : 'linear-gradient(90deg, #EE4D2D 0%, #10B981 100%)',
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <div className="kpi-subtext" style={{ marginTop: '5px' }}>
              <span>{summary.unconfiguredCount || 0} produk menunggu input HPP</span>
            </div>
          </div>
        </div>

        {/* 4. Rata-rata Laba Bersih (Semantic Colors: Red for Negative, Green for Positive) */}
        <div className="kpi-card" style={{ borderColor: isLossMargin ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Rata-Rata Margin Bersih</span>
            <div 
              className="kpi-icon" 
              style={{ 
                backgroundColor: isLossMargin ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                color: isLossMargin ? '#EF4444' : '#10B981' 
              }}
            >
              {isLossMargin ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
            </div>
          </div>
          <div className="kpi-value tabular-nums" style={{ color: isLossMargin ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{avgMargin}%</span>
            {isLossMargin ? (
              <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '10px', padding: '2px 6px', fontWeight: 600 }}>
                Defisit Iklan
              </span>
            ) : (
              <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '10px', padding: '2px 6px', fontWeight: 600 }}>
                Sehat
              </span>
            )}
          </div>
          <div className="kpi-subtext">
            <span style={{ color: isLossMargin ? '#FCA5A5' : 'var(--text-muted)' }}>
              {isLossMargin ? '⚠️ Rugi setelah CPR 25% (HPP terlalu tinggi)' : 'Estimasi cuan bersih setelah CPR 25%'}
            </span>
          </div>
        </div>
      </div>

      {/* Zona 3: Toolbar Filter Status, Urutkan (Sorting), dan Pencarian */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '12px',
        backgroundColor: 'var(--bg-card)',
        padding: '12px 18px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
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
                backgroundColor: statusFilter === f.key ? 'var(--color-brand-primary)' : 'var(--bg-input)',
                color: statusFilter === f.key ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${statusFilter === f.key ? 'var(--color-brand-primary)' : 'var(--border-subtle)'}`,
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Right Controls: Sort Dropdown & Search Form */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 450px', justifyContent: 'flex-end' }}>
          {/* Quick Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                padding: '7px 28px 7px 10px',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
              title="Urutkan daftar produk"
            >
              <option value="default">Urutan Default Shopee</option>
              <option value="stock_desc">Stok Terbanyak</option>
              <option value="stock_asc">Stok Tersedikit</option>
              <option value="price_desc">Harga Tertinggi</option>
              <option value="price_asc">Harga Terendah</option>
              <option value="models_desc">Varian Terbanyak</option>
              <option value="margin_asc">Margin Terendah (Prioritas Evaluasi)</option>
              <option value="margin_desc">Margin Tertinggi</option>
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '240px', flex: '1 1 240px', maxWidth: '360px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Cari produk, SKU induk, Item ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 32px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              {searchTerm && (
                <button 
                  type="button" 
                  onClick={() => { setSearchTerm(''); loadProducts(); }}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '12px' }}>
              Cari
            </button>
          </form>
        </div>
      </div>

      {/* Zona 4: Tabel Master SKU Produk (Wide Container with Fixed Header & Columns) */}
      <div className="table-responsive" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
            <span>Memuat master data produk & kalkulator margin...</span>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Tidak ada produk yang cocok dengan pencarian atau filter.</p>
          </div>
        ) : (
          <table className="campaign-data-table" style={{ width: '100%', minWidth: '1140px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '48px', textAlign: 'center', padding: '12px 8px' }}></th>
                <th style={{ minWidth: '280px', textAlign: 'left', fontSize: '11px', letterSpacing: '0.04em', padding: '12px 14px' }}>
                  PRODUK & SKU INDUK
                </th>
                <th style={{ width: '90px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em', padding: '12px 10px' }}>
                  STOK
                </th>
                <th style={{ width: '125px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em', padding: '12px 10px' }}>
                  HARGA PROMO
                </th>
                <th style={{ width: '125px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em', padding: '12px 10px' }}>
                  PLAFON CPR (25%)
                </th>
                <th style={{ width: '125px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em', padding: '12px 10px' }}>
                  PLAFON CAC (40%)
                </th>
                <th style={{ width: '135px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em', padding: '12px 10px' }}>
                  ESTIMASI CUAN
                </th>
                <th style={{ width: '140px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em', padding: '12px 10px' }}>
                  STATUS MARGIN
                </th>
                <th style={{ width: '120px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.04em', padding: '12px 14px' }}>
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((p) => {
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
                    <tr style={{ backgroundColor: isExpanded ? 'var(--bg-card-hover)' : 'transparent', transition: 'background-color 0.15s ease' }}>
                      {/* Accordion Expand Button */}
                      <td style={{ textAlign: 'center', padding: '14px 8px' }}>
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
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {p.coverImage ? (
                            <img 
                              src={p.coverImage} 
                              alt={p.name} 
                              style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Package size={22} style={{ color: 'var(--text-muted)' }} />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }} title={p.name}>
                              {p.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                              <span>SKU: <strong style={{ color: 'var(--text-secondary)' }}>{p.parentSku}</strong></span>
                              <span>•</span>
                              <span>ID: <span className="tabular-nums">{p.itemId}</span></span>
                              <span>•</span>
                              <span style={{ color: 'var(--color-info)' }}>{p.modelsCount} Varian</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stok Tersedia (Center Aligned) */}
                      <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <span className="tabular-nums" style={{ fontSize: '13px', fontWeight: 600, color: p.availableStock > 0 ? 'var(--text-primary)' : 'var(--color-danger)' }}>
                          {p.availableStock} pcs
                        </span>
                      </td>

                      {/* Harga Jual Promo (Center Aligned) */}
                      <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                            {formatRupiah(p.representativePrice)}
                          </div>
                          {p.sellingPriceMin !== p.sellingPriceMax && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {formatRupiah(p.sellingPriceMin)} - {formatRupiah(p.sellingPriceMax)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Plafon CPR 25% (Center Aligned) */}
                      <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>
                            {formatRupiah(eco.cprLimit)}
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ROAS ≥ 4.0x
                          </span>
                        </div>
                      </td>

                      {/* Plafon CAC 40% (Center Aligned) */}
                      <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>
                            {formatRupiah(eco.cacLimit)}
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ROAS ≥ 2.5x
                          </span>
                        </div>
                      </td>

                      {/* Estimasi Laba Bersih (Center Aligned) */}
                      <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          {p.isConfigured ? (
                            <>
                              <div className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: eco.netProfitWithCpr > 0 ? '#10B981' : '#EF4444' }}>
                                {formatRupiah(eco.netProfitWithCpr)}
                              </div>
                              <span style={{ fontSize: '10px', color: eco.netProfitWithCpr > 0 ? '#34D399' : '#F87171', marginTop: '2px', fontWeight: 600 }}>
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

                      {/* Status Konfigurasi Margin (Interactive Quick-Action CTA) */}
                      <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          {p.isConfigured ? (
                            <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '11px', padding: '4px 8px' }}>
                              ✅ Terkonfigurasi
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedProductForMargin(p)}
                              className="badge"
                              title="Klik untuk langsung mengatur HPP produk ini"
                              style={{ 
                                cursor: 'pointer',
                                backgroundColor: 'rgba(245, 158, 11, 0.12)', 
                                color: '#F59E0B', 
                                border: '1px solid rgba(245, 158, 11, 0.3)', 
                                fontSize: '11px', 
                                padding: '4px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <AlertCircle size={12} />
                              <span>+ Atur HPP</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Tombol Aksi (Center Aligned, Always Visible) */}
                      <td style={{ textAlign: 'center', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                          {p.isConfigured ? (
                            <button
                              onClick={() => setSelectedProductForMargin(p)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                              title="Perbarui margin & HPP"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedProductForMargin(p)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
                              title="Input HPP & kalkulator plafon iklan"
                            >
                              <Plus size={13} />
                              <span>Atur HPP</span>
                            </button>
                          )}

                          <a
                            href={`https://seller.shopee.co.id/portal/product/${p.itemId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon"
                            title="Buka produk di Shopee Seller Center"
                            style={{ color: 'var(--text-muted)', padding: '5px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>

                    {/* Accordion Detail: Daftar Varian Model SKU (Urutan Warna & Size M - 4XL/6XL) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} style={{ backgroundColor: 'rgba(0, 0, 0, 0.28)', padding: '16px 22px', borderBottom: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                  📦 Rincian {sortedModels.length} Varian Model SKU (Urutan Warna & Size M - 4XL):
                                </span>
                                <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '10px', padding: '1px 6px' }}>
                                  {p.name}
                                </span>
                              </div>
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
                                          {m.image ? (
                                            <img src={m.image} alt={m.name} style={{ width: '26px', height: '26px', borderRadius: '4px', objectFit: 'cover' }} />
                                          ) : (
                                            <div style={{ width: '26px', height: '26px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              <Tag size={12} style={{ color: 'var(--text-muted)' }} />
                                            </div>
                                          )}
                                          <strong style={{ color: 'var(--text-primary)' }}>{m.name}</strong>
                                        </div>
                                      </td>
                                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{m.sku}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'center' }} className="tabular-nums">
                                        <span style={{ color: m.availableStock > 0 ? 'var(--text-primary)' : 'var(--color-danger)' }}>
                                          {m.availableStock}
                                        </span>
                                      </td>
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
