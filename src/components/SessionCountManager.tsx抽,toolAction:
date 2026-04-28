"use client";

import { useState } from "react";
import { Settings, Save, Loader2, Plus, Minus, Calendar } from "lucide-react";
import styles from "./SessionCountManager.module.css";

interface Props {
  customerId: string;
  planName: string;
  planStartDate: Date | null;
  initialTotal: number | null;
  initialAdjustment: number;
  dbSessionCount: number;
  isMonthly: boolean;
}

export default function SessionCountManager({ 
  customerId, 
  planName,
  planStartDate,
  initialTotal, 
  initialAdjustment,
  dbSessionCount,
  isMonthly
}: Props) {
  // プラン名から回数を推測
  let inferredTotal = 0;
  if (planName.includes("4回")) inferredTotal = 4;
  else if (planName.includes("8回")) inferredTotal = 8;
  else if (planName.includes("12回")) inferredTotal = 12;
  else if (planName.includes("24回") || planName.includes("25回")) inferredTotal = 25;
  else if (planName.includes("48回") || planName.includes("52回")) inferredTotal = 52;
  
  const [total, setTotal] = useState<number>(initialTotal || inferredTotal);
  const [adjustment, setAdjustment] = useState<number>(initialAdjustment);
  const [startDate, setStartDate] = useState<string>(
    planStartDate ? new Date(planStartDate).toISOString().split('T')[0] : ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualTotalSessions: total,
          usedSessionsAdjustment: adjustment,
          planStartDate: startDate ? new Date(startDate).toISOString() : null
        })
      });
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const finalUsed = dbSessionCount + adjustment;
  const left = total > 0 ? total - finalUsed : null;
  const progressPercent = total > 0 ? Math.min((finalUsed / total) * 100, 100) : 0;

  return (
    <div className={`card ${styles.managerCard}`}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h3>ご利用状況（{isMonthly ? "今月分" : "プラン分"}）</h3>
          <div className={styles.planBadge}>{planName || "プラン未設定"}</div>
          {planStartDate && (
            <p className={styles.startDateInfo}>
              <Calendar size={12} /> 開始日: {new Date(planStartDate).toLocaleDateString('ja-JP')}
            </p>
          )}
        </div>
        <button onClick={() => setIsEditing(!isEditing)} className={styles.editBtn}>
          {isEditing ? "閉じる" : <Settings size={18} />}
        </button>
      </div>

      {!isEditing ? (
        <div className={styles.displayArea}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.label}>{isMonthly ? "今月の消化" : "プラン消化済み"}</span>
              <span className={styles.value}>{finalUsed} <span className={styles.unit}>回</span></span>
            </div>
            {total > 0 && (
              <>
                <div className={styles.separator}>/</div>
                <div className={styles.statItem}>
                  <span className={styles.label}>契約回数</span>
                  <span className={styles.value}>{total} <span className={styles.unit}>回</span></span>
                </div>
                <div className={styles.leftBadge}>
                  あと <span className={styles.leftValue}>{left}</span> 回
                </div>
              </>
            )}
          </div>
          
          {total > 0 && (
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.editArea}>
          <div className={styles.editGrid}>
            <div className={styles.inputGroup}>
              <label>契約合計回数</label>
              <div className={styles.numberInput}>
                <button onClick={() => setTotal(Math.max(0, total - 1))}><Minus size={16}/></button>
                <input type="number" value={total} onChange={(e) => setTotal(parseInt(e.target.value) || 0)} />
                <button onClick={() => setTotal(total + 1)}><Plus size={16}/></button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>手動調整（±）</label>
              <div className={styles.numberInput}>
                <button onClick={() => setAdjustment(adjustment - 1)}><Minus size={16}/></button>
                <input 
                  type="number" 
                  value={adjustment} 
                  onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)} 
                  className={adjustment !== 0 ? styles.activeAdjustment : ""}
                />
                <button onClick={() => setAdjustment(adjustment + 1)}><Plus size={16}/></button>
              </div>
            </div>

            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
              <label>プラン開始日（回数券などの起算日）</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className={styles.dateInput}
              />
            </div>
          </div>

          <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className={styles.spin} /> : <Save size={18} />}
            変更を確定する
          </button>
        </div>
      )}
    </div>
  );
}
