import React, { useState, useEffect, useMemo } from 'react';
import ShopeeDataCenterPicker from './ShopeeDataCenterPicker';
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
  RefreshCw,
  SlidersHorizontal,
  Filter,
  Check
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

// Opsi Pilihan Bulan untuk Filter Kustom
const MONTH_SELECT_OPTIONS = [
  { label: 'Oktober 2026', value: '2026-10' },
  { label: 'September 2026', value: '2026-09' },
  { label: 'Agustus 2026', value: '2026-08' },
  { label: 'Juli 2026', value: '2026-07' },
  { label: 'Juni 2026', value: '2026-06' },
  { label: 'Mei 2026', value: '2026-05' },
  { label: 'April 2026', value: '2026-04' },
  { label: 'Maret 2026', value: '2026-03' },
  { label: 'Februari 2026', value: '2026-02' },
  { label: 'Januari 2026', value: '2026-01' },
  { label: 'Desember 2025', value: '2025-12' },
  { label: 'November 2025', value: '2025-11' },
  { label: 'Oktober 2025', value: '2025-10' },
  { label: 'September 2025', value: '2025-09' },
  { label: 'Agustus 2025', value: '2025-08' },
  { label: 'Juli 2025', value: '2025-07' },
  { label: 'Januari 2025', value: '2025-01' },
  { label: 'September 2024', value: '2024-09' }
];

export default function MarketingPerformanceEvaluation({ showToast, storeInfo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [activeChartMetric, setActiveChartMetric] = useState('all'); // 'all' | 'gmv' | 'ads' | 'organic'

  // State Filter Periode
  const [activePeriodFilter, setActivePeriodFilter] = useState('all'); 
  // 'all' | 'pic_baru' | 'pic_lama' | '2026' | '2025' | 'last_3m' | 'custom' | 'datacenter'
  const [customStartMonth, setCustomStartMonth] = useState('2025-07');
  const [customEndMonth, setCustomEndMonth] = useState('2026-10');
  const [selectedPeriodObj, setSelectedPeriodObj] = useState({
    id: '30 hari sebelumnya.',
    period: 'past30days',
    label: '30 hari sebelumnya.'
  });
  const [orderType, setOrderType] = useState('paid');

  // Fetch overview data (contains picBenchmark and historicalTrends)
  const fetchEvaluationData = async (periodObj = selectedPeriodObj, forceLive = false, currentOrderType = orderType) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (periodObj?.period) params.set('period', periodObj.period);
      if (periodObj?.type) params.set('type', periodObj.type);
      if (periodObj?.startMonth) params.set('startMonth', periodObj.startMonth);
      if (periodObj?.endMonth) params.set('endMonth', periodObj.endMonth);
      if (periodObj?.startTime) params.set('startTime', String(periodObj.startTime));
      if (periodObj?.endTime) params.set('endTime', String(periodObj.endTime));
      if (currentOrderType) params.set('orderType', currentOrderType);
      if (forceLive) params.set('fetchLive', 'true');

      const res = await fetch(`/api/overview?${params.toString()}`);
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
  const allTrends = data?.historicalTrends || [];
  const profile = data?.storeProfile;

  // 1. Filter trends dinamis berdasarkan opsi filter yang dipilih
  const filteredTrends = useMemo(() => {
    if (!allTrends || allTrends.length === 0) return [];

    switch (activePeriodFilter) {
      case 'pic_baru':
        return allTrends.filter(t => t.pic === 'BARU');
      case 'pic_lama':
        return allTrends.filter(t => t.pic === 'LAMA');
      case '2026':
        return allTrends.filter(t => t.mCode && t.mCode.startsWith('2026'));
      case '2025':
        return allTrends.filter(t => t.mCode && t.mCode.startsWith('2025'));
      case 'last_3m':
        return allTrends.slice(-3);
      case 'custom':
        return allTrends.filter(t => {
          if (!t.mCode) return false;
          return t.mCode >= customStartMonth && t.mCode <= customEndMonth;
        });
      case 'datacenter':
        if (selectedPeriodObj?.type === 'month_range') {
          return allTrends.filter(t => t.mCode >= selectedPeriodObj.startMonth && t.mCode <= selectedPeriodObj.endMonth);
        } else if (selectedPeriodObj?.type === 'month') {
          return allTrends.filter(t => t.mCode === selectedPeriodObj.startMonth);
        } else if (selectedPeriodObj?.type === 'year') {
          return allTrends.filter(t => t.mCode && t.mCode.startsWith(String(selectedPeriodObj.year)));
        } else if (selectedPeriodObj?.period === 'past30days' || selectedPeriodObj?.id === '30 hari sebelumnya.') {
          // 30 hari sebelumnya mencakup bulan-bulan aktif terkini
          return allTrends.filter(t => t.mCode >= '2026-08');
        } else if (selectedPeriodObj?.period === 'past7days' || selectedPeriodObj?.period === 'yesterday' || selectedPeriodObj?.period === 'real_time') {
          return allTrends.slice(-1); // Bulan berjalan terkini
        }
        return allTrends;
      case 'all':
      default:
        return allTrends;
    }
  }, [allTrends, activePeriodFilter, customStartMonth, customEndMonth, selectedPeriodObj]);

  // Pisahkan bulan-bulan terfilter untuk PIC Lama dan PIC Baru
  const picLamaMonths = useMemo(() => {
    return filteredTrends.filter(t => t.pic === 'LAMA');
  }, [filteredTrends]);

  const picBaruMonths = useMemo(() => {
    return filteredTrends.filter(t => t.pic === 'BARU');
  }, [filteredTrends]);

  // 2. Perhitungan Statistik Dinamis untuk KARTU ERA PIC LAMA
  const picLamaStats = useMemo(() => {
    // Jika ada bulan untuk PIC Lama dalam filter:
    if (picLamaMonths.length > 0) {
      const activeMonthsList = picLamaMonths.filter(t => t.revenue > 0);
      const monthsCount = activeMonthsList.length || picLamaMonths.length || 1;
      const totalRevenue = picLamaMonths.reduce((s, t) => s + (t.revenue || 0), 0);
      const totalOrders = picLamaMonths.reduce((s, t) => s + (t.orders || 0), 0);
      const totalAdsRevenue = picLamaMonths.reduce((s, t) => s + (t.adsRevenue || 0), 0);
      const totalOrganicRevenue = picLamaMonths.reduce((s, t) => s + (t.organicRevenue || 0), 0);
      const avgMonthlyRevenue = Math.round(totalRevenue / monthsCount);
      const avgMonthlyOrders = (totalOrders / monthsCount).toFixed(1);
      const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const adsRatio = totalRevenue > 0 ? ((totalAdsRevenue / totalRevenue) * 100).toFixed(1) : '0';
      const organicRatio = totalRevenue > 0 ? (Number(totalAdsRevenue) === 0 ? '100.0' : ((totalOrganicRevenue / totalRevenue) * 100).toFixed(1)) : '100.0';

      const firstMonth = picLamaMonths[0]?.month;
      const lastMonth = picLamaMonths[picLamaMonths.length - 1]?.month;
      const periodLabel = firstMonth === lastMonth ? firstMonth : `${firstMonth} – ${lastMonth}`;

      return {
        hasData: true,
        isBaseline: false,
        periodLabel,
        badgeText: `👤 ERA PIC LAMA (${monthsCount} Bulan Terfilter)`,
        statusText: `${monthsCount} Bulan di Filter Ini`,
        totalRevenue,
        totalRevenueFormatted: 'Rp ' + totalRevenue.toLocaleString('id-ID'),
        avgMonthlyRevenue,
        avgMonthlyRevenueFormatted: 'Rp ' + avgMonthlyRevenue.toLocaleString('id-ID'),
        totalOrders,
        avgMonthlyOrders,
        aov,
        aovFormatted: 'Rp ' + aov.toLocaleString('id-ID'),
        adsRatio,
        organicRatio,
        description: `Akumulasi performa PIC Lama pada rentang ${periodLabel} (${monthsCount} bulan aktif).`
      };
    }

    // Jika filter hanya memilih era PIC Baru (misal: "Era PIC Baru" atau bulan September 2026):
    // Tampilkan PIC Lama sebagai kartu acuan benchmark baseline
    return {
      hasData: false,
      isBaseline: true,
      periodLabel: 'Sep 2024 – Jul 2026 (Acuan Baseline)',
      badgeText: '👤 ERA PIC LAMA (Acuan Baseline Historis)',
      statusText: '12 Bulan Baseline',
      totalRevenue: bm?.picLama?.totalRevenue || 22798537,
      totalRevenueFormatted: bm?.picLama?.totalRevenueFormatted || 'Rp 22.798.537',
      avgMonthlyRevenue: bm?.picLama?.avgMonthlyRevenue || 1899878,
      avgMonthlyRevenueFormatted: bm?.picLama?.avgMonthlyRevenueFormatted || 'Rp 1.899.878',
      totalOrders: bm?.picLama?.totalOrders || 145,
      avgMonthlyOrders: bm?.picLama?.avgMonthlyOrders || 12.1,
      aov: bm?.picLama?.aov || 157231,
      aovFormatted: bm?.picLama?.aovFormatted || 'Rp 157.231',
      adsRatio: bm?.picLama?.adsRatio || 0,
      organicRatio: bm?.picLama?.organicRatio || 100,
      description: 'Menampilkan data acuan rata-rata era PIC Lama sebagai tolak ukur evaluasi pertumbuhan.'
    };
  }, [picLamaMonths, bm]);

  // 3. Perhitungan Statistik Dinamis untuk KARTU ERA PIC BARU
  const picBaruStats = useMemo(() => {
    // Jika ada bulan untuk PIC Baru dalam filter:
    if (picBaruMonths.length > 0) {
      const activeMonthsList = picBaruMonths.filter(t => t.revenue > 0);
      const monthsCount = activeMonthsList.length || picBaruMonths.length || 1;
      const totalRevenue = picBaruMonths.reduce((s, t) => s + (t.revenue || 0), 0);
      const totalOrders = picBaruMonths.reduce((s, t) => s + (t.orders || 0), 0);
      const totalAdsRevenue = picBaruMonths.reduce((s, t) => s + (t.adsRevenue || 0), 0);
      const totalOrganicRevenue = picBaruMonths.reduce((s, t) => s + (t.organicRevenue || 0), 0);
      const avgMonthlyRevenue = Math.round(totalRevenue / monthsCount);
      const avgMonthlyOrders = (totalOrders / monthsCount).toFixed(1);
      const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const adsRatio = totalRevenue > 0 ? ((totalAdsRevenue / totalRevenue) * 100).toFixed(1) : '0';
      const organicRatio = totalRevenue > 0 ? ((totalOrganicRevenue / totalRevenue) * 100).toFixed(1) : '100';

      const firstMonth = picBaruMonths[0]?.month;
      const lastMonth = picBaruMonths[picBaruMonths.length - 1]?.month;
      const periodLabel = firstMonth === lastMonth ? firstMonth : `${firstMonth} – ${lastMonth}`;

      // Hitung pertumbuhan terhadap PIC Lama (periode terfilter atau baseline)
      const baseRev = picLamaStats.avgMonthlyRevenue > 0 ? picLamaStats.avgMonthlyRevenue : 1899878;
      const baseOrd = Number(picLamaStats.avgMonthlyOrders) > 0 ? Number(picLamaStats.avgMonthlyOrders) : 12.1;
      const baseAov = picLamaStats.aov > 0 ? picLamaStats.aov : 157231;

      const revGrowthNum = (((avgMonthlyRevenue - baseRev) / baseRev) * 100).toFixed(1);
      const ordGrowthNum = (((Number(avgMonthlyOrders) - baseOrd) / baseOrd) * 100).toFixed(1);
      const aovGrowthNum = (((aov - baseAov) / baseAov) * 100).toFixed(1);

      return {
        hasData: true,
        isNotYetActive: false,
        periodLabel,
        badgeText: `⚡ ERA PIC BARU (${monthsCount} Bulan Terfilter)`,
        statusText: `${monthsCount} Bulan Berjalan 🚀`,
        totalRevenue,
        totalRevenueFormatted: 'Rp ' + totalRevenue.toLocaleString('id-ID'),
        avgMonthlyRevenue,
        avgMonthlyRevenueFormatted: 'Rp ' + avgMonthlyRevenue.toLocaleString('id-ID'),
        totalOrders,
        avgMonthlyOrders,
        aov,
        aovFormatted: 'Rp ' + aov.toLocaleString('id-ID'),
        adsRatio,
        organicRatio,
        revGrowth: Number(revGrowthNum) >= 0 ? `+${revGrowthNum}` : `${revGrowthNum}`,
        ordGrowth: Number(ordGrowthNum) >= 0 ? `+${ordGrowthNum}` : `${ordGrowthNum}`,
        aovGrowth: Number(aovGrowthNum) >= 0 ? `+${aovGrowthNum}` : `${aovGrowthNum}`,
        description: `Omzet meningkat ${Number(revGrowthNum) >= 0 ? '+' + revGrowthNum + '%' : revGrowthNum + '%'} dibanding acuan PIC Lama (${picLamaStats.avgMonthlyRevenueFormatted}/bln).`
      };
    }

    // Jika filter hanya memilih era sebelum Agustus 2026 (misal: "Tahun 2025" atau "Era PIC Lama"):
    return {
      hasData: false,
      isNotYetActive: true,
      periodLabel: 'Agustus 2026 – Saat ini',
      badgeText: '⚡ ERA PIC BARU (Belum Menjabat)',
      statusText: 'Belum Menjabat',
      totalRevenue: 0,
      totalRevenueFormatted: 'Rp 0',
      avgMonthlyRevenue: 0,
      avgMonthlyRevenueFormatted: 'Rp 0',
      totalOrders: 0,
      avgMonthlyOrders: '0',
      aov: 0,
      aovFormatted: 'Rp 0',
      adsRatio: '0',
      organicRatio: '0',
      revGrowth: '0',
      ordGrowth: '0',
      aovGrowth: '0',
      description: 'PIC Baru belum aktif menjabat pada periode ini (Mulai aktif bertugas per Agustus 2026).'
    };
  }, [picBaruMonths, picLamaStats]);

  // 4. Perhitungan Dinamis untuk 4 SCORECARDS ATAS (Mengikuti Filter)
  const scorecardMetrics = useMemo(() => {
    // Skenario A: Jika PIC Baru aktif dalam filter (atau membandingkan terhadap baseline):
    if (picBaruStats.hasData) {
      const lamaOrdInt = Math.round(Number(picLamaStats.avgMonthlyOrders));
      const baruOrdInt = Math.round(Number(picBaruStats.avgMonthlyOrders));
      const adsPctNum = Number(picBaruStats.adsRatio);
      return {
        card1: {
          title: 'Pertumbuhan Omzet / Bulan',
          value: `${picBaruStats.revGrowth}%`,
          badge: !picBaruStats.revGrowth.startsWith('-') ? '🚀 Akselerasi Omzet' : '📉 Penurunan Omzet',
          isPositive: !picBaruStats.revGrowth.startsWith('-'),
          subtitle: `Dari ${picLamaStats.avgMonthlyRevenueFormatted} → ${picBaruStats.avgMonthlyRevenueFormatted}/bln`,
          icon: TrendingUp,
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.12)'
        },
        card2: {
          title: 'Pertumbuhan Pesanan / Bulan',
          value: `${picBaruStats.ordGrowth}%`,
          badge: '📦 Volume Penjualan',
          isPositive: !picBaruStats.ordGrowth.startsWith('-'),
          subtitle: `Dari ${lamaOrdInt} order → ${baruOrdInt} order/bln`,
          icon: ShoppingBag,
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.12)'
        },
        card3: {
          title: 'Peningkatan Nilai Belanja (AOV)',
          value: `${picBaruStats.aovGrowth}%`,
          badge: '💎 Daya Beli Keranjang',
          isPositive: !picBaruStats.aovGrowth.startsWith('-'),
          subtitle: `Dari ${picLamaStats.aovFormatted} → ${picBaruStats.aovFormatted}`,
          icon: CreditCard,
          color: '#60A5FA',
          bg: 'rgba(59, 130, 246, 0.12)'
        },
        card4: {
          title: 'Ketergantungan Belanja Iklan',
          value: `${picBaruStats.adsRatio}%`,
          badge: adsPctNum > 50 ? '⚠️ Iklan Dominan' : '🛡️ Organik Dominan',
          isPositive: null,
          subtitle: `Iklan: ${picBaruStats.adsRatio}% • Organik: ${picBaruStats.organicRatio}%`,
          icon: Percent,
          color: adsPctNum > 50 ? '#F59E0B' : '#10B981',
          bg: adsPctNum > 50 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          adsRatio: adsPctNum,
          organicRatio: Number(picBaruStats.organicRatio)
        }
      };
    }

    // Skenario B: Jika filter HANYA memilih era PIC Lama (misal: Tahun 2025):
    const lamaOrdInt = Math.round(Number(picLamaStats.avgMonthlyOrders));
    return {
      card1: {
        title: 'Rata-Rata Omzet / Bulan',
        value: picLamaStats.avgMonthlyRevenueFormatted,
        badge: '👤 Era PIC Lama',
        isPositive: true,
        subtitle: `Total Omzet Periode: ${picLamaStats.totalRevenueFormatted}`,
        icon: TrendingUp,
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.12)'
      },
      card2: {
        title: 'Rata-Rata Pesanan / Bulan',
        value: `${lamaOrdInt} pesanan`,
        badge: '📦 Volume Penjualan',
        isPositive: true,
        subtitle: `Total Terfilter: ${picLamaStats.totalOrders} pesanan`,
        icon: ShoppingBag,
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.12)'
      },
      card3: {
        title: 'Nilai Belanja Rata-Rata (AOV)',
        value: picLamaStats.aovFormatted,
        badge: '💎 Nilai Keranjang',
        isPositive: true,
        subtitle: 'Rata-rata nilai belanja keranjang terfilter',
        icon: CreditCard,
        color: '#60A5FA',
        bg: 'rgba(59, 130, 246, 0.12)'
      },
      card4: {
        title: 'Rasio Iklan vs Organik',
        value: `${picLamaStats.adsRatio}% / ${picLamaStats.organicRatio}%`,
        badge: '🌱 Organik Murni',
        isPositive: null,
        subtitle: 'Toko murni mengandalkan penjualan organik',
        icon: Percent,
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)',
        adsRatio: Number(picLamaStats.adsRatio),
        organicRatio: Number(picLamaStats.organicRatio)
      }
    };
  }, [picBaruStats, picLamaStats]);

  // Perhitungan Selisih Pertumbuhan Bersih (Net Growth Impact PIC Baru vs PIC Lama)
  const netDeltas = useMemo(() => {
    if (!picBaruStats.hasData) return null;
    const revDelta = picBaruStats.avgMonthlyRevenue - picLamaStats.avgMonthlyRevenue;
    const lamaOrdInt = Math.round(Number(picLamaStats.avgMonthlyOrders));
    const baruOrdInt = Math.round(Number(picBaruStats.avgMonthlyOrders));
    const ordDelta = baruOrdInt - lamaOrdInt;
    const aovDelta = picBaruStats.aov - picLamaStats.aov;
    return {
      revDelta,
      revDeltaFormatted: (revDelta >= 0 ? '+Rp ' : '-Rp ') + Math.abs(revDelta).toLocaleString('id-ID'),
      ordDelta,
      ordDeltaFormatted: (ordDelta >= 0 ? '+' : '') + ordDelta,
      aovDelta,
      aovDeltaFormatted: (aovDelta >= 0 ? '+Rp ' : '-Rp ') + Math.abs(aovDelta).toLocaleString('id-ID')
    };
  }, [picBaruStats, picLamaStats]);

  // Statistik Keseluruhan Terfilter untuk Footer Accordion & Export CSV
  const filteredStats = useMemo(() => {
    if (!filteredTrends || filteredTrends.length === 0) {
      return {
        monthsCount: 0,
        totalRevenue: 0,
        totalOrders: 0,
        avgMonthlyRevenue: 0,
        avgMonthlyOrders: '0',
        aov: 0,
        adsRatio: '0',
        organicRatio: '100',
        totalAdsRevenue: 0,
        totalOrganicRevenue: 0
      };
    }
    const monthsCount = filteredTrends.length;
    const totalRevenue = filteredTrends.reduce((acc, t) => acc + (t.revenue || 0), 0);
    const totalOrders = filteredTrends.reduce((acc, t) => acc + (t.orders || 0), 0);
    const totalAdsRevenue = filteredTrends.reduce((acc, t) => acc + (t.adsRevenue || 0), 0);
    const totalOrganicRevenue = filteredTrends.reduce((acc, t) => acc + (t.organicRevenue || 0), 0);
    const activeMonthsCount = filteredTrends.filter(t => t.revenue > 0).length || monthsCount;
    const avgMonthlyRevenue = Math.round(totalRevenue / activeMonthsCount);
    const avgMonthlyOrders = (totalOrders / activeMonthsCount).toFixed(1);
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const adsRatio = totalRevenue > 0 ? ((totalAdsRevenue / totalRevenue) * 100).toFixed(1) : '0';
    const organicRatio = totalRevenue > 0 ? ((totalOrganicRevenue / totalRevenue) * 100).toFixed(1) : '100';

    return {
      monthsCount,
      totalRevenue,
      totalOrders,
      avgMonthlyRevenue,
      avgMonthlyOrders,
      aov,
      adsRatio,
      organicRatio,
      totalAdsRevenue,
      totalOrganicRevenue
    };
  }, [filteredTrends]);

  // Label Deskripsi Periode Aktif
  const activePeriodLabel = useMemo(() => {
    switch (activePeriodFilter) {
      case 'pic_baru':
        return '⚡ Era PIC Baru (Agustus 2026 – Saat ini)';
      case 'pic_lama':
        return '👤 Era PIC Lama (September 2024 – Juli 2026)';
      case '2026':
        return '📅 Tahun Buku 2026 (Januari – Oktober 2026)';
      case '2025':
        return '🗓️ Tahun Buku 2025 (Januari – Desember 2025)';
      case 'last_3m':
        return '📊 3 Bulan Terakhir (Agustus – Oktober 2026)';
      case 'custom':
        return `📆 Rentang Kustom (${customStartMonth} s/d ${customEndMonth})`;
      case 'datacenter':
        return `🎯 Shopee Data Center: ${selectedPeriodObj?.label || 'Kustom'}`;
      case 'all':
      default:
        return '🌟 Sepanjang Masa (Sep 2024 – Saat ini)';
    }
  }, [activePeriodFilter, customStartMonth, customEndMonth, selectedPeriodObj]);

  // Export CSV khusus Laporan Evaluasi Kinerja (Mendukung Data Terfilter)
  const handleExportCSV = () => {
    if (!filteredTrends || filteredTrends.length === 0) return;

    const rows = [
      ['LAPORAN EVALUASI KINERJA MARKETING: PIC LAMA VS PIC BARU'],
      ['Toko: Monture Outdoor (ID: 1575219792)'],
      ['Filter Periode Terpilih:', activePeriodLabel],
      ['Tanggal Ekspor:', new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
      [],
      ['RINGKASAN METRIK PERIODE TERFILTER'],
      ['Jumlah Bulan', `${filteredStats.monthsCount} Bulan`],
      ['Total Omzet Terfilter', `Rp ${filteredStats.totalRevenue.toLocaleString('id-ID')}`],
      ['Rata-Rata Omzet / Bulan', `Rp ${filteredStats.avgMonthlyRevenue.toLocaleString('id-ID')}`],
      ['Total Pesanan Terfilter', `${filteredStats.totalOrders} pesanan`],
      ['Rata-Rata Pesanan / Bulan', `${filteredStats.avgMonthlyOrders} pesanan`],
      ['Nilai Belanja Rata-Rata (AOV)', `Rp ${filteredStats.aov.toLocaleString('id-ID')}`],
      ['Omzet Iklan Berbayar', `Rp ${filteredStats.totalAdsRevenue.toLocaleString('id-ID')} (${filteredStats.adsRatio}%)`],
      ['Omzet Organik', `Rp ${filteredStats.totalOrganicRevenue.toLocaleString('id-ID')} (${filteredStats.organicRatio}%)`],
      [],
      ['RINGKASAN BENCHMARK DUA ERA (DINAMIS TERFILTER)'],
      ['Metrik', `Era PIC Lama (${picLamaStats.periodLabel})`, `Era PIC Baru (${picBaruStats.periodLabel})`, 'Pertumbuhan'],
      ['Rata-Rata Omzet / Bulan', picLamaStats.avgMonthlyRevenueFormatted, picBaruStats.avgMonthlyRevenueFormatted, `${picBaruStats.revGrowth}%`],
      ['Rata-Rata Pesanan / Bulan', `${picLamaStats.avgMonthlyOrders} pesanan`, `${picBaruStats.avgMonthlyOrders} pesanan`, `${picBaruStats.ordGrowth}%`],
      ['Nilai Belanja Rata-Rata (AOV)', picLamaStats.aovFormatted, picBaruStats.aovFormatted, `${picBaruStats.aovGrowth}%`],
      ['Rasio Iklan vs Organik', `${picLamaStats.adsRatio}% / ${picLamaStats.organicRatio}%`, `${picBaruStats.adsRatio}% / ${picBaruStats.organicRatio}%`, '-'],
      ['Total Akumulasi Omzet', picLamaStats.totalRevenueFormatted, picBaruStats.totalRevenueFormatted, '-'],
      ['Total Akumulasi Pesanan', `${picLamaStats.totalOrders} pesanan`, `${picBaruStats.totalOrders} pesanan`, '-'],
      [],
      ['RINCIAN RIWAYAT BULANAN TOKO (TERFILTER)'],
      ['Bulan', 'Era PIC', 'Total Omzet (Rp)', 'Total Pesanan', 'Omzet Iklan (Rp)', 'Omzet Organik (Rp)', 'Rasio Iklan (%)', 'Catatan Milestone']
    ];

    filteredTrends.forEach(t => {
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

  // Data Grafik Garis Komparatif Tren Omzet (Mengikuti Filter Periode)
  const lineChartData = useMemo(() => {
    if (!filteredTrends || filteredTrends.length === 0) return null;

    const labels = filteredTrends.map(t => t.month);
    const pointColors = filteredTrends.map(t => t.pic === 'BARU' ? '#EE4D2D' : '#3B82F6');
    // Highlight titik Agustus 2026 (titik transisi serah terima PIC)
    const gmvPointRadii = filteredTrends.map(t => t.mCode === '2026-08' ? 7.5 : (t.pic === 'BARU' ? 5 : 4));

    const datasets = [];

    if (activeChartMetric === 'all' || activeChartMetric === 'gmv') {
      datasets.push({
        label: 'Total Omzet (GMV)',
        data: filteredTrends.map(t => t.revenue),
        borderColor: '#EE4D2D',
        backgroundColor: 'rgba(238, 77, 45, 0.12)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.8,
        pointRadius: gmvPointRadii,
        pointHoverRadius: 8,
        pointBackgroundColor: pointColors,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5
      });
    }

    if (activeChartMetric === 'all' || activeChartMetric === 'ads') {
      datasets.push({
        label: 'Omzet Iklan (Paid Ads)',
        data: filteredTrends.map(t => t.adsRevenue),
        borderColor: '#F97316',
        backgroundColor: 'transparent',
        borderDash: [5, 4],
        tension: 0.35,
        borderWidth: 2,
        pointRadius: gmvPointRadii.map(r => Math.max(2.5, r - 1.5)),
        pointHoverRadius: 6,
        pointBackgroundColor: '#F97316'
      });
    }

    if (activeChartMetric === 'all' || activeChartMetric === 'organic') {
      datasets.push({
        label: 'Omzet Organik & Konten',
        data: filteredTrends.map(t => t.organicRevenue),
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        borderDash: [3, 3],
        tension: 0.35,
        borderWidth: 2,
        pointRadius: gmvPointRadii.map(r => Math.max(2.5, r - 1.5)),
        pointHoverRadius: 6,
        pointBackgroundColor: '#10B981'
      });
    }

    return { labels, datasets };
  }, [filteredTrends, activeChartMetric]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--color-brand-primary)' }} />
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Memuat Laporan Evaluasi Kinerja PIC & Tim...</span>
      </div>
    );
  }

  const isFiltered = activePeriodFilter !== 'all';

  return (
    <div className="evaluation-container" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 1. Executive Toolbar & Filter Bar Terpadu (Zona 1) */}
      <section aria-label="Toolbar dan Filter Evaluasi Kinerja PIC">
        <div
          className="glass-card"
          style={{
            padding: '14px 20px',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)'
          }}
        >
          {/* Main Row: Title Badge + Shopee Picker + Presets + Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            
            {/* Left Section: Icon Badge + ShopeeDataCenterPicker + Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              
              {/* Badge Icon & Label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                    flexShrink: 0
                  }}
                >
                  <Briefcase size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      Benchmark PIC
                    </span>
                    <span className="badge" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '10px', padding: '1px 6px' }}>
                      Executive Audit
                    </span>
                  </div>
                </div>
              </div>

              {/* Separator Divider */}
              <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

              {/* Shopee Data Center Dropdown Picker */}
              <ShopeeDataCenterPicker
                selectedPeriod={selectedPeriodObj}
                onChange={(newPeriod) => {
                  setSelectedPeriodObj(newPeriod);
                  setActivePeriodFilter('datacenter');
                  fetchEvaluationData(newPeriod, false, orderType);
                }}
                orderType={orderType}
                onOrderTypeChange={(newOrderType) => {
                  setOrderType(newOrderType);
                  fetchEvaluationData(selectedPeriodObj, false, newOrderType);
                }}
              />

              {/* Separator Divider */}
              <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

              {/* Quick Era Preset Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: '🌟 Semua (Lifetime)' },
                  { id: 'pic_baru', label: '⚡ Era PIC Baru' },
                  { id: 'pic_lama', label: '👤 Era PIC Lama' },
                  { id: '2026', label: '📅 Tahun 2026' },
                  { id: '2025', label: '🗓️ Tahun 2025' },
                  { id: 'last_3m', label: '📊 3 Bulan Terakhir' },
                  { id: 'custom', label: '📆 Kustom' }
                ].map(p => {
                  const isSelected = activePeriodFilter === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActivePeriodFilter(p.id);
                        if (p.id === 'all') {
                          const pObj = { id: '30 hari sebelumnya.', period: 'past30days', label: '30 hari sebelumnya.' };
                          setSelectedPeriodObj(pObj);
                          fetchEvaluationData(pObj, false, orderType);
                        } else if (p.id === 'pic_baru') {
                          const picBaruPeriod = { type: 'month_range', startMonth: '2026-08', endMonth: '2026-10', label: 'Agu 2026 - Okt 2026' };
                          setSelectedPeriodObj(picBaruPeriod);
                          fetchEvaluationData(picBaruPeriod, false, orderType);
                        } else if (p.id === 'pic_lama') {
                          const picLamaPeriod = { type: 'month_range', startMonth: '2024-09', endMonth: '2026-07', label: 'Sep 2024 - Jul 2026' };
                          setSelectedPeriodObj(picLamaPeriod);
                          fetchEvaluationData(picLamaPeriod, false, orderType);
                        } else if (p.id === '2026') {
                          const y26Period = { type: 'year', year: 2026, label: '2026' };
                          setSelectedPeriodObj(y26Period);
                          fetchEvaluationData(y26Period, false, orderType);
                        } else if (p.id === '2025') {
                          const y25Period = { type: 'year', year: 2025, label: '2025' };
                          setSelectedPeriodObj(y25Period);
                          fetchEvaluationData(y25Period, false, orderType);
                        } else if (p.id === 'last_3m') {
                          const last3mPeriod = { type: 'month_range', startMonth: '2026-08', endMonth: '2026-10', label: '3 Bulan Terakhir' };
                          setSelectedPeriodObj(last3mPeriod);
                          fetchEvaluationData(last3mPeriod, false, orderType);
                        }
                      }}
                      className={`filter-chip ${isSelected ? 'active' : ''}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: isSelected ? 700 : 500,
                        border: isSelected ? '1px solid var(--color-brand-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: isSelected ? 'rgba(238, 77, 45, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? 'var(--color-brand-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Right Section: Status Pill & Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              
              {/* Filtered Data Pill */}
              <div
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Clock size={13} style={{ color: 'var(--color-brand-primary)' }} />
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>{filteredTrends.length} Bulan</strong> ({filteredStats.totalOrders} Order)
                </span>
              </div>

              {/* Action Buttons: Segarkan, Cetak PDF, Export CSV */}
              <button
                onClick={() => fetchEvaluationData(selectedPeriodObj, true, orderType)}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', padding: '6px 12px', borderRadius: '8px' }}
                title="Muat ulang data evaluasi terkini dari Shopee API"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Segarkan</span>
              </button>

              <button
                onClick={handlePrint}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', padding: '6px 12px', borderRadius: '8px' }}
                title="Cetak atau simpan ke PDF"
              >
                <Printer size={13} />
                <span>Cetak</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', padding: '6px 12px', borderRadius: '8px' }}
                title="Unduh rekapitulasi evaluasi kinerja ke CSV"
              >
                <Download size={13} />
                <span>CSV</span>
              </button>

            </div>

          </div>

          {/* Conditional Sub-Row: Custom Month Range Form */}
          {activePeriodFilter === 'custom' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(238, 77, 45, 0.05)',
                border: '1px solid rgba(238, 77, 45, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-brand-primary)' }}>
                <SlidersHorizontal size={14} />
                <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Pilih Rentang Bulan:</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mulai:</span>
                <select
                  value={customStartMonth}
                  onChange={(e) => setCustomStartMonth(e.target.value)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#1E293B',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {MONTH_SELECT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </option>
                  ))}
                </select>
              </div>

              <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sampai:</span>
                <select
                  value={customEndMonth}
                  onChange={(e) => setCustomEndMonth(e.target.value)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#1E293B',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {MONTH_SELECT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  const customPeriod = {
                    type: 'month_range',
                    startMonth: customStartMonth,
                    endMonth: customEndMonth,
                    label: `${customStartMonth} ~ ${customEndMonth}`
                  };
                  setSelectedPeriodObj(customPeriod);
                  fetchEvaluationData(customPeriod, false, orderType);
                  showToast && showToast(`Rentang periode diterapkan: ${customStartMonth} s/d ${customEndMonth}`, 'success');
                }}
                className="btn-primary"
                style={{
                  padding: '5px 12px',
                  fontSize: '11.5px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Terapkan Filter
              </button>
            </div>
          )}

          {/* Sub-Row: Breadcrumb & Active Filter Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted)',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Periode Aktif:</span>
              <strong style={{ color: isFiltered ? 'var(--color-brand-primary)' : 'var(--text-primary)' }}>
                {activePeriodLabel}
              </strong>
            </div>

            {isFiltered && (
              <button
                onClick={() => {
                  setActivePeriodFilter('all');
                  const pObj = { id: '30 hari sebelumnya.', period: 'past30days', label: '30 hari sebelumnya.' };
                  setSelectedPeriodObj(pObj);
                  fetchEvaluationData(pObj, false, orderType);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#60A5FA',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Reset ke Semua Periode (Lifetime)
              </button>
            )}
          </div>

        </div>
      </section>

      {/* 2. Executive Scorecards Dinamis (Zona 2: 100% Menyesuaikan Filter Terpilih) */}
      <section aria-label="Ringkasan Kinerja Utama">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px'
          }}
        >
          {/* Card 1: Omzet / Bulan */}
          <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '14px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {scorecardMetrics.card1.title}
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: scorecardMetrics.card1.bg, color: scorecardMetrics.card1.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: scorecardMetrics.card1.color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {scorecardMetrics.card1.value}
              </div>
            </div>
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {scorecardMetrics.card1.subtitle}
              </span>
              <span className="badge" style={{ backgroundColor: scorecardMetrics.card1.bg, color: scorecardMetrics.card1.color, fontSize: '10px', padding: '1px 6px', borderRadius: '5px' }}>
                {scorecardMetrics.card1.badge}
              </span>
            </div>
          </div>

          {/* Card 2: Pesanan / Bulan */}
          <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '14px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {scorecardMetrics.card2.title}
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: scorecardMetrics.card2.bg, color: scorecardMetrics.card2.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={16} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: scorecardMetrics.card2.color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {scorecardMetrics.card2.value}
              </div>
            </div>
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {scorecardMetrics.card2.subtitle}
              </span>
              <span className="badge" style={{ backgroundColor: scorecardMetrics.card2.bg, color: scorecardMetrics.card2.color, fontSize: '10px', padding: '1px 6px', borderRadius: '5px' }}>
                {scorecardMetrics.card2.badge}
              </span>
            </div>
          </div>

          {/* Card 3: Nilai Belanja Rata-Rata (AOV) */}
          <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '14px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {scorecardMetrics.card3.title}
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: scorecardMetrics.card3.bg, color: scorecardMetrics.card3.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={16} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: scorecardMetrics.card3.color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {scorecardMetrics.card3.value}
              </div>
            </div>
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {scorecardMetrics.card3.subtitle}
              </span>
              <span className="badge" style={{ backgroundColor: scorecardMetrics.card3.bg, color: scorecardMetrics.card3.color, fontSize: '10px', padding: '1px 6px', borderRadius: '5px' }}>
                {scorecardMetrics.card3.badge}
              </span>
            </div>
          </div>

          {/* Card 4: Ketergantungan Iklan / Rasio */}
          <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '14px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {scorecardMetrics.card4.title}
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: scorecardMetrics.card4.bg, color: scorecardMetrics.card4.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Percent size={16} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: scorecardMetrics.card4.color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {scorecardMetrics.card4.value}
              </div>
              {/* Mini 2-tone Bar (Ads vs Organic) */}
              <div style={{ height: '4px', width: '100%', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{ width: `${scorecardMetrics.card4.adsRatio}%`, backgroundColor: '#F97316' }} title={`Iklan: ${scorecardMetrics.card4.adsRatio}%`} />
                <div style={{ width: `${scorecardMetrics.card4.organicRatio}%`, backgroundColor: '#10B981' }} title={`Organik: ${scorecardMetrics.card4.organicRatio}%`} />
              </div>
            </div>
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {scorecardMetrics.card4.subtitle}
              </span>
              <span className="badge" style={{ backgroundColor: scorecardMetrics.card4.bg, color: scorecardMetrics.card4.color, fontSize: '10px', padding: '1px 6px', borderRadius: '5px' }}>
                {scorecardMetrics.card4.badge}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Kartu Head-to-Head Komparasi (Zona 3: PIC Lama vs PIC Baru) */}
      <section aria-label="Head to Head Komparasi Era PIC">
        {/* Net Growth Impact Bridge (Hanya Tampil Jika Era PIC Baru Memiliki Data Pembanding) */}
        {netDeltas && (
          <div
            className="glass-card"
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(238, 77, 45, 0.08) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Net Growth Impact (Akselerasi PIC Baru):
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Net Omzet:</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                  {netDeltas.revDeltaFormatted} /bln ({picBaruStats.revGrowth}%)
                </span>
              </div>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Net Order:</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                  {netDeltas.ordDeltaFormatted} order /bln ({picBaruStats.ordGrowth}%)
                </span>
              </div>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Net AOV:</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>
                  {netDeltas.aovDeltaFormatted} ({picBaruStats.aovGrowth}%)
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
          
          {/* KARTU ERA PIC LAMA */}
          <div
            className="glass-card"
            style={{
              padding: '22px',
              borderRadius: '16px',
              backgroundColor: 'rgba(59, 130, 246, 0.04)',
              border: activePeriodFilter === 'pic_lama' 
                ? '2px solid #3B82F6' 
                : (picLamaStats.isBaseline ? '1px dashed rgba(59, 130, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.25)'),
              boxShadow: activePeriodFilter === 'pic_lama' ? '0 0 24px rgba(59, 130, 246, 0.25)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'all 0.2s ease',
              opacity: picBaruStats.hasData && !picLamaStats.hasData ? 0.9 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(59, 130, 246, 0.15)', paddingBottom: '12px' }}>
              <div>
                <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', fontSize: '11px', padding: '3px 8px', marginBottom: '6px', display: 'inline-block' }}>
                  {picLamaStats.badgeText}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {picLamaStats.periodLabel}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status Evaluasi</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: picLamaStats.isBaseline ? '#94A3B8' : '#38BDF8' }}>
                  {picLamaStats.statusText}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: '#CBD5E1', backgroundColor: 'rgba(59, 130, 246, 0.06)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
              💡 <strong>Karakteristik Strategi:</strong> {picLamaStats.description}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rata-Rata Omzet / Bulan:</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {picLamaStats.avgMonthlyRevenueFormatted}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rata-Rata Order / Bulan:</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(Number(picLamaStats.avgMonthlyOrders))} <small style={{ fontSize: '12px', fontWeight: 500 }}>pesanan</small>
                </div>
              </div>
            </div>

            {/* Horizontal Stacked Bar (Ads vs Organic Split) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#F97316', fontWeight: 700 }}>Iklan: {picLamaStats.adsRatio}%</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>Organik: {picLamaStats.organicRatio}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${picLamaStats.adsRatio}%`, backgroundColor: '#F97316' }} />
                <div style={{ width: `${picLamaStats.organicRatio}%`, backgroundColor: '#10B981' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Nilai Belanja Rata-Rata (AOV):</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#CBD5E1', fontFamily: 'var(--font-mono)' }}>
                  {picLamaStats.aovFormatted}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Pesanan:</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#CBD5E1', fontFamily: 'var(--font-mono)' }}>
                  {picLamaStats.totalOrders} order
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              Total Akumulasi Omzet Era Ini: <strong style={{ color: '#60A5FA' }}>{picLamaStats.totalRevenueFormatted}</strong> ({picLamaStats.totalOrders} Pesanan Terkonfirmasi)
            </div>
          </div>

          {/* KARTU ERA PIC BARU */}
          <div
            className="glass-card"
            style={{
              padding: '22px',
              borderRadius: '16px',
              backgroundColor: 'rgba(238, 77, 45, 0.04)',
              border: activePeriodFilter === 'pic_baru' 
                ? '2px solid var(--color-brand-primary)' 
                : (picBaruStats.isNotYetActive ? '1px dashed rgba(255, 255, 255, 0.15)' : '1.5px solid rgba(238, 77, 45, 0.35)'),
              boxShadow: activePeriodFilter === 'pic_baru' ? '0 0 24px rgba(238, 77, 45, 0.3)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'all 0.2s ease',
              opacity: picBaruStats.isNotYetActive ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(238, 77, 45, 0.2)', paddingBottom: '12px' }}>
              <div>
                <span className="badge" style={{ backgroundColor: 'rgba(238, 77, 45, 0.15)', color: 'var(--color-brand-primary)', fontSize: '11px', padding: '3px 8px', marginBottom: '6px', display: 'inline-block' }}>
                  {picBaruStats.badgeText}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {picBaruStats.periodLabel}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status Evaluasi</span>
                <div style={{ fontSize: '12px', fontWeight: 800, color: picBaruStats.isNotYetActive ? '#94A3B8' : '#10B981' }}>
                  {picBaruStats.statusText}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: '#CBD5E1', backgroundColor: 'rgba(238, 77, 45, 0.06)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(238, 77, 45, 0.15)' }}>
              🚀 <strong>Status Kinerja:</strong> {picBaruStats.description}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rata-Rata Omzet / Bulan:</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-brand-primary)', fontFamily: 'var(--font-mono)' }}>
                  {picBaruStats.avgMonthlyRevenueFormatted}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rata-Rata Order / Bulan:</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(Number(picBaruStats.avgMonthlyOrders))} <small style={{ fontSize: '12px', fontWeight: 500 }}>pesanan</small>
                </div>
              </div>
            </div>

            {/* Horizontal Stacked Bar (Ads vs Organic Split) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#F97316', fontWeight: 700 }}>Iklan: {picBaruStats.adsRatio}%</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>Organik: {picBaruStats.organicRatio}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${picBaruStats.adsRatio}%`, backgroundColor: '#F97316' }} />
                <div style={{ width: `${picBaruStats.organicRatio}%`, backgroundColor: '#10B981' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Nilai Belanja Rata-Rata (AOV):</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
                  {picBaruStats.aovFormatted} {picBaruStats.hasData && <small style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>({picBaruStats.aovGrowth}%)</small>}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Pesanan:</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#CBD5E1', fontFamily: 'var(--font-mono)' }}>
                  {picBaruStats.totalOrders} order
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              Total Akumulasi Omzet Era Ini: <strong style={{ color: 'var(--color-brand-primary)' }}>{picBaruStats.totalRevenueFormatted}</strong> ({picBaruStats.totalOrders} Pesanan Terkonfirmasi)
            </div>
          </div>

        </div>
      </section>

      {/* 4. Grafik Garis Komparatif Tren Omzet (Zona 4) */}
      <section aria-label="Grafik Tren Omzet Komparatif">
        <div
          className="glass-card"
          style={{
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Header Grafik & Metric Toggle Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <TrendingUp size={18} style={{ color: 'var(--color-brand-primary)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Grafik Pertumbuhan Omzet Toko ({filteredTrends.length} Bulan Terpilih)
                </h3>
                <span className="badge" style={{ backgroundColor: 'rgba(238, 77, 45, 0.12)', color: 'var(--color-brand-primary)', border: '1px solid rgba(238, 77, 45, 0.25)', fontSize: '10.5px', padding: '2px 8px' }}>
                  ⚡ Titik Balik Transisi: Agustus 2026
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Visualisasi titik balik akselerasi penjualan dan pergeseran saluran akuisisi pemasaran.
              </p>
            </div>

            {/* Toggle Metrik Garis */}
            <div style={{ display: 'inline-flex', padding: '3px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {[
                { id: 'all', label: 'Semua Metrik' },
                { id: 'gmv', label: 'Total GMV' },
                { id: 'ads', label: 'Omzet Iklan' },
                { id: 'organic', label: 'Omzet Organik' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveChartMetric(m.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '7px',
                    fontSize: '11px',
                    fontWeight: activeChartMetric === m.id ? 700 : 500,
                    color: activeChartMetric === m.id ? '#FFFFFF' : 'var(--text-muted)',
                    backgroundColor: activeChartMetric === m.id ? 'var(--color-brand-primary)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legenda Keterangan Era PIC */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '11.5px', color: 'var(--text-secondary)', padding: '8px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Panduan Titik & Era:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'inline-block' }} />
              <span>Titik Biru: Era PIC Lama (Organik)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EE4D2D', display: 'inline-block' }} />
              <span>Titik Oranye: Era PIC Baru (Shopee Ads)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#EE4D2D', border: '2px solid #FFFFFF', display: 'inline-block' }} />
              <span>Titik Besar: Transisi Serah Terima (Agu 2026)</span>
            </div>
          </div>

          {/* Canvas Chart */}
          <div style={{ height: '320px', width: '100%', position: 'relative' }}>
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
                      display: true,
                      position: 'top',
                      labels: {
                        boxWidth: 12,
                        color: '#94A3B8',
                        font: { size: 11, family: 'Inter' }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      titleColor: '#F8FAFC',
                      bodyColor: '#E2E8F0',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      borderWidth: 1,
                      padding: 12,
                      callbacks: {
                        label: function (ctx) {
                          const val = ctx.raw || 0;
                          return ` ${ctx.dataset.label}: Rp ${val.toLocaleString('id-ID')}`;
                        },
                        afterBody: function (items) {
                          const gmvItem = items.find(i => i.dataset.label && i.dataset.label.includes('GMV'));
                          const adsItem = items.find(i => i.dataset.label && i.dataset.label.includes('Iklan'));
                          if (gmvItem && adsItem && gmvItem.raw > 0) {
                            const adsPct = ((adsItem.raw / gmvItem.raw) * 100).toFixed(1);
                            const orgPct = (100 - adsPct).toFixed(1);
                            return [` Komposisi: ${adsPct}% Iklan • ${orgPct}% Organik`];
                          }
                          return [];
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(255, 255, 255, 0.05)' },
                      ticks: { color: '#94A3B8', font: { size: 11 } }
                    },
                    y: {
                      grid: { color: 'rgba(255, 255, 255, 0.05)' },
                      ticks: {
                        color: '#94A3B8',
                        font: { size: 11 },
                        callback: function (val) {
                          if (val >= 1000000) return 'Rp ' + (val / 1000000).toFixed(1) + 'M';
                          if (val >= 1000) return 'Rp ' + (val / 1000).toFixed(0) + 'k';
                          return val;
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* 5. Accordion Audit Bulanan (Zona 5: Matriks Penjualan per Bulan + MoM Growth) */}
      <section aria-label="Rincian Audit Bulanan Toko">
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
              padding: '16px 22px',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Rincian Audit Bulanan Toko ({filteredTrends.length} Bulan Terdata)
                  </h3>
                  <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '10.5px', padding: '2px 8px' }}>
                    Total: Rp {filteredStats.totalRevenue.toLocaleString('id-ID')} • {filteredStats.totalOrders} Order
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                  Matriks audit bulan ke bulan dengan indikator pertumbuhan MoM sejak transaksi pertama Juli 2025 s/d saat ini.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '11px', padding: '4px 10px' }}>
                {isAccordionOpen ? 'Tutup Rincian' : 'Buka Rincian Tabel'}
              </span>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}
              >
                {isAccordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
          </button>

          {/* Isi Accordion (Tabel Data dengan MoM %) */}
          {isAccordionOpen && (
            <div style={{ padding: '0 22px 22px 22px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ overflowX: 'auto', marginTop: '14px' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 12px' }}>Bulan</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Era PIC</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Omzet (GMV)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>MoM %</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Pesanan</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Omzet Iklan</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Omzet Organik</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Rasio Iklan</th>
                      <th style={{ padding: '10px 12px' }}>Catatan Milestone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrends.map((t, idx) => {
                      const isBaru = t.pic === 'BARU';
                      const adsPct = t.revenue > 0 ? ((t.adsRevenue / t.revenue) * 100).toFixed(1) : 0;
                      // Hitung MoM terhadap bulan sebelumnya
                      const prevRev = idx > 0 ? filteredTrends[idx - 1]?.revenue : null;
                      const momPct = prevRev && prevRev > 0 
                        ? (((t.revenue - prevRev) / prevRev) * 100).toFixed(1) 
                        : null;

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            backgroundColor: isBaru ? 'rgba(238, 77, 45, 0.03)' : 'transparent',
                            borderLeft: isBaru ? '3px solid var(--color-brand-primary)' : '3px solid transparent',
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
                                fontSize: '10px',
                                padding: '2px 8px'
                              }}
                            >
                              {isBaru ? '⚡ PIC Baru' : '👤 PIC Lama'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: isBaru ? 'var(--color-brand-primary)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            Rp {t.revenue.toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                            {momPct !== null ? (
                              <span style={{
                                color: Number(momPct) > 0 ? '#10B981' : Number(momPct) < 0 ? '#EF4444' : '#94A3B8',
                                fontWeight: 700
                              }}>
                                {Number(momPct) > 0 ? `+${momPct}%` : `${momPct}%`}
                              </span>
                            ) : (
                              <span style={{ color: '#64748B' }}>-</span>
                            )}
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
                            <span style={{ color: Number(adsPct) > 50 ? '#F97316' : 'var(--text-muted)' }}>
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
                  {/* Summary Footer Baris Total Terfilter */}
                  <tfoot>
                    <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', fontWeight: 800, borderTop: '2px solid rgba(255, 255, 255, 0.1)' }}>
                      <td colSpan={2} style={{ padding: '12px', color: 'var(--text-primary)' }}>
                        TOTAL TERFILTER ({filteredStats.monthsCount} BULAN)
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-brand-primary)', fontFamily: 'var(--font-mono)' }}>
                        Rp {filteredStats.totalRevenue.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#10B981', fontSize: '11px' }}>
                        Avg MoM
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                        {filteredStats.totalOrders}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#F97316', fontFamily: 'var(--font-mono)' }}>
                        Rp {filteredStats.totalAdsRevenue.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                        Rp {filteredStats.totalOrganicRevenue.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#F59E0B' }}>
                        {filteredStats.adsRatio}%
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '11px' }}>
                        Rata-rata: Rp {filteredStats.avgMonthlyRevenue.toLocaleString('id-ID')}/bln
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. Executive Takeaways & Rekomendasi Manajerial (Zona 6) */}
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
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
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
                Ekspansi marketing di era PIC Baru berhasil mendongkrak omzet bulanan hingga <strong>{picBaruStats.revGrowth}%</strong> (rata-rata {picBaruStats.avgMonthlyRevenueFormatted}/bln) dan order <strong>{picBaruStats.ordGrowth}%</strong> dibanding acuan era lama.
              </p>
            </div>

            {/* Poin 2: Peringatan Ketergantungan Iklan */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>Monitoring Biaya Iklan ({picBaruStats.adsRatio}%)</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Tingginya porsi omzet iklan menuntut penerapan ketat batas <strong>Plafon CPR 25%</strong> dan <strong>CAC 40%</strong> dari Modul 3 agar toko tidak membakar budget pada campaign yang tidak menguntungkan.
              </p>
            </div>

            {/* Poin 3: Rekomendasi Diversifikasi Organik */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Target size={16} style={{ color: '#60A5FA' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#60A5FA' }}>Rekomendasi Diversifikasi Organik</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Seimbangkan akuisisi berbayar dengan optimasi listing SEO organik dan program repeat buyer dari Modul 2 untuk mengamankan margin laba bersih jangka panjang.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
