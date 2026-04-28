"use client";

import { useState } from "react";
import { Settings, Save, Loader2, Plus, Minus, RefreshCw } from "lucide-react";
import styles from "./SessionCountManager.module.css";

interface Props {
  customerId: string;
  initialTotal: number | null;
  initialAdjustment: number;
  dbSessionCount: number;
}

export default function SessionCountManager({ 
  customerId, 
  initialTotal, 
  initialAdjustment,
  dbSessionCount 
}: Props) {
  const [total, setTotal] = useState<number>(initialTotal || 0);
  const [adjustment, setAdjustment] = useState<number>(initialAdjustment);
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
          usedSessionsAdjustment: adjustment
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
  const progressPercent = total > 0 ? Math.min((finalUsed / total) * 100, 100) : 0;

  return (
    <div className={`card ${styles.managerCard}`}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h3>利用状況・回数管理</h3>
          <p>自動集計（{dbSessionCount}回）に手動調整を加えることができます</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)} 
          className={styles.editBtn}
        >
          {isEditing ? "キャンセル" : <Settings size={18} />}
        </button>
      </div>

      {!isEditing ? (
        <div className={styles.displayArea}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.label}>現在（自動＋調整）</span>
              <span className={styles.value}>{finalUsed}</span>
            </div>
            <div className={styles.separator}>/</div>
            <div className={styles.statItem}>
              <span className={styles.label}>契約合計</span>
              <span className={styles.value}>{total > 0 ? total : "--"}</span>
            </div>
            {adjustment !== 0 && (
              <div className={styles.adjustmentBadge}>
                手動調整: {adjustment > 0 ? `+${adjustment}` : adjustment}回
              </div>
            )}
          </div>
          
          {total > 0 && (
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
              </div>
              <div className={styles.progressText}>
                残り {total - finalUsed} 回 ({progressPercent.toFixed(0)}%)
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.editArea}>
          <div className={styles.inputGroup}>
            <label>契約合計回数 (プラン回数など)</label>
            <div className={styles.numberInput}>
              <button onClick={() => setTotal(Math.max(0, total - 1))}><Minus size={16}/></button>
              <input 
                type="number" 
                value={total} 
                onChange={(e) => setTotal(parseInt(e.target.value) || 0)} 
              />
              <button onClick={() => setTotal(total + 1)}><Plus size={16}/></button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>手動調整 (記録漏れ補正など)</label>
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
            <p className={styles.hint}>※セッション記録{dbSessionCount}回にこの数値を足します</p>
          </div>

          <button 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className={styles.spin} /> : <Save size={18} />}
            設定を保存
          </button>
        </div>
      )}
    </div>
  );
}
