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
  onOpenSettings 
}) {
  const storeName = storeInfo?.shop_name || 'Monture outdoor';

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="header-title">
          <h2>Dashboard Performa Iklan</h2>
          <p>
            Toko: <strong style={{ color: 'var(--text-primary)' }}>{storeName}</strong> • Monitoring Metrik Iklan Shopee Real-Time
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
