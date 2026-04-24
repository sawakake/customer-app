"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    furigana: "",
    gender: "女性",
    dob: "",
    postalCode: "",
    address: "",
    phone: "",
    emergencyPhone: "",
    emergencyName: "",
    emergencyRelation: "",
    plan: "2ヶ月集中プラン",
    complaint: "",
    idealState: "",
    desiredServices: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setIsSuccess(true);
      } else {
        alert("登録に失敗しました。時間をおいて再度お試しください。");
      }
    } catch (error) {
      alert("エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.wrapper}>
        <div className={`card ${styles.container} ${styles.successMessage}`}>
          <CheckCircle className={styles.successIcon} />
          <h2>ご登録ありがとうございました</h2>
          <p>お客様の情報の送信が完了しました。<br/>セッションでお会いできるのを楽しみにしております。</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={`card ${styles.container}`}>
        <div className={styles.header}>
          <h1>お客様情報のご登録</h1>
          <p>以下のフォームに必要事項をご記入の上、送信をお願いいたします。</p>
        </div>

        <form onSubmit={handleSubmit}>
          <h3 className={styles.sectionTitle}>基本情報</h3>
          
          <div className={styles.row}>
            <div className="form-group">
              <label>氏名（フルネームでお書きください） *</label>
              <input required type="text" name="name" className="input" value={formData.name} onChange={handleChange} placeholder="例）山田 太郎" />
            </div>
            <div className="form-group">
              <label>ふりがな *</label>
              <input required type="text" name="furigana" className="input" value={formData.furigana} onChange={handleChange} placeholder="例）やまだ たろう" />
            </div>
          </div>

          <div className={styles.row}>
            <div className="form-group">
              <label>性別 *</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input type="radio" name="gender" value="男性" checked={formData.gender === "男性"} onChange={handleChange} />
                  男性
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" name="gender" value="女性" checked={formData.gender === "女性"} onChange={handleChange} />
                  女性
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>生年月日 *</label>
              <input required type="date" name="dob" className="input" value={formData.dob} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>お住まい（郵便番号）</label>
            <input type="text" name="postalCode" className="input" value={formData.postalCode} onChange={handleChange} placeholder="例）100-0001" />
          </div>

          <div className="form-group">
            <label>住所</label>
            <input type="text" name="address" className="input" value={formData.address} onChange={handleChange} placeholder="例）東京都千代田区1-1-1..." />
          </div>

          <div className="form-group">
            <label>連絡先（電話番号ハイフンなしで記入ください） *</label>
            <input required type="tel" name="phone" className="input" value={formData.phone} onChange={handleChange} placeholder="例）09012345678" pattern="[0-9]*" />
          </div>

          <h3 className={styles.sectionTitle}>緊急連絡先</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", marginBottom: "1rem" }}>
            万が一のことがあった時に連絡できる番号をお書きください。
          </p>

          <div className={styles.row}>
            <div className="form-group">
              <label>電話番号 *</label>
              <input required type="tel" name="emergencyPhone" className="input" value={formData.emergencyPhone} onChange={handleChange} placeholder="例）09012345678" />
            </div>
            <div className="form-group">
              <label>氏名 *</label>
              <input required type="text" name="emergencyName" className="input" value={formData.emergencyName} onChange={handleChange} placeholder="例）山田 花子" />
            </div>
          </div>
          <div className="form-group">
            <label>本人との続柄 *</label>
            <input required type="text" name="emergencyRelation" className="input" value={formData.emergencyRelation} onChange={handleChange} placeholder="例）妻、父など" />
          </div>

          <h3 className={styles.sectionTitle}>ご契約内容</h3>
          <div className="form-group">
            <label>契約プラン *</label>
            <select 
              required
              name="plan" 
              className="input" 
              value={formData.plan} 
              onChange={handleChange}
            >
              <option value="2ヶ月集中プラン">2ヶ月集中プラン</option>
              <option value="ボディメイクプラン">ボディメイクプラン</option>
              <option value="回数券利用">回数券利用</option>
              <option value="メンテナンスプラン">メンテナンスプラン</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <h3 className={styles.sectionTitle}>アンケート（サービス向上のためご協力ください）</h3>

          <div className="form-group">
            <label>解決したい身体の悩みを教えてください</label>
            <textarea name="complaint" className={`input ${styles.textarea}`} value={formData.complaint} onChange={handleChange} placeholder="例）最近肩こりがひどくて..."></textarea>
          </div>

          <div className="form-group">
            <label>あなたが求める理想の状態を教えてください</label>
            <textarea name="idealState" className={`input ${styles.textarea}`} value={formData.idealState} onChange={handleChange} placeholder="例）疲れにくい身体になりたい、マイナス5kg..."></textarea>
          </div>

          <div className="form-group">
            <label>こんな物やサービスがあったらいいな！があれば教えてください<br/>
              <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "var(--secondary-foreground)" }}>
                （例）プロテイン、肌が綺麗になるやつ、疲れにくくなるサプリなど、ざっくりとした内容でOKです。
              </span>
            </label>
            <textarea name="desiredServices" className={`input ${styles.textarea}`} value={formData.desiredServices} onChange={handleChange}></textarea>
          </div>

          <div className={styles.consentWrapper}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                required 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)} 
              />
              <span className={styles.consentText}>
                入力いただいた個人情報は、カウンセリング、セッション管理、サービス提供、緊急時の連絡、サービス改善のために利用します。内容を確認のうえ、同意します。
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !agreed} 
            className={`btn btn-primary ${styles.submitBtn}`}
          >
            {isSubmitting ? "送信中..." : "同意して内容を送信する"}
          </button>
        </form>
      </div>
    </div>
  );
}
