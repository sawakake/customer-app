import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { Activity, Calendar, Ruler, FileText, Plus, Sparkles, ChevronRight, Dumbbell, Coffee, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/client/login");
  
  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  
  // スタッフがアクセスしたらスタッフ画面へ
  if (role === "staff") redirect("/dashboard");

  const customer = await prisma.customer.findUnique({
    where: { id: userId },
    include: {
      sessions: {
        orderBy: { date: "desc" },
        take: 10,
        include: { menuItems: true }
      },
      metrics: {
        orderBy: { date: "desc" },
        take: 1
      },
      goals: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 3
      },
      customerLogs: {
        orderBy: { date: "desc" },
        take: 10
      }
    }
  });

  if (!customer) redirect("/client/login");

  const latestMetric = customer.metrics[0];
  const currentGoal = customer.goals[0];
  const recentSessions = customer.sessions.filter(s => s.type !== "計測のみ");

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brandRow}>
            <img src="/images/gym-logo.png" alt="Logo" className={styles.headerLogo} />
            <span className={styles.brandName}>BodyCareGymCONNECT</span>
          </div>
          <div className={styles.userGreeting}>
            <p className={styles.welcomeText}>おかえりなさい！</p>
            <h1 className={styles.userName}>{customer.name} さん</h1>
          </div>
          <Link href="/api/auth/signout" className={styles.logoutBtn}>ログアウト</Link>
        </div>
      </header>

      <main className={styles.main}>
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
          </section>
        )}

        {/* セルフログ（食事・日記） */}
        {customer.customerLogs.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}><FileText size={20} /> 自分の記録</h2>
              <Link href="/client/log/new" className={styles.addBtn}><Plus size={16} /> 追加</Link>
            </div>
            <div className={styles.logList}>
              {customer.customerLogs.map(log => (
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
          </section>
        )}

        {/* セッション履歴 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><Activity size={20} /> セッション履歴</h2>
          {recentSessions.length === 0 ? (
            <p className={styles.emptyText}>まだセッション記録がありません</p>
          ) : (
            <div className={styles.sessionList}>
              {recentSessions.map(session => (
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
                        {session.menuItems.slice(0, 3).map(m => m.name).join('・')}
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
        {customer.reports.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><Sparkles size={20} /> AIコーチングレポート</h2>
            <div className={styles.reportList}>
              {customer.reports.map(report => (
                <div key={report.id} className={styles.reportCard}>
                  <div className={styles.reportMeta}>
                    <strong>{report.title}</strong>
                    <span>{new Date(report.createdAt).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <p className={styles.reportContent}>{report.content.substring(0, 200)}...</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
