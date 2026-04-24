import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import { ArrowLeft, Calendar, Clock, Activity, Sparkles, Ruler } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({ 
  params 
}: { 
  params: any 
}) {
  const { id, sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      customer: true,
    }
  });

  if (!session) {
    notFound();
  }

  // その日の計測データも取得（同じ日に記録されたものを探す）
  const metric = await prisma.metric.findFirst({
    where: {
      customerId: id,
      date: {
        gte: new Date(new Date(session.date).setHours(0,0,0,0)),
        lte: new Date(new Date(session.date).setHours(23,59,59,999))
      }
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.navHeader}>
        <Link href={`/customers/${id}`} className={styles.backLink}>
          <ArrowLeft size={18} /> 顧客詳細に戻る
        </Link>
      </div>

      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <div className={styles.dateBadge}>
            <Calendar size={16} /> {new Date(session.date).toLocaleDateString('ja-JP')}
          </div>
          <h1>セッション詳細: {session.customer.name} 様</h1>
        </div>
        <div className={styles.metaBadges}>
          <span className={styles.badge}><Clock size={14} /> {session.duration}分</span>
          <span className={styles.badge}>{session.type}</span>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          {/* コンディション・計測 */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className={styles.sectionTitle}><Activity size={18} /> コンディション ・ 計測</h3>
            <div className={styles.metricsRow}>
              <div className={styles.metricItem}>
                <label>体重</label>
                <div className={styles.value}>{metric?.weight || '--'} <span className={styles.unit}>kg</span></div>
              </div>
              <div className={styles.metricItem}>
                <label>血圧</label>
                <div className={styles.value}>{metric?.bloodPressure || '--'}</div>
              </div>
              <div className={styles.metricItem}>
                <label>本人の体調</label>
                <div className={styles.value}>{session.conditionSelf || '--'}</div>
              </div>
            </div>
            
            {(metric?.waist || metric?.armL) && (
              <div className={styles.sizeSection}>
                <h4 className={styles.subTitle}><Ruler size={14} /> 身体サイズ</h4>
                <div className={styles.sizeGrid}>
                  <div><span>ウェスト:</span> {metric.waist || '--'} cm</div>
                  <div><span>へそ周り:</span> {metric.belly || '--'} cm</div>
                  <div><span>二の腕:</span> {metric.armL || '--'} / {metric.armR || '--'} cm</div>
                  <div><span>太もも:</span> {metric.thighL || '--'} / {metric.thighR || '--'} cm</div>
                  <div><span>ふくらはぎ:</span> {metric.calfL || '--'} / {metric.calfR || '--'} cm</div>
                </div>
              </div>
            )}
          </div>

          {/* トレーニング内容 */}
          <div className="card">
            <h3 className={styles.sectionTitle}>トレーニング記録</h3>
            <div className={styles.contentBlock}>
              <label>実施メニュー</label>
              <p className={styles.text}>{session.routines || "記録なし"}</p>
            </div>
            <div className={styles.contentBlock}>
              <label>宿題・次回の課題</label>
              <p className={styles.text}>{session.homework || "記録なし"}</p>
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          {/* AIフィードバック */}
          <div className={`card ${styles.aiCard}`}>
            <h3 className={styles.aiTitle}><Sparkles size={18} /> AI 要約 ＆ アドバイス</h3>
            <div className={styles.aiItem}>
              <label>セッションの様子</label>
              <p>{session.aiSummary || "分析データがありません"}</p>
            </div>
            <div className={styles.aiItem}>
              <label>トレーナーへのアドバイス</label>
              <p>{session.aiAdvice || "分析データがありません"}</p>
            </div>
            <div className={styles.aiItem}>
              <label>顧客のモチベーション推測</label>
              <p>{session.clientMotivation || "分析データがありません"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
