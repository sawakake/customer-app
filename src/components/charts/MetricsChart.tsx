"use client";

import { useState, useMemo } from 'react';
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
import styles from './MetricsChart.module.css';

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

interface Metric {
  date: string;
  weight: number | null;
  waist?: number | null;
  belly?: number | null;
  armL?: number | null;
  armR?: number | null;
  thighL?: number | null;
  thighR?: number | null;
  calfL?: number | null;
  calfR?: number | null;
}

interface MetricsChartProps {
  metrics: Metric[];
}

const METRIC_CONFIG = {
  weight: { label: '体重 (kg)', color: '#3b82f6' },
  waist: { label: 'ウエスト (cm)', color: '#ef4444' },
  belly: { label: 'へそ周り (cm)', color: '#f59e0b' },
  armL: { label: '左二の腕 (cm)', color: '#10b981' },
  armR: { label: '右二の腕 (cm)', color: '#059669' },
  thighL: { label: '左太もも (cm)', color: '#8b5cf6' },
  thighR: { label: '右太もも (cm)', color: '#7c3aed' },
  calfL: { label: '左ふくらはぎ (cm)', color: '#ec4899' },
  calfR: { label: '右ふくらはぎ (cm)', color: '#db2777' },
};

export default function MetricsChart({ metrics }: MetricsChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['weight']);
  const [range, setRange] = useState<'all' | '3m' | '6m'>('all');

  const filteredMetrics = useMemo(() => {
    let raw = [...metrics];
    if (range === '3m') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      raw = raw.filter(m => new Date(m.date) >= threeMonthsAgo);
    } else if (range === '6m') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      raw = raw.filter(m => new Date(m.date) >= sixMonthsAgo);
    }
    return raw;
  }, [metrics, range]);

  if (!metrics || metrics.length === 0) {
    return (
      <div className={styles.emptyChart}>
        測定データがありません。セッションを記録して数値を入力してください。
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { beginAtZero: false },
    },
  };

  const labels = filteredMetrics.map(m => 
    new Date(m.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
  );

  const chartData = {
    labels,
    datasets: selectedMetrics.map(key => {
      const config = (METRIC_CONFIG as any)[key];
      return {
        label: config.label,
        data: filteredMetrics.map(m => (m as any)[key]),
        borderColor: config.color,
        backgroundColor: `${config.color}33`,
        tension: 0.3,
        pointRadius: 4,
        spanGaps: true,
      };
    }),
  };

  const toggleMetric = (key: string) => {
    setSelectedMetrics(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.selector}>
          {Object.entries(METRIC_CONFIG).map(([key, config]) => (
            <button
              key={key}
              className={`${styles.filterBtn} ${selectedMetrics.includes(key) ? styles.active : ''}`}
              onClick={() => toggleMetric(key)}
            >
              {config.label}
            </button>
          ))}
        </div>
        <div className={styles.rangeSelector}>
          <button className={`${styles.rangeBtn} ${range === 'all' ? styles.activeRange : ''}`} onClick={() => setRange('all')}>全期間</button>
          <button className={`${styles.rangeBtn} ${range === '6m' ? styles.activeRange : ''}`} onClick={() => setRange('6m')}>6ヶ月</button>
          <button className={`${styles.rangeBtn} ${range === '3m' ? styles.activeRange : ''}`} onClick={() => setRange('3m')}>3ヶ月</button>
        </div>
      </div>
      <div className={styles.chartWrapper}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}
