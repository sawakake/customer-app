"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";
import { ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(res => res.json())
      .then(customer => {
        if (customer && !customer.error) {
          const dobDate = new Date(customer.dob);
          const dobString = dobDate.toISOString().split('T')[0];
          setFormData({ ...customer, dob: dobString });
        }
        setIsLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        router.push(`/customers/${id}`);
        router.refresh();
      } else {
        alert("保存に失敗しました。");
      }
    } catch (error) {
      alert("エラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !formData) return <div className={styles.loading}>読み込み中...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href={`/customers/${id}`} className={styles.backLink}>
          <ArrowLeft size={18} /> 戻る
        </Link>
        <h1 className={styles.title}>顧客情報の編集: {formData.name} 様</h1>
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        <div className="card">
          <h3 className={styles.sectionTitle}>基本データ</h3>
          <div className={styles.grid}>
            <div className="form-group">
              <label>氏名 *</label>
              <input required type="text" name="name" className="input" value={formData.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>ふりがな *</label>
              <input required type="text" name="furigana" className="input" value={formData.furigana} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>性別 *</label>
              <select name="gender" className="input" value={formData.gender} onChange={handleChange}>
                <option value="男性">男性</option>
                <option value="女性">女性</option>
                <option value="その他">その他</option>
              </select>
            </div>
            <div className="form-group">
              <label>生年月日 *</label>
              <input required type="date" name="dob" className="input" value={formData.dob} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.grid} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>電話番号 *</label>
              <input required type="tel" name="phone" className="input" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>メールアドレス (ログイン用ID)</label>
              <input type="email" name="email" className="input" value={formData.email || ''} onChange={handleChange} placeholder="example@mail.com" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>郵便番号 / 住所</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" name="postalCode" className="input" value={formData.postalCode || ''} onChange={handleChange} placeholder="000-0000" style={{ maxWidth: '150px' }} />
              </div>
              <input type="text" name="address" className="input" value={formData.address || ''} onChange={handleChange} placeholder="東京都..." />
            </div>
          </div>

          <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>プラン・ステータス</h3>
          <div className={styles.grid}>
            <div className="form-group">
              <label>顧客ステータス *</label>
              <select name="status" className="input" value={formData.status || '入会済み'} onChange={handleChange}>
                <option value="入会済み">入会済み</option>
                <option value="休会中">休会中</option>
                <option value="退会">退会</option>
              </select>
            </div>
            <div className="form-group">
              <label>契約プラン *</label>
              <select name="plan" className="input" value={formData.plan} onChange={handleChange}>
                <option value="未設定">-- プランを選択してください --</option>
                <optgroup label="回数券">
                  <option value="回数券(12回) - 60分">回数券(12回) - 60分</option>
                  <option value="回数券(12回) - 90分">回数券(12回) - 90分</option>
                  <option value="回数券(25回) - 60分">回数券(25回) - 60分</option>
                  <option value="回数券(25回) - 90分">回数券(25回) - 90分</option>
                  <option value="回数券(52回) - 60分">回数券(52回) - 60分</option>
                  <option value="回数券(52回) - 90分">回数券(52回) - 90分</option>
                </optgroup>
                <optgroup label="定額プラン（サブスク）">
                  <option value="定額(月4回) - 60分">定額(月4回) - 60分</option>
                  <option value="定額(月4回) - 90分">定額(月4回) - 90分</option>
                  <option value="定額(月8回) - 60分">定額(月8回) - 60分</option>
                  <option value="定額(月8回) - 90分">定額(月8回) - 90分</option>
                </optgroup>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>

          <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem', color: 'var(--destructive)' }}>緊急連絡先</h3>
          <div className={styles.grid}>
            <div className="form-group">
              <label>緊急連絡先 氏名</label>
              <input type="text" name="emergencyName" className="input" value={formData.emergencyName || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>続柄</label>
              <input type="text" name="emergencyRelation" className="input" value={formData.emergencyRelation || ''} onChange={handleChange} placeholder="例：配偶者" />
            </div>
            <div className="form-group">
              <label>緊急用 電話番号</label>
              <input type="tel" name="emergencyPhone" className="input" value={formData.emergencyPhone || ''} onChange={handleChange} />
            </div>
          </div>

          <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>アンケート（任意）</h3>
          <div className={styles.grid} style={{ gridTemplateColumns: '1fr' }}>
            <div className="form-group">
              <label>解決したい悩み</label>
              <textarea name="complaint" className={`input`} value={formData.complaint || ''} onChange={handleChange}></textarea>
            </div>
            <div className="form-group">
              <label>理想の状態</label>
              <textarea name="idealState" className={`input`} value={formData.idealState || ''} onChange={handleChange}></textarea>
            </div>
            <div className="form-group">
              <label>欲しいサービス</label>
              <textarea name="desiredServices" className={`input`} value={formData.desiredServices || ''} onChange={handleChange}></textarea>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="submit" disabled={isSaving} className={`btn btn-primary ${styles.saveBtn}`}>
            <Save size={18} /> {isSaving ? "保存中..." : "変更を確定する"}
          </button>
        </div>
      </form>
    </div>
  );
}
