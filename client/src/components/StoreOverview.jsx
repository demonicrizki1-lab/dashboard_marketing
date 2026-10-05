import React, { useState, useEffect, useMemo } from 'react';
import ShopeeDataCenterPicker from './ShopeeDataCenterPicker';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  CreditCard,
  Eye,
  MousePointer,
  Percent,
  Calendar,
  Store,
  RefreshCw,
  Download,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Award,
  Video,
  Radio,
  Search,
  Megaphone,
  CheckCircle2,
  UserCheck,
  Briefcase,
  History,
  Target,
  ArrowRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function StoreOverview({ showToast, storeInfo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedPeriodObj, setSelectedPeriodObj] = useState({
    id: '30 hari sebelumnya.',
    period: 'past30days',
    label: '30 hari sebelumnya.'
  });
  const [chartViewMode, setChartViewMode] = useState('monthly'); // 'monthly' | 'daily'
  const [orderType, setOrderType] = useState('paid'); // 'paid' | 'confirmed'

  // Fetch overview data from backend directly
  const fetchOverview = async (periodObj = selectedPeriodObj, forceLive = false, currentOrderType = orderType) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (periodObj?.period) params.set('period', periodObj.period);
      if (periodObj?.type) params.set('type', periodObj.type);
      if (periodObj?.startMonth) params.set('startMonth', periodObj.startMonth);
      if (periodObj?.endMonth) params.set('endMonth', periodObj.endMonth);
      if (periodObj?.startTime) params.set('startTime', String(periodObj.startTime));
      if (periodObj?.endTime) params.set('endTime', String(periodObj.endTime));
      params.set('orderType', currentOrderType);
      if (forceLive) params.set('fetchLive', 'true');

      const res = await fetch(`/api/overview?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        showToast && showToast('Gagal memuat data ringkasan toko.', 'error');
      }
    } catch (err) {
      console.error('Error fetching overview:', err);
      showToast && showToast('Terjadi kesalahan jaringan: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderTypeChange = (newType) => {
    setOrderType(newType);
    fetchOverview(selectedPeriodObj, false, newType);
  };

  useEffect(() => {
    fetchOverview(selectedPeriodObj);
  }, [selectedPeriodObj]);

  // Live Sync from Shopee Data Center
  const handleSyncLive = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/overview/sync', { method: 'POST' });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast && showToast('Sinkronisasi sukses! Data terbaru Shopee Data Center berhasil ditarik.', 'success');
        setData(result.overview);
      } else {
        showToast && showToast(result.error || 'Gagal sinkronisasi data Shopee.', 'error');
      }
    } catch (err) {
      showToast && showToast('Koneksi gagal: ' + err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (!data) return;
    const km = data.keyMetrics;
    const bm = data.picBenchmark;
    const rows = [
      ['RINGKASAN EKSEKUTIF TOKO MONTURE OUTDOOR'],
      ['Tanggal Pendaftaran Toko', data.storeProfile?.creationDate || '30 September 2024'],
      ['Mulai Aktif Penjualan', data.storeProfile?.firstSalesDate || '07 Juli 2025'],
      ['Total Omzet Sepanjang Masa (Lifetime)', data.lifetime?.revenueFormatted || 'Rp 0'],
      ['Total Pesanan Selesai (Lifetime)', (data.lifetime?.orders || 0) + ' Pesanan'],
      [],
      ['KOMPARASI KINERJA MARKETING: PIC LAMA VS PIC BARU'],
      ['Metrik', 'PIC Lama (Sep 2024 - Jul 2026)', 'PIC Baru (Agu 2026 - Saat ini)', 'Pertumbuhan (% Delta)'],
      ['Rata-Rata Omzet / Bulan', bm?.picLama?.avgMonthlyRevenueFormatted, bm?.picBaru?.avgMonthlyRevenueFormatted, (bm?.deltas?.avgMonthlyRevenueGrowth >= 0 ? '+' : '') + bm?.deltas?.avgMonthlyRevenueGrowth + '%'],
      ['Total Omzet Terkumpul', bm?.picLama?.totalRevenueFormatted, bm?.picBaru?.totalRevenueFormatted, '-'],
      ['Rata-Rata Pesanan / Bulan', bm?.picLama?.avgMonthlyOrders + ' Pesanan', bm?.picBaru?.avgMonthlyOrders + ' Pesanan', (bm?.deltas?.avgMonthlyOrdersGrowth >= 0 ? '+' : '') + bm?.deltas?.avgMonthlyOrdersGrowth + '%'],
      ['AOV (Nilai Belanja Rata-Rata)', bm?.picLama?.aovFormatted, bm?.picBaru?.aovFormatted, (bm?.deltas?.aovGrowth >= 0 ? '+' : '') + bm?.deltas?.aovGrowth + '%'],
      ['Rasio Omzet Iklan (Paid Ads)', bm?.picLama?.adsRatio + '%', bm?.picBaru?.adsRatio + '%', (bm?.deltas?.adsRatioDiff >= 0 ? '+' : '') + bm?.deltas?.adsRatioDiff + '%'],
      ['Rasio Omzet Organik', bm?.picLama?.organicRatio + '%', bm?.picBaru?.organicRatio + '%', '-'],
      [],
      ['7 METRIK PERFORMA PERIODE TERPILIH', 'NILAI', 'PERUBAHAN VS SEBELUMNYA'],
      ['Total Penjualan Kotor (Total Sales)', km?.totalSales?.formatted, (km?.totalSales?.pctDiff >= 0 ? '+' : '') + km?.totalSales?.pctDiff.toFixed(2) + '%'],
      ['Total Pesanan Berhasil (Confirmed Orders)', km?.confirmedOrders?.formatted, (km?.confirmedOrders?.pctDiff >= 0 ? '+' : '') + km?.confirmedOrders?.pctDiff.toFixed(2) + '%'],
      ['Total Pembeli (Unique Buyers)', km?.uniqueBuyers?.formatted, (km?.uniqueBuyers?.pctDiff >= 0 ? '+' : '') + km?.uniqueBuyers?.pctDiff.toFixed(2) + '%'],
      ['Rata-Rata Nilai Belanja (AOV)', km?.salesPerOrder?.formatted, (km?.salesPerOrder?.pctDiff >= 0 ? '+' : '') + km?.salesPerOrder?.pctDiff.toFixed(2) + '%'],
      ['Total Tayangan Produk (Impressions)', km?.impressions?.formatted, (km?.impressions?.pctDiff >= 0 ? '+' : '') + km?.impressions?.pctDiff.toFixed(2) + '%'],
      ['Total Klik Produk (Clicks)', km?.clicks?.formatted, (km?.clicks?.pctDiff >= 0 ? '+' : '') + km?.clicks?.pctDiff.toFixed(2) + '%'],
      ['Rasio Klik (CTR)', km?.ctr?.formatted, (km?.ctr?.pctDiff >= 0 ? '+' : '') + km?.ctr?.pctDiff.toFixed(2) + '%'],
      [],
      ['TOP 5 PRODUK TERLARIS', 'OMZET', 'PESANAN', 'UNIT', 'CTR', 'CR (%)']
    ];

    (data.topProducts || []).forEach(p => {
      rows.push([p.name, p.salesFormatted, p.orders, p.units, p.ctr, p.conversionRate]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(i => `"${String(i || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ringkasan_Toko_Monture_Outdoor_${selectedPeriodObj?.label || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast && showToast('Laporan CSV berhasil diunduh!', 'success');
  };

  // Helper render delta badge
  const renderDelta = (pctDiff, reverse = false) => {
    if (pctDiff === undefined || pctDiff === null) return null;
    const isPositive = pctDiff > 0;
    const isGood = reverse ? !isPositive : isPositive;
    const color = isGood ? 'var(--color-success, #10B981)' : 'var(--color-danger, #EF4444)';
    const bg = isGood ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '11px',
          fontWeight: 700,
          color,
          backgroundColor: bg,
          padding: '2px 6px',
          borderRadius: '6px',
          lineHeight: 1
        }}
        title="Perubahan dibanding periode sebelumnya"
      >
        <Icon size={12} strokeWidth={2.5} />
        {Math.abs(pctDiff).toFixed(1)}%
      </span>
    );
  };

  // 1. Chart Data: Tren Omzet Historis Toko atau Harian dengan Penanda Transisi PIC
  const lineChartData = useMemo(() => {
    // Mode Harian jika dipilih dan ada data harian
    if (chartViewMode === 'daily' && data?.dailyTrendPoints && data.dailyTrendPoints.length > 0) {
      const labels = data.dailyTrendPoints.map(p => p.date);
      const revenues = data.dailyTrendPoints.map(p => p.revenue);
      return {
        labels,
        datasets: [
          {
            label: 'Omzet Harian (Real Shopee)',
            data: revenues,
            borderColor: '#EE4D2D',
            backgroundColor: 'rgba(238, 77, 45, 0.12)',
            fill: true,
            tension: 0.25,
            borderWidth: 2.8,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#EE4D2D',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 1.5
          }
        ]
      };
    }

    if (!data?.historicalTrends) return null;
    const labels = data.historicalTrends.map(t => t.month);
    const revenues = data.historicalTrends.map(t => t.revenue);
    const adsRev = data.historicalTrends.map(t => t.adsRevenue);
    const orgRev = data.historicalTrends.map(t => t.organicRevenue);

    // Warna point berbeda antara PIC Lama (Biru) vs PIC Baru (Coral Shopee)
    const pointColors = data.historicalTrends.map(t => t.pic === 'BARU' ? '#EE4D2D' : '#3B82F6');

    return {
      labels,
      datasets: [
        {
          label: 'Total Omzet (GMV)',
          data: revenues,
          borderColor: '#EE4D2D',
          backgroundColor: 'rgba(238, 77, 45, 0.12)',
          fill: true,
          tension: 0.38,
          borderWidth: 2.8,
          pointRadius: 4.5,
          pointHoverRadius: 7,
          pointBackgroundColor: pointColors,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 1.5
        },
        {
          label: 'Omzet Iklan (Paid Ads)',
          data: adsRev,
          borderColor: '#F97316',
          backgroundColor: 'transparent',
          borderDash: [5, 4],
          tension: 0.38,
          borderWidth: 1.8,
          pointRadius: 2
        },
        {
          label: 'Omzet Organik & Konten',
          data: orgRev,
          borderColor: '#10B981',
          backgroundColor: 'transparent',
          borderDash: [3, 3],
          tension: 0.38,
          borderWidth: 1.8,
          pointRadius: 2
        }
      ]
    };
  }, [data, chartViewMode]);

  // 2. Chart Data: Donut Chart Sumber Omzet
  const doughnutChartData = useMemo(() => {
    if (!data?.channelBreakdown) return null;
    const cb = data.channelBreakdown;
    return {
      labels: ['Organik & Etalase', 'Iklan Shopee', 'Shopee Video', 'Affiliate', 'Live Stream'],
      datasets: [
        {
          data: [cb.product_card.sales, cb.paid_ads.sales, cb.video.sales, cb.affiliate.sales, cb.live.sales],
          backgroundColor: [cb.product_card.color, cb.paid_ads.color, cb.video.color, cb.affiliate.color, cb.live.color],
          borderColor: '#0B0F19',
          borderWidth: 2.5,
          hoverOffset: 6
        }
      ]
    };
  }, [data]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--color-brand-primary)' }} />
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Menghubungkan ke Shopee Data Center API...</span>
      </div>
    );
  }

  const km = data?.keyMetrics;
  const cb = data?.channelBreakdown;
  const lp = data?.lifetime;
  const profile = data?.storeProfile;
  const bm = data?.picBenchmark;
  const orderPerf = data?.orderPerformance;

  // 8th Metric: Tingkat Konversi Pesanan (CR)
  const conversionRateVal = km?.conversionRate?.value !== undefined 
    ? km.conversionRate.value 
    : (km?.clicks?.value > 0 ? (km.confirmedOrders?.value / km.clicks.value) * 100 : 0);
  const conversionRateFormatted = km?.conversionRate?.formatted || (conversionRateVal.toFixed(2) + '%');
  const conversionRatePctDiff = km?.conversionRate?.pctDiff !== undefined ? km.conversionRate.pctDiff : km?.confirmedOrders?.pctDiff;

  // Top 5 Products Summary
  const topProducts = data?.topProducts || [];
  const top5TotalSales = topProducts.reduce((sum, p) => sum + (p.sales || 0), 0);
  const top5TotalUnits = topProducts.reduce((sum, p) => sum + (p.units || 0), 0);

  return (
    <div className="store-overview-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header Filter Bar (Zona 1: Quick Presets + Shopee Data Center Picker + Utilitas Terpadu) */}
      <div
        className="glass-card"
        style={{
          padding: '12px 18px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.65) 100%)',
          boxShadow: '0 4px 20px -8px rgba(0,0,0,0.4)'
        }}
      >
        {/* Sisi Kiri: Shopee Data Center Picker + Quick Preset Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Shopee Data Center Dropdown Picker */}
          <ShopeeDataCenterPicker
            selectedPeriod={selectedPeriodObj}
            onChange={(newPeriod) => {
              setSelectedPeriodObj(newPeriod);
            }}
            orderType={orderType}
            onOrderTypeChange={handleOrderTypeChange}
            showLiveBadge={false}
          />

          {/* Pemisah Vertikal */}
          <div style={{ width: '1px', height: '22px', backgroundColor: 'rgba(255, 255, 255, 0.12)', margin: '0 2px' }} />

          {/* Quick Preset Shortcut Chips (Akses Cepat Harian/Mingguan/Bulanan) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'Real-time', period: 'real_time', label: 'Hari Ini' },
              { id: 'Kemarin', period: 'yesterday', label: 'Kemarin' },
              { id: '7 hari sebelumnya.', period: 'past7days', label: '7 Hari' },
              { id: '30 hari sebelumnya.', period: 'past30days', label: '30 Hari' }
            ].map(preset => {
              const isActive = selectedPeriodObj?.id === preset.id || selectedPeriodObj?.period === preset.period || selectedPeriodObj?.label === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    const nowSec = Math.floor(Date.now() / 1000);
                    let sTime = null;
                    let eTime = null;
                    if (preset.id === 'Kemarin') {
                      const today0 = Math.floor(new Date().setHours(0,0,0,0) / 1000);
                      sTime = today0 - 86400;
                      eTime = today0 - 1;
                    } else if (preset.id === 'Real-time') {
                      sTime = Math.floor(new Date().setHours(0,0,0,0) / 1000);
                      eTime = nowSec;
                    } else if (preset.id === '7 hari sebelumnya.') {
                      sTime = nowSec - 7 * 86400;
                      eTime = nowSec;
                    } else if (preset.id === '30 hari sebelumnya.') {
                      sTime = nowSec - 30 * 86400;
                      eTime = nowSec;
                    }

                    const newPeriod = {
                      id: preset.id,
                      period: preset.period,
                      startTime: sTime,
                      endTime: eTime,
                      label: preset.id
                    };
                    setSelectedPeriodObj(newPeriod);
                  }}
                  className={`badge ${isActive ? 'active' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: '5px 11px',
                    fontSize: '11.5px',
                    fontWeight: isActive ? 700 : 500,
                    backgroundColor: isActive ? 'rgba(238, 77, 45, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? 'var(--color-brand-primary)' : 'var(--text-secondary)',
                    border: isActive ? '1px solid var(--color-brand-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Pindah cepat ke periode ${preset.label}`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sisi Kanan: Aksi Segarkan & Export CSV */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchOverview(selectedPeriodObj, true, orderType)}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            title="Muat ulang data live terkini dari Shopee"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            title="Unduh rekapitulasi performa ke CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Store Milestone & Lifetime Profile Strip (Zona 2) */}
      <div
        className="glass-card"
        style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(238, 77, 45, 0.05) 0%, rgba(15, 23, 42, 0.7) 100%)',
          border: '1px solid rgba(238, 77, 45, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Left: Store identity & milestones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--color-brand-primary) 0%, #D83B1B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 10px rgba(238, 77, 45, 0.25)',
              flexShrink: 0
            }}
          >
            <Store size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                {profile?.storeName || 'Monture outdoor'}
              </h2>
              <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '10.5px', padding: '1px 7px', borderRadius: '5px' }}>
                🟢 {profile?.status || 'Aktif'}
              </span>
              <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '10.5px', padding: '1px 7px', borderRadius: '5px' }}>
                ID: {profile?.shopId || '1575219792'}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>Daftar Toko: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{profile?.creationDate || '30 September 2024'}</strong></span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span>Mulai Penjualan: <strong style={{ color: '#10B981', fontWeight: 600 }}>{profile?.firstSalesDate || '07 Juli 2025'}</strong></span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span>Fase Aktif: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{profile?.activeMonths || 16} Bulan</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Lifetime Metric Cards */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                Total Omzet Lifetime
              </span>
              <span style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--color-brand-primary)', fontFamily: 'var(--font-mono)' }}>
                {lp?.revenueFormatted || 'Rp 0'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                Total Pesanan Selesai
              </span>
              <span style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {(lp?.orders || 0).toLocaleString('id-ID')} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>order</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 8 Metrik Kunci Utama (Zona 3: Symmetric 4x2 Grid) */}
      <section aria-label="8 Metrik Kunci Performa Toko">
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              8 Metrik Kunci Performa Toko ({data?.customLabel || selectedPeriodObj?.label || '30 Hari Terakhir'})
            </h3>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Sinkron langsung dari Shopee Data Center</span>
        </div>

        <div className="overview-kpi-grid">
          {/* Card 1: Total Penjualan Kotor */}
          <div className="glass-card" style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Total Penjualan Kotor</span>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(238, 77, 45, 0.12)', color: 'var(--color-brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={15} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {km?.totalSales?.formatted || 'Rp 0'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>vs periode lalu:</span>
              {renderDelta(km?.totalSales?.pctDiff)}
            </div>
          </div>

          {/* Card 2: Total Pesanan Berhasil */}
          <div className="glass-card" style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Pesanan Berhasil</span>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={15} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {km?.confirmedOrders?.formatted || '0 Pesanan'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>vs periode lalu:</span>
              {renderDelta(km?.confirmedOrders?.pctDiff)}
            </div>
          </div>

          {/* Card 3: Total Pembeli Unik */}
          <div className="glass-card" style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Pembeli Unik</span>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={15} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {km?.uniqueBuyers?.formatted || '0 Pembeli'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>vs periode lalu:</span>
              {renderDelta(km?.uniqueBuyers?.pctDiff)}
            </div>
          </div>

          {/* Card 4: Nilai Belanja / Order (AOV) */}
          <div className="glass-card" style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Nilai Belanja / Order (AOV)</span>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={15} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {km?.salesPerOrder?.formatted || 'Rp 0'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>vs periode lalu:</span>
              {renderDelta(km?.salesPerOrder?.pctDiff)}
            </div>
          </div>

          {/* Card 5: Total Tayangan Produk */}
          <div className="glass-card" style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Tayangan Produk</span>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={15} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {km?.impressions?.formatted || '0'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>vs periode lalu:</span>
              {renderDelta(km?.impressions?.pctDiff)}
            </div>
          </div>

          {/* Card 6: Total Klik Produk */}
          <div className="glass-card" style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Klik Produk</span>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MousePointer size={15} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {km?.clicks?.formatted || '0'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>vs periode lalu:</span>
              {renderDelta(km?.clicks?.pctDiff)}
            </div>
          </div>

          {/* Card 7: Rasio Klik (CTR) */}
          <div className="glass-card" style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Rasio Klik (CTR)</span>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(236, 72, 153, 0.12)', color: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Percent size={15} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {km?.ctr?.formatted || '0%'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>vs periode lalu:</span>
              {renderDelta(km?.ctr?.pctDiff)}
            </div>
          </div>

          {/* Card 8: Tingkat Konversi Pesanan (CR) */}
          <div className="glass-card" style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Konversi Pesanan (CR)</span>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={15} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {conversionRateFormatted}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>vs periode lalu:</span>
              {renderDelta(conversionRatePctDiff)}
            </div>
          </div>
        </div>
      </section>

      {/* 4 & 5. Visualisasi Grafik: Tren Pertumbuhan Omzet + Donut Sumber Omzet */}
      <div className="overview-charts-grid">
        
        {/* Grafik Garis Tren Omzet Bulanan */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '18px 20px', 
            borderRadius: '14px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            gap: '14px',
            minHeight: '380px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', minHeight: '34px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <TrendingUp size={16} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} />
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {chartViewMode === 'daily' && data?.dailyTrendPoints?.length > 0
                  ? `Grafik Tren Harian (${data.customLabel || 'Bulan Terpilih'})`
                  : 'Grafik Tren Omzet Toko (Sejak Berdiri)'}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {data?.dailyTrendPoints && data.dailyTrendPoints.length > 0 && (
                <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => setChartViewMode('monthly')}
                    style={{
                      background: chartViewMode === 'monthly' ? 'var(--color-brand-primary)' : 'transparent',
                      color: chartViewMode === 'monthly' ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '3px 8px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Bulanan
                  </button>
                  <button
                    onClick={() => setChartViewMode('daily')}
                    style={{
                      background: chartViewMode === 'daily' ? 'var(--color-brand-primary)' : 'transparent',
                      color: chartViewMode === 'daily' ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '3px 8px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Harian
                  </button>
                </div>
              )}
              {chartViewMode === 'monthly' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3B82F6', flexShrink: 0 }}></span>
                    PIC Lama
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-brand-primary)', flexShrink: 0 }}></span>
                    PIC Baru
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ height: '290px', position: 'relative' }}>
            {lineChartData && (
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        color: '#94A3B8',
                        font: { size: 11, family: 'Inter', weight: 500 },
                        boxWidth: 10,
                        boxHeight: 10,
                        padding: 12
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      titleColor: '#F8FAFC',
                      bodyColor: '#CBD5E1',
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                      borderWidth: 1,
                      padding: 10,
                      boxPadding: 4,
                      usePointStyle: true,
                      callbacks: {
                        title: (tooltipItems) => {
                          if (!tooltipItems.length) return '';
                          const label = tooltipItems[0].label;
                          if (chartViewMode === 'monthly' && data?.historicalTrends) {
                            const item = data.historicalTrends[tooltipItems[0].dataIndex];
                            const picBadge = item?.pic === 'BARU' ? '🔴 Era PIC Baru' : '🔵 Era PIC Lama';
                            return `${label} • ${picBadge}`;
                          }
                          return label;
                        },
                        label: (ctx) => ` ${ctx.dataset.label}: Rp ${Number(ctx.raw || 0).toLocaleString('id-ID')}`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(255,255,255,0.04)' },
                      ticks: { color: '#64748B', font: { size: 10 } }
                    },
                    y: {
                      grid: { color: 'rgba(255,255,255,0.04)' },
                      ticks: {
                        color: '#64748B',
                        font: { size: 10 },
                        callback: (v) => `Rp ${(v / 1000000).toFixed(1)}M`
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Ringkasan Sumber Omzet (Donut Chart) */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '18px 20px', 
            borderRadius: '14px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            gap: '14px',
            minHeight: '380px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', minHeight: '34px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} style={{ color: '#8B5CF6', flexShrink: 0 }} />
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, whiteSpace: 'nowrap' }}>
                Ringkasan Sumber Omzet
              </h3>
            </div>
            <span className="badge" style={{ fontSize: '10.5px', background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA', padding: '2px 8px', borderRadius: '5px' }}>
              Kontribusi Channel
            </span>
          </div>

          <div style={{ height: '290px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px' }}>
            <div style={{ width: '180px', height: '180px', position: 'relative', flexShrink: 0 }}>
              {doughnutChartData && (
                <Doughnut
                  data={doughnutChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#F8FAFC',
                        bodyColor: '#CBD5E1',
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        borderWidth: 1,
                        padding: 10,
                        boxPadding: 4,
                        callbacks: {
                          label: (ctx) => {
                            const totalVal = Number(km?.totalSales?.value || 1);
                            const currentVal = Number(ctx.raw || 0);
                            const pct = totalVal > 0 ? ((currentVal / totalVal) * 100).toFixed(1) : '0';
                            return ` ${ctx.label}: Rp ${currentVal.toLocaleString('id-ID')} (${pct}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Total Omzet</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  Rp {(Number(km?.totalSales?.value || 0) / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>

            {/* Channel Legend Strip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '160px' }}>
              {[
                { label: 'Organik & Pencarian', color: cb?.product_card.color, val: cb?.product_card.sales, ratio: cb?.product_card.ratio },
                { label: 'Iklan Shopee Ads', color: cb?.paid_ads.color, val: cb?.paid_ads.sales, ratio: cb?.paid_ads.ratio },
                { label: 'Shopee Video', color: cb?.video.color, val: cb?.video.sales, ratio: cb?.video.ratio },
                { label: 'Shopee Affiliate', color: cb?.affiliate.color, val: cb?.affiliate.sales, ratio: cb?.affiliate.ratio },
                { label: 'Live Streaming', color: cb?.live.color, val: cb?.live.sales, ratio: cb?.live.ratio }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    fontSize: '11.5px',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: item.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                      Rp {((item.val || 0) / 1000000).toFixed(2)}M
                    </strong>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', width: '38px', textAlign: 'right' }}>
                      ({(item.ratio || 0).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Top 5 Produk Terlaris Toko & Status Operasional Pesanan */}
      <section aria-label="Top 5 Produk Terlaris Toko dan Status Operasional">
        <div className="glass-card" style={{ padding: '20px 22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Header Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                  Top 5 Produk Terlaris Toko ({data?.customLabel || selectedPeriodObj?.label || '30 Hari Terakhir'})
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Peringkat produk terlaris berdasarkan penjualan terkonfirmasi Shopee Product Rankings API
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ backgroundColor: 'rgba(238, 77, 45, 0.12)', color: 'var(--color-brand-primary)', fontSize: '11px', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>
                Total Omzet Top 5: Rp {((top5TotalSales || 0) / 1000000).toFixed(2)}M
              </span>
              <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA', fontSize: '11px', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>
                {top5TotalUnits} Unit Terjual
              </span>
            </div>
          </div>

          {/* Operational Health Strip (Pembatalan, Retur, NFR) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {/* 1. Pesanan Dibatalkan */}
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Pesanan Dibatalkan</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  {orderPerf?.cancelledOrders || 0} <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 400 }}>pesanan</span> ({orderPerf?.cancelledSalesFormatted || 'Rp 0'})
                </div>
              </div>
              <span className="badge" style={{ backgroundColor: (orderPerf?.cancelledOrders || 0) === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: (orderPerf?.cancelledOrders || 0) === 0 ? '#10B981' : '#EF4444', fontSize: '10.5px', padding: '2px 7px' }}>
                {(orderPerf?.cancelledOrders || 0) === 0 ? '🟢 0% Batal' : 'Ada Pembatalan'}
              </span>
            </div>

            {/* 2. Pengembalian Barang & Dana */}
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Pengembalian / Retur</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  {orderPerf?.returnRefundOrders || 0} <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 400 }}>pesanan</span> (Rp {Number(orderPerf?.returnRefundSales || 0).toLocaleString('id-ID')})
                </div>
              </div>
              <span className="badge" style={{ backgroundColor: (orderPerf?.returnRefundOrders || 0) === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: (orderPerf?.returnRefundOrders || 0) === 0 ? '#10B981' : '#EF4444', fontSize: '10.5px', padding: '2px 7px' }}>
                {(orderPerf?.returnRefundOrders || 0) === 0 ? '🟢 0% Retur' : 'Ada Retur'}
              </span>
            </div>

            {/* 3. Non-Fulfilment Rate */}
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Tingkat Pesanan Tidak Selesai (NFR)</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#10B981', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  0.00% <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 400 }}>Target Shopee &lt; 3%</span>
                </div>
              </div>
              <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontSize: '10.5px', padding: '2px 7px' }}>
                ✓ Standar Star Seller
              </span>
            </div>
          </div>

          {/* Table Container */}
          {topProducts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 16px', background: 'rgba(255, 255, 255, 0.015)', borderRadius: '12px', border: '1px dashed rgba(255, 255, 255, 0.08)', gap: '10px' }}>
              <ShoppingBag size={28} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Tidak ada data peringkat produk untuk periode ini
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Pilih rentang bulan aktif atau 30 hari terakhir untuk melihat ranking produk riil.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '11px 14px', width: '52px', textAlign: 'center', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.04em' }}>Rank</th>
                    <th style={{ padding: '11px 14px', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.04em' }}>Produk</th>
                    <th style={{ padding: '11px 14px', textAlign: 'right', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.04em' }}>Penjualan Kotor</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.04em' }}>Pesanan</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.04em' }}>Unit</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.04em' }}>Add to Cart</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.04em' }}>CTR</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.04em' }}>Konversi (CR)</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((prod) => (
                    <tr 
                      key={prod.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.04)', 
                        transition: 'background 0.15s ease' 
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            width: '26px',
                            height: '26px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '7px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            backgroundColor: 
                              prod.rank === 1 ? 'rgba(245, 158, 11, 0.18)' : 
                              prod.rank === 2 ? 'rgba(148, 163, 184, 0.18)' : 
                              prod.rank === 3 ? 'rgba(217, 119, 6, 0.18)' : 'rgba(255,255,255,0.05)',
                            color: 
                              prod.rank === 1 ? '#F59E0B' : 
                              prod.rank === 2 ? '#CBD5E1' : 
                              prod.rank === 3 ? '#F97316' : 'var(--text-muted)',
                            border: 
                              prod.rank === 1 ? '1px solid rgba(245, 158, 11, 0.35)' :
                              prod.rank === 2 ? '1px solid rgba(148, 163, 184, 0.35)' :
                              prod.rank === 3 ? '1px solid rgba(217, 119, 6, 0.35)' : '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          {prod.rank}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <ShoppingBag size={18} style={{ color: 'var(--text-muted)' }} />
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '420px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {prod.name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                ID: {prod.id}
                              </span>
                              <a
                                href={`https://shopee.co.id/product/${profile?.shopId || '1575219792'}/${prod.id}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '10.5px', color: '#60A5FA', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                              >
                                Lihat Produk <ArrowUpRight size={10} />
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--color-brand-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                        {prod.salesFormatted}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {prod.orders}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {prod.units}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>
                        {prod.addToCart}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                        {prod.ctr}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', padding: '2px 8px', fontSize: '11px', borderRadius: '5px' }}>
                          {prod.conversionRate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
