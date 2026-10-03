import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Tag, 
  Users, 
  Settings, 
  Store, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ storeInfo, onOpenSettings, activeTab, setActiveTab }) {
  const navItems = [
    { id: 'module1', label: '1. Ringkasan Bisnis (Overview)', icon: BarChart3, badge: 'Aktif', disabled: false },
    { id: 'module2', label: '2. Performa Iklan', icon: TrendingUp, badge: 'Aktif', disabled: false },
    { id: 'module3', label: '3. Master Data SKU & Margin', icon: Package, badge: 'Aktif', disabled: false },
    { id: 'module4', label: '4. Program Promosi', icon: Tag, badge: 'Segera', disabled: true },
    { id: 'module5', label: '5. Analisis Pelanggan', icon: Users, badge: 'Segera', disabled: true },
  ];

  const storeName = storeInfo?.shop_name || 'Monture outdoor';
  const shopId = storeInfo?.shop_id || '1575219792';
  const initial = storeName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand-icon">
          <TrendingUp size={20} strokeWidth={2.4} />
        </div>
        <div className="sidebar-brand-text">
          <h1>Shopee Analytics</h1>
          <span>Seller Command Hub</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Modul Marketing PRD</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => !item.disabled && setActiveTab && setActiveTab(item.id)}
              disabled={item.disabled}
              title={item.disabled ? 'Modul dalam pengembangan berikutnya' : item.label}
              style={{ opacity: item.disabled ? 0.6 : 1, cursor: item.disabled ? 'not-allowed' : 'pointer' }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="nav-item-badge">{item.badge}</span>
              )}
            </button>
          );
        })}

        <div className="nav-section-title" style={{ marginTop: '16px' }}>Konfigurasi & Akses</div>
        
        <button 
          className="nav-item" 
          onClick={onOpenSettings}
          id="btn-sidebar-settings"
        >
          <Settings size={18} />
          <span>Pengaturan Sesi API</span>
          <span className="nav-item-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>cURL</span>
        </button>

        <a 
          href="https://seller.shopee.co.id/portal/marketing/pas/index" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="nav-item"
        >
          <ExternalLink size={18} />
          <span>Shopee Seller Center</span>
        </a>
      </nav>

      {/* Store Footer Profile */}
      <div className="sidebar-footer">
        <div className="store-card">
          <div className="store-avatar">
            {initial}
          </div>
          <div className="store-info" style={{ overflow: 'hidden' }}>
            <h4 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {storeName}
            </h4>
            <p className="tabular-nums">ID: {shopId} • Region ID</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
