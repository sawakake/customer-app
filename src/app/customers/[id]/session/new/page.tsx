"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import VoiceRecorder from "@/components/VoiceRecorder";
import { ArrowLeft, Save, Sparkles, Activity, Ruler } from "lucide-react";
import Link from "next/link";

export default function NewSessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = params.id as string;
  const isMonthlyMode = searchParams.get('type') === 'monthly';
  
  const [isSaving, setIsSaving] = useState(false);
  const [customerName, setCustomerName] = useState("");

  // Form State
  const [sessionForm, setSessionForm] = useState({
    weight: "",
    bloodPressure: "",
    duration: "60",
    type: "通常",
    waist: "",
    belly: "",
    armL: "",
    armR: "",
    thighL: "",
    thighR: "",
    calfL: "",
    calfR: "",
    conditionSelf: "良好",
    conditionObjective: "",
    routines: "",
    homework: "",
    summary: "",
    motivation: "",
    advice: "",
  });

  useEffect(() => {
    // Fetch customer name for the header
    fetch(`/api/customers`)
      .then(res => res.json())
      .then(data => {
        const customer = data.find((c: any) => c.id === customerId);
        if (customer) setCustomerName(customer.name);
      });
  }, [customerId]);

  const handleAIAnalysis = (aiData: any) => {
    setSessionForm(prev => ({
      ...prev,
      routines: aiData.routines || prev.routines,
      homework: aiData.homework || prev.homework,
      summary: aiData.summary || prev.summary,
      motivation: aiData.motivation || prev.motivation,
      advice: aiData.advice || prev.advice,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSessionForm({ ...sessionForm, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          ...sessionForm,
          type: isMonthlyMode ? "計測のみ" : sessionForm.type,
          duration: isMonthlyMode ? 0 : parseInt(sessionForm.duration),
        }),
      });
      
      if (res.ok) {
        router.push(`/customers/${customerId}`);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href={`/customers/${customerId}`} className={styles.backLink}>
          <ArrowLeft size={18} /> 戻る
        </Link>
        <h1 className={styles.title}>
          {isMonthlyMode ? <Ruler size={32} /> : null}
          {isMonthlyMode ? '月次身体データ計測' : '本日のセッション記録'}: {customerName} 様
        </h1>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          {!isMonthlyMode && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Sparkles className={styles.aiIcon} /> AI アシスト録音
                </h2>
                <div className={styles.sessionMetaInputs}>
                  <select name="type" className="input-sm" value={sessionForm.type} onChange={handleChange}>
                    <option value="通常">通常</option>
                    <option value="体験">体験</option>
                  </select>
                  <select name="duration" className="input-sm" value={sessionForm.duration} onChange={handleChange}>
                    <option value="60">60分</option>
                    <option value="90">90分</option>
                  </select>
                </div>
              </div>
              <VoiceRecorder onAnalysisComplete={handleAIAnalysis} />
            </section>
          )}

          <form onSubmit={handleSave}>
            <div className="card">
              <h2 className={styles.sectionTitle}>
                <Activity size={20} className={styles.icon} /> 今日の計測・コンディション
              </h2>
              <div className={styles.row}>
                <div className="form-group">
                  <label>体重 (kg)</label>
                  <input type="number" step="0.1" name="weight" className="input" value={sessionForm.weight} onChange={handleChange} placeholder="0.0" />
                </div>
                <div className="form-group">
                  <label>血圧 (最高/最低)</label>
                  <input type="text" name="bloodPressure" className="input" value={sessionForm.bloodPressure} onChange={handleChange} placeholder="120/80" />
                </div>
              </div>
              
              {!isMonthlyMode && (
                <div className={styles.row}>
                  <div className="form-group">
                    <label>本人申告の体調</label>
                    <select name="conditionSelf" className="input" value={sessionForm.conditionSelf} onChange={handleChange}>
                      <option value="良好">良好</option>
                      <option value="普通">普通</option>
                      <option value="疲労ぎみ">疲労ぎみ</option>
                      <option value="不調">不調</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>トレーナー評価</label>
                    <input type="text" name="conditionObjective" className="input" value={sessionForm.conditionObjective} onChange={handleChange} placeholder="例）動きが良い" />
                  </div>
                </div>
              )}

              <details className={styles.details} open={isMonthlyMode}>
                <summary className={styles.summaryLabel}>
                  {isMonthlyMode ? '身体サイズを入力してください' : '身体サイズ計測の入力（月一計測など）'}
                </summary>
                <div className={styles.sizeGrid}>
                  <div className="form-group">
                    <label>ウエスト (cm)</label>
                    <input type="number" step="0.1" name="waist" className="input" value={sessionForm.waist} onChange={handleChange} placeholder="0.0" />
                  </div>
                  <div className="form-group">
                    <label>へそ周り (cm)</label>
                    <input type="number" step="0.1" name="belly" className="input" value={sessionForm.belly} onChange={handleChange} placeholder="0.0" />
                  </div>
                  <div className={styles.lrGroup}>
                    <div className="form-group">
                      <label>二の腕 左 (cm)</label>
                      <input type="number" step="0.1" name="armL" className="input" value={sessionForm.armL} onChange={handleChange} placeholder="0.0" />
                    </div>
                    <div className="form-group">
                      <label>二の腕 右 (cm)</label>
                      <input type="number" step="0.1" name="armR" className="input" value={sessionForm.armR} onChange={handleChange} placeholder="0.0" />
                    </div>
                  </div>
                  <div className={styles.lrGroup}>
                    <div className="form-group">
                      <label>太もも 左 (cm)</label>
                      <input type="number" step="0.1" name="thighL" className="input" value={sessionForm.thighL} onChange={handleChange} placeholder="0.0" />
                    </div>
                    <div className="form-group">
                      <label>太もも 右 (cm)</label>
                      <input type="number" step="0.1" name="thighR" className="input" value={sessionForm.thighR} onChange={handleChange} placeholder="0.0" />
                    </div>
                  </div>
                  <div className={styles.lrGroup}>
                    <div className="form-group">
                      <label>ふくらはぎ 左 (cm)</label>
                      <input type="number" step="0.1" name="calfL" className="input" value={sessionForm.calfL} onChange={handleChange} placeholder="0.0" />
                    </div>
                    <div className="form-group">
                      <label>ふくらはぎ 右 (cm)</label>
                      <input type="number" step="0.1" name="calfR" className="input" value={sessionForm.calfR} onChange={handleChange} placeholder="0.0" />
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {!isMonthlyMode && (
              <div className="card" style={{ marginTop: '1.5rem' }}>
                <h2 className={styles.sectionTitle}>トレーニング・会話内容（AI自動入力可）</h2>
                
                <div className="form-group">
                  <label>実施メニュー・回数</label>
                  <textarea 
                    name="routines" 
                    className={`input ${styles.textarea}`} 
                    value={sessionForm.routines} 
                    onChange={handleChange}
                    placeholder="AI分析または手動入力..."
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>会話の要約</label>
                  <textarea 
                    name="summary" 
                    className={`input ${styles.textarea}`} 
                    value={sessionForm.summary} 
                    onChange={handleChange}
                    placeholder="AI分析または手動入力..."
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>宿題・次回の課題</label>
                  <textarea 
                    name="homework" 
                    className={`input ${styles.textareaSmall}`} 
                    value={sessionForm.homework} 
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            )}

            <button type="submit" disabled={isSaving} className={`btn btn-primary ${styles.saveBtn}`}>
              <Save style={{ marginRight: '0.5rem' }} /> {isSaving ? "保存中..." : "セッションを保存する"}
            </button>
          </form>
        </div>

        {!isMonthlyMode && (
          <div className={styles.rightCol}>
            <div className={`card ${styles.aiCard}`}>
              <h3 className={styles.aiCardTitle}>
                <Sparkles style={{ marginRight: '0.5rem' }} /> AI アドバイス & 分析
              </h3>
              <div className={styles.aiContent}>
                <div className={styles.aiItem}>
                  <h4>推測されるモチベーション</h4>
                  <p>{sessionForm.motivation || "分析待ち..."}</p>
                </div>
                <div className={styles.aiItem}>
                  <h4>AIからの専門アドバイス</h4>
                  <p>{sessionForm.advice || "分析待ち..."}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
