/**
 * Utility Pengelolaan Tanggal & Zona Waktu GMT+7 (Asia/Jakarta)
 * File: client/src/utils/dateUtils.js
 */

// Format Date to YYYY-MM-DD (format standar API & HTML date)
export const toDateKey = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Format Date for Display (DD/MM/YYYY)
export const formatDisplayDate = (date) => {
  if (!date) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

// Dapatkan tanggal hari ini di zona waktu GMT+7 (Asia/Jakarta)
export const getTodayGMT7 = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const year = parseInt(parts.find(p => p.type === 'year').value, 10);
  const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1; // 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day').value, 10);
  return new Date(year, month, day);
};

// Buat rentang default (1 Bulan Terakhir / 30 Hari sampai Hari Ini GMT+7)
export const getDefaultDateRange = () => {
  const today = getTodayGMT7();
  const start = new Date(today);
  start.setDate(start.getDate() - 30);
  return {
    startDate: toDateKey(start),
    endDate: toDateKey(today),
    label: '1 Bulan Terakhir (GMT+7)',
    presetKey: '1_month'
  };
};
