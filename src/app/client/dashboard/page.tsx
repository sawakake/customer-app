import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { Activity, Calendar, Ruler, FileText, Plus, Sparkles, ChevronRight, Dumbbell, Coffee, BookOpen, Video, TrendingUp } from "lucide-react";
import MetricsChart from "@/components/charts/MetricsChart";

export const dynamic = "force-dynamic";

export default async function ClientDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/client/login");
  
  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  
  // スタッフがアクセスしたらスタッフ画面へ
  if (role === "staff") redirect("/dashboard");

  // 重い結合クエリを避け、並列で独立したクエリを発行する
  const [customer, sessions, metrics, goals, reports, logs] = await Promise.all([
    prisma.customer.findUnique({ where: { id: userId } }),
    prisma.session.findMany({
      where: { customerId: userId },
      orderBy: { date: "desc" },
      take: 10,
      include: { menuItems: true }
    }),
    prisma.metric.findMany({
      where: { customerId: userId },
      orderBy: { date: "desc" },
      take: 1
    }),
    prisma.goal.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
      take: 1
    }),
    prisma.report.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.customerLog.findMany({
      where: { customerId: userId },
      orderBy: { date: "desc" },
      take: 10
    })
  ]);

  // 5. 動画リストの取得
  const videos = await prisma.videoGuide.findMany();
  // 簡易レコメンド（ランダムで3つ抽出、将来的にはお客様の課題に合わせた抽出を行う）
  const recommendedVideos = videos.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  if (!customer) redirect("/client/login");

  // プロパティの互換性を保つために customer オブジェクトに結合するか、そのまま使用する
  const customerWithData = {
    ...customer,
    customerLogs: logs,
    reports: reports,
  };

  const latestMetric = metrics[0] as any;
  const currentGoal = goals[0] as any;
  const recentSessions = sessions.filter(s => s.type !== "計測のみ") as any;

  // グラフ用データ
  const chartMetrics = [...metrics].reverse().map(m => ({
    date: new Date(m.date).toLocaleDateString('ja-JP'),
    weight: m.weight,
    waist: m.waist
  }));

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.brandRow}>
          <img src="/images/gym-logo.png" alt="Logo" className={styles.headerLogo} />
          <span className={styles.brandName}>BodyCareGymCONNECT</span>
        </div>
        <Link href="/api/auth/signout" className={styles.logoutBtn}>ログアウト</Link>
      </header>

      <main className={styles.main}>
        <div className={styles.heroSection}>
          <p className={styles.welcomeText}>おかえりなさい！</p>
          <h1 className={styles.userName}>{customerWithData.name} さん</h1>
        </div>

        {/* 目標カード */}
        {currentGoal && (
          <div className={styles.goalBanner}>
            <div className={styles.goalIcon}><Sparkles size={20} /></div>
            <div>
              <p className={styles.goalLabel}>今の目標</p>
              <p className={styles.goalText}>{currentGoal.longTermPurpose}</p>
            </div>
          </div>
        )}

        {/* クイック記録ボタン */}
        <section className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>今日の記録を追加</h2>
          <div className={styles.actionGrid}>
            <Link href="/client/log/new?type=Meal" className={`${styles.actionCard} ${styles.mealCard}`}>
              <Coffee size={28} />
              <span>食事を記録</span>
            </Link>
            <Link href="/client/log/new?type=Workout" className={`${styles.actionCard} ${styles.workoutCard}`}>
              <Dumbbell size={28} />
              <span>自主トレを記録</span>
            </Link>
            <Link href="/client/log/new?type=Diary" className={`${styles.actionCard} ${styles.diaryCard}`}>
              <BookOpen size={28} />
              <span>日記・体調を記録</span>
            </Link>
          </div>
        </section>

        {/* 最新の身体データ */}
        {latestMetric && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><Ruler size={20} /> 最新の身体データ</h2>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>体重</span>
                <span className={styles.metricValue}>{latestMetric.weight ?? '--'}</span>
                <span className={styles.metricUnit}>kg</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>血圧</span>
                <span className={styles.metricValue}>
                  {latestMetric.bloodPressureHigh ? `${latestMetric.bloodPressureHigh}/${latestMetric.bloodPressureLow}` : '--'}
                </span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>ウエスト</span>
                <span className={styles.metricValue}>{latestMetric.waist ?? '--'}</span>
                <span className={styles.metricUnit}>cm</span>
              </div>
              {latestMetric.weight && currentGoal?.targetWeight && (
                <div className={`${styles.metricCard} ${styles.goalProgress}`}>
                  <span className={styles.metricLabel}>目標体重まで</span>
                  <span className={styles.metricValue}>
                    {Math.abs(latestMetric.weight - currentGoal.targetWeight).toFixed(1)}
                  </span>
                  <span className={styles.metricUnit}>kg</span>
                </div>
              )}
            </div>

            {/* 身体データ推移グラフ */}
            <div className={styles.chartSection}>
              <h3 className={styles.sectionTitle}>
                <TrendingUp size={22} color="var(--primary)" /> 身体データ推移
              </h3>
              <MetricsChart metrics={chartMetrics} />
            </div>

          </section>
        )}

        {/* セルフログ（食事・日記） */}
        {customerWithData.customerLogs.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}><FileText size={20} /> 自分の記録</h2>
              <Link href="/client/log/new" className={styles.addBtn}><Plus size={16} /> 追加</Link>
            </div>
            <div className={styles.logList}>
              {customerWithData.customerLogs.slice(0, 3).map((log: any) => (
                <div key={log.id} className={styles.logItem}>
                  <div className={styles.logType}>
                    {log.type === 'Meal' ? <Coffee size={16} /> : log.type === 'Workout' ? <Dumbbell size={16} /> : <BookOpen size={16} />}
                  </div>
                  <div className={styles.logContent}>
                    <div className={styles.logTitle}>{log.title || (log.type === 'Meal' ? '食事' : log.type === 'Workout' ? '自主トレ' : '日記')}</div>
                    <div className={styles.logText}>{log.content}</div>
                    {log.imageUrl && <img src={log.imageUrl} alt="記録" className={styles.logImage} />}
                  </div>
                  <div className={styles.logDate}>{new Date(log.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</div>
                </div>
              ))}
            </div>
            {customerWithData.customerLogs.length > 3 && (
              <Link href="/client/log/history" className={styles.viewAllBtn} style={{ display: 'block', textAlign: 'center', padding: '1rem', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold', textDecoration: 'none', borderTop: '1px solid #f0f0f0' }}>
                過去の記録をすべて見る <ChevronRight size={16} style={{ verticalAlign: 'middle' }} />
              </Link>
            )}
          </section>
        )}

        {/* セッション履歴 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><Activity size={20} /> セッション履歴</h2>
          {recentSessions.length === 0 ? (
            <p className={styles.emptyText}>まだセッション記録がありません</p>
          ) : (
            <div className={styles.sessionList}>
              {recentSessions.map((session: any) => (
                <Link key={session.id} href={`/client/session/${session.id}`} className={styles.sessionCard}>
                  <div className={styles.sessionDate}>
                    <span className={styles.dateMonth}>{new Date(session.date).toLocaleDateString('ja-JP', { month: 'long' })}</span>
                    <span className={styles.dateDay}>{new Date(session.date).getDate()}</span>
                    <span className={styles.dateWeek}>{['日', '月', '火', '水', '木', '金', '土'][new Date(session.date).getDay()]}曜</span>
                  </div>
                  <div className={styles.sessionContent}>
                    <div className={styles.sessionType}>{session.type} {session.duration}分</div>
                    {session.menuItems.length > 0 && (
                      <div className={styles.menuSummary}>
                        {session.menuItems.slice(0, 3).map((m: any) => m.name).join('・')}
                        {session.menuItems.length > 3 && ' …'}
                      </div>
                    )}
                    {session.aiSummary && (
                      <div className={styles.aiSummary}><Sparkles size={12} /> {session.aiSummary.substring(0, 50)}...</div>
                    )}
                  </div>
                  <ChevronRight size={20} className={styles.arrow} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* AIレポート */}
        {customerWithData.reports.length > 0 && (
          <section id="reports" className={styles.section}>
            <h2 className={styles.sectionTitle}><Sparkles size={20} /> AIコーチングレポート</h2>
            <div className={styles.reportList}>
              {customerWithData.reports.map((report: any) => (
                <div key={report.id} className={styles.reportCard}>
                  <div className={styles.reportMeta}>
                    <strong>{report.title}</strong>
                    <span>{new Date(report.createdAt).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <details style={{ cursor: 'pointer', marginTop: '0.5rem' }}>
                    <summary style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>レポートを開く / 閉じる</summary>
                    <p className={styles.reportContent} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{report.content}</p>
                  </details>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* おすすめ動画 */}
        {recommendedVideos.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><Video size={20} /> あなたにおすすめの動画</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recommendedVideos.map(video => (
                <a key={video.id} href={video.url} target="_blank" rel="noreferrer" style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem', textDecoration: 'none', color: '#333', border: '1px solid #eaeaea' }}>
                  <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0284c7', padding: '0.2rem 0.6rem', borderRadius: '12px', width: 'max-content', fontWeight: 'bold' }}>{video.category}</span>
                  <strong style={{ fontSize: '1rem' }}>{video.title}</strong>
                  {video.description && <span style={{ fontSize: '0.85rem', color: '#666' }}>{video.description}</span>}
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
