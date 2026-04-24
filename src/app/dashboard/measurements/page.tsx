import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import Link from "next/link";
import { ArrowLeft, Ruler, User, Calendar, TrendingDown, ChevronRight } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AllMeasurementsPage() {
  // 計測データを持つセッション（計測のみ、または身体データが含まれるセッション）
  const measurements = await prisma.session.findMany({
    where: {
      OR: [
        { type: "計測のみ" },
        { 
          customer: {
            metrics: {
              some: {}
            }
          }
        }
      ]
    },
    include: {
      customer: {
        include: {
          metrics: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      }
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
        <h1>身体データ更新履歴</h1>
        <p className={styles.subtitle}>月次測定や、セッション時の計測データの履歴です</p>
      </div>

      <div className={styles.grid}>
        {measurements.map(record => {
          // その日の特定のメトリクスが必要だが、簡易的に最新の1つを表示
          const metric = record.customer.metrics[0];
          
          return (
            <Link key={record.id} href={`/customers/${record.customerId}`} className={`card ${styles.dataCard}`}>
              <div className={styles.cardHeader}>
                <div className={styles.userInfo}>
                  <User size={16} />
                  <span className={styles.userName}>{record.customer.name} 様</span>
                </div>
                <div className={styles.date}>
                  <Calendar size={14} />
                  {new Date(record.date).toLocaleDateString('ja-JP')}
                </div>
              </div>
              
              <div className={styles.dataGrid}>
                <div className={styles.dataItem}>
                  <label>体重</label>
                  <span>{metric?.weight || '--'} kg</span>
                </div>
                <div className={styles.dataItem}>
                  <label>ウェスト</label>
                  <span>{metric?.waist || '--'} cm</span>
                </div>
                <div className={styles.dataItem}>
                  <label>腕 (左/右)</label>
                  <span>{metric?.armL || '--'} / {metric?.armR || '--'}</span>
                </div>
                <div className={styles.dataItem}>
                  <label>種別</label>
                  <span className={styles.typeBadge}>{record.type}</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span>詳細プロフィールへ</span>
                <ChevronRight size={16} />
              </div>
            </Link>
          );
        })}

        {measurements.length === 0 && (
          <div className={styles.empty}>計測データがまだありません。</div>
        )}
      </div>
    </div>
  );
}
