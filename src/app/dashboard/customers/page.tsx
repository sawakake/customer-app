"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { Search, ArrowRight, UserPlus, Filter } from "lucide-react";

export default function CustomersManagementPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState("すべて");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
                <div key={customer.id} className={styles.customerCardWrapper}>
                  <Link href={`/customers/${customer.id}`} className={styles.customerCard}>
                    <div className={styles.customerInfo}>
                      <div className={styles.avatarMini}>{customer.name[0]}</div>
                      <div>
                        <h3>{customer.name}</h3>
                        <div className={styles.status}>
                          <span className={styles.dot} style={{ backgroundColor: status.color }} />
                          {status.label}
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className={styles.quickActions}>
                    <select 
                      className={styles.quickPlanSelect}
                      value={customer.plan || "未設定"} 
                      onChange={async (e) => {
                        const newPlan = e.target.value;
                        // 楽観的更新
                        setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, plan: newPlan } : c));
                        try {
                          await fetch(`/api/customers/${customer.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ plan: newPlan })
                          });
                        } catch (err) {
                          console.error("Failed to update plan");
                        }
                      }}
                    >
                      <option value="未設定">未設定</option>
                      <option value="月4回コース">月4回コース</option>
                      <option value="月8回コース">月8回コース</option>
                      <option value="定額通い放題">定額通い放題</option>
                      <option value="体験">体験</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
