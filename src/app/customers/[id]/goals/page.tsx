"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./page.module.css";
import { Target, ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function GoalUpdatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    longTermPurpose: "",
    actionPlan: "",
    targetWeight: "",
    deadline: "",
    month: new Date().toISOString().substring(0, 7) // YYYY-MM
  });

  useEffect(() => {
    async function fetchGoal() {
      try {
        const res = await fetch(`/api/customers/${id}/goals`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setFormData({
              longTermPurpose: data.longTermPurpose || "",
              actionPlan: data.actionPlan || "",
              targetWeight: data.targetWeight?.toString() || "",
              deadline: data.deadline ? new Date(data.deadline).toISOString().substring(0, 10) : "",
              month: data.month || new Date().toISOString().substring(0, 7)
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch goal:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGoal();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/customers/${id}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : null,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
        }),
      });

      if (res.ok) {
        router.push(`/customers/${id}`);
        router.refresh();
      }
    } catch (error) {
      alert("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}><Loader2 className={styles.spin} /> 読み込み中...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.navHeader}>
        <Link href={`/customers/${id}`} className={styles.backLink}>
          <ArrowLeft size={20} /> 顧客詳細へ戻る
        </Link>
      </div>

      <div className={`card ${styles.goalCard}`}>
        <div className={styles.header}>
          <Target size={32} color="var(--primary)" />
          <h1>目標の設定・更新</h1>
          <p>お客様の「なりたい姿」を言語化して共有しましょう</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label>中長期の目的 (例: 1年後までに健康診断の数値を正常にする)</label>
            <textarea
              className="input"
              value={formData.longTermPurpose}
              onChange={(e) => setFormData({ ...formData, longTermPurpose: e.target.value })}
              placeholder="お客様が本当に達成したい目的を記入してください"
              rows={3}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className="form-group">
              <label>目標体重 (kg)</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={formData.targetWeight}
                onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                placeholder="0.0"
              />
            </div>
            <div className="form-group">
              <label>達成期限</label>
              <input
                type="date"
                className="input"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>具体的なアクション・今月の目標</label>
            <textarea
              className="input"
              value={formData.actionPlan}
              onChange={(e) => setFormData({ ...formData, actionPlan: e.target.value })}
              placeholder="例: 週3日の禁酒、1日30分のウォーキング"
              rows={4}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', marginTop: '1rem' }}>
            {saving ? <Loader2 className={styles.spin} /> : <Save size={18} />} 
            <span style={{ marginLeft: '0.5rem' }}>設定を保存する</span>
          </button>
        </form>
      </div>
    </div>
  );
}
