"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { QrCode, TrendingUp, Users, Activity } from "lucide-react";
import ShareFormModal from "@/components/ShareFormModal";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(res => res.json())
      .then(statsData => {
        setStats(statsData);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div className={styles.loading}>読み込み中...</div>;

  return (
    <div className={styles.mainContent}>
      <div className={styles.topBar}>
        <div className={styles.greeting}>
          <h1>経営管理ダッシュボード</h1>
          <p>ジムの稼働状況と数値をリアルタイムで把握しましょう</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className={`btn btn-primary ${styles.btnIcon}`}
        >
          <QrCode size={18} /> お客様情報入力シートを表示
        </button>
      </div>

      {stats && (
        <>
          <div className={styles.kpiGrid}>
            <Link href="/dashboard/sessions" className={`card ${styles.kpiCard} ${styles.clickable}`}>
              <div className={styles.kpiLabel}>
                <Activity size={14} /> セッション数 (今月 / 先月)
              </div>
              <div className={styles.kpiValue}>
                {stats.summary.thisMonthSessionCount} <span className={styles.subText}>/ {stats.summary.lastMonthSessionCount}</span>
              </div>
              <div className={styles.kpiDetail}>
                60分: {stats.summary.durationCount["60"]}本 | 90分: {stats.summary.durationCount["90"]}本
              </div>
            </Link>
            
            <div className={`card ${styles.kpiCard}`}>
              <div className={styles.kpiLabel}>
                <TrendingUp size={14} /> 概算発生額 (今月 / 先月)
              </div>
              <div className={styles.kpiValue}>
                {stats.summary.thisMonthRevenue > 0 ? (
                  <>
                    ¥{stats.summary.thisMonthRevenue.toLocaleString()} 
                    <span className={styles.subText}>/ ¥{stats.summary.lastMonthRevenue.toLocaleString()}</span>
                  </>
                ) : (
                  <button 
                    className={styles.calculateBtn}
                    onClick={() => {
                      setIsLoading(true);
                      fetch('/api/dashboard-stats?calculateRevenue=true')
                        .then(res => res.json())
                        .then(data => {
                          setStats(data);
                          setIsLoading(false);
                        });
                    }}
                  >
                    数値を算出する
                  </button>
                )}
              </div>
              <div className={styles.kpiDetail}>
                単価設定: 8,500円 / 60分
              </div>
            </div>

            <div className={`card ${styles.kpiCard}`}>
              <div className={styles.kpiLabel}>
                <Users size={14} /> 総顧客数
              </div>
              <div className={styles.kpiValue}>{stats.summary.totalCustomers}</div>
              <div className={styles.kpiDetail}>
                アクティブプラン: {Object.keys(stats.planStats).length} カテゴリ
              </div>
            </div>
          </div>

          <div className={styles.subStatsGrid}>
            <div className={`card ${styles.subCard}`}>
              <h3>体験・入会状況</h3>
              <div className={styles.statRow}>
                <span>体験数 (今月)</span>
                <strong>{stats.summary.experienceCount} 名</strong>
              </div>
              <div className={styles.statRow}>
                <span>新規入会 (今月)</span>
                <strong>{stats.summary.newEnrollments} 名</strong>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statRow}>
                <span>入会率</span>
                <strong className={styles.highlight}>{stats.summary.enrollmentRate}%</strong>
              </div>
            </div>

            <div className={`card ${styles.subCard}`}>
              <h3>プラン別分布</h3>
              <div className={styles.planStatsList}>
                {Object.entries(stats.planStats).map(([plan, count]: [string, any]) => (
                  <div key={plan} className={styles.planStatItem}>
                    <span>{plan}</span>
                    <strong>{count}名</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <ShareFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
