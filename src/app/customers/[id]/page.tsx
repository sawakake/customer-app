import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import MetricsChart from "@/components/charts/MetricsChart";
import Link from "next/link";
import { Mic, Target, FileText, Activity, ArrowLeft, Ruler } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
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
        orderBy: { date: "desc" }
      }
    }
  });

  if (!customer) {
    notFound();
  }

  const dob = new Date(customer.dob);
  const age = new Date().getFullYear() - dob.getFullYear();
  const currentGoal = customer.goals[0];

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
        <Link href="/dashboard" className={styles.backLink}>
          <ArrowLeft size={20} /> ダッシュボードに戻る
        </Link>
      </div>

      <div className={styles.header}>
        <div className={styles.nameBlock}>
          <div className={styles.furigana}>{customer.furigana} - {customer.plan || 'プラン未設定'}</div>
          <h1>
            {customer.name} 
            <span className={styles.badge} style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>{customer.gender}</span>
          </h1>
        </div>
        <div className={styles.actionGroup}>
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
              <div className={styles.infoValue} style={{ color: 'var(--destructive)' }}>
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
            <p style={{ color: 'var(--secondary-foreground)' }}>サイズ計測のデータがまだありません。</p>
          )}
        </div>

        <div className={`card ${styles.goalCard}`}>
          <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target color="var(--accent)" /> 目的・目標 (鏡に貼る用)
          </h2>
          {currentGoal ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: "var(--accent)" }}>中長期の目的</h4>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{currentGoal.longTermPurpose}</p>
              </div>
              <div>
                <h4 style={{ color: "var(--accent)" }}>今月({currentGoal.month})の目標</h4>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currentGoal.monthlyGoal}</p>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-secondary">目標を更新する</button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--secondary-foreground)', marginBottom: '1rem' }}>目標がまだ設定されていません。</p>
              <button className="btn btn-secondary">目標を設定する</button>
            </div>
          )}
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
    </div>
  );
}
