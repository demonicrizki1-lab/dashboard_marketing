import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronRight, ChevronDown, HelpCircle, Check, Clock, ArrowRight, Sparkles } from 'lucide-react';

export default function ShopeeDataCenterPicker({ 
  selectedPeriod, 
  onChange, 
  lastUpdated,
  orderType = 'paid',
  onOrderTypeChange,
  showLiveBadge = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOrderTypeOpen, setIsOrderTypeOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Rentang Bulan');
  const [rangeStartMonth, setRangeStartMonth] = useState('2026-08');
  const [rangeEndMonth, setRangeEndMonth] = useState('2026-09');
  const [monthTab, setMonthTab] = useState('range'); // 'range' | 'single'
  const dropdownRef = useRef(null);
  const orderTypeRef = useRef(null);

  // Helper date calculations in GMT+7
  const now = useMemo(() => new Date(Date.now() + 7 * 3600 * 1000), []);
  
  // Format DD-MM-YYYY
  const formatIndoDate = (date) => {
    const d = String(date.getUTCDate()).padStart(2, '0');
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const y = date.getUTCFullYear();
    return `${d}-${m}-${y}`;
  };

  const yesterdayDate = useMemo(() => {
    const d = new Date(now.getTime() - 86400 * 1000);
    return formatIndoDate(d);
  }, [now]);

  const past7DaysRange = useMemo(() => {
    const start = new Date(now.getTime() - 7 * 86400 * 1000);
    const end = new Date(now.getTime() - 86400 * 1000);
    return `${formatIndoDate(start)} ~ ${formatIndoDate(end)}`;
  }, [now]);

  const past30DaysRange = useMemo(() => {
    const start = new Date(now.getTime() - 30 * 86400 * 1000);
    const end = new Date(now.getTime() - 86400 * 1000);
    return `${formatIndoDate(start)} ~ ${formatIndoDate(end)}`;
  }, [now]);

  // Month Options List
  const monthOptions = [
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
    { label: 'Juli 2025', value: '2025-07' }
  ];

  // Year List
  const yearList = [
    { label: '2026 (Tahun Berjalan)', year: 2026, start: 1767225600, end: 1798761599 },
    { label: '2025 (Tahun Pertama Aktif)', year: 2025, start: 1735689600, end: 1767225599 },
    { label: '2024 (Pendaftaran Toko 30 Sep)', year: 2024, start: 1704067200, end: 1735689599 }
  ];

  // Week List
  const weekList = [
    { label: '28-09-2026 ~ 04-10-2026', start: 1790553600, end: 1791158399 },
    { label: '21-09-2026 ~ 27-09-2026', start: 1789948800, end: 1790553599 },
    { label: '14-09-2026 ~ 20-09-2026', start: 1789344000, end: 1789948799 },
    { label: '07-09-2026 ~ 13-09-2026', start: 1788739200, end: 1789343999 }
  ];

  // Current display label
  const displayInfo = useMemo(() => {
    if (!selectedPeriod) {
      return { label: '30 hari sebelumnya.', dateText: `${past30DaysRange} (GMT+07)` };
    }
    if (selectedPeriod.type === 'month_range') {
      return { label: 'Rentang Bulan', dateText: `${selectedPeriod.label} (GMT+07)` };
    }
    if (selectedPeriod.type === 'month') {
      return { label: 'Per Bulan', dateText: `${selectedPeriod.label} (GMT+07)` };
    }
    if (selectedPeriod.type === 'year') {
      return { label: 'Berdasarkan Tahun', dateText: `Tahun ${selectedPeriod.label} (GMT+07)` };
    }
    if (selectedPeriod.type === 'week') {
      return { label: 'Per Minggu', dateText: `${selectedPeriod.label} (GMT+07)` };
    }
    if (selectedPeriod.id === 'Kemarin' || selectedPeriod === 'yesterday') {
      return { label: 'Kemarin', dateText: `${yesterdayDate} (GMT+07)` };
    }
    if (selectedPeriod.id === 'Real-time' || selectedPeriod === 'real_time') {
      return { label: 'Real-time', dateText: `${formatIndoDate(now)} (GMT+07)` };
    }
    if (selectedPeriod.id === '7 hari sebelumnya.' || selectedPeriod === 'past7days') {
      return { label: '7 hari sebelumnya.', dateText: `${past7DaysRange} (GMT+07)` };
    }
    if (selectedPeriod.id === '30 hari sebelumnya.' || selectedPeriod === 'past30days') {
      return { label: '30 hari sebelumnya.', dateText: `${past30DaysRange} (GMT+07)` };
    }
    if (selectedPeriod.label) {
      return { label: selectedPeriod.label, dateText: selectedPeriod.dateText || '' };
    }
    return { label: '30 hari sebelumnya.', dateText: `${past30DaysRange} (GMT+07)` };
  }, [selectedPeriod, yesterdayDate, past7DaysRange, past30DaysRange, now]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
      if (orderTypeRef.current && !orderTypeRef.current.contains(e.target)) {
        setIsOrderTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Preset Handlers
  const handleSelectPreset = (presetId) => {
    let periodParam = 'past30days';
    let sTime = null;
    let eTime = null;
    const nowSec = Math.floor(Date.now() / 1000);

    if (presetId === 'Kemarin') {
      periodParam = 'yesterday';
      const today0 = Math.floor(new Date().setHours(0,0,0,0) / 1000);
      sTime = today0 - 86400;
      eTime = today0 - 1;
    } else if (presetId === 'Real-time') {
      periodParam = 'real_time';
      sTime = Math.floor(new Date().setHours(0,0,0,0) / 1000);
      eTime = nowSec;
    } else if (presetId === '7 hari sebelumnya.') {
      periodParam = 'past7days';
      sTime = nowSec - 7 * 86400;
      eTime = nowSec;
    } else if (presetId === '30 hari sebelumnya.') {
      periodParam = 'past30days';
      sTime = nowSec - 30 * 86400;
      eTime = nowSec;
    }

    onChange && onChange({
      id: presetId,
      period: periodParam,
      startTime: sTime,
      endTime: eTime,
      label: presetId
    });
    setIsOpen(false);
  };

  // Month Range Apply Handler
  const handleApplyMonthRange = (startM = rangeStartMonth, endM = rangeEndMonth) => {
    let s = startM;
    let e = endM;
    if (s > e) {
      const tmp = s;
      s = e;
      e = tmp;
    }
    const sObj = monthOptions.find(o => o.value === s) || { label: s };
    const eObj = monthOptions.find(o => o.value === e) || { label: e };
    const label = s === e ? sObj.label : `${sObj.label} ~ ${eObj.label}`;

    onChange && onChange({
      type: 'month_range',
      startMonth: s,
      endMonth: e,
      label: label,
      dateText: `${label} (GMT+07)`
    });
    setIsOpen(false);
  };

  const handleSelectSingleMonth = (m) => {
    onChange && onChange({
      type: 'month',
      startMonth: m.value,
      label: m.label,
      dateText: `Bulan ${m.label} (GMT+07)`
    });
    setIsOpen(false);
  };

  const handleSelectYear = (y) => {
    onChange && onChange({
      type: 'year',
      period: 'past30days',
      startTime: y.start,
      endTime: y.end,
      label: String(y.year)
    });
    setIsOpen(false);
  };

  const handleSelectWeek = (w) => {
    onChange && onChange({
      type: 'week',
      period: 'past7days',
      startTime: w.start,
      endTime: w.end,
      label: w.label
    });
    setIsOpen(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }} ref={dropdownRef}>
      
      {/* Date Picker Button (Matching Shopee Seller Center) */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 12px',
            backgroundColor: 'var(--bg-input)',
            border: isOpen ? '1.5px solid var(--color-brand-primary)' : '1px solid var(--border-subtle)',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: isOpen ? '0 0 0 3px var(--color-brand-subtle)' : 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            if (!isOpen) e.currentTarget.style.borderColor = 'var(--border-highlight)';
          }}
          onMouseLeave={(e) => {
            if (!isOpen) e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Periode Data:
          </span>
          <span style={{ fontSize: '12.5px', color: '#EE4D2D', fontWeight: 700 }}>
            {displayInfo.label}
          </span>
          <span style={{ fontSize: '12px', color: '#F8FAFC', fontWeight: 600 }}>
            {displayInfo.dateText}
          </span>
          <Calendar size={15} style={{ color: '#94A3B8', marginLeft: '2px' }} />
        </button>

        {/* Dropdown Panel 2 Kolom Persis Seller Center Shopee */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 9999,
              display: 'flex',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 12px 28px -4px rgba(0,0,0,0.18), 0 4px 10px -2px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              minWidth: '540px',
              animation: 'dropdownFadeIn 0.18s ease-out'
            }}
          >
            {/* Kolom Kiri: Pilihan Periode Cepat & Submenu */}
            <div
              style={{
                width: '185px',
                backgroundColor: '#F8FAFC',
                borderRight: '1px solid #E2E8F0',
                padding: '8px 0',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {[
                { id: 'Real-time', label: 'Real-time' },
                { id: 'Kemarin', label: 'Kemarin' },
                { id: '7 hari sebelumnya.', label: '7 hari sebelumnya.' },
                { id: '30 hari sebelumnya.', label: '30 hari sebelumnya.' }
              ].map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveMenu(item.id);
                    handleSelectPreset(item.id);
                  }}
                  onMouseEnter={() => setActiveMenu(item.id)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: activeMenu === item.id ? 700 : 500,
                    color: activeMenu === item.id ? '#EE4D2D' : '#334155',
                    cursor: 'pointer',
                    backgroundColor: activeMenu === item.id ? '#FFF1ED' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{item.label}</span>
                </div>
              ))}

              <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '6px 12px' }} />

              {[
                { id: 'Rentang Bulan', label: 'Rentang Bulan (Manual)', highlight: true },
                { id: 'Per Bulan', label: 'Per Bulan' },
                { id: 'Per Hari', label: 'Per Hari' },
                { id: 'Per Minggu', label: 'Per Minggu' },
                { id: 'Berdasarkan Tahun', label: 'Berdasarkan Tahun' }
              ].map(item => (
                <div
                  key={item.id}
                  onMouseEnter={() => setActiveMenu(item.id)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: activeMenu === item.id ? 700 : 500,
                    color: activeMenu === item.id ? '#EE4D2D' : item.highlight ? '#0284C7' : '#334155',
                    cursor: 'pointer',
                    backgroundColor: activeMenu === item.id ? '#FFF1ED' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{item.label}</span>
                  <ChevronRight size={13} style={{ color: activeMenu === item.id ? '#EE4D2D' : '#94A3B8' }} />
                </div>
              ))}
            </div>

            {/* Kolom Kanan: Detail Sub-menu / Kalender / Rentang Bulan */}
            <div style={{ flex: 1, padding: '16px', backgroundColor: '#FFFFFF', minHeight: '290px', maxHeight: '380px', overflowY: 'auto' }}>
              
              {/* SUB-MENU UTAMA: RENTANG BULAN MANUAL */}
              {(activeMenu === 'Rentang Bulan' || (activeMenu === 'Per Bulan' && monthTab === 'range')) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={15} style={{ color: '#EE4D2D' }} />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase' }}>
                        PILIH RENTANG WAKTU PERBULAN
                      </span>
                    </div>
                    {activeMenu === 'Per Bulan' && (
                      <button
                        onClick={() => setMonthTab('single')}
                        style={{ fontSize: '11px', color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Pilih 1 Bulan Saja &gt;
                      </button>
                    )}
                  </div>

                  {/* Dropdowns Dari Bulan ~ Sampai Bulan */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>
                        DARI BULAN:
                      </label>
                      <select
                        value={rangeStartMonth}
                        onChange={(e) => setRangeStartMonth(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#0F172A',
                          backgroundColor: '#F8FAFC',
                          cursor: 'pointer'
                        }}
                      >
                        {monthOptions.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ paddingTop: '16px', display: 'flex', justifyContent: 'center' }}>
                      <ArrowRight size={16} style={{ color: '#94A3B8' }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>
                        SAMPAI BULAN:
                      </label>
                      <select
                        value={rangeEndMonth}
                        onChange={(e) => setRangeEndMonth(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#0F172A',
                          backgroundColor: '#F8FAFC',
                          cursor: 'pointer'
                        }}
                      >
                        {monthOptions.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Shortcut Presets */}
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      PILIHAN CEPAT (PRESET):
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[
                        { label: 'Agustus - September 2026', s: '2026-08', e: '2026-09' },
                        { label: 'Agustus - Oktober 2026 (PIC Baru)', s: '2026-08', e: '2026-10' },
                        { label: 'April - Juli 2026 (PIC Lama)', s: '2026-04', e: '2026-07' },
                        { label: 'April - Oktober 2026 (Semua Data)', s: '2026-04', e: '2026-10' }
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setRangeStartMonth(chip.s);
                            setRangeEndMonth(chip.e);
                            handleApplyMonthRange(chip.s, chip.e);
                          }}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: '5px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: rangeStartMonth === chip.s && rangeEndMonth === chip.e ? '#FFF1ED' : '#F1F5F9',
                            color: rangeStartMonth === chip.s && rangeEndMonth === chip.e ? '#EE4D2D' : '#334155',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={() => handleApplyMonthRange()}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#EE4D2D',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(238, 77, 45, 0.3)',
                      marginTop: '4px'
                    }}
                  >
                    <Check size={14} strokeWidth={2.5} />
                    Terapkan Rentang Bulan Ini
                  </button>
                </div>
              )}

              {/* PER BULAN: SINGLE MONTH SELECTOR */}
              {activeMenu === 'Per Bulan' && monthTab === 'single' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                      PILIH 1 BULAN REKAPITULASI:
                    </span>
                    <button
                      onClick={() => setMonthTab('range')}
                      style={{ fontSize: '11px', color: '#EE4D2D', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Pilih Rentang Bulan &gt;
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '250px', overflowY: 'auto' }}>
                    {monthOptions.map((m, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSingleMonth(m)}
                        style={{
                          textAlign: 'left',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FAFAFA',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#1E293B',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EE4D2D'; e.currentTarget.style.color = '#EE4D2D'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }}
                      >
                        <span>{m.label}</span>
                        <span style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>{m.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeMenu === 'Kemarin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>TANGGAL TERPILIH:</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#EE4D2D', fontFamily: 'var(--font-mono)' }}>
                    {yesterdayDate}
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '4px 0 0 0' }}>
                    Menampilkan performa toko dari seluruh transaksi kemarin (00:00 - 23:59 WIB).
                  </p>
                </div>
              )}

              {activeMenu === 'Real-time' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>HARI INI (REAL-TIME):</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                    {formatIndoDate(now)}
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '4px 0 0 0' }}>
                    Data transaksi terkini yang masuk hari ini sampai saat ini.
                  </p>
                </div>
              )}

              {activeMenu === '7 hari sebelumnya.' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>RENTANG WAKTU:</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#EE4D2D', fontFamily: 'var(--font-mono)' }}>
                    {past7DaysRange}
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '4px 0 0 0' }}>
                    Akumulasi performa toko dalam 7 hari terakhir.
                  </p>
                </div>
              )}

              {activeMenu === '30 hari sebelumnya.' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>RENTANG WAKTU:</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#EE4D2D', fontFamily: 'var(--font-mono)' }}>
                    {past30DaysRange}
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '4px 0 0 0' }}>
                    Akumulasi performa toko dalam 30 hari terakhir (standar Shopee Seller Center).
                  </p>
                </div>
              )}

              {activeMenu === 'Berdasarkan Tahun' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                    PILIH TAHUN BUKU:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {yearList.map((y, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectYear(y)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FAFAFA',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#1E293B',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EE4D2D'; e.currentTarget.style.color = '#EE4D2D'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }}
                      >
                        <span>{y.label}</span>
                        <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>Tahun {y.year}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeMenu === 'Per Minggu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                    PILIH MINGGU:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {weekList.map((w, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectWeek(w)}
                        style={{
                          textAlign: 'left',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FAFAFA',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#1E293B',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EE4D2D'; e.currentTarget.style.color = '#EE4D2D'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }}
                      >
                        <span>{w.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeMenu === 'Per Hari' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                    PILIH HARI TERTENTU:
                  </span>
                  <p style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Untuk kalender harian, Anda dapat memilih tanggal spesifik atau rentang harian.
                  </p>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        const selDate = new Date(e.target.value + 'T00:00:00+07:00');
                        const sTime = Math.floor(selDate.getTime() / 1000);
                        const eTime = sTime + 86400 - 1;
                        onChange && onChange({
                          type: 'day',
                          period: 'yesterday',
                          startTime: sTime,
                          endTime: eTime,
                          label: e.target.value,
                          dateText: `${e.target.value} (GMT+07)`
                        });
                        setIsOpen(false);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      color: '#1E293B'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dropdown Status Pesanan (Replika 1:1 Shopee Seller Center) */}
      <div ref={orderTypeRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsOrderTypeOpen(!isOrderTypeOpen)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '7px 12px',
            backgroundColor: 'var(--bg-input)',
            border: isOrderTypeOpen ? '1px solid var(--color-brand-primary)' : '1px solid var(--border-subtle)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            minWidth: '175px',
            boxShadow: isOrderTypeOpen ? '0 0 0 2px var(--color-brand-subtle)' : 'none',
            transition: 'all 0.15s ease'
          }}
          title="Filter status pesanan sesuai Shopee Seller Center"
          onMouseEnter={(e) => {
            if (!isOrderTypeOpen) e.currentTarget.style.borderColor = 'var(--border-highlight)';
          }}
          onMouseLeave={(e) => {
            if (!isOrderTypeOpen) e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Status:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {orderType === 'place' ? 'Pesanan Dibuat' : (orderType === 'confirmed' ? 'Pesanan Siap Dikirim' : 'Pesanan Dibayar')}
            </span>
            <ChevronDown 
              size={13} 
              style={{ 
                color: '#94A3B8', 
                transform: isOrderTypeOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease'
              }} 
            />
          </div>
        </button>

        {/* Dropdown Menu Status Pesanan */}
        {isOrderTypeOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              zIndex: 9999,
              padding: '4px 0',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {[
              { id: 'place', label: 'Pesanan Dibuat' },
              { id: 'confirmed', label: 'Pesanan Siap Dikirim' },
              { id: 'paid', label: 'Pesanan Dibayar' }
            ].map((opt) => {
              const isSelected = opt.id === orderType;
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    onOrderTypeChange && onOrderTypeChange(opt.id);
                    setIsOrderTypeOpen(false);
                  }}
                  style={{
                    padding: '9px 14px',
                    fontSize: '12.5px',
                    color: isSelected ? '#EE4D2D' : '#334155',
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected ? 'rgba(238, 77, 45, 0.06)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} style={{ color: '#EE4D2D' }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Indikator Live Connection (Pill Kompak, opsional) */}
      {showLiveBadge && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '20px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '11px',
            fontWeight: 600,
            color: '#10B981'
          }}
          title="Terhubung langsung ke Shopee Seller Center Data Center API"
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
          <span>Shopee API Live</span>
        </div>
      )}
    </div>
  );
}
