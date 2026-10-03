import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WEEKDAY_NAMES = ['M', 'S', 'S', 'R', 'K', 'J', 'S']; // Minggu, Senin, Selasa, Rabu, Kamis, Jumat, Sabtu

import { toDateKey, formatDisplayDate, getTodayGMT7 } from '../utils/dateUtils';

export default function ShopeeDateRangePicker({ dateRange, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Today reference based on GMT+7 (Asia/Jakarta)
  const today = useMemo(() => getTodayGMT7(), []);

  // Internal selection state
  const [selectedPreset, setSelectedPreset] = useState(dateRange?.presetKey || '1_month');
  const [tempStart, setTempStart] = useState(() => {
    if (dateRange?.startDate) return new Date(dateRange.startDate + 'T00:00:00');
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [tempEnd, setTempEnd] = useState(() => {
    if (dateRange?.endDate) return new Date(dateRange.endDate + 'T00:00:00');
    return new Date(today);
  });
  const [hoverDate, setHoverDate] = useState(null);

  // Left calendar view: default ke bulan & tahun tanggal terpilih / hari ini
  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());

  // Right calendar view: Bulan berikutnya
  const rightMonth = (viewMonth + 1) % 12;
  const rightYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  // Sync state when datepicker is opened
  useEffect(() => {
    if (isOpen) {
      if (dateRange?.startDate) setTempStart(new Date(dateRange.startDate + 'T00:00:00'));
      if (dateRange?.endDate) {
        const endD = new Date(dateRange.endDate + 'T00:00:00');
        setTempEnd(endD);
        setViewYear(endD.getFullYear());
        setViewMonth(endD.getMonth());
      }
      if (dateRange?.presetKey) setSelectedPreset(dateRange.presetKey);
    }
  }, [isOpen, dateRange]);

  // Preset definitions matching Shopee Seller Center
  const presets = [
    {
      key: 'today',
      label: 'Hari Ini',
      getRange: () => {
        const s = new Date(today);
        const e = new Date(today);
        return { start: s, end: e, display: 'Hari Ini (GMT+7)' };
      }
    },
    {
      key: 'yesterday',
      label: 'Kemarin',
      getRange: () => {
        const s = new Date(today);
        s.setDate(s.getDate() - 1);
        const e = new Date(s);
        return { start: s, end: e, display: 'Kemarin (GMT+7)' };
      }
    },
    {
      key: '1_week',
      label: '1 Minggu Terakhir',
      getRange: () => {
        const s = new Date(today);
        s.setDate(s.getDate() - 6);
        const e = new Date(today);
        return { start: s, end: e, display: '1 Minggu Terakhir (GMT+7)' };
      }
    },
    {
      key: '1_month',
      label: '1 Bulan Terakhir',
      getRange: () => {
        const s = new Date(today);
        s.setDate(s.getDate() - 30);
        const e = new Date(today);
        return { start: s, end: e, display: '1 Bulan Terakhir (GMT+7)' };
      }
    },
    {
      key: '3_month',
      label: '3 bulan terakhir',
      getRange: () => {
        const s = new Date(today);
        s.setDate(s.getDate() - 90);
        const e = new Date(today);
        return { start: s, end: e, display: '3 Bulan Terakhir (GMT+7)' };
      }
    }
  ];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Preset Click
  const handleSelectPreset = (p) => {
    const { start, end, display } = p.getRange();
    setSelectedPreset(p.key);
    setTempStart(start);
    setTempEnd(end);
    onChange({
      startDate: toDateKey(start),
      endDate: toDateKey(end),
      label: display,
      presetKey: p.key
    });
    setIsOpen(false);
  };

  // Navigation handlers
  const handlePrevYear = () => setViewYear(y => y - 1);
  const handleNextYear = () => setViewYear(y => y + 1);
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Right calendar navigation
  const handleRightNextMonth = () => {
    handleNextMonth();
  };
  const handleRightNextYear = () => {
    handleNextYear();
  };

  // Generate calendar days matrix
  const getDaysMatrix = (year, month) => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    // Empty cells before month start
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }

    // Days in month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }

    return cells;
  };

  // Handle date cell click in calendar
  const handleDateClick = (date) => {
    if (!date) return;
    if (date > today) return; // cannot select future dates

    setSelectedPreset('custom');

    // If both start and end exist, or no start: start fresh
    if ((tempStart && tempEnd) || !tempStart) {
      setTempStart(date);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (date < tempStart) {
        setTempStart(date);
        setTempEnd(tempStart);
      } else {
        setTempEnd(date);
      }
    }
  };

  // Apply custom selection
  const handleApplyCustom = () => {
    if (!tempStart) return;
    const finalStart = tempStart;
    const finalEnd = tempEnd || tempStart;
    
    onChange({
      startDate: toDateKey(finalStart),
      endDate: toDateKey(finalEnd),
      label: `${formatDisplayDate(finalStart)} - ${formatDisplayDate(finalEnd)} (GMT+7)`,
      presetKey: 'custom'
    });
    setIsOpen(false);
  };

  // Helper check cell state
  const getCellClasses = (date) => {
    if (!date) return 'empty';
    const isFuture = date > today;
    const isToday = toDateKey(date) === toDateKey(today);

    let isStart = false;
    let isEnd = false;
    let inRange = false;

    const startVal = tempStart ? new Date(toDateKey(tempStart) + 'T00:00:00').getTime() : null;
    const endVal = tempEnd ? new Date(toDateKey(tempEnd) + 'T00:00:00').getTime() : null;
    const hoverVal = hoverDate ? new Date(toDateKey(hoverDate) + 'T00:00:00').getTime() : null;
    const curVal = new Date(toDateKey(date) + 'T00:00:00').getTime();

    if (startVal && curVal === startVal) isStart = true;
    if (endVal && curVal === endVal) isEnd = true;

    if (startVal && endVal && curVal > startVal && curVal < endVal) {
      inRange = true;
    } else if (startVal && !endVal && hoverVal) {
      const minVal = Math.min(startVal, hoverVal);
      const maxVal = Math.max(startVal, hoverVal);
      if (curVal >= minVal && curVal <= maxVal) {
        inRange = true;
      }
    }

    const classes = ['shopee-cal-cell'];
    if (isFuture) classes.push('disabled');
    if (isToday) classes.push('today');
    if (isStart || isEnd) classes.push('selected-edge');
    if (inRange && !isStart && !isEnd) classes.push('in-range');

    return classes.join(' ');
  };

  return (
    <div className="shopee-datepicker-container" ref={containerRef}>
      {/* Trigger Button Matching Shopee Design */}
      <button
        type="button"
        className="shopee-datepicker-trigger"
        onClick={() => setIsOpen(prev => !prev)}
        id="btn-shopee-datepicker"
      >
        <CalendarIcon size={15} style={{ color: 'var(--text-muted)' }} />
        <span className="tabular-nums" style={{ fontWeight: 600 }}>
          {dateRange?.label || '1 Bulan Terakhir (GMT+7)'}
        </span>
      </button>

      {/* Popover Dropdown matching Shopee Seller Center Screenshot */}
      {isOpen && (
        <div className="shopee-datepicker-popover" id="shopee-datepicker-popover">
          {/* Left Panel: Presets */}
          <div className="shopee-datepicker-presets">
            {presets.map(p => (
              <button
                key={p.key}
                type="button"
                className={`shopee-preset-item ${selectedPreset === p.key ? 'active' : ''}`}
                onClick={() => handleSelectPreset(p)}
                id={`preset-${p.key}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Right Panel: Dual Month Calendar Picker */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="shopee-calendars-wrapper">
              {/* Calendar 1: Left (View Month) */}
              <div className="shopee-calendar-month">
                <div className="shopee-cal-header">
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button type="button" className="shopee-cal-nav-btn" onClick={handlePrevYear} title="Tahun Sebelumnya">
                      <ChevronsLeft size={14} />
                    </button>
                    <button type="button" className="shopee-cal-nav-btn" onClick={handlePrevMonth} title="Bulan Sebelumnya">
                      <ChevronLeft size={14} />
                    </button>
                  </div>

                  <span className="shopee-cal-title">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>

                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button type="button" className="shopee-cal-nav-btn" onClick={handleNextMonth} title="Bulan Berikutnya">
                      <ChevronRight size={14} />
                    </button>
                    <button type="button" className="shopee-cal-nav-btn" onClick={handleNextYear} title="Tahun Berikutnya">
                      <ChevronsRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="shopee-cal-weekdays">
                  {WEEKDAY_NAMES.map((name, i) => (
                    <span key={i}>{name}</span>
                  ))}
                </div>

                <div className="shopee-cal-grid">
                  {getDaysMatrix(viewYear, viewMonth).map((date, idx) => (
                    <div
                      key={idx}
                      className={getCellClasses(date)}
                      onClick={() => handleDateClick(date)}
                      onMouseEnter={() => date && !tempEnd && setHoverDate(date)}
                    >
                      {date ? date.getDate() : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar 2: Right (Next Month) */}
              <div className="shopee-calendar-month">
                <div className="shopee-cal-header">
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button type="button" className="shopee-cal-nav-btn" onClick={handlePrevYear} title="Tahun Sebelumnya">
                      <ChevronsLeft size={14} />
                    </button>
                    <button type="button" className="shopee-cal-nav-btn" onClick={handlePrevMonth} title="Bulan Sebelumnya">
                      <ChevronLeft size={14} />
                    </button>
                  </div>

                  <span className="shopee-cal-title">
                    {MONTH_NAMES[rightMonth]} {rightYear}
                  </span>

                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button type="button" className="shopee-cal-nav-btn" onClick={handleRightNextMonth} title="Bulan Berikutnya">
                      <ChevronRight size={14} />
                    </button>
                    <button type="button" className="shopee-cal-nav-btn" onClick={handleRightNextYear} title="Tahun Berikutnya">
                      <ChevronsRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="shopee-cal-weekdays">
                  {WEEKDAY_NAMES.map((name, i) => (
                    <span key={i}>{name}</span>
                  ))}
                </div>

                <div className="shopee-cal-grid">
                  {getDaysMatrix(rightYear, rightMonth).map((date, idx) => (
                    <div
                      key={idx}
                      className={getCellClasses(date)}
                      onClick={() => handleDateClick(date)}
                      onMouseEnter={() => date && !tempEnd && setHoverDate(date)}
                    >
                      {date ? date.getDate() : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Popover Action Footer */}
            <div className="shopee-datepicker-footer">
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {tempStart ? (
                  <>
                    Terpilih: <strong style={{ color: 'var(--text-primary)' }}>{formatDisplayDate(tempStart)}</strong>
                    {tempEnd && <> s/d <strong style={{ color: 'var(--text-primary)' }}>{formatDisplayDate(tempEnd)}</strong></>}
                  </>
                ) : (
                  'Pilih rentang tanggal dari kalender'
                )}
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsOpen(false)}
                  style={{ padding: '5px 12px', fontSize: '11px' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyCustom}
                  style={{ padding: '5px 14px', fontSize: '11px' }}
                  id="btn-apply-custom-dates"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
