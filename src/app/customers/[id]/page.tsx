import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import Link from "next/link";
import { Mic, Target, FileText, ArrowLeft, Ruler, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import GenerateReportButton from "@/components/GenerateReportButton";
import DeleteCustomerButton from "@/components/DeleteCustomerButton";
import CustomerHeavyData from "@/components/CustomerHeavyData";
import SessionCountManager from "@/components/SessionCountManager";

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({ params }: { params: any }) {
  const { id } = await params;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 画面遷移を「スッと」させるため、ここでは基本情報のみ取得（リレーションは最小限）
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      goals: { orderBy: { createdAt: "desc" }, take: 1 },
      reports: { orderBy: { createdAt: "desc" }, take: 3 },
      _count: {
        select: {
          sessions: {
            where: {
              date: { gte: startOfMonth },
              type: { not: "計測のみ" }
            }
          }
        }
      }
    }
  });

  if (!customer) notFound();

  // 定額・月額プランの場合は今月の消化数、回数券はプラン開始日以降
  const isMonthlyPlan = customer.plan?.includes("月");
  const isTicketPlan = customer.plan?.includes("回数券");
  
  let dbCount = 0;
  let displayCount = 0;

  if (isMonthlyPlan) {
    dbCount = customer._count.sessions; 
    // 月額プランは「今月のセッション数」のみを表示し、古い調整値は無視する
    displayCount = dbCount; 
  } else if (isTicketPlan && customer.planStartDate) {
    dbCount = await prisma.session.count({ 
      where: { 
        customerId: id, 
        date: { gte: customer.planStartDate },
        type: { not: "計測のみ" }
      } 
    });
    displayCount = dbCount + (customer.usedSessionsAdjustment || 0);
  } else {
    // それ以外（体験など）は全期間
    dbCount = await prisma.session.count({ where: { customerId: id, type: { not: "計測のみ" } } });
    displayCount = dbCount;
  }

  const dob = new Date(customer.dob);
  const age = new Date().getFullYear() - dob.getFullYear();
  const currentGoal = customer.goals[0];

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
            <span className={styles.sessionCount}>
              {isMonthlyPlan ? "今月の消化数" : "プラン消化数"}: {displayCount} 回
            </span>
          </div>
        </div>
        <div className={styles.actionGroup}>
          <DeleteCustomerButton customerId={id} customerName={customer.name} />
          <Link href={`/customers/${id}/edit`} className="btn btn-secondary"><FileText size={18} /> 修正</Link>
          <Link href={`/customers/${id}/session/new`} className={`btn btn-primary ${styles.actionBtn}`}><Mic size={18} /> セッション記録</Link>
          <Link href={`/customers/${id}/session/new?type=monthly`} className={`btn btn-secondary ${styles.actionBtn}`}><Ruler size={18} /> 身体データ計測</Link>
        </div>
      </div>

      {/* プラン更新アラート */}
      {(isTicketPlan && customer.manualTotalSessions && (customer.manualTotalSessions - (dbCount + (customer.usedSessionsAdjustment || 0)) <= 0)) && (
        <div className={styles.renewalAlert}>
          <div className={styles.alertIcon}>⚠️</div>
          <div className={styles.alertText}>
            <strong>プラン更新のタイミングです</strong>
            <p>回数券の全回数を消化しました。次回のプラン継続についてご案内をお願いします。</p>
          </div>
        </div>
      )}

      {/* 回数管理セクション */}
      <div style={{ marginBottom: '2rem' }}>
        <SessionCountManager 
          customerId={id}
          planName={customer.plan || ""}
          planStartDate={customer.planStartDate}
          initialTotal={customer.manualTotalSessions}
          initialAdjustment={customer.usedSessionsAdjustment || 0}
          dbSessionCount={dbCount}
          isMonthly={isMonthlyPlan || false}
        />
      </div>

      <div className={styles.topDashboard}>
        <div className={`card ${styles.mainInfoCard}`}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}><label>生年月日 / 年齢</label><div className={styles.infoValue}>{dob.toLocaleDateString('ja-JP')} ({age}歳)</div></div>
            <div className={styles.infoItem}><label>電話番号</label><div className={styles.infoValue}>{customer.phone}</div></div>
            <div className={styles.infoItem}><label>ステータス</label><div className={styles.statusBadge}>{customer.status || '入会済み'}</div></div>
            <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}><label>住所</label><div className={styles.infoValue}>{customer.address}</div></div>
          </div>
        </div>

        <div className={`card ${styles.goalCard}`}>
          <h2 className={styles.sectionTitle}><Target color="var(--primary)" /> 目標管理</h2>
          <div className={styles.goalContent}>
            <div className={styles.goalItem}><label>目的</label><div className={styles.goalValue}>{currentGoal?.longTermPurpose || '未設定'}</div></div>
            <div className={styles.goalRow}>
              <div className={styles.goalItem}><label>目標体重</label><div className={styles.goalValue}>{currentGoal?.targetWeight ? `${currentGoal.targetWeight} kg` : '--'}</div></div>
            </div>
            <Link href={`/customers/${id}/goals`} className={`btn btn-secondary ${styles.goalUpdateBtn}`}>更新</Link>
          </div>
        </div>

        {/* 重いデータ（セッション履歴・グラフ・サイズ詳細）はクライアント側で非同期ロード */}
        <CustomerHeavyData customerId={id} />
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
          {customer.reports?.map((report: any) => (
            <div key={report.id} className={styles.reportItem}>
              <div className={styles.reportHeader}>
                <strong>{report.title}</strong>
                <span>{new Date(report.createdAt).toLocaleDateString('ja-JP')}</span>
              </div>
              <div className={styles.reportPreview}>{report.content.substring(0, 100)}...</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
