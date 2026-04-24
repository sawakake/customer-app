import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock, ChevronRight } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AllSessionsPage() {
  const sessions = await prisma.session.findMany({
    where: {
      type: {
        not: "計測のみ"
      }
    },
    include: {
      customer: true
    },
    orderBy: {
      date: 'desc'
    },
    take: 50
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>
          <ArrowLeft size={20} /> ダッシュボードに戻る
        </Link>
        <h1>最近のセッション一覧</h1>
        <p className={styles.subtitle}>直近50件のトレーニング記録を表示しています</p>
      </div>

      <div className="card">
        <div className={styles.tableHeader}>
          <div className={styles.colDate}>日付</div>
          <div className={styles.colCustomer}>顧客名</div>
          <div className={styles.colType}>種別</div>
          <div className={styles.colDuration}>時間</div>
          <div className={styles.colSummary}>内容要約</div>
          <div className={styles.colAction}></div>
        </div>

        <div className={styles.tableBody}>
          {sessions.map(session => (
            <Link key={session.id} href={`/customers/${session.customerId}/session/${session.id}`} className={styles.row}>
              <div className={styles.colDate}>
                <Calendar size={14} className={styles.icon} />
                {new Date(session.date).toLocaleDateString('ja-JP')}
              </div>
              <div className={styles.colCustomer}>
                <User size={14} className={styles.icon} />
                {session.customer.name}
              </div>
              <div className={styles.colType}>
                <span className={`${styles.badge} ${session.type === '体験' ? styles.experience : ''}`}>
                  {session.type}
                </span>
              </div>
              <div className={styles.colDuration}>
                <Clock size={14} className={styles.icon} />
                {session.duration}分
              </div>
              <div className={styles.colSummary}>
                {session.aiSummary || "（詳細なし）"}
              </div>
              <div className={styles.colAction}>
                <ChevronRight size={18} />
              </div>
            </Link>
          ))}
          {sessions.length === 0 && (
            <div className={styles.empty}>セッション記録がまだありません。</div>
          )}
        </div>
      </div>
    </div>
  );
}
