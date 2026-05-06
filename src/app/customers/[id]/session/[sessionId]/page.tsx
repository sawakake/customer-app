import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import { ArrowLeft, Calendar, Clock, Activity, Sparkles, Ruler } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import GenerateReportButton from "@/components/GenerateReportButton";

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
      menuItems: true,
      photos: true,
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
          <Link href={`/customers/${id}/session/${session.id}/edit`} className="btn btn-secondary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem", height: "auto" }}>
            編集する
          </Link>
          <GenerateReportButton customerId={id} type="Session" />
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
                <div className={styles.value}>
                  {metric?.bloodPressureHigh ? `${metric.bloodPressureHigh} / ${metric.bloodPressureLow}` : '--'}
                </div>
              </div>
              <div className={styles.metricItem}>
                <label>本人の体調</label>
                <div className={styles.value}>{session.conditionSelf || '--'}</div>
              </div>
            </div>
          </div>

          {/* 姿勢写真 */}
          {session.photos.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 className={styles.sectionTitle}>姿勢分析写真</h3>
              <div className={styles.photoGrid}>
                {session.photos.map(photo => (
                  <div key={photo.id} className={styles.photoItem}>
                    <img src={photo.url} alt={photo.viewType} />
                    <div className={styles.photoLabel}>{photo.timing} - {photo.viewType}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* トレーニング内容 */}
          <div className="card">
            <h3 className={styles.sectionTitle}>トレーニング・ストレッチ記録</h3>
            
            {session.menuItems.length > 0 ? (
              <div className={styles.menuList}>
                {session.menuItems.map((item) => (
                  <div key={item.id} className={styles.menuItem}>
                    <span className={styles.menuType}>{item.type === 'トレーニング' ? '重' : '伸'}</span>
                    <div className={styles.menuDetail}>
                      <div className={styles.menuName}>{item.name}</div>
                      <div className={styles.menuStats}>
                        {item.weight && <span>{item.weight} / </span>}
                        {item.sets && <span>{item.sets} set / </span>}
                        {item.reps && <span>{item.reps} 回</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>詳細な種目記録はありません</p>
            )}

            <div className={styles.contentBlock} style={{ marginTop: '1.5rem' }}>
              <label>フリー記入欄</label>
              <p className={styles.text}>{session.routinesText || "記録なし"}</p>
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
          
          {/* 日常生活・雑談 (スタッフ限定) */}
          <div className="card" style={{ marginTop: '1.5rem', background: '#f8fafc' }}>
            <h3 className={styles.sectionTitle} style={{ borderBottomColor: '#cbd5e1' }}>日常生活・雑談 (スタッフ用メモ)</h3>
            <p className={styles.text} style={{ color: '#475569' }}>{session.smallTalk || "記録なし"}</p>
          </div>

          {/* 文字起こし全文 (スタッフ限定) */}
          <details className={styles.transcriptDetails} style={{ marginTop: '1.5rem' }}>
            <summary className={styles.transcriptSummary}>文字起こし全文を表示</summary>
            <div className={styles.transcriptContent}>
              {session.fullTranscript || "文字起こしデータがありません"}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
