"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { Search, ArrowRight, QrCode } from "lucide-react";
import ShareFormModal from "@/components/ShareFormModal";

export default function Dashboard() {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activePlan, setActivePlan] = useState("すべて");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then(res => res.json()),
      fetch('/api/dashboard-stats').then(res => res.json())
    ]).then(([customerData, statsData]) => {
      setCustomers(customerData);
      setStats(statsData);
      setIsLoading(false);
    });
  }, []);

  const plans = Array.from(new Set(customers.map(c => c.plan || "未設定")));

  const filteredCustomers = customers.filter(c => {
    const matchesPlan = activePlan === "すべて" || (c.plan || "未設定") === activePlan;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.furigana.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlan && matchesSearch;
  });

  const getStatusBadge = (customer: any) => {
    if (!customer.sessions || customer.sessions.length === 0) return { label: '未開始', color: '#94a3b8' };
    return { label: '継続中', color: '#10b981' };
  };

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar 
        plans={plans} 
        activePlan={activePlan} 
        onSelectPlan={setActivePlan} 
      />

      <main className={styles.mainContent}>
        <div className={styles.topBar}>
          <div className={styles.greeting}>
            <h1>経営管理ダッシュボード</h1>
            <p>ジムの稼働状況と数値をリアルタイムで把握しましょう</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className={`btn btn-primary ${styles.btnIcon}`}
          >
            <QrCode size={18} /> お客様情報入力シートはこちら
          </button>
        </div>

        {stats && (
          <div className={styles.kpiGrid}>
            <Link href="/dashboard/sessions" className={`card ${styles.kpiCard} ${styles.clickable}`}>
              <div className={styles.kpiLabel}>セッション数 (今月 / 先月)</div>
              <div className={styles.kpiValue}>
                {stats.summary.thisMonthSessionCount} <span className={styles.subText}>/ {stats.summary.lastMonthSessionCount}</span>
              </div>
              <div className={styles.kpiDetail}>
                60分: {stats.summary.durationCount["60"]}本 | 90分: {stats.summary.durationCount["90"]}本
              </div>
            </Link>
            
            <div className={`card ${styles.kpiCard}`}>
              <div className={styles.kpiLabel}>体験数 / 新規入会</div>
              <div className={styles.kpiValue}>
                {stats.summary.experienceCount} <span className={styles.subText}>/ {stats.summary.newEnrollments}</span>
              </div>
              <div className={styles.kpiDetail}>
                入会率: <span className={styles.highlight}>{stats.summary.enrollmentRate}%</span>
              </div>
            </div>

            <div className={`card ${styles.kpiCard}`}>
              <div className={styles.kpiLabel}>総顧客数</div>
              <div className={styles.kpiValue}>{stats.summary.totalCustomers}</div>
              <div className={styles.kpiDetail}>
                プラン別: {Object.keys(stats.planStats).length} カテゴリ
              </div>
            </div>
          </div>
        )}

        <div className={`card ${styles.listCard}`}>
          <div className={styles.listHeader}>
            <h2>顧客リスト ({filteredCustomers.length}名)</h2>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="名前・ふりがなで検索..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className={styles.loading}>読み込み中...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className={styles.empty}>該当する顧客が見つかりません</div>
          ) : (
            <div className={styles.customerGrid}>
              {filteredCustomers.map(customer => {
                const status = getStatusBadge(customer);
                return (
                  <Link key={customer.id} href={`/customers/${customer.id}`} className={styles.customerCard}>
                    <div className={styles.customerInfo}>
                      <div className={styles.avatarMini}>{customer.name[0]}</div>
                      <div>
                        <h3>{customer.name}</h3>
                        <span className={styles.planLabel}>{customer.plan || "未設定"}</span>
                      </div>
                    </div>
                    <div className={styles.customerMeta}>
                      <div className={styles.status}>
                        <span className={styles.dot} style={{ backgroundColor: status.color }} />
                        {status.label}
                      </div>
                      <ArrowRight size={18} className={styles.arrow} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 共有モーダル */}
        <ShareFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </main>
    </div>
  );
}
