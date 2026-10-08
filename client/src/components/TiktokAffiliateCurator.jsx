import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  RefreshCw,
  Search,
  Filter,
  Play,
  Eye,
  ShoppingBag,
  ExternalLink,
  Copy,
  Settings,
  ShieldAlert,
  Sparkles,
  Layers,
  Award,
  Video,
  Clock,
  Check,
  X,
  UserCheck,
  UserX,
  TrendingUp,
  Percent,
  Tag,
  Bot,
  FileJson,
  Terminal,
  ArrowDownToLine
} from 'lucide-react';
import TiktokVideoModal from './TiktokVideoModal';

export default function TiktokAffiliateCurator({ showToast }) {
  const [samples, setSamples] = useState([]);
  const [summary, setSummary] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCurating, setIsCurating] = useState(false);
  
  // Selected creator for right detail panel (Split View)
  const [selectedApplyId, setSelectedApplyId] = useState(null);

  // Video modal
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeVideoCreator, setActiveVideoCreator] = useState('');
  
  // Filters & Search
  const [statusTab, setStatusTab] = useState('all'); // all | approved | rejected | star
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // Modal Sesi & Import Data (Tab: 'json' | 'curl')
  const [isCurlModalOpen, setIsCurlModalOpen] = useState(false);
  const [importTab, setImportTab] = useState('json');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonSubmitting, setJsonSubmitting] = useState(false);
  const [curlInput, setCurlInput] = useState('');
  const [curlSubmitting, setCurlSubmitting] = useState(false);

  // Fetch initial summary & samples
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSamples, resSummary, resSession] = await Promise.all([
        fetch('/api/tiktok/samples'),
        fetch('/api/tiktok/summary'),
        fetch('/api/tiktok/session')
      ]);

      if (resSamples.ok) {
        const data = await resSamples.json();
        const list = data.samples || [];
        setSamples(list);
        if (list.length > 0 && !selectedApplyId) {
          setSelectedApplyId(list[0].apply_id);
        }
      }
      if (resSummary.ok) {
        setSummary(await resSummary.json());
      }
      if (resSession.ok) {
        setSessionInfo(await resSession.json());
      }
    } catch (err) {
      console.error('Error fetching TikTok curation data:', err);
      showToast?.('Gagal memuat data kurasi TikTok: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Run Curation Engine
  const handleRunCuration = async (force = false) => {
    try {
      setIsCurating(true);
      const res = await fetch('/api/tiktok/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      if (res.ok) {
        showToast?.(`Kurasi 7 KPI berhasil! ${data.newly_curated} permohonan baru selesai dievaluasi.`, 'success');
        fetchData();
      } else {
        showToast?.('Gagal menjalankan kurasi: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast?.('Error eksekusi kurasi: ' + err.message, 'error');
    } finally {
      setIsCurating(false);
    }
  };

  // Sync Live from TikTok API
  const handleSyncLive = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/tiktok/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, pageSize: 50 })
      });
      const data = await res.json();
      if (res.ok) {
        showToast?.(`Sinkronisasi sukses! Berhasil menarik ${data.total_fetched} pengajuan dari TikTok.`, 'success');
        fetchData();
      } else {
        const errorMsg = data.error || 'Periksa sesi cURL TikTok Anda';
        showToast?.('Gagal sinkronisasi: ' + errorMsg, 'error');
        // Jika error signature expired / Code 10000, arahkan user ke Tab Import Response JSON
        if (errorMsg.includes('10000') || errorMsg.includes('Signature') || errorMsg.includes('X-Bogus')) {
          setImportTab('json');
          setIsCurlModalOpen(true);
        }
      }
    } catch (err) {
      showToast?.('Error sinkronisasi: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Update Status Manual Override
  const handleUpdateStatus = async (applyId, newStatus) => {
    try {
      const res = await fetch('/api/tiktok/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyId, status: newStatus, note: 'Diubah manual oleh PIC Marketing' })
      });
      if (res.ok) {
        showToast?.(`Status permohonan diubah menjadi ${newStatus}.`, 'success');
        setSamples(prev => prev.map(s => s.apply_id === applyId ? { ...s, status: newStatus } : s));
        const resSum = await fetch('/api/tiktok/summary');
        if (resSum.ok) setSummary(await resSum.json());
      } else {
        showToast?.('Gagal mengubah status', 'error');
      }
    } catch (err) {
      showToast?.('Error updating status: ' + err.message, 'error');
    }
  };

  // Audit Keaslian Video (Tandai AI / Real Human)
  const handleAuditAi = async (applyId, isAi) => {
    try {
      const res = await fetch('/api/tiktok/audit-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          applyId, 
          isAi, 
          note: isAi ? 'Ditandai manual oleh PIC Marketing: Konten AI / Bot Slideshow' : 'Diverifikasi manual oleh PIC Marketing: Real Human Try-On'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast?.(
          isAi 
            ? 'Creator berhasil ditandai sebagai AI dan OTOMATIS DIGUGURKAN (HPP Terlindungi).' 
            : 'Creator diverifikasi sebagai Real Human Creator.', 
          isAi ? 'warning' : 'success'
        );
        setSamples(prev => prev.map(s => s.apply_id === applyId ? data.updated : s));
        const resSum = await fetch('/api/tiktok/summary');
        if (resSum.ok) setSummary(await resSum.json());
      } else {
        showToast?.('Gagal mengupdate audit keaslian: ' + (data.error || 'Server error'), 'error');
      }
    } catch (err) {
      showToast?.('Error audit AI: ' + err.message, 'error');
    }
  };

  // Import Response JSON dari DevTools
  const handleImportJson = async (e) => {
    e.preventDefault();
    if (!jsonInput.trim()) {
      showToast?.('Silakan paste data Response JSON dari DevTools terlebih dahulu.', 'error');
      return;
    }
    try {
      setJsonSubmitting(true);
      const res = await fetch('/api/tiktok/import-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: jsonInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast?.(data.message || `Berhasil mengimpor ${data.total_imported} pengajuan sampel!`, 'success');
        setIsCurlModalOpen(false);
        setJsonInput('');
        fetchData();
      } else {
        showToast?.('Gagal mengimpor JSON: ' + (data.error || 'Format tidak valid'), 'error');
      }
    } catch (err) {
      showToast?.('Error import JSON: ' + err.message, 'error');
    } finally {
      setJsonSubmitting(false);
    }
  };

  // Submit cURL TikTok Session
  const handleSubmitCurl = async (e) => {
    e.preventDefault();
    if (!curlInput.trim()) {
      showToast?.('Perintah cURL wajib diisi.', 'error');
      return;
    }
    try {
      setCurlSubmitting(true);
      const res = await fetch('/api/tiktok/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curl: curlInput })
      });
      const data = await res.json();
      if (res.ok) {
        showToast?.('Sesi cURL TikTok berhasil disimpan dan aktif!', 'success');
        setIsCurlModalOpen(false);
        setCurlInput('');
        fetchData();
      } else {
        showToast?.('Gagal memproses cURL: ' + (data.error || 'Format tidak valid'), 'error');
      }
    } catch (err) {
      showToast?.('Error import cURL: ' + err.message, 'error');
    } finally {
      setCurlSubmitting(false);
    }
  };

  // Copy Username
  const handleCopyUsername = (username) => {
    navigator.clipboard.writeText(username);
    showToast?.(`Username @${username} berhasil disalin!`, 'success');
  };

  // Filtered & Sorted Samples
  const filteredSamples = useMemo(() => {
    let result = [...samples];

    // Filter Status Tab
    if (statusTab === 'approved') {
      result = result.filter(s => s.status === 'APPROVED');
    } else if (statusTab === 'rejected') {
      result = result.filter(s => s.status === 'REJECTED');
    } else if (statusTab === 'star') {
      result = result.filter(s => s.is_star_creator === true);
    } else if (statusTab === 'expired') {
      result = result.filter(s => s.is_expired === true);
    }

    // Filter Kategori
    if (categoryFilter !== 'all') {
      result = result.filter(s => 
        (s.categories || []).some(c => c.toLowerCase().includes(categoryFilter.toLowerCase()))
      );
    }

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(s => 
        s.creator_name.toLowerCase().includes(q) ||
        s.creator_nickname.toLowerCase().includes(q) ||
        s.product_title.toLowerCase().includes(q) ||
        s.sku_desc.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'gmv_desc') {
      result.sort((a, b) => b.gmv_number - a.gmv_number);
    } else if (sortBy === 'views_desc') {
      result.sort((a, b) => b.max_views - a.max_views);
    } else if (sortBy === 'level_desc') {
      result.sort((a, b) => b.ecom_level - a.ecom_level);
    } else if (sortBy === 'fulfillment_desc') {
      result.sort((a, b) => b.fulfillment_rate - a.fulfillment_rate);
    } else if (sortBy === 'expiry_asc') {
      result.sort((a, b) => (a.expires_at || 0) - (b.expires_at || 0));
    } else {
      // Default: Yang belum kadaluarsa dulu, lalu Approved, lalu Star Creator, lalu GMV
      result.sort((a, b) => {
        if (!a.is_expired && b.is_expired) return -1;
        if (a.is_expired && !b.is_expired) return 1;
        if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
        if (a.status !== 'APPROVED' && b.status === 'APPROVED') return 1;
        if (a.is_star_creator && !b.is_star_creator) return -1;
        if (!a.is_star_creator && b.is_star_creator) return 1;
        return b.gmv_number - a.gmv_number;
      });
    }

    return result;
  }, [samples, statusTab, categoryFilter, searchTerm, sortBy]);

  // Keep selectedApplyId valid when filters change
  useEffect(() => {
    if (filteredSamples.length > 0) {
      const exists = filteredSamples.some(s => s.apply_id === selectedApplyId);
      if (!exists) {
        setSelectedApplyId(filteredSamples[0].apply_id);
      }
    }
  }, [filteredSamples, selectedApplyId]);

  // Active creator details
  const activeCreator = useMemo(() => {
    return samples.find(s => s.apply_id === selectedApplyId) || filteredSamples[0] || null;
  }, [samples, selectedApplyId, filteredSamples]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. Header Control Bar */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(28, 36, 59, 0.9) 0%, rgba(14, 19, 34, 0.95) 100%)',
          border: '1px solid var(--border-highlight)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div 
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#07101e',
              boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)',
              flexShrink: 0
            }}
          >
            <ShieldCheck size={24} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                Monture TikTok Affiliate Sample Curation
              </h2>
              <span 
                className="badge" 
                style={{
                  background: 'rgba(0, 242, 254, 0.12)',
                  color: '#00f2fe',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px'
                }}
              >
                Split View Curation
              </span>
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: sessionInfo?.isConnected ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: sessionInfo?.isConnected ? 'var(--color-success)' : 'var(--color-danger)',
                  border: `1px solid ${sessionInfo?.isConnected ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`
                }}
              >
                <span 
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: sessionInfo?.isConnected ? 'var(--color-success)' : 'var(--color-danger)'
                  }} 
                />
                {sessionInfo?.isConnected ? 'Sesi TikTok Aktif' : 'Perlu Sesi cURL'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', marginBottom: 0 }}>
              Evaluasi cepat calon affiliator: Pilih creator di sebelah kiri, periksa detail metrik dan preview video di sebelah kanan.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleRunCuration(true)}
            disabled={isCurating || loading}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Evaluasi ulang seluruh pengajuan sampel dengan 7 KPI"
          >
            <Sparkles size={14} className={isCurating ? 'animate-spin' : ''} style={{ color: 'var(--color-warning)' }} />
            {isCurating ? 'Mengevaluasi...' : 'Evaluasi 7 KPI'}
          </button>

          <button
            onClick={handleSyncLive}
            disabled={isSyncing || loading}
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #EE4D2D 0%, #D73C1E 100%)' }}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Menarik...' : 'Sync Live'}
          </button>

          <button
            onClick={() => setIsCurlModalOpen(true)}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Kelola Sesi cURL atau Impor Response JSON dari DevTools"
          >
            <ArrowDownToLine size={14} />
            <span>Sesi & Impor Data</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Scorecards Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}
      >
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Pengajuan</span>
            <Layers size={15} style={{ color: 'var(--color-info)' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {summary?.total_samples || samples.length} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>creator</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', padding: '14px 18px', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, var(--bg-card) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-success)' }}>Direkomendasikan</span>
            <CheckCircle2 size={15} style={{ color: 'var(--color-success)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-success)' }}>
              {summary?.approved_count || 0}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-success)' }}>
              ({summary?.pass_rate || 0}% lolos)
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', padding: '14px 18px', background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.04) 0%, var(--bg-card) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-danger)' }}>Ditolak Otomatis</span>
            <XCircle size={15} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-danger)' }}>
            {summary?.rejected_count || 0} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>creator</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-md)', padding: '14px 18px', background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, var(--bg-card) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-warning)' }}>HPP Terlindungi</span>
            <ShieldAlert size={15} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-warning)' }}>
            {summary?.saved_hpp_formatted || 'Rp0'}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 'var(--radius-md)', padding: '14px 18px', background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.04) 0%, var(--bg-card) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Telah Kadaluarsa</span>
            <Clock size={15} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#94A3B8' }}>
              {summary?.expired_count || 0}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              ({summary?.active_count || 0} aktif)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div 
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        {/* Status Tab Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Semua (${samples.length})` },
            { id: 'approved', label: `✅ Lolos (${summary?.approved_count || 0})` },
            { id: 'star', label: `⭐ Star (${summary?.star_creators_count || 0})` },
            { id: 'rejected', label: `🚫 Gugur (${summary?.rejected_count || 0})` },
            { id: 'expired', label: `⏰ Kadaluarsa (${summary?.expired_count || 0})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: statusTab === tab.id ? '1px solid var(--border-highlight)' : '1px solid transparent',
                backgroundColor: statusTab === tab.id ? 'var(--bg-surface-elevated)' : 'transparent',
                color: statusTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '200px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Cari creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px 6px 30px',
                fontSize: '12px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">Semua Kategori</option>
            <option value="Menswear">Pakaian Pria</option>
            <option value="Sports">Olahraga & Outdoor</option>
            <option value="Shoes">Sepatu & Aksesoris</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="default">Rekomendasi Utama (Aktif Didahulukan)</option>
            <option value="expiry_asc">Batas Waktu Terdekat (Deadline)</option>
            <option value="gmv_desc">GMV Tertinggi</option>
            <option value="views_desc">Views Terbanyak</option>
            <option value="level_desc">Level Tertinggi</option>
            <option value="fulfillment_desc">Fulfillment Tertinggi</option>
          </select>
        </div>
      </div>

      {/* 4. SPLIT VIEW CONTAINER (Master List Kiri 380px, Detail Kanan 1fr) */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '380px 1fr',
          gap: '18px',
          alignItems: 'stretch',
          height: 'calc(100vh - 220px)',
          minHeight: '700px'
        }}
      >
        {/* ============================================================ */}
        {/* PANEL KIRI: LIST CREATOR RINGKAS (COMPACT MASTER LIST)      */}
        {/* ============================================================ */}
        <div 
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Header Panel Kiri */}
          <div 
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Daftar Creator ({filteredSamples.length})
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Klik untuk inspeksi detail ➔
            </span>
          </div>

          {/* List Items Container (Scrollable) */}
          <div 
            style={{
              overflowY: 'auto',
              flex: 1,
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '12px' }}>Memuat daftar creator...</p>
              </div>
            ) : filteredSamples.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
                Tidak ada creator yang cocok dengan filter.
              </div>
            ) : (
              filteredSamples.map((item) => {
                const isSelected = item.apply_id === selectedApplyId;
                const isApproved = item.status === 'APPROVED';
                const isStar = item.is_star_creator;

                return (
                  <div
                    key={item.apply_id}
                    onClick={() => setSelectedApplyId(item.apply_id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      border: isSelected 
                        ? '1px solid var(--color-info)' 
                        : (item.is_expired ? '1px dashed rgba(148, 163, 184, 0.25)' : '1px solid transparent'),
                      backgroundColor: isSelected 
                        ? 'rgba(59, 130, 246, 0.12)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      opacity: item.is_expired ? 0.78 : 1,
                      transition: 'all 0.15s ease-in-out',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    }}
                  >
                    {/* Baris 1: Avatar + Level + Nama + Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {item.avatar_url ? (
                            <img 
                              src={item.avatar_url} 
                              alt={item.creator_name} 
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div 
                              style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                backgroundColor: 'var(--bg-surface-elevated)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyItems: 'center', 
                                fontSize: '13px', 
                                fontWeight: 700 
                              }}
                            >
                              {item.creator_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span 
                            style={{
                              position: 'absolute',
                              bottom: '-3px',
                              right: '-3px',
                              fontSize: '8px',
                              fontWeight: 800,
                              padding: '1px 3px',
                              borderRadius: '4px',
                              backgroundColor: item.ecom_level >= 5 ? '#8B5CF6' : (item.ecom_level >= 2 ? '#3B82F6' : '#64748B'),
                              color: '#fff'
                            }}
                          >
                            L{item.ecom_level}
                          </span>
                        </div>

                        {/* Nama */}
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              @{item.creator_name}
                            </span>
                            {isStar && <Star size={11} fill="#F59E0B" color="#F59E0B" />}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.creator_nickname}
                          </div>
                        </div>
                      </div>

                      {/* Pill Status & Expiry */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        {item.is_expired ? (
                          <span 
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '2px 5px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(148, 163, 184, 0.15)',
                              color: '#94A3B8',
                              border: '1px solid rgba(148, 163, 184, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                            title={`Batas waktu peninjauan TikTok telah lewat: ${item.expires_at_formatted || ''}`}
                          >
                            <Clock size={9} /> Kadaluarsa
                          </span>
                        ) : (
                          <span 
                            style={{
                              fontSize: '9px',
                              fontWeight: 600,
                              padding: '2px 5px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: '#60A5FA',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                            title={`Batas respon: ${item.expires_at_formatted || ''}`}
                          >
                            <Clock size={9} /> {item.time_left_text}
                          </span>
                        )}

                        <span 
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: isApproved ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                            color: isApproved ? 'var(--color-success)' : 'var(--color-danger)',
                            border: `1px solid ${isApproved ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`
                          }}
                        >
                          {isApproved ? '✓ Lolos' : (item.is_real_human === false ? '🤖 AI' : '✕ Gugur')}
                        </span>
                      </div>
                    </div>

                    {/* Baris 2: Metrik Singkat (GMV | Views | Fulfillment) */}
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        fontSize: '11px', 
                        color: 'var(--text-secondary)',
                        paddingTop: '4px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>GMV:</span>{' '}
                        <strong style={{ color: isStar ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                          {item.gmv || 'Rp0'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Views:</span>{' '}
                        <strong style={{ color: item.max_views >= 500 ? 'var(--color-info)' : 'var(--text-primary)' }}>
                          {item.avg_views}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Fulfill:</span>{' '}
                        <strong style={{ color: item.fulfillment_rate >= 80 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {item.fulfillment_rate}%
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* PANEL KANAN: DETAIL INSPECTOR CREATOR (STICKY / DEEP DIVE)   */}
        {/* ============================================================ */}
        <div 
          style={{
            backgroundColor: 'var(--bg-card)',
            border: activeCreator?.status === 'APPROVED' 
              ? (activeCreator?.is_star_creator ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--color-success-border)')
              : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            boxShadow: 'var(--shadow-md)',
            height: '100%',
            overflowY: 'auto'
          }}
        >
          {activeCreator ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header Inspector: Profile + Quick Action Buttons */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                {/* Profil Utama */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {activeCreator.avatar_url ? (
                    <img 
                      src={activeCreator.avatar_url} 
                      alt={activeCreator.creator_name} 
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-highlight)' }} 
                    />
                  ) : (
                    <div 
                      style={{ 
                        width: '56px', 
                        height: '56px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--bg-surface-elevated)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 700,
                        border: '2px solid var(--border-highlight)'
                      }}
                    >
                      {activeCreator.creator_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        @{activeCreator.creator_name}
                      </h3>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        ({activeCreator.creator_nickname})
                      </span>

                      <a 
                        href={`https://www.tiktok.com/@${activeCreator.creator_name}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        title="Buka Profil di TikTok"
                        style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <ExternalLink size={14} />
                      </a>

                      <button 
                        onClick={() => handleCopyUsername(activeCreator.creator_name)}
                        title="Salin Username"
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    {/* Badge Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span 
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: activeCreator.ecom_level >= 5 ? '#8B5CF6' : (activeCreator.ecom_level >= 2 ? '#3B82F6' : '#64748B'),
                          color: '#fff'
                        }}
                      >
                        Tier Level {activeCreator.ecom_level}
                      </span>

                      {activeCreator.is_star_creator && (
                        <span 
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--color-warning-bg)',
                            color: 'var(--color-warning)',
                            border: '1px solid var(--color-warning-border)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Star size={12} fill="currentColor" /> STAR CREATOR (GMV 30Jt+)
                        </span>
                      )}

                      {/* Badge Keaslian Konten AI vs Real */}
                      <span 
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: activeCreator.is_real_human !== false ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                          color: activeCreator.is_real_human !== false ? 'var(--color-success)' : 'var(--color-danger)',
                          border: `1px solid ${activeCreator.is_real_human !== false ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {activeCreator.is_real_human !== false ? (
                          <>
                            <ShieldCheck size={12} /> Real Try-On Fisik
                          </>
                        ) : (
                          <>
                            <Bot size={12} /> 🤖 Terindikasi AI / Bot
                          </>
                        )}
                      </span>

                      {(activeCreator.categories || []).map((cat, idx) => (
                        <span 
                          key={idx}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tombol Panduan & Eksekusi Manual di TikTok Seller */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href="https://affiliate-id.tokopedia.com/affiliate/sample/sample-request?tab=10&shop_region=ID&shop_id=7494826103548118725"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: 'var(--color-brand-primary, #4F46E5)',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
                    }}
                    title="Buka halaman permohonan sampel di TikTok Shop Seller Center"
                  >
                    <ExternalLink size={14} />
                    <span>Buka di TikTok Seller</span>
                  </a>

                  <button
                    onClick={() => handleCopyUsername(activeCreator.creator_name)}
                    className="btn btn-secondary"
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Salin username creator untuk dicari di TikTok Seller Center"
                  >
                    <Copy size={13} />
                    <span>Salin Username</span>
                  </button>

                  <button
                    onClick={() => handleAuditAi(activeCreator.apply_id, activeCreator.is_real_human !== false)}
                    className="btn btn-secondary"
                    title={activeCreator.is_real_human !== false ? "Tandai creator ini sebagai konten AI (Otomatis Gugur)" : "Kembalikan status Real Human"}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: activeCreator.is_real_human === false ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-input)',
                      color: activeCreator.is_real_human === false ? 'var(--color-danger)' : 'var(--text-secondary)',
                      border: activeCreator.is_real_human === false ? '1px solid var(--color-danger-border)' : '1px solid var(--border-subtle)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Bot size={14} style={{ color: activeCreator.is_real_human === false ? 'var(--color-danger)' : 'var(--text-muted)' }} />
                    <span>{activeCreator.is_real_human === false ? 'Telah Ditandai AI' : 'Tandai AI (Gugur)'}</span>
                  </button>
                </div>
              </div>

              {/* Expiry Banner / Time Indicator */}
              {activeCreator.is_expired ? (
                <div 
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px'
                  }}
                >
                  <AlertTriangle size={20} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>PERMOHONAN SAMPEL TELAH KADALUARSA</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.25)', color: '#fff' }}>
                        {activeCreator.time_left_text}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.5 }}>
                      Batas respon 7 hari di TikTok Shop telah lewat ({activeCreator.expires_at_formatted}). Di portal TikTok Seller Center, permohonan ini otomatis dibatalkan/kadaluarsa oleh sistem TikTok sehingga tidak perlu diproses lagi.
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={15} style={{ color: '#60A5FA' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Sisa Batas Waktu Respon TikTok: <strong style={{ color: '#60A5FA' }}>{activeCreator.time_left_text}</strong> (Batas: {activeCreator.expires_at_formatted})
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Diajukan: <strong style={{ color: 'var(--text-secondary)' }}>{activeCreator.create_date_formatted}</strong>
                  </div>
                </div>
              )}

              {/* Executive Decision & Alasan Rekomendasi Card (Redesigned for Maximum Clarity) */}
              <div 
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: activeCreator.status === 'APPROVED' 
                    ? (activeCreator.is_star_creator ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.35)') 
                    : '1px solid rgba(239, 68, 68, 0.35)',
                  backgroundColor: activeCreator.status === 'APPROVED'
                    ? (activeCreator.is_star_creator ? 'rgba(245, 158, 11, 0.04)' : 'rgba(16, 185, 129, 0.04)')
                    : 'rgba(239, 68, 68, 0.04)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Header Bar: Status Badge + Subtitle */}
                <div 
                  style={{
                    padding: '12px 18px',
                    backgroundColor: activeCreator.status === 'APPROVED'
                      ? (activeCreator.is_star_creator ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)')
                      : 'rgba(239, 68, 68, 0.12)',
                    borderBottom: activeCreator.status === 'APPROVED'
                      ? (activeCreator.is_star_creator ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)')
                      : '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        backgroundColor: activeCreator.status === 'APPROVED' 
                          ? (activeCreator.is_star_creator ? '#F59E0B' : '#10B981') 
                          : '#EF4444',
                        color: activeCreator.status === 'APPROVED' && activeCreator.is_star_creator ? '#000' : '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                    >
                      {activeCreator.status === 'APPROVED' ? (
                        activeCreator.is_star_creator ? <Star size={13} fill="currentColor" /> : <CheckCircle2 size={13} strokeWidth={2.5} />
                      ) : (
                        <XCircle size={13} strokeWidth={2.5} />
                      )}
                      {activeCreator.status === 'APPROVED' 
                        ? (activeCreator.is_star_creator ? 'STAR CREATOR • PRIORITAS APPROVE' : 'DIREKOMENDASIKAN APPROVE')
                        : 'TIDAK DIREKOMENDASIKAN (GUGUR)'}
                    </div>

                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {activeCreator.status === 'APPROVED' ? 'Lolos Evaluasi Otomatis 7 KPI Monture' : 'Gugur Pada Kriteria KPI Wajib'}
                    </span>
                  </div>

                  <div 
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: activeCreator.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: activeCreator.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-danger)',
                      border: `1px solid ${activeCreator.status === 'APPROVED' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`
                    }}
                  >
                    {activeCreator.status === 'APPROVED' ? 'Alokasi Sampel: Layak Kirim' : 'Alokasi Sampel: Hemat HPP Rp150.000'}
                  </div>
                </div>

                {/* Main Content Body */}
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Narrative Reason - Large, High Contrast, Clear */}
                  <div 
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div 
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: activeCreator.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: activeCreator.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-danger)'
                      }}
                    >
                      {activeCreator.status === 'APPROVED' ? <Sparkles size={16} /> : <AlertTriangle size={16} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '3px' }}>
                        {activeCreator.status === 'APPROVED' ? 'Kesimpulan Kurasi Sistem' : 'Alasan Keguguran / Titik Kritis'}
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                        {activeCreator.status === 'APPROVED' ? (
                          <span>
                            Creator <strong style={{ color: '#fff', textDecoration: 'underline' }}>@{activeCreator.creator_name}</strong> sangat potensial untuk diberikan sampel produk Monture.
                            {activeCreator.is_star_creator && <strong style={{ color: '#F59E0B' }}> Merupakan Star Creator dengan GMV {activeCreator.gmv} (di atas 30 Juta).</strong>}
                            {' '}Audiens relevan dengan fashion pria/outdoor, memiliki rekam jejak pengiriman sampel yang aman (<strong style={{ color: '#10B981' }}>{activeCreator.fulfillment_rate}%</strong>), dan rata-rata penayangan video konsisten di angka <strong style={{ color: '#60A5FA' }}>{activeCreator.avg_views} views</strong>.
                          </span>
                        ) : (
                          <span>
                            Pengajuan sampel creator <strong style={{ color: '#fff' }}>@{activeCreator.creator_name}</strong> tidak memenuhi standar kurasi Monture pada kriteria: <strong style={{ color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>{activeCreator.decision_reason.replace('DITOLAK OTOMATIS: ', '').replace(/\.$/, '')}</strong>. Disarankan menolak permohonan ini untuk menghindari sampel macet atau tidak menghasilkan penjualan.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4 Clean Metric Pills - Scan in 2 seconds */}
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '10px'
                    }}
                  >
                    {/* Pill 1: Niche Relevansi */}
                    <div 
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-input)',
                        border: `1px solid ${activeCreator.kpi_checklist?.kpi5_kategori?.passed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>1. Niche & Kategori</span>
                        {activeCreator.kpi_checklist?.kpi5_kategori?.passed ? <CheckCircle2 size={13} style={{ color: 'var(--color-success)' }} /> : <XCircle size={13} style={{ color: 'var(--color-danger)' }} />}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: activeCreator.kpi_checklist?.kpi5_kategori?.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {activeCreator.kpi_checklist?.kpi5_kategori?.passed ? 'Sesuai Niche Monture' : 'Di Luar Niche Toko'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(activeCreator.categories || []).join(', ') || 'Tidak terdeteksi'}
                      </div>
                    </div>

                    {/* Pill 2: Skala Penjualan & Tier */}
                    <div 
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-input)',
                        border: `1px solid ${activeCreator.kpi_checklist?.kpi2_level?.passed ? 'rgba(59, 130, 246, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>2. Tier & Omzet</span>
                        {activeCreator.kpi_checklist?.kpi2_level?.passed ? <CheckCircle2 size={13} style={{ color: 'var(--color-info)' }} /> : <XCircle size={13} style={{ color: 'var(--color-danger)' }} />}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: activeCreator.kpi_checklist?.kpi2_level?.passed ? '#60A5FA' : 'var(--color-danger)' }}>
                        Level {activeCreator.ecom_level} • {activeCreator.gmv}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {activeCreator.item_sold.toLocaleString('id-ID')} pcs produk terjual
                      </div>
                    </div>

                    {/* Pill 3: Performa Views */}
                    <div 
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-input)',
                        border: `1px solid ${activeCreator.kpi_checklist?.kpi6_views_500?.passed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>3. Views Rata-Rata</span>
                        {activeCreator.kpi_checklist?.kpi6_views_500?.passed ? <CheckCircle2 size={13} style={{ color: 'var(--color-success)' }} /> : <XCircle size={13} style={{ color: 'var(--color-danger)' }} />}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: activeCreator.kpi_checklist?.kpi6_views_500?.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {activeCreator.avg_views} Views / Video
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        Target min. 500 views (Top: {activeCreator.max_views >= 1000 ? (activeCreator.max_views/1000).toFixed(1) + 'k' : activeCreator.max_views})
                      </div>
                    </div>

                    {/* Pill 4: Fulfillment Rate */}
                    <div 
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-input)',
                        border: `1px solid ${activeCreator.fulfillment_rate >= 80 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>4. Disiplin Sampel</span>
                        {activeCreator.fulfillment_rate >= 80 ? <CheckCircle2 size={13} style={{ color: 'var(--color-success)' }} /> : <XCircle size={13} style={{ color: 'var(--color-danger)' }} />}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: activeCreator.fulfillment_rate >= 80 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {activeCreator.fulfillment_rate}% Fulfillment
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {activeCreator.fulfillment_rate >= 80 ? 'Aman (Target min. 80%)' : 'Rentan macet (<80%)'}
                      </div>
                    </div>
                  </div>

                  {/* Subtle Action Suggestion */}
                  <div 
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      paddingTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>
                      {activeCreator.status === 'APPROVED' 
                        ? (activeCreator.is_expired 
                            ? '⏰ Permohonan telah kadaluarsa di TikTok Shop (tidak perlu diproses lagi).' 
                            : '💡 Rekomendasi LAYAK APPROVE: Silakan setujui permohonan ini secara manual di TikTok Shop Seller Center.')
                        : '🛡️ Proteksi HPP: Rekomendasi GUGUR / TOLAK. Hindari menyetujui sampel ini di TikTok Shop Seller Center.'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Evaluasi Engine Monture AI
                    </span>
                  </div>
                </div>
              </div>


              {/* 4 Scorecards Grid (GMV, Terjual, Views, Fulfillment) */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px'
                }}
              >
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total GMV / Omzet</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: activeCreator.is_star_creator ? 'var(--color-warning)' : 'var(--text-primary)', marginTop: '4px' }}>
                    {activeCreator.gmv || 'Rp0'}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Produk Terjual</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {activeCreator.item_sold.toLocaleString('id-ID')} pcs
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rata-Rata Views</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: activeCreator.avg_views >= 500 ? 'var(--color-info)' : 'var(--text-primary)', marginTop: '4px' }}>
                    {activeCreator.avg_views} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>({(activeCreator.max_views >= 1000 ? (activeCreator.max_views/1000).toFixed(1) + 'k' : activeCreator.max_views)} top)</span>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Fulfillment Rate</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: activeCreator.fulfillment_rate >= 80 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '4px' }}>
                    {activeCreator.fulfillment_rate}%
                  </div>
                </div>
              </div>

              {/* Produk Monture yang Diminta */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {activeCreator.sku_image && (
                  <img 
                    src={activeCreator.sku_image} 
                    alt={activeCreator.product_title} 
                    style={{ width: '54px', height: '54px', borderRadius: '6px', objectFit: 'cover' }} 
                  />
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <ShoppingBag size={13} style={{ color: 'var(--color-brand-primary)' }} />
                    PRODUK TOKO YANG DIAJUKAN SAMPEL
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeCreator.product_title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Varian SKU: <strong style={{ color: 'var(--text-primary)' }}>{activeCreator.sku_desc}</strong> • Harga Toko: <span style={{ color: 'var(--color-brand-primary)', fontWeight: 700 }}>{activeCreator.sku_price_formatted}</span> • Komisi: <strong style={{ color: 'var(--color-success)' }}>{activeCreator.commission_rate}</strong>
                  </div>
                </div>
              </div>

              {/* Sampel Video VT Creator & Player Direct */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Video size={14} style={{ color: 'var(--color-info)' }} />
                  Katalog Video VT Unggulan ({activeCreator.videos?.length || 0} Video)
                </div>

                {activeCreator.videos && activeCreator.videos.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                    {activeCreator.videos.map((vid, vIdx) => (
                      <div 
                        key={vIdx}
                        onClick={() => {
                          setSelectedVideo(vid);
                          setActiveVideoCreator(activeCreator.creator_name);
                        }}
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          padding: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          position: 'relative',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-info)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                      >
                        {/* Video Cover Thumbnail */}
                        <div style={{ position: 'relative', width: '52px', height: '70px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#000' }}>
                          {vid.cover_url ? (
                            <img src={vid.cover_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Play size={16} fill="#fff" />
                            </div>
                          )}
                          <div 
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: 'rgba(0,0,0,0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <div style={{ backgroundColor: 'rgba(238, 77, 45, 0.9)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Play size={11} fill="#fff" style={{ marginLeft: '1px' }} />
                            </div>
                          </div>
                        </div>

                        {/* Video Info */}
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>
                            {vid.title || 'Video VT E-Commerce'}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px' }}>
                            {Number(vid.play_cnt).toLocaleString('id-ID')} views
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ❤️ {vid.like_cnt} likes • 💬 {vid.comment_cnt}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
                    Creator ini tidak memiliki sampel video e-commerce yang terdeteksi.
                  </div>
                )}
              </div>

              {/* Rincian Evaluasi 7 KPI Monture */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={14} style={{ color: 'var(--color-warning)' }} />
                  Hasil Rincian Checklist 7 KPI Monture
                </div>

                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '8px',
                    padding: '14px',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {activeCreator.kpi_checklist && Object.entries(activeCreator.kpi_checklist).map(([key, kpi]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px' }}>
                      {kpi.passed ? (
                        <Check size={14} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
                      ) : (
                        <X size={14} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '2px' }} />
                      )}
                      <div>
                        <strong style={{ color: kpi.passed ? 'var(--text-primary)' : 'var(--color-danger)' }}>
                          {kpi.label}:
                        </strong>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>{kpi.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p>Pilih salah satu creator dari daftar di sebelah kiri untuk melihat detail.</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Video Player Modal */}
      {selectedVideo && (
        <TiktokVideoModal
          video={selectedVideo}
          creatorName={activeVideoCreator}
          applyId={activeCreator?.apply_id}
          isRealHuman={activeCreator?.is_real_human !== false}
          aiAudit={activeCreator?.ai_audit}
          onAuditAi={handleAuditAi}
          onClose={() => setSelectedVideo(null)}
        />
      )}


      {/* 6. Modal Sinkronisasi & Impor Data TikTok (Dual Mode: JSON Response & cURL) */}
      {isCurlModalOpen && (
        <div 
          className="modal-backdrop" 
          onClick={() => setIsCurlModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 8, 16, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            className="modal-content animate-in" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-highlight)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '680px',
              width: '100%',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ArrowDownToLine size={20} style={{ color: 'var(--color-brand-primary)' }} />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Sinkronisasi & Impor Data TikTok
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Perbarui daftar pengajuan sampel creator affiliate ke dalam Monture Dashboard
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCurlModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Navigasi Mode Impor */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px', paddingBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setImportTab('json')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: importTab === 'json' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: importTab === 'json' ? 'var(--color-success)' : 'var(--text-secondary)',
                  borderBottom: importTab === 'json' ? '2px solid var(--color-success)' : '2px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <FileJson size={16} />
                <span>Impor Response JSON</span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--color-success)', color: '#fff', fontWeight: 700 }}>
                  100% Berhasil
                </span>
              </button>

              <button
                type="button"
                onClick={() => setImportTab('curl')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: importTab === 'curl' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: importTab === 'curl' ? 'var(--color-brand-primary)' : 'var(--text-secondary)',
                  borderBottom: importTab === 'curl' ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <Terminal size={16} />
                <span>Sesi cURL API</span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', fontWeight: 600 }}>
                  TTL ~60s
                </span>
              </button>
            </div>

            {/* TAB 1: IMPOR RESPONSE JSON (REKOMENDASI UTAMA) */}
            {importTab === 'json' && (
              <form onSubmit={handleImportJson}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-success)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} /> Solusi Pasti Berhasil (Bebas Error Signature / Code 10000):
                  </div>
                  <ol style={{ paddingLeft: '18px', margin: 0 }}>
                    <li>Buka tab TikTok Seller Center Anda di browser (halaman Permintaan Sampel).</li>
                    <li>Buka <strong>DevTools (tekan F12)</strong> ➔ pilih tab <strong>Network</strong> ➔ ketik <code style={{ color: 'var(--color-brand-primary)' }}>list</code> di filter pencarian.</li>
                    <li>Klik salah satu request <strong>list</strong> ➔ buka tab <strong>Response</strong> di sebelah kanan.</li>
                    <li>Klik kanan di isi response ➔ pilih <strong>Copy object</strong> (atau <em>Ctrl+A</em> lalu <em>Ctrl+C</em>).</li>
                    <li>Tempelkan (*paste*) teks JSON di bawah ini, lalu klik <strong>Impor Data Sampel</strong>.</li>
                  </ol>
                </div>

                <textarea 
                  rows={7}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`Tempelkan Response JSON di sini (contoh: {"code":0,"message":"success","agg_info":[...],"total_count":50})`}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    outline: 'none',
                    marginBottom: '16px'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCurlModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={jsonSubmitting}
                    className="btn btn-primary"
                    style={{ padding: '8px 22px', fontSize: '13px', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                  >
                    {jsonSubmitting ? 'Mengimpor...' : 'Impor Data Sampel'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: SESI cURL */}
            {importTab === 'curl' && (
              <form onSubmit={handleSubmitCurl}>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} /> Mengapa Muncul Code 10000 di cURL?
                  </div>
                  <div>
                    TikTok menerapkan proteksi bot WAF dengan cryptographic signature <code>X-Bogus</code> yang otomatis <strong>kadaluarsa dalam waktu ~60 detik</strong> dan hanya bisa dieksekusi 1 kali (replay protection). 
                    <br />
                    Jika tombol <strong>Sync Live</strong> memunculkan error Code 10000, segera gunakan tab <strong>"Impor Response JSON"</strong> di atas.
                  </div>
                </div>

                <textarea 
                  rows={7}
                  value={curlInput}
                  onChange={(e) => setCurlInput(e.target.value)}
                  placeholder="curl --url 'https://affiliate-id.tokopedia.com/api/v1/affiliate/sample/group/list?...' -H 'cookie: ...'"
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    outline: 'none',
                    marginBottom: '16px'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCurlModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={curlSubmitting}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', fontSize: '13px' }}
                  >
                    {curlSubmitting ? 'Memproses...' : 'Simpan Sesi cURL'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
