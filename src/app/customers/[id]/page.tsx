import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import MetricsChart from "@/components/charts/MetricsChart";
import Link from "next/link";
import { Mic, Target, FileText, Activity, ArrowLeft, Ruler, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import GenerateReportButton from "@/components/GenerateReportButton";

export const dynamic = 'force-dynamic';

import DeleteCustomerButton from "@/components/DeleteCustomerButton";

export default async function CustomerDetailPage({ params }: { params: any }) {
  const { id } = await params;
  
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      metrics: {
        orderBy: { date: "asc" }
      },
      goals: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      sessions: {
        orderBy: { date: "desc" },
        include: { menuItems: true }
      },
      reports: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!customer) {
    notFound();
  }

  const dob = new Date(customer.dob);
  const age = new Date().getFullYear() - dob.getFullYear();
  const currentGoal = customer.goals[0];

  // セッション進捗計算
  const totalSessionsMatch = customer.plan?.match(/(\d+)回/);
  const totalSessions = totalSessionsMatch ? parseInt(totalSessionsMatch[1]) : null;
  const isMonthly = customer.plan?.includes("定額");

  let usedSessions = 0;
  if (isMonthly) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    usedSessions = customer.sessions.filter(s => {
      const d = new Date(s.date);
      return d >= startOfMonth && s.type !== "計測のみ";
    }).length;
  } else {
    usedSessions = customer.sessions.filter(s => s.type !== "計測のみ").length;
  }

  const progressPercent = totalSessions ? Math.min((usedSessions / totalSessions) * 100, 100) : 0;

  // 身体側面の最新データを取得
  const latestMetricWithSizes = [...customer.metrics]
    .reverse()
    .find(m => m.waist || m.belly || m.armL || m.armR || m.thighL || m.thighR || m.calfL || m.calfR);

  const chartMetrics = customer.metrics.map(m => ({
    date: m.date.toISOString(),
    weight: m.weight,
    waist: m.waist,
    belly: m.belly,
    armL: m.armL,
    armR: m.armR,
    thighL: m.thighL,
    thighR: m.thighR,
    calfL: m.calfL,
    calfR: m.calfR
  }));

  return (
    <div className={styles.container}>
      <div className={styles.navHeader}>
        <Link href="/dashboard/customers" className={styles.backLink}>
          <ArrowLeft size={20} /> 顧客一覧に戻る
        </Link>
      </div>

      <div className={styles.header}>
        <div className={styles.nameBlock}>
          <div className={styles.furigana}>{customer.furigana}</div>
          <h1>
            {customer.name} 
            <span className={styles.badge} style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>{customer.gender}</span>
          </h1>
          <div className={styles.planStatus}>
            <span className={styles.planName}>{customer.plan || 'プラン未設定'}</span>
            {totalSessions && (
              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <span>利用状況: <strong>{usedSessions}</strong> / {totalSessions} 回</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={styles.actionGroup}>
          <DeleteCustomerButton customerId={id} customerName={customer.name} />
          <Link href={`/customers/${id}/edit`} className="btn btn-secondary">
            <FileText size={18} /> 修正
          </Link>
          <Link href={`/customers/${id}/session/new`} className={`btn btn-primary ${styles.actionBtn}`}>
            <Mic size={18} /> セッション記録
          </Link>
          <Link href={`/customers/${id}/session/new?type=monthly`} className={`btn btn-secondary ${styles.actionBtn}`}>
            <Ruler size={18} /> 身体データ計測
          </Link>
        </div>
      </div>

      <div className={styles.topDashboard}>
        <div className={`card ${styles.mainInfoCard}`}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>生年月日 / 年齢</label>
              <div className={styles.infoValue}>
                {dob.toLocaleDateString('ja-JP')} <span className={styles.age}>({age}歳)</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <label>電話番号</label>
              <div className={styles.infoValue}>{customer.phone}</div>
            </div>
            <div className={styles.infoItem}>
              <label>現在のステータス</label>
              <div className={styles.statusBadge}>{customer.status || '入会済み'}</div>
            </div>
            <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}>
              <label>住所</label>
              <div className={styles.infoValue}>
                {customer.postalCode ? `〒${customer.postalCode} ` : ''}{customer.address}
              </div>
            </div>
            <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}>
              <label>緊急連絡先 (氏名 / 続柄 / 電話番号)</label>
              <div className={styles.infoValue} style={{ color: 'var(--destructive)', fontSize: '0.85rem' }}>
                {customer.emergencyName || '未登録'} ({customer.emergencyRelation || '--'}) : {customer.emergencyPhone || '--'}
              </div>
            </div>
          </div>
        </div>

        <div className={`card ${styles.sizeCard}`}>
          <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity /> 最新の身体サイズ
          </h2>
          {latestMetricWithSizes ? (
            <div className={styles.sizeGridMini}>
              <div className={styles.sizeItem}>
                <label>ウェスト</label>
                <span>{latestMetricWithSizes.waist || '--'} cm</span>
              </div>
              <div className={styles.sizeItem}>
                <label>へそ周り</label>
                <span>{latestMetricWithSizes.belly || '--'} cm</span>
              </div>
              <div className={styles.sizeItem}>
                <label>二の腕 (左/右)</label>
                <span>{latestMetricWithSizes.armL || '--'} / {latestMetricWithSizes.armR || '--'} cm</span>
              </div>
              <div className={styles.sizeItem}>
                <label>太もも (左/右)</label>
                <span>{latestMetricWithSizes.thighL || '--'} / {latestMetricWithSizes.thighR || '--'} cm</span>
              </div>
              <div className={styles.sizeItem}>
                <label>ふくらはぎ (左/右)</label>
                <span>{latestMetricWithSizes.calfL || '--'} / {latestMetricWithSizes.calfR || '--'} cm</span>
              </div>
              <div className={styles.dateLabel}>
                計測日: {new Date(latestMetricWithSizes.date).toLocaleDateString('ja-JP')}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.9rem' }}>データがまだありません。</p>
          )}
        </div>

        <div className={`card ${styles.goalCard}`}>
          <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target color="var(--primary)" /> 目標管理
          </h2>
          <div className={styles.goalContent}>
            <div className={styles.goalItem}>
              <label>達成したい目的</label>
              <div className={styles.goalValue}>{currentGoal?.longTermPurpose || '未設定'}</div>
            </div>
            
            <div className={styles.goalRow}>
              <div className={styles.goalItem}>
                <label>目標体重</label>
                <div className={styles.goalValue}>{currentGoal?.targetWeight ? `${currentGoal.targetWeight} kg` : '--'}</div>
              </div>
              <div className={styles.goalItem}>
                <label>達成期限</label>
                <div className={styles.goalValue}>{currentGoal?.deadline ? new Date(currentGoal.deadline).toLocaleDateString('ja-JP') : '--'}</div>
              </div>
            </div>

            <div className={styles.goalItem}>
              <label>具体的なアクション・今月の目標</label>
              <div className={styles.goalValue}>{currentGoal?.actionPlan || '未設定'}</div>
            </div>

            <Link href={`/customers/${id}/goals`} className={`btn btn-secondary ${styles.goalUpdateBtn}`}>
              目標を更新する
            </Link>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className={styles.sectionTitle}>
          初回アンケート回答
        </h2>
        <div className={styles.surveyBlock}>
          <div className={styles.surveyItem}>
            <h4>Q. 解決したい身体の悩み</h4>
            <p>{customer.complaint || "回答なし"}</p>
          </div>
          <div className={styles.surveyItem}>
            <h4>Q. 求める理想の状態</h4>
            <p>{customer.idealState || "回答なし"}</p>
          </div>
          <div className={styles.surveyItem}>
            <h4>Q. あったらいいなと思うサービス・物</h4>
            <p>{customer.desiredServices || "回答なし"}</p>
          </div>
        </div>
      </div>

      <div className={`card ${styles.chartSection}`}>
        <h2 className={styles.sectionTitle}>身体データ推移 (グラフ)</h2>
        <MetricsChart metrics={chartMetrics} />
      </div>

      <div className={styles.historySection}>
        <div className="card">
          <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText /> セッション記録 (トレーニング)
          </h2>
          {customer.sessions.filter(s => s.type !== "計測のみ").length === 0 ? (
            <p className={styles.emptyText}>セッション記録がまだありません。</p>
          ) : (
            <ul className={styles.infoList}>
              {customer.sessions.filter(s => s.type !== "計測のみ").map(session => (
                <li key={session.id} className={styles.historyItem}>
                  <div className={styles.historyMain}>
                    <div className={styles.historyDate}>
                      {new Date(session.date).toLocaleDateString('ja-JP')}
                      <span className={styles.typeTag}>{session.type}</span>
                    </div>
                    {session.aiSummary && <p className={styles.historySummary}>{session.aiSummary}</p>}
                    <div className={styles.historyBadges}>
                      <span className={styles.badge}>時間: {session.duration}分</span>
                      {session.conditionSelf && <span className={styles.badge}>体調: {session.conditionSelf}</span>}
                    </div>
                  </div>
                  <Link href={`/customers/${id}/session/${session.id}`} className="btn btn-secondary">詳細</Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ruler size={20} /> 身体計測の履歴
          </h2>
          {customer.sessions.filter(s => s.type === "計測のみ").length === 0 ? (
            <p className={styles.emptyText}>計測データがまだありません。</p>
          ) : (
            <ul className={styles.infoList}>
              {customer.sessions.filter(s => s.type === "計測のみ").map(session => (
                <li key={session.id} className={styles.historyItem}>
                  <div className={styles.historyMain}>
                    <div className={styles.historyDate}>
                      {new Date(session.date).toLocaleDateString('ja-JP')}
                    </div>
                    <p className={styles.historySummary}>身体サイズの計測データを更新しました</p>
                  </div>
                  <Link href={`/customers/${id}/session/${session.id}`} className="btn btn-secondary">数値を確認</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* AIレポートセクション */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0, border: 'none' }}>
            <Sparkles color="var(--primary)" size={20} /> AIコーチングレポート
          </h2>
          <GenerateReportButton customerId={id} type="Monthly" />
        </div>
        <div className={styles.reportList}>
          {customer.reports?.length > 0 ? (
            customer.reports.map((report: any) => (
              <div key={report.id} className={styles.reportItem}>
                <div className={styles.reportHeader}>
                  <strong className={styles.reportTitle}>{report.title}</strong>
                  <span className={styles.reportDate}>{new Date(report.createdAt).toLocaleDateString('ja-JP')}</span>
                </div>
                <div className={styles.reportPreview}>{report.content.substring(0, 150)}...</div>
              </div>
            ))
          ) : (
            <p className={styles.emptyText}>まだレポートが作成されていません。上のボタンから作成できます。</p>
          )}
        </div>
      </div>
    </div>
  );
}
