import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Save, 
  ShieldAlert, 
  Sparkles, 
  Calculator, 
  Percent, 
  CheckCircle2, 
  Info,
  Package,
  Layers,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function SkuMarginModal({ product, isOpen, onClose, onSaveSuccess }) {
  if (!isOpen || !product) return null;

  const currentMargin = product.marginConfig || {};
  const repPrice = product.representativePrice || 0;

  // Form State
  const [hpp, setHpp] = useState(currentMargin.hpp || '');
  const [shopeeAdminRate, setShopeeAdminRate] = useState(
    currentMargin.shopeeAdminRate !== undefined ? currentMargin.shopeeAdminRate : 8.5
  );
  const [serviceFeeRate, setServiceFeeRate] = useState(
    currentMargin.serviceFeeRate !== undefined ? currentMargin.serviceFeeRate : 4.0
  );
  const [voucher, setVoucher] = useState(currentMargin.voucher || 0);
  const [affiliateFee, setAffiliateFee] = useState(currentMargin.affiliateFee || 0);
  const [operationalFee, setOperationalFee] = useState(
    currentMargin.operationalFee !== undefined ? currentMargin.operationalFee : 3500
  );
  const [notes, setNotes] = useState(currentMargin.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live Unit Economics Calculation
  const numHpp = Number(hpp) || 0;
  const numAdminRate = (Number(shopeeAdminRate) || 0) / 100;
  const numServiceRate = (Number(serviceFeeRate) || 0) / 100;
  const numVoucher = Number(voucher) || 0;
  const numAffiliate = Number(affiliateFee) || 0;
  const numOps = Number(operationalFee) || 0;

  // Plafon Iklan
  const cprLimit = Math.round(repPrice * 0.25); // CPR 25%
  const cacLimit = Math.round(repPrice * 0.40); // CAC 40%
  const cprTax = Math.round(cprLimit * 0.11); // PPN 11%

  // Potongan Marketplace
  const adminAmount = Math.round(repPrice * numAdminRate);
  const serviceAmount = Math.round(repPrice * numServiceRate);

  // Total Potongan Pokok
  const totalBaseDeductions = numHpp + adminAmount + serviceAmount + numVoucher + numAffiliate + numOps;

  // Estimasi Laba Bersih
  const netProfitWithoutAds = repPrice - totalBaseDeductions;
  const netProfitWithCpr = repPrice - totalBaseDeductions - cprLimit - cprTax;
  const marginPercentWithCpr = repPrice > 0 ? (netProfitWithCpr / repPrice) * 100 : 0;

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!hpp || numHpp <= 0) {
      setErrorMsg('Harap masukkan HPP (Modal Produk) dengan benar.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await fetch('/api/products/margin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: product.itemId,
          hpp: numHpp,
          shopeeAdminRate: Number(shopeeAdminRate),
          serviceFeeRate: Number(serviceFeeRate),
          voucher: numVoucher,
          affiliateFee: numAffiliate,
          operationalFee: numOps,
          notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (onSaveSuccess) onSaveSuccess(product.itemId, data.margin);
        onClose();
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan konfigurasi margin.');
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan jaringan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.75)', 
        backdropFilter: 'blur(5px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 99999, 
        padding: '20px' 
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '820px', 
          width: '100%', 
          maxHeight: '90vh', 
          overflowY: 'auto',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          padding: '24px',
          position: 'relative'
        }}
      >
        {/* Header Modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(238, 77, 45, 0.15)', color: 'var(--color-brand-primary)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Kalkulator Margin & Biaya Produk
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                Tetapkan HPP dan komponen biaya untuk mengaktifkan batas aman iklan CPR (25%) & CAC (40%)
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="btn btn-secondary btn-icon-only" 
            onClick={onClose} 
            aria-label="Tutup Modal"
            style={{ borderRadius: '50%', padding: '6px', background: 'rgba(255,255,255,0.06)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Info Singkat Produk */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px', 
          backgroundColor: 'rgba(255, 255, 255, 0.03)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '10px', 
          padding: '12px 14px', 
          margin: '18px 0' 
        }}>
          {product.coverImage && (
            <img 
              src={product.coverImage} 
              alt={product.name} 
              style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.name}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Parent SKU: <strong style={{ color: 'var(--text-secondary)' }}>{product.parentSku}</strong></span>
              <span>•</span>
              <span>Item ID: <span className="tabular-nums">{product.itemId}</span></span>
              <span>•</span>
              <span>Harga Jual Promo: <strong style={{ color: 'var(--color-brand-primary)' }}>{formatRupiah(repPrice)}</strong></span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.12)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#F87171', 
            padding: '10px 14px', 
            borderRadius: '8px', 
            fontSize: '13px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '16px' 
          }}>
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Grid Form Input & Live Preview */}
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Kolom Kiri: Form Input Biaya */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={15} style={{ color: 'var(--color-brand-primary)' }} />
                <span>1. Komponen Modal & Marketplace</span>
              </div>

              {/* Input HPP Produk */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  HPP Produk (Modal Barang) <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Rp
                  </span>
                  <input
                    type="number"
                    value={hpp}
                    onChange={(e) => setHpp(e.target.value)}
                    placeholder="Contoh: 65000"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Biaya produksi kain, jahitan, aksesoris, atau harga kulakan per unit.
                </span>
              </div>

              {/* Grid 2 Input: Admin Shopee & Layanan */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Admin Shopee (%)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      value={shopeeAdminRate}
                      onChange={(e) => setShopeeAdminRate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 32px 9px 12px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Biaya Layanan (%)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      value={serviceFeeRate}
                      onChange={(e) => setServiceFeeRate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 32px 9px 12px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 2 Input: Voucher & Operasional */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Beban Voucher (Rp)
                  </label>
                  <input
                    type="number"
                    value={voucher}
                    onChange={(e) => setVoucher(e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Operasional & Packing (Rp)
                  </label>
                  <input
                    type="number"
                    value={operationalFee}
                    onChange={(e) => setOperationalFee(e.target.value)}
                    placeholder="3500"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Komisi Affiliate */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Alokasi Komisi Affiliate (Rp)
                </label>
                <input
                  type="number"
                  value={affiliateFee}
                  onChange={(e) => setAffiliateFee(e.target.value)}
                  placeholder="0 jika tidak menggunakan affiliate"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Catatan */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Catatan Internal Produk
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Margin rompi tebal, siap scale up di harbolnas"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Kolom Kanan: Preview Unit Economics & Plafon Iklan */}
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '12px', 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={15} style={{ color: 'var(--color-success)' }} />
                <span>2. Hasil Hitungan Otomatis & Plafon Iklan</span>
              </div>

              {/* Box Plafon CPR & CAC */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.25)', 
                  borderRadius: '10px', 
                  padding: '10px 12px' 
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#10B981', display: 'block' }}>
                    🟢 Plafon CPR (25%)
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#10B981', marginTop: '4px' }} className="tabular-nums">
                    {formatRupiah(cprLimit)}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Max biaya iklan/order cuan (ROAS ≥ 4.0x)
                  </span>
                </div>

                <div style={{ 
                  backgroundColor: 'rgba(245, 158, 11, 0.08)', 
                  border: '1px solid rgba(245, 158, 11, 0.25)', 
                  borderRadius: '10px', 
                  padding: '10px 12px' 
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#F59E0B', display: 'block' }}>
                    🟡 Plafon CAC (40%)
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#F59E0B', marginTop: '4px' }} className="tabular-nums">
                    {formatRupiah(cacLimit)}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Batas toleransi akuisisi (ROAS ≥ 2.5x)
                  </span>
                </div>
              </div>

              {/* Rincian Beban Finansial */}
              <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Harga Jual Akhir (Promo):</span>
                  <strong className="tabular-nums">{formatRupiah(repPrice)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Potongan HPP Barang:</span>
                  <span style={{ color: 'var(--color-danger)' }} className="tabular-nums">- {formatRupiah(numHpp)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Potongan Admin & Layanan:</span>
                  <span style={{ color: 'var(--color-danger)' }} className="tabular-nums">- {formatRupiah(adminAmount + serviceAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Biaya Operasional & Voucher:</span>
                  <span style={{ color: 'var(--color-danger)' }} className="tabular-nums">- {formatRupiah(numOps + numVoucher + numAffiliate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Laba Kotor (Tanpa Iklan):</span>
                  <strong style={{ color: netProfitWithoutAds > 0 ? 'var(--color-success)' : 'var(--color-danger)' }} className="tabular-nums">
                    {formatRupiah(netProfitWithoutAds)}
                  </strong>
                </div>
              </div>

              {/* Estimasi Laba Bersih Setelah CPR */}
              <div style={{ 
                marginTop: 'auto', 
                backgroundColor: netProfitWithCpr > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${netProfitWithCpr > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '10px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      ESTIMASI LABA BERSIH (Setelah Iklan CPR 25% + PPN):
                    </span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: netProfitWithCpr > 0 ? '#10B981' : '#EF4444', marginTop: '2px' }} className="tabular-nums">
                      {formatRupiah(netProfitWithCpr)}
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    backgroundColor: netProfitWithCpr > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: netProfitWithCpr > 0 ? '#10B981' : '#EF4444' 
                  }}>
                    {marginPercentWithCpr.toFixed(1)}% Margin
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px', 
            marginTop: '22px', 
            borderTop: '1px solid var(--border-color)', 
            paddingTop: '16px' 
          }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Simpan Parameter Margin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
