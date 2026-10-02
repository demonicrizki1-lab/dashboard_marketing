import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  ExternalLink, 
  Sparkles,
  AlertTriangle,
  Award,
  HelpCircle,
  PackageX,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import CampaignDetailModal from './CampaignDetailModal';

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

export default function CampaignTable({ campaigns = [], dateRange, loading = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'ongoing' | 'paused' | 'ended' | 'deleted'
  const [selectedEval, setSelectedEval] = useState('all'); // 'all' | 'winning' | 'boncos' | 'potential'
  const [sortField, setSortField] = useState('broad_gmv'); // default sort by GMV desc
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const pageSize = 15;

  // Calculate status counts for pills
  const statusCounts = useMemo(() => {
    const counts = { all: campaigns.length, ongoing: 0, paused: 0, ended: 0, deleted: 0 };
    campaigns.forEach(c => {
      const st = (c.state || '').toLowerCase();
      if (counts[st] !== undefined) counts[st]++;
    });
    return counts;
  }, [campaigns]);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      // Status filter
      if (selectedStatus !== 'all' && (c.state || '').toLowerCase() !== selectedStatus) {
        return false;
      }

      // Eval filter
      if (selectedEval !== 'all' && (c.evaluation?.type || '').toLowerCase() !== selectedEval) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (c.title || '').toLowerCase().includes(q);
        const idMatch = String(c.campaign_id || '').includes(q) || String(c.item_id || '').includes(q);
        if (!titleMatch && !idMatch) return false;
      }

      return true;
    });
  }, [campaigns, selectedStatus, selectedEval, searchQuery]);

  // Sort campaigns
  const sortedCampaigns = useMemo(() => {
    return [...filteredCampaigns].sort((a, b) => {
      const getVal = (item, field) => {
        if (field === 'broad_gmv') return item.broad_gmv ?? item.gmv ?? 0;
        if (field === 'roas') return item.roas ?? item.roi ?? 0;
        if (field === 'broad_order') return item.broad_order ?? item.orders ?? 0;
        if (field === 'click') return item.click ?? item.clicks ?? 0;
        if (field === 'cost') return item.cost ?? 0;
        if (field === 'title') return (item.title || '').toLowerCase();
        return item[field] ?? 0;
      };

      let valA = getVal(a, sortField);
      let valB = getVal(b, sortField);

      if (sortField === 'title') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      valA = Number(valA || 0);
      valB = Number(valB || 0);

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCampaigns, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedCampaigns.length / pageSize) || 1;
  const paginatedCampaigns = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedCampaigns.slice(start, start + pageSize);
  }, [sortedCampaigns, page, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} style={{ opacity: 0.35 }} />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} style={{ color: 'var(--color-brand-primary)' }} />
    ) : (
      <ArrowDown size={12} style={{ color: 'var(--color-brand-primary)' }} />
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (sortedCampaigns.length === 0) return;
    
    const headers = [
      'Campaign ID',
      'Item ID',
      'Nama Produk',
      'Status',
      'Evaluasi',
      'Biaya (IDR)',
      'Omzet (IDR)',
      'ROAS',
      'Pesanan Langsung',
      'Total Pesanan',
      'Klik',
      'Tayangan',
      'CPC (IDR)'
    ];

    const rows = sortedCampaigns.map(c => [
      c.campaign_id || c.campaignId,
      c.item_id || c.itemId,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      c.state,
      c.evaluation?.label || '',
      c.cost,
      c.broad_gmv ?? c.gmv ?? 0,
      c.roas ?? c.roi ?? 0,
      c.direct_order ?? c.directOrder ?? 0,
      c.broad_order ?? c.orders ?? 0,
      c.click ?? c.clicks ?? 0,
      c.impression ?? c.impressions ?? 0,
      c.cpc
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shopee_ads_campaigns_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-section-card">
      {/* Table Toolbar */}
      <div className="table-header-toolbar">
        {/* Status Filter Pills */}
        <div className="status-pills-group">
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>
            STATUS:
          </span>
          <button
            className={`pill-btn ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => { setSelectedStatus('all'); setPage(1); }}
            id="filter-status-all"
          >
            Semua ({statusCounts.all})
          </button>
          <button
            className={`pill-btn ${selectedStatus === 'ongoing' ? 'active' : ''}`}
            onClick={() => { setSelectedStatus('ongoing'); setPage(1); }}
            id="filter-status-ongoing"
          >
            <span style={{ color: '#10B981' }}>●</span> Aktif ({statusCounts.ongoing})
          </button>
          <button
            className={`pill-btn ${selectedStatus === 'paused' ? 'active' : ''}`}
            onClick={() => { setSelectedStatus('paused'); setPage(1); }}
            id="filter-status-paused"
          >
            <span style={{ color: '#F59E0B' }}>●</span> Dijeda ({statusCounts.paused})
          </button>
          <button
            className={`pill-btn ${selectedStatus === 'ended' ? 'active' : ''}`}
            onClick={() => { setSelectedStatus('ended'); setPage(1); }}
            id="filter-status-ended"
          >
            <span style={{ color: '#3B82F6' }}>●</span> Selesai ({statusCounts.ended})
          </button>
          <button
            className={`pill-btn ${selectedStatus === 'deleted' ? 'active' : ''}`}
            onClick={() => { setSelectedStatus('deleted'); setPage(1); }}
            id="filter-status-deleted"
          >
            <span style={{ color: '#94A3B8' }}>●</span> Dihapus ({statusCounts.deleted})
          </button>
        </div>

        {/* Right Action: Search & CSV */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="table-search-bar">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Cari produk atau ID campaign..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              id="input-campaign-search"
            />
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            title="Download CSV tabel kampanye"
            id="btn-export-csv"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Sub-filter: Smart Evaluation Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        padding: '8px 24px', 
        backgroundColor: 'rgba(0, 0, 0, 0.15)', 
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '11px' 
      }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>EVALUASI CERDAS:</span>
        <button
          className={`preset-btn ${selectedEval === 'all' ? 'active' : ''}`}
          onClick={() => { setSelectedEval('all'); setPage(1); }}
          style={{ padding: '3px 8px', fontSize: '11px' }}
        >
          Semua
        </button>
        <button
          className={`preset-btn ${selectedEval === 'winning' ? 'active' : ''}`}
          onClick={() => { setSelectedEval('winning'); setPage(1); }}
          style={{ padding: '3px 8px', fontSize: '11px' }}
        >
          🏆 Winning
        </button>
        <button
          className={`preset-btn ${selectedEval === 'boncos' ? 'active' : ''}`}
          onClick={() => { setSelectedEval('boncos'); setPage(1); }}
          style={{ padding: '3px 8px', fontSize: '11px' }}
        >
          ⚠️ Boncos
        </button>
        <button
          className={`preset-btn ${selectedEval === 'potential' ? 'active' : ''}`}
          onClick={() => { setSelectedEval('potential'); setPage(1); }}
          style={{ padding: '3px 8px', fontSize: '11px' }}
        >
          🌱 Potensial
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ color: '#F97316', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>💡 Klik baris produk untuk rincian metrik lengkap</span>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            Menampilkan <strong>{sortedCampaigns.length}</strong> produk iklan
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-responsive">
        <table className="campaign-data-table">
          <thead>
            <tr>
              <th style={{ minWidth: '280px' }} className="sortable" onClick={() => handleSort('title')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Produk & Iklan</span>
                  {getSortIcon('title')}
                </div>
              </th>
              <th>Status</th>
              <th>Evaluasi Cerdas</th>
              <th className="sortable" onClick={() => handleSort('cost')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Biaya Iklan</span>
                  {getSortIcon('cost')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('broad_gmv')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Omzet (GMV)</span>
                  {getSortIcon('broad_gmv')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('roas')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>ROAS</span>
                  {getSortIcon('roas')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('broad_order')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Pesanan</span>
                  {getSortIcon('broad_order')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('click')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Klik & CPC</span>
                  {getSortIcon('click')}
                </div>
              </th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <RefreshCw size={24} className="spin-animation" style={{ color: 'var(--color-brand-primary)' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      Memperbarui data kampanye untuk periode {dateRange?.label || 'terpilih'}...
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Mengambil metrik performa langsung dari Shopee Ads
                    </span>
                  </div>
                </td>
              </tr>
            ) : paginatedCampaigns.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <PackageX size={32} strokeWidth={1.5} />
                    <p>Tidak ada campaign yang sesuai dengan filter atau pencarian Anda.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCampaigns.map((c) => {
                const imageUrl = c.image || (c.image_id ? `https://down-id.img.susercontent.com/file/${c.image_id}` : (c.imageId ? `https://down-id.img.susercontent.com/file/${c.imageId}` : null));
                const evalInfo = c.evaluation || { label: 'Pemantauan', type: 'monitoring' };
                const evalType = evalInfo.statusKey || evalInfo.type || 'monitoring';
                const state = (c.state || '').toLowerCase();
                const gmvVal = c.broad_gmv ?? c.gmv ?? 0;
                const roasVal = c.roas ?? c.roi ?? 0;
                const ordersVal = c.broad_order ?? c.orders ?? 0;
                const directOrdersVal = c.direct_order ?? c.directOrder ?? 0;
                const clicksVal = c.click ?? c.clicks ?? 0;
                const cpcVal = c.cpc ?? (clicksVal > 0 ? c.cost / clicksVal : 0);
                const campaignId = c.campaign_id || c.campaignId || '-';
                const itemId = c.item_id || c.itemId || '-';

                let statusBadgeClass = 'badge-ended';
                let statusLabel = state;
                if (state === 'ongoing') {
                  statusBadgeClass = 'badge-ongoing';
                  statusLabel = 'Aktif';
                } else if (state === 'paused') {
                  statusBadgeClass = 'badge-paused';
                  statusLabel = 'Dijeda';
                } else if (state === 'ended') {
                  statusBadgeClass = 'badge-ended';
                  statusLabel = 'Selesai';
                } else if (state === 'deleted') {
                  statusBadgeClass = 'badge-deleted';
                  statusLabel = 'Dihapus';
                }

                return (
                  <tr 
                    key={campaignId} 
                    className="campaign-row-clickable"
                    onClick={() => setSelectedCampaign(c)}
                    title="Klik baris untuk membuka rincian metrik lengkap produk ini"
                  >
                    {/* Produk & Judul */}
                    <td>
                      <div className="product-cell">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="product-thumb"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="product-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No Img</span>
                          </div>
                        )}
                        <div className="product-details">
                          <span className="product-title" title={c.title}>
                            {c.title || 'Produk Iklan Shopee'}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            ID: <span className="tabular-nums">{campaignId}</span> • Item: <span className="tabular-nums">{itemId}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={`badge ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>

                    {/* Evaluasi Cerdas */}
                    <td>
                      <span className={`badge-eval badge-${evalType}`}>
                        {evalInfo.label}
                      </span>
                    </td>

                    {/* Biaya */}
                    <td className="tabular-nums" style={{ fontWeight: 600 }}>
                      {formatRupiah(c.cost)}
                    </td>

                    {/* Omzet */}
                    <td className="tabular-nums" style={{ fontWeight: 600, color: gmvVal > 0 ? 'var(--color-success)' : 'inherit' }}>
                      {formatRupiah(gmvVal)}
                    </td>

                    {/* ROAS */}
                    <td className="tabular-nums">
                      <strong style={{ 
                        color: roasVal >= 2.0 ? 'var(--color-success)' : roasVal >= 1.0 ? 'var(--color-info)' : c.cost > 0 ? 'var(--color-danger)' : 'var(--text-muted)',
                        fontSize: '13px'
                      }}>
                        {roasVal > 0 ? `${roasVal.toFixed(2)}x` : '-'}
                      </strong>
                    </td>

                    {/* Pesanan */}
                    <td className="tabular-nums">
                      <div>
                        <strong>{formatNumber(ordersVal)}</strong> <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>order</span>
                      </div>
                      {directOrdersVal > 0 && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {directOrdersVal} langsung
                        </div>
                      )}
                    </td>

                    {/* Klik & CPC */}
                    <td className="tabular-nums">
                      <div>{formatNumber(clicksVal)} klik</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        CPC {formatRupiah(cpcVal)}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon-only"
                          onClick={(e) => { e.stopPropagation(); setSelectedCampaign(c); }}
                          title="Buka Rincian Metrik Lengkap"
                          style={{ padding: '6px', borderRadius: 'var(--radius-xs)' }}
                        >
                          <BarChart2 size={13} style={{ color: 'var(--color-brand-primary)' }} />
                        </button>
                        <a
                          href={`https://seller.shopee.co.id/portal/marketing/pas/index?item_id=${itemId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="product-link"
                          title="Tinjau di Shopee Seller Center"
                          onClick={(e) => e.stopPropagation()}
                          style={{ padding: '4px' }}
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Campaign Detail Modal */}
      <CampaignDetailModal
        campaign={selectedCampaign}
        isOpen={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
      />

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '14px 24px', 
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(0, 0, 0, 0.1)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Halaman <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> dari {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Sebelumnya
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
