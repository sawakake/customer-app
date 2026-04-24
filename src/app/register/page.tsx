"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { CheckCircle, Search } from "lucide-react";

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    lastNameFurigana: "",
    firstNameFurigana: "",
    gender: "女性",
    dobYear: "1990",
    dobMonth: "1",
    dobDay: "1",
    postalCode1: "",
    postalCode2: "",
    address: "",
    phone1: "",
    phone2: "",
    phone3: "",
    emergencyPhone1: "",
    emergencyPhone2: "",
    emergencyPhone3: "",
    emergencyLastName: "",
    emergencyFirstName: "",
    emergencyRelation: "",
    plan: "2ヶ月集中プラン",
    complaint: "",
    idealState: "",
    desiredServices: "",
  });

  // 郵便番号から住所を自動検索
  useEffect(() => {
    const fetchAddress = async () => {
      if (formData.postalCode1.length === 3 && formData.postalCode2.length === 4) {
        try {
          const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${formData.postalCode1}${formData.postalCode2}`);
          const data = await res.json();
          if (data.results) {
            const result = data.results[0];
            setFormData(prev => ({
              ...prev,
              address: `${result.address1}${result.address2}${result.address3}`
            }));
          }
        } catch (error) {
          console.error("Address search failed:", error);
        }
      }
    };
    fetchAddress();
  }, [formData.postalCode1, formData.postalCode2]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // データを送信形式（結合済み）に変換
    const submissionData = {
      name: `${formData.lastName} ${formData.firstName}`,
      furigana: `${formData.lastNameFurigana} ${formData.firstNameFurigana}`,
      gender: formData.gender,
      dob: `${formData.dobYear}-${formData.dobMonth.padStart(2, '0')}-${formData.dobDay.padStart(2, '0')}`,
      postalCode: `${formData.postalCode1}-${formData.postalCode2}`,
      address: formData.address,
      phone: `${formData.phone1}${formData.phone2}${formData.phone3}`,
      emergencyPhone: `${formData.emergencyPhone1}${formData.emergencyPhone2}${formData.emergencyPhone3}`,
      emergencyName: `${formData.emergencyLastName} ${formData.emergencyFirstName}`,
      emergencyRelation: formData.emergencyRelation,
      plan: formData.plan,
      complaint: formData.complaint,
      idealState: formData.idealState,
      desiredServices: formData.desiredServices,
    };
    
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
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

  // 年・月・日の選択肢生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

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
          <img src="/images/gym-logo.png" alt="BodyCareGymCONNECT" className={styles.registerLogo} />
          <h1>BodyCareGymCONNECT</h1>
          <h2>お客様情報入力フォーム</h2>
          <p>以下のフォームに必要事項をご記入の上、送信をお願いいたします。</p>
        </div>

        <form onSubmit={handleSubmit}>
          <h3 className={styles.sectionTitle}>基本情報</h3>
          
          <div className="form-group">
            <label>氏名 *</label>
            <div className={styles.nameRow}>
              <input required type="text" name="lastName" className="input" value={formData.lastName} onChange={handleChange} placeholder="名字" />
              <input required type="text" name="firstName" className="input" value={formData.firstName} onChange={handleChange} placeholder="名前" />
            </div>
          </div>

          <div className="form-group">
            <label>ふりがな *</label>
            <div className={styles.nameRow}>
              <input required type="text" name="lastNameFurigana" className="input" value={formData.lastNameFurigana} onChange={handleChange} placeholder="みょうじ" />
              <input required type="text" name="firstNameFurigana" className="input" value={formData.firstNameFurigana} onChange={handleChange} placeholder="なまえ" />
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
              <div className={styles.dobGroup}>
                <select name="dobYear" className="input" value={formData.dobYear} onChange={handleChange}>
                  {years.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <select name="dobMonth" className="input" value={formData.dobMonth} onChange={handleChange}>
                  {months.map(m => <option key={m} value={m}>{m}月</option>)}
                </select>
                <select name="dobDay" className="input" value={formData.dobDay} onChange={handleChange}>
                  {days.map(d => <option key={d} value={d}>{d}日</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>お住まい（郵便番号）</label>
            <div className={styles.postalGroup}>
              <input type="text" name="postalCode1" className="input" maxLength={3} value={formData.postalCode1} onChange={handleChange} placeholder="000" />
              <span>-</span>
              <input type="text" name="postalCode2" className="input" maxLength={4} value={formData.postalCode2} onChange={handleChange} placeholder="0000" />
              <span className={styles.postHint}><Search size={14}/> 入力すると住所が自動入力されます</span>
            </div>
          </div>

          <div className="form-group">
            <label>住所</label>
            <input required type="text" name="address" className="input" value={formData.address} onChange={handleChange} placeholder="例）東京都千代田区1-1-1..." />
          </div>

          <div className="form-group">
            <label>連絡先（電話番号） *</label>
            <div className={styles.phoneGroup}>
              <input required type="tel" name="phone1" className="input" maxLength={4} value={formData.phone1} onChange={handleChange} placeholder="090" />
              <span>-</span>
              <input required type="tel" name="phone2" className="input" maxLength={4} value={formData.phone2} onChange={handleChange} placeholder="0000" />
              <span>-</span>
              <input required type="tel" name="phone3" className="input" maxLength={4} value={formData.phone3} onChange={handleChange} placeholder="0000" />
            </div>
          </div>

          <h3 className={styles.sectionTitle}>緊急連絡先</h3>
          <div className="form-group">
            <label>氏名 *</label>
            <div className={styles.nameRow}>
              <input required type="text" name="emergencyLastName" className="input" value={formData.emergencyLastName} onChange={handleChange} placeholder="名字" />
              <input required type="text" name="emergencyFirstName" className="input" value={formData.emergencyFirstName} onChange={handleChange} placeholder="名前" />
            </div>
          </div>
          
          <div className={styles.row}>
            <div className="form-group">
              <label>電話番号 *</label>
              <div className={styles.phoneGroup}>
                <input required type="tel" name="emergencyPhone1" className="input" maxLength={4} value={formData.emergencyPhone1} onChange={handleChange} />
                <span>-</span>
                <input required type="tel" name="emergencyPhone2" className="input" maxLength={4} value={formData.emergencyPhone2} onChange={handleChange} />
                <span>-</span>
                <input required type="tel" name="emergencyPhone3" className="input" maxLength={4} value={formData.emergencyPhone3} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>本人との続柄 *</label>
              <input required type="text" name="emergencyRelation" className="input" value={formData.emergencyRelation} onChange={handleChange} placeholder="例）妻、父など" />
            </div>
          </div>


          <h3 className={styles.sectionTitle}>アンケート</h3>

          <div className="form-group">
            <label>解決したい身体の悩みを教えてください</label>
            <textarea name="complaint" className={`input ${styles.textarea}`} value={formData.complaint} onChange={handleChange} placeholder="例）最近肩こりがひどくて..."></textarea>
          </div>

          <div className="form-group">
            <label>あなたが求める理想の状態を教えてください</label>
            <textarea name="idealState" className={`input ${styles.textarea}`} value={formData.idealState} onChange={handleChange} placeholder="例）疲れにくい身体になりたい、マイナス5kg..."></textarea>
          </div>

          <div className="form-group">
            <label>こんな物やサービスがあったらいいな！があれば教えてください</label>
            <textarea 
              name="desiredServices" 
              className={`input ${styles.textarea}`} 
              value={formData.desiredServices} 
              onChange={handleChange}
              placeholder="例）プロテイン、肌が綺麗になるやつ、疲れにくくなるサプリなど"
            ></textarea>
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
