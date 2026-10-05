import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiGrid from './components/KpiGrid';
import AdsCharts from './components/AdsCharts';
import CampaignTable from './components/CampaignTable';
import SettingsModal from './components/SettingsModal';
import ShopeeDateRangePicker from './components/ShopeeDateRangePicker';
import ProductSkuManager from './components/ProductSkuManager';
import StoreOverview from './components/StoreOverview';
import MarketingPerformanceEvaluation from './components/MarketingPerformanceEvaluation';
import { getDefaultDateRange } from './utils/dateUtils';
import { 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Clock,
  Layers,
  Info
} from 'lucide-react';

export default function App() {
  const [storeInfo, setStoreInfo] = useState({
    shop_name: 'Monture outdoor',
    shop_id: '1575219792',
    shop_region: 'ID'
  });
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('id-ID'));
  const [timeGraph, setTimeGraph] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [activeModuleTab, setActiveModuleTab] = useState('module2');
  const [toast, setToast] = useState(null);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Helper show toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch campaigns and time graph for specific dateRange
  const loadDataForRange = async (range) => {
    try {
      setCampaignsLoading(true);
      const params = new URLSearchParams();
      if (range?.startDate) params.set('startDate', range.startDate);
      if (range?.endDate) params.set('endDate', range.endDate);

      const [resCamp, resTimeGraph] = await Promise.all([
        fetch(`/api/ads/campaigns?${params.toString()}`),
        fetch(`/api/ads/time-graph?${params.toString()}`)
      ]);

      if (resCamp.ok) {
        const campData = await resCamp.json();
        setCampaigns(campData.campaigns || []);
      }
      if (resTimeGraph.ok) {
        const tgData = await resTimeGraph.json();
        setTimeGraph(tgData);
      }
    } catch (err) {
      console.error('Error loading data for date range:', err);
    } finally {
      setCampaignsLoading(false);
    }
  };

  // Fetch initial general data
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Store Info
      const resStore = await fetch('/api/store/info');
      if (resStore.ok) {
        const store = await resStore.json();
        setStoreInfo({
          shop_name: store.shopName || 'Monture outdoor',
          shop_id: store.shopId || '1575219792',
          shop_region: store.shopRegion || 'ID'
        });
        setIsLive(store.isConnected);
      }

      // 2. Fetch Time Graph & Campaigns for initial range
      await loadDataForRange(dateRange);

      setLastUpdated(new Date().toLocaleTimeString('id-ID'));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      showToast('Gagal memuat beberapa data dari backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Re-fetch data every time dateRange changes
  useEffect(() => {
    loadDataForRange(dateRange);
  }, [dateRange]);

  // Sync Live Data from Shopee
  const handleLiveSync = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/ads/sync', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Sinkronisasi sukses! Data terbaru Shopee berhasil ditarik.', 'success');
        setIsLive(true);
        await fetchData();
      } else {
        showToast(data.message || 'Sesi Shopee kedaluwarsa. Silakan perbarui cURL.', 'error');
        setIsLive(false);
        setIsSettingsOpen(true);
      }
    } catch (err) {
      showToast('Gagal menghubungkan ke Shopee API: ' + err.message, 'error');
      setIsLive(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Compute filtered timeSeries based on dateRange
  const filteredTimeSeries = useMemo(() => {
    if (!timeGraph?.timeSeries || timeGraph.timeSeries.length === 0) return [];
    const list = timeGraph.timeSeries;

    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      return list;
    }

    const start = dateRange.startDate;
    const end = dateRange.endDate;

    const filtered = list.filter(item => {
      const d = item.fullDate;
      if (!d) return true;
      return d >= start && d <= end;
    });

    return filtered;
  }, [timeGraph, dateRange]);

  // Recalculate summary metrics based on selected datePreset
  const calculatedTotals = useMemo(() => {
    if (timeGraph?.isLiveFiltered && timeGraph?.summary) {
      return timeGraph.summary;
    }

    if (!filteredTimeSeries || filteredTimeSeries.length === 0) {
      if (!dateRange?.startDate && timeGraph?.summary) {
        return timeGraph.summary;
      }
      return {
        cost: 0,
        broad_gmv: 0,
        roas: 0,
        broad_order: 0,
        impression: 0,
        click: 0,
        cpc: 0,
        ctr: 0,
        broad_cart: 0
      };
    }

    const cost = filteredTimeSeries.reduce((acc, cur) => acc + (cur.cost || 0), 0);
    const gmv = filteredTimeSeries.reduce((acc, cur) => acc + (cur.broadGmv || cur.directGmv || 0), 0);
    const orders = filteredTimeSeries.reduce((acc, cur) => acc + (cur.orders || 0), 0);
    const impressions = filteredTimeSeries.reduce((acc, cur) => acc + (cur.impressions || 0), 0);
    const clicks = filteredTimeSeries.reduce((acc, cur) => acc + (cur.clicks || 0), 0);
    const carts = filteredTimeSeries.reduce((acc, cur) => acc + (cur.atc || 0), 0);
    const roas = cost > 0 ? gmv / cost : 0;
    const cpc = clicks > 0 ? cost / clicks : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return {
      cost,
      broad_gmv: gmv,
      roas,
      broad_order: orders,
      impression: impressions,
      click: clicks,
      cpc,
      ctr,
      broad_cart: carts
    };
  }, [filteredTimeSeries, timeGraph]);

  // Prepare chart dataset
  const chartData = useMemo(() => {
    if (!filteredTimeSeries || filteredTimeSeries.length === 0) {
      return { labels: [], cost: [], gmv: [], impression: [], click: [] };
    }
    return {
      labels: filteredTimeSeries.map(i => i.dateFormatted || i.fullDate),
      cost: filteredTimeSeries.map(i => i.cost),
      gmv: filteredTimeSeries.map(i => i.broadGmv),
      impression: filteredTimeSeries.map(i => i.impressions),
      click: filteredTimeSeries.map(i => i.clicks)
    };
  }, [filteredTimeSeries]);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        storeInfo={storeInfo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeModuleTab}
        setActiveTab={setActiveModuleTab}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Sticky Header */}
        <Header
          storeInfo={storeInfo}
          isLive={isLive}
          lastUpdated={lastUpdated}
          onRefresh={handleLiveSync}
          isRefreshing={isRefreshing}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Content Body */}
        <main className="content-body">
          {activeModuleTab === 'module1' ? (
            /* Modul 1: Dashboard Utama (Overview Toko - Lifetime) */
            <StoreOverview showToast={showToast} storeInfo={storeInfo} />
          ) : activeModuleTab === 'module3' ? (
            /* Modul 3: Master Data SKU & Kalkulator Margin */
            <ProductSkuManager showToast={showToast} />
          ) : activeModuleTab === 'module_eval' ? (
            /* Modul 4: Laporan Kinerja PIC & Tim */
            <MarketingPerformanceEvaluation showToast={showToast} storeInfo={storeInfo} />
          ) : (
            /* Modul 2: Performa Iklan */
            <>
              {/* Filter Bar with Shopee Date Range Picker */}
              <div className="filter-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    RENTANG WAKTU:
                  </span>
                  <ShopeeDateRangePicker
                    dateRange={dateRange}
                    onChange={setDateRange}
                  />
                </div>

                <div className="filter-info-tag">
                  <Clock size={13} />
                  <span>
                    Pembaruan Terakhir: <strong style={{ color: 'var(--text-secondary)' }}>{lastUpdated} WIB</strong>
                  </span>
                </div>
              </div>

              {/* KPI Scorecards Grid */}
              <section aria-label="KPI Ringkasan Iklan">
                <KpiGrid totals={calculatedTotals} />
              </section>

              {/* Interactive Trends Chart */}
              <section aria-label="Grafik Tren Iklan">
                <AdsCharts chartData={chartData} />
              </section>

              {/* Campaign Product Table with Filter & Evaluasi */}
              <section aria-label="Tabel Kampanye Iklan Produk">
                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Layers size={18} style={{ color: 'var(--color-brand-primary)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                      Daftar Kinerja Campaign Iklan Produk
                    </h3>
                    <span className="badge" style={{ backgroundColor: 'rgba(238, 77, 45, 0.12)', color: 'var(--color-brand-primary)', border: '1px solid rgba(238, 77, 45, 0.25)', fontSize: '11px', padding: '3px 8px' }}>
                      📅 {dateRange?.label || '1 Bulan Terakhir'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Total <strong>{campaigns.length}</strong> Kampanye Terdata
                  </span>
                </div>
                
                <CampaignTable 
                  campaigns={campaigns} 
                  dateRange={dateRange}
                  loading={campaignsLoading}
                />
              </section>
            </>
          )}
        </main>
      </div>

      {/* Settings Modal (Smart cURL Importer) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSessionUpdated={(info) => {
          if (info) {
            setStoreInfo({
              shop_name: info.shopName || 'Monture outdoor',
              shop_id: info.shopId || '1575219792',
              shop_region: info.shopRegion || 'ID'
            });
            setIsLive(info.isConnected);
            showToast('Sesi berhasil diperbarui dan diverifikasi!', 'success');
            fetchData();
          }
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="toast" id="app-toast">
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          )}
          <span style={{ color: 'var(--text-primary)' }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
