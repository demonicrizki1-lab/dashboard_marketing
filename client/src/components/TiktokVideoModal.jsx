import React, { useEffect, useState } from 'react';
import { X, Play, Eye, Heart, MessageCircle, Clock, ExternalLink, ShoppingBag, ShieldCheck, Bot, UserCheck, AlertTriangle } from 'lucide-react';

export default function TiktokVideoModal({ 
  video, 
  creatorName, 
  applyId,
  isRealHuman = true,
  aiAudit,
  onAuditAi,
  onClose 
}) {
  // Default to 'direct' agar video langsung autoplay di dashboard seperti sebelumnya
  const [playerMode, setPlayerMode] = useState(video?.mp4_url ? 'direct' : 'embed');
  const [hasMp4Error, setHasMp4Error] = useState(false);

  useEffect(() => {
    setPlayerMode(video?.mp4_url ? 'direct' : 'embed');
    setHasMp4Error(false);
  }, [video?.item_id, video?.mp4_url]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose} 
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
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Tombol Close */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
        >
          <X size={18} />
        </button>

        {/* Sisi Kiri: Video Player (TikTok Embed + Direct MP4 Fallback) */}
        <div 
          style={{
            flex: '1.2',
            backgroundColor: '#050810',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '520px',
            maxHeight: '85vh',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top Switcher: Embed vs Direct */}
          <div 
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 15,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(5, 8, 16, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <button
              onClick={() => setPlayerMode('embed')}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                backgroundColor: playerMode === 'embed' ? 'var(--color-brand-primary)' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s'
              }}
              title="Official TikTok live stream embed"
            >
              <Play size={10} fill={playerMode === 'embed' ? '#fff' : 'none'} />
              TikTok Embed
            </button>
            <button
              onClick={() => setPlayerMode('direct')}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                backgroundColor: playerMode === 'direct' ? 'var(--color-brand-primary)' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="Direct MP4 player"
            >
              Direct MP4
            </button>
          </div>

          {/* Player Display */}
          {playerMode === 'embed' ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {video.item_id ? (
                <iframe
                  key={video.item_id}
                  src={`https://www.tiktok.com/embed/v2/${video.item_id}`}
                  title={video.title || "TikTok Video Player"}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '520px',
                    border: 'none',
                    backgroundColor: '#000'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  <p>ID video TikTok tidak ditemukan.</p>
                  {video.tiktok_web_url && (
                    <a 
                      href={video.tiktok_web_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-primary"
                      style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ExternalLink size={14} /> Buka di TikTok Web
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hasMp4Error || !video.mp4_url ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-secondary)', maxWidth: '360px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                    Token CDN TikTok Kadaluarsa
                  </div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.5, marginBottom: '14px' }}>
                    TikTok mengenkripsi link direct MP4 dengan masa kedaluwarsa 24 jam. Silakan putar menggunakan <strong>TikTok Embed</strong> atau buka langsung di TikTok.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setPlayerMode('embed')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--color-brand-primary)',
                        color: '#fff',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Putar via TikTok Embed
                    </button>
                    {video.tiktok_web_url && (
                      <a
                        href={video.tiktok_web_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          textDecoration: 'none',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ExternalLink size={12} /> Buka di Web
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <video 
                  src={video.mp4_url} 
                  controls 
                  autoPlay 
                  playsInline
                  onError={() => setHasMp4Error(true)}
                  style={{
                    width: '100%',
                    maxHeight: '85vh',
                    objectFit: 'contain'
                  }}
                >
                  Browser Anda tidak mendukung pemutar video HTML5.
                </video>
              )}
            </div>
          )}

          {/* Bottom Bar: Quick link */}
          {video.tiktok_web_url && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(5, 8, 16, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '11px',
                zIndex: 10
              }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '10px' }}>
                {playerMode === 'embed' ? 'Official TikTok Player' : 'Direct MP4 Stream'}
              </span>
              <a
                href={video.tiktok_web_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#FE2C55',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px'
                }}
              >
                <ExternalLink size={11} /> Buka Web TikTok
              </a>
            </div>
          )}
        </div>

        {/* Sisi Kanan: Detail Video & Creator */}
        <div 
          style={{
            flex: '1',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
            background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-surface-elevated) 100%)'
          }}
        >
          <div>
            {/* Header Creator */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-brand-primary)', fontWeight: 700 }}>
                  TikTok E-Commerce VT
                </span>
                {video.duration > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {video.duration.toFixed(1)} detik
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                @{creatorName}
              </h3>
            </div>

            {/* Caption Video */}
            <div 
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                maxHeight: '120px',
                overflowY: 'auto'
              }}
            >
              {video.title || 'Tidak ada caption video.'}
            </div>

            {/* Metrik Video (Views, Likes, Comments) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-xs)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <Eye size={15} style={{ color: 'var(--color-info)', margin: '0 auto 4px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {Number(video.play_cnt).toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Views</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-xs)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <Heart size={15} style={{ color: 'var(--color-danger)', margin: '0 auto 4px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {Number(video.like_cnt).toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Likes</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-xs)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <MessageCircle size={15} style={{ color: 'var(--color-warning)', margin: '0 auto 4px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {Number(video.comment_cnt).toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Komentar</div>
              </div>
            </div>

            {/* Audit Keaslian Video Box */}
            <div 
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '18px',
                border: isRealHuman 
                  ? '1px solid rgba(16, 185, 129, 0.3)' 
                  : '1px solid rgba(239, 68, 68, 0.4)',
                backgroundColor: isRealHuman 
                  ? 'rgba(16, 185, 129, 0.05)' 
                  : 'rgba(239, 68, 68, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: isRealHuman ? 'var(--color-success)' : 'var(--color-danger)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Audit Keaslian Konten Monture
                  </span>
                </div>
                <span 
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: isRealHuman ? 'var(--color-success)' : 'var(--color-danger)',
                    color: '#07101E',
                    letterSpacing: '0.03em'
                  }}
                >
                  {isRealHuman ? '✓ REAL HUMAN TRY-ON' : '🤖 TERDETEKSI AI / BOT'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {aiAudit?.reason || (isRealHuman 
                  ? 'Video terverifikasi dibuat oleh kreator manusia nyata yang mencoba produk (bukan template/slideshow bot).' 
                  : 'Video terindikasi buatan AI / slideshow statis bot. Sesuai aturan Monture, creator ini TIDAK LOLOS.')}
              </div>

              {/* Quick Action Button for Auditor PIC */}
              {onAuditAi && applyId && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button
                    onClick={() => onAuditAi(applyId, true)}
                    disabled={!isRealHuman}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      backgroundColor: !isRealHuman ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--color-danger)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: !isRealHuman ? 'default' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Bot size={13} />
                    {!isRealHuman ? 'Telah Ditandai AI (Gugur)' : 'Tandai Konten AI (Gugurkan)'}
                  </button>

                  <button
                    onClick={() => onAuditAi(applyId, false)}
                    disabled={isRealHuman}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      backgroundColor: isRealHuman ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.1)',
                      color: 'var(--color-success)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: isRealHuman ? 'default' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <UserCheck size={13} />
                    {isRealHuman ? 'Terverifikasi Asli' : 'Konfirmasi Real Human'}
                  </button>
                </div>
              )}
            </div>

            {/* Produk Keranjang Kuning Terkait */}
            {video.products && video.products.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingBag size={13} style={{ color: 'var(--color-brand-primary)' }} />
                  PRODUK DI KERANJANG KUNING
                </div>
                {video.products.map((p, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      backgroundColor: 'var(--bg-input)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '6px'
                    }}
                  >
                    {p.image && (
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        style={{ width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover' }} 
                      />
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-brand-primary)', fontWeight: 600 }}>
                        {p.price && Number(p.price) > 0 ? `Rp${Number(p.price).toLocaleString('id-ID')}` : 'Tersedia di Toko'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
            {video.tiktok_web_url && (
              <a 
                href={video.tiktok_web_url} 
                target="_blank" 
                rel="noreferrer" 
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--color-brand-primary)',
                  color: '#fff',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                  boxShadow: '0 2px 6px rgba(238, 77, 45, 0.25)'
                }}
              >
                <ExternalLink size={14} /> Tonton Langsung di TikTok Web
              </a>
            )}
            <button 
              onClick={onClose}
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '9px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
