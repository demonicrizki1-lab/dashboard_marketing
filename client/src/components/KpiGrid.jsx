import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Target, 
  Eye, 
  MousePointerClick, 
  ShoppingBag, 
  Zap,
  ArrowUpRight,
  ArrowDownRight
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

const formatCompact = (val) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
  return (val || 0).toString();
};

export default function KpiGrid({ totals }) {
  const cost = totals?.cost || 0;
  const gmv = totals?.broad_gmv || totals?.gmv || 0;
  const roas = totals?.roas || (cost > 0 ? (gmv / cost) : 0);
  const orders = totals?.broad_order || totals?.order || 0;
  const impressions = totals?.impression || 0;
  const clicks = totals?.click || 0;
  const cpc = totals?.cpc || (clicks > 0 ? cost / clicks : 0);
  const ctr = totals?.ctr || (impressions > 0 ? (clicks / impressions) * 100 : 0);
  const carts = totals?.broad_cart || totals?.cart || 0;
  const conversionRate = clicks > 0 ? ((orders / clicks) * 100).toFixed(2) : '0.00';

  // ROAS indicator badge
  let roasBadge = { label: 'Evaluasi', class: 'boncos', text: '< 1.0x Boncos' };
  if (roas >= 2.0) {
    roasBadge = { label: 'Sangat Sehat', class: 'winning', text: 'ROAS Prima' };
  } else if (roas >= 1.0) {
    roasBadge = { label: 'Moderat', class: 'profit', text: 'Balik Modal' };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 4 Primary KPI Scorecards */}
      <div className="kpi-grid">
        {/* 1. Biaya Iklan */}
        <div className="kpi-card" id="kpi-card-cost">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Biaya Iklan</span>
            <div className="kpi-icon" style={{ backgroundColor: 'rgba(238, 77, 45, 0.12)', color: 'var(--color-brand-primary)' }}>
              <DollarSign size={18} strokeWidth={2.4} />
            </div>
          </div>
          <div className="kpi-value tabular-nums">
            {formatRupiah(cost)}
          </div>
          <div className="kpi-subtext">
            <span>Total saldo ad spend yang telah digunakan</span>
          </div>
        </div>

        {/* 2. Omzet Iklan (GMV) */}
        <div className="kpi-card" id="kpi-card-gmv">
          <div className="kpi-card-header">
            <span className="kpi-title">Omzet Iklan (GMV)</span>
            <div className="kpi-icon success">
              <TrendingUp size={18} strokeWidth={2.4} />
            </div>
          </div>
          <div className="kpi-value tabular-nums" style={{ color: 'var(--color-success)' }}>
            {formatRupiah(gmv)}
          </div>
          <div className="kpi-subtext">
            <span className="kpi-chip success tabular-nums">
              Gross Revenue
            </span>
            <span>Penjualan langsung & terkait</span>
          </div>
        </div>

        {/* 3. ROAS */}
        <div className="kpi-card" id="kpi-card-roas">
          <div className="kpi-card-header">
            <span className="kpi-title">ROAS (Return On Ad Spend)</span>
            <div className="kpi-icon info">
              <Target size={18} strokeWidth={2.4} />
            </div>
          </div>
          <div className="kpi-value tabular-nums" style={{ color: roas >= 2.0 ? 'var(--color-success)' : roas >= 1.0 ? 'var(--color-info)' : 'var(--color-danger)' }}>
            {roas.toFixed(2)}x
          </div>
          <div className="kpi-subtext">
            <span className={`badge-eval badge-${roasBadge.class}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
              {roasBadge.text}
            </span>
            <span>Rasio pendapatan : biaya</span>
          </div>
        </div>

        {/* 4. Total Pesanan */}
        <div className="kpi-card" id="kpi-card-orders">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Pesanan Iklan</span>
            <div className="kpi-icon warning">
              <ShoppingCart size={18} strokeWidth={2.4} />
            </div>
          </div>
          <div className="kpi-value tabular-nums">
            {formatNumber(orders)} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>order</span>
          </div>
          <div className="kpi-subtext">
            <span className="kpi-chip" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--color-warning)' }}>
              CR {conversionRate}%
            </span>
            <span>Tingkat konversi per klik</span>
          </div>
        </div>
      </div>

      {/* 4 Secondary Quick Metric Strips */}
      <div className="secondary-kpi-strip">
        {/* CPC */}
        <div className="mini-kpi">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={15} style={{ color: 'var(--color-brand-primary)' }} />
            <span className="mini-kpi-label">CPC Rata-rata</span>
          </div>
          <span className="mini-kpi-val tabular-nums">{formatRupiah(cpc)}</span>
        </div>

        {/* Total Tayangan */}
        <div className="mini-kpi">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={15} style={{ color: 'var(--color-info)' }} />
            <span className="mini-kpi-label">Total Tayangan (Views)</span>
          </div>
          <span className="mini-kpi-val tabular-nums">{formatCompact(impressions)} ({formatNumber(impressions)})</span>
        </div>

        {/* Total Klik & CTR */}
        <div className="mini-kpi">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MousePointerClick size={15} style={{ color: 'var(--color-success)' }} />
            <span className="mini-kpi-label">Klik & CTR</span>
          </div>
          <span className="mini-kpi-val tabular-nums">
            {formatNumber(clicks)} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>({ctr.toFixed(2)}%)</span>
          </span>
        </div>

        {/* Keranjang */}
        <div className="mini-kpi">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={15} style={{ color: 'var(--color-purple)' }} />
            <span className="mini-kpi-label">Masuk Keranjang</span>
          </div>
          <span className="mini-kpi-val tabular-nums">{formatNumber(carts)} item</span>
        </div>
      </div>
    </div>
  );
}
