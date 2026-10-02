import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Layers, Eye, Target } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  // dateStr is 'YYYYMMDD' or ISO
  if (dateStr.length === 8) {
    const day = dateStr.substring(6, 8);
    const month = dateStr.substring(4, 6);
    return `${day}/${month}`;
  }
  return dateStr;
};

const formatRupiahTooltip = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function AdsCharts({ chartData }) {
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' | 'traffic' | 'roas'

  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <div className="chart-section-card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Memuat data grafik tren iklan...</p>
      </div>
    );
  }

  const shortLabels = chartData.labels.map(formatShortDate);

  let datasets = [];
  let yAxesConfig = {};

  if (activeTab === 'revenue') {
    datasets = [
      {
        label: 'Omzet Iklan (GMV)',
        data: chartData.gmv || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10B981',
        borderWidth: 2.5,
      },
      {
        label: 'Biaya Iklan (Cost)',
        data: chartData.cost || [],
        borderColor: '#EE4D2D',
        backgroundColor: 'rgba(238, 77, 45, 0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#EE4D2D',
        borderWidth: 2.5,
      }
    ];
    yAxesConfig = {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#94A3B8',
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
          callback: (value) => {
            if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return 'Rp ' + (value / 1000).toFixed(0) + 'K';
            return 'Rp ' + value;
          }
        }
      }
    };
  } else if (activeTab === 'traffic') {
    datasets = [
      {
        label: 'Tayangan (Impressions)',
        data: chartData.impression || [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        yAxisID: 'yImp',
        borderWidth: 2,
      },
      {
        label: 'Klik (Clicks)',
        data: chartData.click || [],
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        fill: false,
        tension: 0.35,
        pointRadius: 3,
        yAxisID: 'yClick',
        borderWidth: 2.5,
      }
    ];
    yAxesConfig = {
      yImp: {
        type: 'linear',
        position: 'left',
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#3B82F6',
          font: { size: 10 },
          callback: (val) => val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val
        }
      },
      yClick: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#F59E0B',
          font: { size: 10 }
        }
      }
    };
  } else if (activeTab === 'roas') {
    const roasSeries = (chartData.cost || []).map((c, i) => {
      const g = (chartData.gmv || [])[i] || 0;
      return c > 0 ? Number((g / c).toFixed(2)) : 0;
    });

    datasets = [
      {
        label: 'ROAS Harian',
        data: roasSeries,
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#8B5CF6',
        borderWidth: 2.5,
      }
    ];
    yAxesConfig = {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#8B5CF6',
          font: { size: 10 },
          callback: (val) => val + 'x'
        }
      }
    };
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#94A3B8',
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' },
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#1C243B',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: '#2A3656',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          title: (items) => {
            const raw = chartData.labels[items[0].dataIndex];
            if (raw && raw.length === 8) {
              return `Tanggal: ${raw.substring(6, 8)}/${raw.substring(4, 6)}/${raw.substring(0, 4)}`;
            }
            return `Tanggal: ${items[0].label}`;
          },
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (activeTab === 'revenue') {
              label += formatRupiahTooltip(context.parsed.y);
            } else if (activeTab === 'roas') {
              label += `${context.parsed.y}x`;
            } else {
              label += new Intl.NumberFormat('id-ID').format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748B',
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
          maxRotation: 0,
        }
      },
      ...yAxesConfig
    }
  };

  return (
    <div className="chart-section-card">
      <div className="chart-header">
        <div className="chart-title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--color-brand-primary)' }} />
            <h3>Tren Kinerja Iklan Harian</h3>
          </div>
          <p>Dinamika performa belanja iklan dan penjualan selama periode berjalan</p>
        </div>

        <div className="chart-toggle-group">
          <button
            className={`pill-btn ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
            id="tab-chart-revenue"
          >
            <Layers size={13} />
            <span>Biaya vs Omzet</span>
          </button>
          <button
            className={`pill-btn ${activeTab === 'traffic' ? 'active' : ''}`}
            onClick={() => setActiveTab('traffic')}
            id="tab-chart-traffic"
          >
            <Eye size={13} />
            <span>Tayangan vs Klik</span>
          </button>
          <button
            className={`pill-btn ${activeTab === 'roas' ? 'active' : ''}`}
            onClick={() => setActiveTab('roas')}
            id="tab-chart-roas"
          >
            <Target size={13} />
            <span>Tren ROAS</span>
          </button>
        </div>
      </div>

      <div className="chart-canvas-wrapper">
        <Line 
          data={{ labels: shortLabels, datasets }} 
          options={chartOptions} 
        />
      </div>
    </div>
  );
}
