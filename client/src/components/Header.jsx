import React from 'react';
import { 
  RefreshCw, 
  Settings, 
  Sparkles, 
  Store, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

export default function Header({ 
  storeInfo, 
  isLive, 
  lastUpdated, 
  onRefresh, 
  isRefreshing, 
  onOpenSettings,
  activeTab = 'module2'
}) {
  const storeName = storeInfo?.shop_name || 'Monture outdoor';

  // Dynamic Header Title & Description based on Active Navigation Tab
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'module1':
        return {
          title: 'Ringkasan Bisnis (Overview Toko)',
          subtitle: `Toko: ${storeName} • Monitoring Pendapatan & Multi-Channel Traffic Shopee`
        };
      case 'module3':
        return {
          title: 'Master Data SKU & Unit Economics',
          subtitle: `Toko: ${storeName} • Kalkulator Margin & Plafon Biaya Iklan (CPR 25% / CAC 40%)`
        };
      case 'module_eval':
        return {
          title: 'Laporan Kinerja PIC & Tim Marketing',
          subtitle: `Toko: ${storeName} • Evaluasi Kinerja PIC Lama vs Baru & Audit Finansial Historis`
        };
      case 'module2':
      default:
        return {
          title: 'Dashboard Performa Iklan',
          subtitle: `Toko: ${storeName} • Monitoring Metrik Iklan Shopee Real-Time`
        };
    }
  };

  const currentInfo = getHeaderInfo();

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="header-title">
          <h2>{currentInfo.title}</h2>
          <p>
            Toko: <strong style={{ color: 'var(--text-primary)' }}>{storeName}</strong> • {currentInfo.subtitle.split('• ')[1] || 'Shopee Command Hub'}
          </p>
        </div>
      </div>

      <div className="header-actions">
        {/* Connection Status Badge */}
        <div 
          className={`health-badge ${isLive ? 'connected' : 'disconnected'}`}
          onClick={onOpenSettings}
          title={isLive ? 'Sesi Shopee aktif & terhubung secara live' : 'Sesi perlu diperbarui via cURL Importer'}
          id="badge-connection-status"
        >
          <span className="health-dot"></span>
          <span>{isLive ? 'Terhubung Live' : 'Sesi Offline'}</span>
        </div>

        {/* Sync Button */}
        <button
          className="btn btn-primary"
          onClick={onRefresh}
          disabled={isRefreshing}
          id="btn-sync-data"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin-animation' : ''} />
          <span>{isRefreshing ? 'Sinkronisasi...' : 'Tarik Data Baru'}</span>
        </button>

        {/* Settings Button */}
        <button
          className="btn btn-secondary btn-icon-only"
          onClick={onOpenSettings}
          title="Buka Pengaturan Token & cURL Importer"
          id="btn-open-settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
