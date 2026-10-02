import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  RefreshCw, 
  Key, 
  Copy, 
  Check
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onSessionUpdated }) {
  const [curlInput, setCurlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!curlInput.trim()) {
      setResult({ success: false, message: 'Silakan tempel (paste) perintah cURL terlebih dahulu.' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/config/update-curl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curlCommand: curlInput })
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          extracted: data.extracted,
          storeInfo: data.storeInfo
        });
        if (onSessionUpdated) {
          onSessionUpdated(data.storeInfo);
        }
      } else {
        setResult({
          success: false,
          message: data.message || 'Gagal memproses cURL.'
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: 'Koneksi ke server gagal: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} style={{ color: 'var(--color-brand-primary)' }} />
            <h3>Pengaturan Sesi & Smart cURL Importer</h3>
          </div>
          <button 
            className="btn btn-secondary btn-icon-only" 
            onClick={onClose}
            style={{ borderRadius: '50%', padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Shopee memperbarui token sesi secara berkala. Jika koneksi offline atau data tidak sinkron, 
            cukup <strong>Copy as cURL</strong> dari Inspect Network Shopee Seller Center dan tempel di bawah ini.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              className="curl-textarea"
              placeholder="Paste raw cURL di sini (curl 'https://seller.shopee.co.id/api/marketing/v3/pas/report/homepage/get_time_graph?...' -H 'cookie: ...' ...)"
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              id="input-curl-textarea"
            />

            {/* Help / Guide Box */}
            <div className="curl-help-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '4px' }}>
                <HelpCircle size={14} />
                <span>Cara Cepat Mengambil cURL dari Shopee:</span>
              </div>
              <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <li>Buka halaman <strong>Iklan Shopee</strong> di Chrome / Edge.</li>
                <li>Tekan <strong>F12</strong> (DevTools) lalu pilih tab <strong>Network</strong>.</li>
                <li>Filter kata kunci: <code>time_graph</code> atau <code>query</code>.</li>
                <li>Klik kanan request tersebut &gt; <strong>Copy</strong> &gt; <strong>Copy as cURL (bash)</strong>.</li>
                <li>Paste di kotak di atas, lalu klik <strong>Simpan & Uji Koneksi</strong>.</li>
              </ol>
            </div>

            {/* Result / Notification Alert */}
            {result && (
              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                backgroundColor: result.success ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                border: `1px solid ${result.success ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
                color: result.success ? 'var(--color-success)' : 'var(--color-danger)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  {result.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{result.message}</span>
                </div>
                {result.storeInfo && (
                  <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '4px' }}>
                    Toko Terverifikasi: <strong>{result.storeInfo.shop_name}</strong> (Shop ID: {result.storeInfo.shop_id})
                  </div>
                )}
                {result.extracted && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    SPC_CDS: {result.extracted.hasSpcCds ? 'Terdeteksi' : 'Tidak ditemukan'} • 
                    Cookie: {result.extracted.hasCookie ? 'Terdeteksi' : 'Tidak ditemukan'} • 
                    Token Akamai: {result.extracted.hasDat && result.extracted.hasSz ? 'Lengkap' : 'Sebagian'}
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Tutup
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                id="btn-submit-curl"
              >
                <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
                <span>{loading ? 'Menguji & Menyimpan...' : 'Simpan & Uji Koneksi'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
