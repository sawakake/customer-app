"use client";

import { useState, useEffect } from "react";
import MetricsChart from "@/components/charts/MetricsChart";
import Link from "next/link";
import { FileText, Activity, Ruler, Loader2 } from "lucide-react";
import styles from "./CustomerHeavyData.module.css";
import DeleteSessionButton from "@/components/DeleteSessionButton";

interface Props {
  customerId: string;
}

export default function CustomerHeavyData({ customerId }: Props) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      fetch(`/api/customers/${customerId}/sessions`).then(res => res.json()),
      fetch(`/api/customers/${customerId}/metrics`).then(res => res.json())
    ]).then(([sessionsData, metricsData]) => {
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setMetrics(Array.isArray(metricsData) ? metricsData : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [customerId]);

  if (loading) {
    return (
      <div className={styles.heavyLoading}>
        <Loader2 className={styles.spin} />
        セッション履歴と身体データを読み込み中...
      </div>
    );
  }

  const latestMetricWithSizes = [...metrics]
    .reverse()
    .find(m => m.waist || m.belly || m.armL || m.armR || m.thighL || m.thighR || m.calfL || m.calfR);

  const chartMetrics = metrics.map(m => ({
    date: m.date,
    weight: m.weight,
    waist: m.waist,
    belly: m.belly,
    armL: m.armL,
    armR: m.armR,
    thighL: m.thighL,
    thighR: m.thighR,
    calfL: m.calfL,
    calfR: m.calfR
  }));

  return (
    <>
      {/* 最新サイズ */}
      <div className={`card ${styles.sizeCard}`}>
        <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity /> 最新の身体サイズ
        </h2>
        {latestMetricWithSizes ? (
          <div className={styles.sizeGridMini}>
            <div className={styles.sizeItem}><label>ウェスト</label><span>{latestMetricWithSizes.waist || '--'} cm</span></div>
            <div className={styles.sizeItem}><label>へそ周り</label><span>{latestMetricWithSizes.belly || '--'} cm</span></div>
            <div className={styles.sizeItem}><label>二の腕 (左/右)</label><span>{latestMetricWithSizes.armL || '--'} / {latestMetricWithSizes.armR || '--'} cm</span></div>
            <div className={styles.sizeItem}><label>太もも (左/右)</label><span>{latestMetricWithSizes.thighL || '--'} / {latestMetricWithSizes.thighR || '--'} cm</span></div>
            <div className={styles.sizeItem}><label>ふくらはぎ (左/右)</label><span>{latestMetricWithSizes.calfL || '--'} / {latestMetricWithSizes.calfR || '--'} cm</span></div>
            <div className={styles.dateLabel}>計測日: {new Date(latestMetricWithSizes.date).toLocaleDateString('ja-JP')}</div>
          </div>
        ) : <p className={styles.emptyText}>データがまだありません。</p>}
      </div>

      {/* チャート */}
      <div className={`card ${styles.chartSection}`} style={{ gridColumn: 'span 3' }}>
        <h2 className={styles.sectionTitle}>身体データ推移 (グラフ)</h2>
        <MetricsChart metrics={chartMetrics} />
      </div>

      {/* 履歴 */}
      <div className={styles.historySection} style={{ gridColumn: 'span 3' }}>
        <div className="card">
          <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText /> セッション記録
          </h2>
          {sessions.filter(s => s.type !== "計測のみ").length === 0 ? (
            <p className={styles.emptyText}>セッション記録がまだありません。</p>
          ) : (
            <ul className={styles.infoList}>
              {sessions.filter(s => s.type !== "計測のみ").map(session => (
                <li key={session.id} className={styles.historyItem}>
                  <div className={styles.historyMain}>
                    <div className={styles.historyDate}>
                      {new Date(session.date).toLocaleDateString('ja-JP')}
                      <span className={styles.typeTag}>{session.type}</span>
                    </div>
                    {session.aiSummary && <p className={styles.historySummary}>{session.aiSummary}</p>}
                  </div>
                  <div className={styles.historyActions}>
                    <Link href={`/customers/${customerId}/session/${session.id}`} className="btn btn-secondary">詳細</Link>
                    <DeleteSessionButton sessionId={session.id} onDeleted={fetchData} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ruler size={20} /> 身体計測の履歴
          </h2>
          {sessions.filter(s => s.type === "計測のみ").length === 0 ? (
            <p className={styles.emptyText}>計測データがまだありません。</p>
          ) : (
            <ul className={styles.infoList}>
              {sessions.filter(s => s.type === "計測のみ").map(session => (
                <li key={session.id} className={styles.historyItem}>
                  <div className={styles.historyMain}>
                    <div className={styles.historyDate}>{new Date(session.date).toLocaleDateString('ja-JP')}</div>
                  </div>
                  <div className={styles.historyActions}>
                    <Link href={`/customers/${customerId}/session/${session.id}`} className="btn btn-secondary">数値</Link>
                    <DeleteSessionButton sessionId={session.id} onDeleted={fetchData} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
