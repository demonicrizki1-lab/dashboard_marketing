import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Percent,
  Calendar,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Award,
  Layers,
  FileText,
  Target,
  Clock,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MarketingPerformanceEvaluation({ showToast, storeInfo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [activeChartMetric, setActiveChartMetric] = useState('all'); // 'all' | 'gmv' | 'ads' | 'organic'

  // Fetch overview data (contains picBenchmark and historicalTrends)
  const fetchEvaluationData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/overview?period=past30days');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        showToast && showToast('Gagal memuat data evaluasi kinerja.', 'error');
      }
    } catch (err) {
      console.error('Error fetching evaluation data:', err);
      showToast && showToast('Terjadi kesalahan jaringan: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluationData();
  }, []);

  const bm = data?.picBenchmark;
  const trends = data?.historicalTrends || [];
  const profile = data?.storeProfile;

  // Export CSV khusus Laporan Evaluasi Kinerja
  const handleExportCSV = () => {
    if (!trends || trends.length === 0) return;

    const rows = [
      ['LAPORAN EVALUASI KINERJA MARKETING: PIC LAMA VS PIC BARU'],
      ['Toko: Monture Outdoor (ID: 1575219792)'],
      ['Tanggal Ekspor:', new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
      [],
      ['RINGKASAN BENCHMARK HEAD-TO-HEAD'],
      ['Metrik', 'Era PIC Lama (Sep 2024 - Jul 2026)', 'Era PIC Baru (Agu 2026 - Saat ini)', 'Pertumbuhan (%)'],
      ['Rata-Rata Omzet / Bulan', bm?.picLama?.avgMonthlyRevenueFormatted, bm?.picBaru?.avgMonthlyRevenueFormatted, `+${bm?.deltas?.avgMonthlyRevenueGrowth}%`],
      ['Rata-Rata Pesanan / Bulan', `${bm?.picLama?.avgMonthlyOrders} pesanan`, `${bm?.picBaru?.avgMonthlyOrders} pesanan`, `+${bm?.deltas?.avgMonthlyOrdersGrowth}%`],
      ['Nilai Belanja Rata-Rata (AOV)', bm?.picLama?.aovFormatted, bm?.picBaru?.aovFormatted, `+${bm?.deltas?.aovGrowth}%`],
      ['Rasio Iklan vs Organik', `${bm?.picLama?.adsRatio}% / ${bm?.picLama?.organicRatio}%`, `${bm?.picBaru?.adsRatio}% / ${bm?.picBaru?.organicRatio}%`, `${bm?.deltas?.adsRatioDiff}%`],
      ['Total Akumulasi Omzet', bm?.picLama?.totalRevenueFormatted, bm?.picBaru?.totalRevenueFormatted, '-'],
      ['Total Akumulasi Pesanan', `${bm?.picLama?.totalOrders} pesanan`, `${bm?.picBaru?.totalOrders} pesanan`, '-'],
      [],
      ['RINCIAN RIWAYAT BULANAN TOKO (JULI 2025 - SAAT INI)'],
      ['Bulan', 'Era PIC', 'Total Omzet (Rp)', 'Total Pesanan', 'Omzet Iklan (Rp)', 'Omzet Organik (Rp)', 'Rasio Iklan (%)', 'Catatan Milestone']
    ];

    trends.forEach(t => {
      const adsRatio = t.revenue > 0 ? ((t.adsRevenue / t.revenue) * 100).toFixed(1) : '0';
      rows.push([
        t.month,
        t.pic === 'BARU' ? 'PIC Baru' : 'PIC Lama',
        t.revenue,
        t.orders,
        t.adsRevenue,
        t.organicRevenue,
        `${adsRatio}%`,
        t.note || '-'
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(i => `"${String(i || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Kinerja_PIC_Marketing_Monture_Outdoor_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast && showToast('Laporan Evaluasi CSV berhasil diunduh!', 'success');
  };

  // Cetak Dokumen / Print PDF
  const handlePrint = () => {
    window.print();
  };

  // Data Grafik Garis Komparatif Tren Omzet
  const lineChartData = useMemo(() => {
    if (!trends || trends.length === 0) return null;

    const labels = trends.map(t => t.month);
    const pointColors = trends.map(t => t.pic === 'BARU' ? '#EE4D2D' : '#3B82F6');

    const datasets = [];

    if (activeChartMetric === 'all' || activeChartMetric === 'gmv') {
      datasets.push({
        label: 'Total Omzet (GMV)',
        data: trends.map(t => t.revenue),
        borderColor: '#EE4D2D',
        backgroundColor: 'rgba(238, 77, 45, 0.12)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.8,
        pointRadius: 4.5,
        pointHoverRadius: 7,
        pointBackgroundColor: pointColors,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5
      });
    }

    if (activeChartMetric === 'all' || activeChartMetric === 'ads') {
      datasets.push({
        label: 'Omzet Iklan (Paid Ads)',
        data: trends.map(t => t.adsRevenue),
        borderColor: '#F97316',
        backgroundColor: 'transparent',
        borderDash: [5, 4],
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#F97316'
      });
    }

    if (activeChartMetric === 'all' || activeChartMetric === 'organic') {
      datasets.push({
        label: 'Omzet Organik & Konten',
        data: trends.map(t => t.organicRevenue),
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        borderDash: [3, 3],
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#10B981'
      });
    }

    return { labels, datasets };
  }, [trends, activeChartMetric]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--color-brand-primary)' }} />
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Memuat Laporan Evaluasi Kinerja PIC & Tim...</span>
      </div>
    );
  }

  return (
    <div className="evaluation-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Executive Header Bar */}
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 16px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Briefcase size={24} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                Laporan Kinerja PIC & Tim Marketing
              </h2>
              <span className="badge" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: '11px', padding: '2px 8px' }}>
                Executive Benchmark
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Analisis komparatif efisiensi dan pertumbuhan strategi: <strong>PIC Lama (Sep 2024 – Jul 2026)</strong> vs <strong>PIC Baru (Agu 2026 – Saat ini)</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons: Refresh, Print PDF, Export CSV */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchEvaluationData}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 14px', borderRadius: '8px' }}
            title="Muat ulang data evaluasi terkini"
          >
            <RefreshCw size={14} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 14px', borderRadius: '8px' }}
            title="Cetak atau simpan ke PDF"
          >
            <Printer size={14} />
            <span>Cetak / PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 14px', borderRadius: '8px' }}
            title="Unduh rekapitulasi evaluasi kinerja ke CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Scorecards: 4 Delta Pertumbuhan Utama */}
      <section aria-label="Ringkasan Pertumbuhan Utama">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '14px'
          }}
        >
          {/* Card 1: Omzet/Bulan Growth */}
          <div className="glass-card" style={{ padding: '18px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Pertumbuhan Omzet / Bulan</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
              +{bm?.deltas?.avgMonthlyRevenueGrowth}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Dari {bm?.picLama?.avgMonthlyRevenueFormatted} &rarr; <strong>{bm?.picBaru?.avgMonthlyRevenueFormatted}</strong>
            </div>
          </div>

          {/* Card 2: Orders/Bulan Growth */}
          <div className="glass-card" style={{ padding: '18px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Pertumbuhan Pesanan / Bulan</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={16} />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
              +{bm?.deltas?.avgMonthlyOrdersGrowth}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Dari {bm?.picLama?.avgMonthlyOrders} order &rarr; <strong>{bm?.picBaru?.avgMonthlyOrders} order/bln</strong>
            </div>
          </div>

          {/* Card 3: AOV Growth */}
          <div className="glass-card" style={{ padding: '18px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Peningkatan Nilai Belanja (AOV)</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={16} />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>
              +{bm?.deltas?.aovGrowth}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Dari {bm?.picLama?.aovFormatted} &rarr; <strong>{bm?.picBaru?.aovFormatted}</strong>
            </div>
          </div>

          {/* Card 4: Ketergantungan Iklan */}
          <div className="glass-card" style={{ padding: '18px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Ketergantungan Belanja Iklan</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Percent size={16} />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>
              +{bm?.deltas?.adsRatioDiff}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Rasio era lama: {bm?.picLama?.adsRatio}% &rarr; era baru: <strong>{bm?.picBaru?.adsRatio}%</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Kartu Head-to-Head Komparasi (PIC Lama vs PIC Baru) */}
      <section aria-label="Head to Head Komparasi Era PIC">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          
          {/* KARTU ERA PIC LAMA */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(59, 130, 246, 0.04)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(59, 130, 246, 0.15)', paddingBottom: '12px' }}>
              <div>
                <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', fontSize: '11px', padding: '3px 8px', marginBottom: '6px', display: 'inline-block' }}>
                  👤 ERA PIC LAMA ({bm?.picLama?.activeMonths} Bulan Aktif Penjualan)
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {bm?.picLama?.periodLabel}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status Transisi</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8' }}>Tutup Buku Juli 2026</div>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: '#94A3B8', backgroundColor: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              💡 <strong>Karakteristik Strategi:</strong> Toko mengandalkan penjualan murni organik tanpa alokasi biaya iklan berbayar.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rata-Rata Omzet / Bulan:</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {bm?.picLama?.avgMonthlyRevenueFormatted}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rata-Rata Order / Bulan:</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {bm?.picLama?.avgMonthlyOrders} <small style={{ fontSize: '12px', fontWeight: 500 }}>pesanan</small>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Nilai Belanja Rata-Rata (AOV):</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#CBD5E1', fontFamily: 'var(--font-mono)' }}>
                  {bm?.picLama?.aovFormatted}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rasio Iklan vs Organik:</span>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>
                  <span style={{ color: '#F97316' }}>{bm?.picLama?.adsRatio}%</span> / <span style={{ color: '#10B981' }}>{bm?.picLama?.organicRatio}%</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              Total Akumulasi Omzet Era Ini: <strong style={{ color: '#60A5FA' }}>{bm?.picLama?.totalRevenueFormatted}</strong> ({bm?.picLama?.totalOrders} Pesanan Terkonfirmasi)
            </div>
          </div>

          {/* KARTU ERA PIC BARU */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(238, 77, 45, 0.04)',
              border: '1.5px solid rgba(238, 77, 45, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(238, 77, 45, 0.2)', paddingBottom: '12px' }}>
              <div>
                <span className="badge" style={{ backgroundColor: 'rgba(238, 77, 45, 0.15)', color: 'var(--color-brand-primary)', fontSize: '11px', padding: '3px 8px', marginBottom: '6px', display: 'inline-block' }}>
                  ⚡ ERA PIC BARU ({bm?.picBaru?.activeMonths} Bulan Berjalan)
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {bm?.picBaru?.periodLabel}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status Evaluasi</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>Aktif & Berjalan 🚀</div>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              🚀 <strong>Status Kinerja:</strong> Omzet meningkat <strong>+{bm?.deltas?.avgMonthlyRevenueGrowth}%</strong> didorong akselerasi Shopee Ads terarah.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rata-Rata Omzet / Bulan:</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-brand-primary)', fontFamily: 'var(--font-mono)' }}>
                  {bm?.picBaru?.avgMonthlyRevenueFormatted}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rata-Rata Order / Bulan:</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {bm?.picBaru?.avgMonthlyOrders} <small style={{ fontSize: '12px', fontWeight: 500 }}>pesanan</small>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Nilai Belanja Rata-Rata (AOV):</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                  {bm?.picBaru?.aovFormatted} <small style={{ fontSize: '10px' }}>(+{bm?.deltas?.aovGrowth}%)</small>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rasio Iklan vs Organik:</span>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>
                  <span style={{ color: '#F97316' }}>{bm?.picBaru?.adsRatio}%</span> / <span style={{ color: '#10B981' }}>{bm?.picBaru?.organicRatio}%</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              Total Akumulasi Omzet Era Ini: <strong style={{ color: 'var(--color-brand-primary)' }}>{bm?.picBaru?.totalRevenueFormatted}</strong> ({bm?.picBaru?.totalOrders} Pesanan Terkonfirmasi)
            </div>
          </div>

        </div>
      </section>

      {/* 4. Visualisasi Grafik Komparatif Garis Tren */}
      <section aria-label="Grafik Tren Transisi PIC">
        <div className="glass-card" style={{ padding: '22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--color-brand-primary)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                Grafik Tren Pertumbuhan Omzet Sepanjang Masa (Penanda Transisi PIC)
              </h3>
            </div>

            {/* Filter Toggle Kurva */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  { id: 'all', label: 'Semua Kurva' },
                  { id: 'gmv', label: 'Omzet GMV' },
                  { id: 'ads', label: 'Iklan Shopee' },
                  { id: 'organic', label: 'Organik' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChartMetric(tab.id)}
                    style={{
                      background: activeChartMetric === tab.id ? 'var(--color-brand-primary)' : 'transparent',
                      color: activeChartMetric === tab.id ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="badge" style={{ fontSize: '10.5px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>
                🔵 Titik Biru: PIC Lama
              </span>
              <span className="badge" style={{ fontSize: '10.5px', background: 'rgba(238, 77, 45, 0.15)', color: 'var(--color-brand-primary)' }}>
                🔴 Titik Merah: PIC Baru
              </span>
            </div>
          </div>

          <div style={{ height: '300px', position: 'relative' }}>
            {lineChartData && (
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: { color: '#94A3B8', font: { size: 11, family: 'Inter' }, boxWidth: 12, padding: 14 }
                    },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: Rp ${Number(ctx.raw || 0).toLocaleString('id-ID')}`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(255,255,255,0.04)' },
                      ticks: { color: '#64748B', font: { size: 10.5 } }
                    },
                    y: {
                      grid: { color: 'rgba(255,255,255,0.04)' },
                      ticks: {
                        color: '#64748B',
                        font: { size: 10.5 },
                        callback: (v) => `Rp ${(v / 1000000).toFixed(1)}M`
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* 5. ACCORDION: Tabel Riwayat Bulanan Toko (Juli 2025 – Oktober 2026) */}
      <section aria-label="Tabel Audit Riwayat Bulanan">
        <div
          className="glass-card"
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Header Accordion yang Bisa Diklik */}
          <button
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            style={{
              width: '100%',
              padding: '18px 24px',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: 'inherit',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38BDF8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Rincian Riwayat Bulanan Toko (16 Bulan Terdata)
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Matriks audit penjualan bulan per bulan sejak transaksi pertama Juli 2025 s/d saat ini.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '11px', padding: '4px 10px' }}>
                {isAccordionOpen ? 'Tutup Rincian' : 'Buka Rincian Tabel'}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}
              >
                {isAccordionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>
          </button>

          {/* Isi Accordion (Tabel Data) */}
          {isAccordionOpen && (
            <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 12px' }}>Bulan</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Era PIC</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Omzet (GMV)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Pesanan</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Omzet Iklan</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Omzet Organik</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Rasio Iklan</th>
                      <th style={{ padding: '10px 12px' }}>Catatan Milestone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((t, idx) => {
                      const isBaru = t.pic === 'BARU';
                      const adsPct = t.revenue > 0 ? ((t.adsRevenue / t.revenue) * 100).toFixed(1) : 0;
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            backgroundColor: isBaru ? 'rgba(238, 77, 45, 0.03)' : 'transparent',
                            transition: 'background 0.15s'
                          }}
                        >
                          <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {t.month}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: isBaru ? 'rgba(238, 77, 45, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: isBaru ? 'var(--color-brand-primary)' : '#60A5FA',
                                fontSize: '10.5px',
                                padding: '2px 8px'
                              }}
                            >
                              {isBaru ? '⚡ PIC Baru' : '👤 PIC Lama'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: isBaru ? 'var(--color-brand-primary)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            Rp {t.revenue.toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            {t.orders}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: t.adsRevenue > 0 ? '#F97316' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Rp {t.adsRevenue.toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                            Rp {t.organicRevenue.toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                            <span style={{ color: adsPct > 50 ? '#F97316' : 'var(--text-muted)' }}>
                              {adsPct}%
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '11px' }}>
                            {t.note || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. Executive Takeaways & Rekomendasi Manajerial */}
      <section aria-label="Kesimpulan Eksekutif dan Rekomendasi">
        <div
          className="glass-card"
          style={{
            padding: '24px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: '#F59E0B' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Kesimpulan Eksekutif & Rekomendasi Strategis Toko
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* Poin 1: Skala & Pertumbuhan */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>Skalabilitas Omzet Terbukti</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Ekspansi marketing di era PIC Baru berhasil mendongkrak omzet bulanan hingga <strong>+264.7%</strong> (rata-rata Rp 6,92M/bln) dan order <strong>+203.4%</strong> dibanding era lama.
              </p>
            </div>

            {/* Poin 2: Peringatan Ketergantungan Iklan */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>Monitoring Biaya Iklan (89%)</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Tingginya porsi omzet iklan menuntut penerapan ketat batas <strong>Plafon CPR 25%</strong> dan <strong>CAC 40%</strong> dari Modul 3 agar toko tidak membakar budget pada campaign yang tidak menguntungkan.
              </p>
            </div>

            {/* Poin 3: Rekomendasi Diversifikasi Organik */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Target size={16} style={{ color: '#60A5FA' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#60A5FA' }}>Rekomendasi Langkah Berikutnya</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Seimbangkan akuisisi berbayar dengan optimasi listing SEO organik dan program repeat buyer untuk mengamankan margin laba bersih jangka panjang.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
