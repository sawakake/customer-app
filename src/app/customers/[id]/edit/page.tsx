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
    fetch(`/api/customers`)
      .then(res => res.json())
      .then(data => {
        const customer = data.find((c: any) => c.id === id);
        if (customer) {
          // dob is string from JSON
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
              <label>契約プラン *</label>
              <select name="plan" className="input" value={formData.plan} onChange={handleChange}>
                <option value="2ヶ月集中プラン">2ヶ月集中プラン</option>
                <option value="ボディメイクプラン">ボディメイクプラン</option>
                <option value="回数券利用">回数券利用</option>
                <option value="メンテナンスプラン">メンテナンスプラン</option>
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
