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
    bloodPressureHigh: "",
    bloodPressureLow: "",
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
    routines: "", // 旧
    homework: "",
    summary: "",
    motivation: "",
    advice: "",
    freeNote: "",
  });

  const [menuItems, setMenuItems] = useState<any[]>([
    { name: "", type: "トレーニング", sets: 3, reps: "", weight: "", note: "" }
  ]);

  const [photos, setPhotos] = useState<any>({
    before: { front: null, side: null, other: null },
    after: { front: null, side: null, other: null }
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
    // AIからの解析結果をメニュー等に反映するロジック（後ほど強化）
    setSessionForm(prev => ({
      ...prev,
      summary: aiData.summary || prev.summary,
      motivation: aiData.motivation || prev.motivation,
      advice: aiData.advice || prev.advice,
      homework: aiData.homework || prev.homework,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSessionForm({ ...sessionForm, [e.target.name]: e.target.value });
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: "", type: "トレーニング", sets: 3, reps: "", weight: "", note: "" }]);
  };

  const updateMenuItem = (index: number, field: string, value: any) => {
    const newItems = [...menuItems];
    newItems[index][field] = value;
    setMenuItems(newItems);
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
          menuItems,
          // 写真データは本来S3等に上げるが、今回はJSONの一部として（構造のみ）
          photos,
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
          {isMonthlyMode ? '月次身体データ計測' : '今日のセッション記録'}: {customerName} 様
        </h1>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          {!isMonthlyMode && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Sparkles className={styles.aiIcon} /> AI アシスト録音（会話から種目を自動抽出）
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
                <div className="form-group" style={{ flex: 2 }}>
                  <label>血圧 (最高 / 最低)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="number" name="bloodPressureHigh" className="input" value={sessionForm.bloodPressureHigh} onChange={handleChange} placeholder="上" />
                    <span>/</span>
                    <input type="number" name="bloodPressureLow" className="input" value={sessionForm.bloodPressureLow} onChange={handleChange} placeholder="下" />
                  </div>
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

              {/* 写真添付セクション */}
              {!isMonthlyMode && (
                <div className={styles.photoSection}>
                  <div className={styles.photoRow}>
                    <div className={styles.photoCol}>
                      <h4>【Before】姿勢写真</h4>
                      <div className={styles.photoGrid}>
                        <div className={styles.photoDrop}><span>前</span></div>
                        <div className={styles.photoDrop}><span>横</span></div>
                        <div className={styles.photoDrop}><span>他</span></div>
                      </div>
                    </div>
                    <div className={styles.photoCol}>
                      <h4>【After】姿勢写真</h4>
                      <div className={styles.photoGrid}>
                        <div className={styles.photoDrop}><span>前</span></div>
                        <div className={styles.photoDrop}><span>横</span></div>
                        <div className={styles.photoDrop}><span>他</span></div>
                      </div>
                    </div>
                  </div>
                  <p className={styles.helpText}>※写真は保存後にAI姿勢分析が実行されます</p>
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
                <h2 className={styles.sectionTitle}>トレーニング・ストレッチ項目</h2>
                
                <div className={styles.menuList}>
                  {menuItems.map((item, index) => (
                    <div key={index} className={styles.menuItemRow}>
                      <select 
                        className="input-sm" 
                        value={item.type} 
                        onChange={(e) => updateMenuItem(index, 'type', e.target.value)}
                      >
                        <option value="トレーニング">トレ</option>
                        <option value="ストレッチ">スト</option>
                      </select>
                      <input 
                        type="text" 
                        className="input" 
                        value={item.name} 
                        onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                        placeholder="種目名" 
                        style={{ flex: 2 }}
                      />
                      <input 
                        type="number" 
                        className="input" 
                        value={item.sets} 
                        onChange={(e) => updateMenuItem(index, 'sets', parseInt(e.target.value))}
                        placeholder="Set" 
                      />
                      <input 
                        type="text" 
                        className="input" 
                        value={item.reps} 
                        onChange={(e) => updateMenuItem(index, 'reps', e.target.value)}
                        placeholder="回数" 
                      />
                      <input 
                        type="text" 
                        className="input" 
                        value={item.weight} 
                        onChange={(e) => updateMenuItem(index, 'weight', e.target.value)}
                        placeholder="重さ" 
                      />
                    </div>
                  ))}
                  <button type="button" onClick={addMenuItem} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                    + 項目を追加
                  </button>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label>フリー記入欄（内容・気づき）</label>
                  <textarea 
                    name="freeNote" 
                    className={`input ${styles.textareaSmall}`} 
                    value={sessionForm.freeNote} 
                    onChange={handleChange}
                    placeholder="その他の内容はこちらに記入してください"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>会話の要約（AI分析結果）</label>
                  <textarea 
                    name="summary" 
                    className={`input ${styles.textareaSmall}`} 
                    value={sessionForm.summary} 
                    onChange={handleChange}
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
