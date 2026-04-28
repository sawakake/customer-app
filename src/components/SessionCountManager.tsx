"use client";

import { useState } from "react";
import { Settings, Save, Loader2, Plus, Minus } from "lucide-react";
import styles from "./SessionCountManager.module.css";

interface Props {
  customerId: string;
  initialTotal: number | null;
  initialUsed: number | null;
  dbSessionCount: number;
}

export default function SessionCountManager({ 
  customerId, 
  initialTotal, 
  initialUsed,
  dbSessionCount 
}: Props) {
  const [total, setTotal] = useState<number>(initialTotal || 0);
  const [used, setUsed] = useState<number>(initialUsed !== null ? initialUsed : dbSessionCount);
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
          manualUsedSessions: used
        })
      });
      setIsEditing(false);
      window.location.reload(); // 簡単のためにリロード
    } catch (err) {
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const progressPercent = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  return (
    <div className={`card ${styles.managerCard}`}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h3>利用状況・回数管理</h3>
          <p>プランの回数と消化状況を手動で設定できます</p>
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
              <span className={styles.label}>消化回数</span>
              <span className={styles.value}>{used}</span>
            </div>
            <div className={styles.separator}>/</div>
            <div className={styles.statItem}>
              <span className={styles.label}>全回数</span>
              <span className={styles.value}>{total > 0 ? total : "--"}</span>
            </div>
          </div>
          
          {total > 0 && (
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
              </div>
              <div className={styles.progressText}>
                残り {total - used} 回 ({progressPercent.toFixed(0)}%)
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.editArea}>
          <div className={styles.inputGroup}>
            <label>全回数 (契約回数)</label>
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
            <label>消化済み回数</label>
            <div className={styles.numberInput}>
              <button onClick={() => setUsed(Math.max(0, used - 1))}><Minus size={16}/></button>
              <input 
                type="number" 
                value={used} 
                onChange={(e) => setUsed(parseInt(e.target.value) || 0)} 
              />
              <button onClick={() => setUsed(used + 1)}><Plus size={16}/></button>
            </div>
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
