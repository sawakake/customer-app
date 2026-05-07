"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { Search, ArrowRight, UserPlus, Filter, Calendar, RefreshCw, CheckCircle2 } from "lucide-react";

export default function CustomersManagementPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState("すべて");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
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

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch('/api/customers/sync-birthdays', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage("同期が完了しました！");
        setTimeout(() => setSyncMessage(""), 3000);
      } else {
        alert("同期エラー: " + (data.error || "不明なエラー"));
      }
    } catch (err) {
      alert("通信エラーが発生しました");
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (customer: any) => {
    const sessionCount = customer._count?.sessions || 0;
    if (sessionCount === 0) return { label: '未開始', color: '#94a3b8' };
    return { label: '継続中', color: '#10b981' };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>顧客一覧・管理</h1>
          <p>会員情報の検索と詳細の確認ができます</p>
        </div>
        <div className={styles.headerActions}>
          {syncMessage && (
            <div className={styles.syncToast}>
              <CheckCircle2 size={16} /> {syncMessage}
            </div>
          )}
          <button 
            className={`btn btn-secondary ${styles.syncBtn}`} 
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? <RefreshCw size={18} className="spin" /> : <Calendar size={18} />}
            {isSyncing ? "同期中..." : "カレンダー一括同期"}
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="名前・ふりがなで検索..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterBox}>
            <Filter size={16} />
            <select value={activePlan} onChange={(e) => setActivePlan(e.target.value)}>
              <option value="すべて">すべてのプラン</option>
              {plans.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={`card ${styles.listCard}`}>
        {isLoading ? (
          <div className={styles.loading}>読み込み中...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className={styles.empty}>
            <p>顧客が見つかりませんでした</p>
          </div>
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
    </div>
  );
}
