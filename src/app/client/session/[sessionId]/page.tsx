import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity, Ruler, Sparkles, Clock } from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function ClientSessionDetail({ params }: { params: any }) {
  const session = await auth();
  if (!session?.user) redirect("/client/login");

  const { sessionId } = await params;
  const userId = (session.user as any).id;

  const sessionData = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      customer: true,
      menuItems: true,
      photos: true,
    }
  });

  // 他の顧客のデータは見せない
  if (!sessionData || sessionData.customerId !== userId) notFound();

  const metric = await prisma.metric.findFirst({
    where: {
      customerId: userId,
      date: {
        gte: new Date(new Date(sessionData.date).setHours(0,0,0,0)),
        lte: new Date(new Date(sessionData.date).setHours(23,59,59,999))
      }
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/client/dashboard" className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>マイページに戻る</span>
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.titleBlock}>
          <p className={styles.dateLabel}>{new Date(sessionData.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          <h1 className={styles.pageTitle}>セッション記録</h1>
          <div className={styles.badges}>
            <span className={styles.badge}><Clock size={14}/> {sessionData.duration}分</span>
            <span className={styles.badge}>{sessionData.type}</span>
          </div>
        </div>

        {/* 計測データ */}
        {metric && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}><Activity size={18} /> この日の計測データ</h2>
            <div className={styles.metricsRow}>
              {metric.weight && (
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>体重</span>
                  <span className={styles.metricValue}>{metric.weight}<span className={styles.unit}>kg</span></span>
                </div>
              )}
              {metric.bloodPressureHigh && (
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>血圧</span>
                  <span className={styles.metricValue}>{metric.bloodPressureHigh}/{metric.bloodPressureLow}</span>
                </div>
              )}
              {metric.waist && (
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>ウエスト</span>
                  <span className={styles.metricValue}>{metric.waist}<span className={styles.unit}>cm</span></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* トレーニング内容 */}
        {sessionData.menuItems.length > 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}><Ruler size={18} /> 実施したメニュー</h2>
            <div className={styles.menuList}>
              {sessionData.menuItems.map(item => (
                <div key={item.id} className={styles.menuItem}>
                  <span className={`${styles.menuBadge} ${item.type === 'ストレッチ' ? styles.stretchBadge : ''}`}>
                    {item.type === 'トレーニング' ? '筋' : '伸'}
                  </span>
                  <div>
                    <div className={styles.menuName}>{item.name}</div>
                    <div className={styles.menuDetail}>
                      {item.sets && `${item.sets}セット`}
                      {item.reps && ` × ${item.reps}回`}
                      {item.weight && ` / ${item.weight}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AIアドバイス */}
        {(sessionData.aiSummary || sessionData.aiAdvice) && (
          <div className={`${styles.card} ${styles.aiCard}`}>
            <h2 className={`${styles.cardTitle} ${styles.aiTitle}`}><Sparkles size={18} /> トレーナーからのメッセージ</h2>
            {sessionData.aiSummary && (
              <div className={styles.aiSection}>
                <p className={styles.aiLabel}>今日のセッションについて</p>
                <p className={styles.aiText}>{sessionData.aiSummary}</p>
              </div>
            )}
            {sessionData.aiAdvice && (
              <div className={styles.aiSection}>
                <p className={styles.aiLabel}>アドバイス</p>
                <p className={styles.aiText}>{sessionData.aiAdvice}</p>
              </div>
            )}
            {sessionData.homework && (
              <div className={styles.aiSection}>
                <p className={styles.aiLabel}>次回までの宿題</p>
                <p className={styles.aiText}>{sessionData.homework}</p>
              </div>
            )}
          </div>
        )}

        {/* 姿勢写真 */}
        {sessionData.photos.length > 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>姿勢写真</h2>
            <div className={styles.photoGrid}>
              {sessionData.photos.map(photo => (
                <div key={photo.id} className={styles.photoItem}>
                  <img src={photo.url} alt={photo.viewType} />
                  <span>{photo.timing} / {photo.viewType}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
