"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Coffee, Dumbbell, BookOpen, Calendar, Filter, ChevronRight, TrendingUp, Activity } from "lucide-react";
import styles from "./page.module.css";

export default function ClientLogHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState("All"); // All, Meal, Workout, Diary
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/logs")
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setIsLoading(false);
      });
  }, []);

  const filteredLogs = filter === "All" 
    ? logs 
    : logs.filter(log => log.type === filter);

  // 日付ごとにグループ化
  const groupedLogs: { [key: string]: any[] } = {};
  filteredLogs.forEach(log => {
    const dateStr = new Date(log.date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short"
    });
    if (!groupedLogs[dateStr]) groupedLogs[dateStr] = [];
    groupedLogs[dateStr].push(log);
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/client/dashboard" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.pageTitle}>これまでの記録</h1>
          <div style={{ width: 40 }} />
        </div>
        
        {/* フィルタータブ */}
        <div className={styles.filterTabs}>
          {[
            { id: "All", label: "すべて", icon: Calendar },
            { id: "Meal", label: "食事", icon: Coffee },
            { id: "Workout", label: "トレ", icon: Dumbbell },
            { id: "Diary", label: "日記", icon: BookOpen },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`${styles.tabBtn} ${filter === tab.id ? styles.tabActive : ""}`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>読み込み中...</div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.empty}>
            <p>まだ記録がありません</p>
            <Link href="/client/log/new" className={styles.addFirstBtn}>
              最初の記録を書く
            </Link>
          </div>
        ) : (
          Object.entries(groupedLogs).map(([date, items]) => (
            <div key={date} className={styles.dateGroup}>
              <h2 className={styles.dateHeader}>{date}</h2>
              <div className={styles.logList}>
                {items.map(log => (
                  <div key={log.id} className={styles.logCard}>
                    <div className={styles.logHeader}>
                      <div className={`${styles.typeBadge} ${styles[log.type.toLowerCase()]}`}>
                        {log.type === "Meal" && <Coffee size={14} />}
                        {log.type === "Workout" && <Dumbbell size={14} />}
                        {log.type === "Diary" && <BookOpen size={14} />}
                        <span>{log.type === "Meal" ? "食事" : log.type === "Workout" ? "自主トレ" : "日記"}</span>
                      </div>
                      <span className={styles.logTime}>
                        {new Date(log.date).toLocaleTimeString("ja-JP", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={styles.logBody}>
                      <h3 className={styles.logTitle}>{log.title || "無題"}</h3>
                      <p className={styles.logContent}>{log.content}</p>
                      
                      {/* 体重・体脂肪（日記のみ） */}
                      {(log.weight || log.bodyFat) && (
                        <div className={styles.metricsBar}>
                          {log.weight && (
                            <div className={styles.metric}>
                              <TrendingUp size={12} />
                              <span>{log.weight}kg</span>
                            </div>
                          )}
                          {log.bodyFat && (
                            <div className={styles.metric}>
                              <Activity size={12} />
                              <span>{log.bodyFat}%</span>
                            </div>
                          )}
                        </div>
                      )}

                      {log.imageUrl && (
                        <div className={styles.imageWrapper}>
                          <img src={log.imageUrl} alt="記録写真" className={styles.logImage} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
