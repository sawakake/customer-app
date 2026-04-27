"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import styles from "../../new/page.module.css";
import VoiceRecorder from "@/components/VoiceRecorder";
import { compressImageToBase64 } from "@/lib/imageUtils";
import {
  ArrowLeft, Save, Sparkles, Activity, Ruler,
  Plus, Trash2, ChevronDown, ChevronUp, Camera, X
} from "lucide-react";
import Link from "next/link";

// =============================================
// 型定義
// =============================================
interface MenuItem {
  name: string;
  type: "トレーニング" | "ストレッチ";
  sets: number;
  reps: string;       // 例: "10,10,12"（セットごとカンマ区切り）
  weight: string;
  note: string;
  isOpen: boolean;    // アコーディオン開閉
}

interface PhotoSlot {
  file: File | null;
  preview: string | null;
  label: string;
  timing: "Before" | "After";
  viewType: "Front" | "Side" | "Other";
}

// =============================================
// 写真スロット初期値
// =============================================
const makePhotoSlots = (): PhotoSlot[] => [
  { file: null, preview: null, label: "Before 正面", timing: "Before", viewType: "Front" },
  { file: null, preview: null, label: "Before 横",  timing: "Before", viewType: "Side"  },
  { file: null, preview: null, label: "Before その他", timing: "Before", viewType: "Other" },
  { file: null, preview: null, label: "After 正面",  timing: "After",  viewType: "Front" },
  { file: null, preview: null, label: "After 横",   timing: "After",  viewType: "Side"  },
  { file: null, preview: null, label: "After その他", timing: "After",  viewType: "Other" },
];

// =============================================
// メインコンポーネント
// =============================================
function EditSessionPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = params.id as string;
  const sessionId = params.sessionId as string;
  const [isMonthlyMode, setIsMonthlyMode] = useState(searchParams.get("type") === "monthly");

  const [isSaving, setIsSaving] = useState(false);
  const [customerName, setCustomerName] = useState("");

  // ---------- フォーム ----------
  const [sessionForm, setSessionForm] = useState({
    weight: "",
    bloodPressureHigh: "",
    bloodPressureLow: "",
    duration: "60",
    type: "通常",
    waist: "", belly: "",
    armL: "", armR: "",
    thighL: "", thighR: "",
    calfL: "", calfR: "",
    conditionSelf: "良好",
    conditionObjective: "",
    homework: "",
    summary: "",
    motivation: "",
    advice: "",
    freeNote: "",
  });

  // ---------- メニュー項目（アコーディオン） ----------
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { name: "", type: "トレーニング", sets: 3, reps: "", weight: "", note: "", isOpen: true },
  ]);

  // ---------- 姿勢写真スロット ----------
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(makePhotoSlots());

  // ---------- 顧客名・セッション情報の取得 ----------
  useEffect(() => {
    // 顧客名取得
    fetch(`/api/customers/${customerId}`)
      .then(res => res.json())
      .then(customer => {
        if (customer && !customer.error) setCustomerName(customer.name);
      });

    // セッション情報の取得
    fetch(`/api/sessions/${sessionId}`)
      .then(res => res.json())
      .then(session => {
        if (session && !session.error) {
          setIsMonthlyMode(session.type === "計測のみ" || session.duration === 0);
          setSessionForm({
            date: new Date(session.date).toISOString().slice(0, 16),
            type: session.type,
            duration: session.duration.toString(),
            conditionSelf: session.conditionSelf || "",
            conditionObjective: session.conditionObjective || "",
            routinesText: session.routinesText || "",
            homework: session.homework || "",
            aiSummary: session.aiSummary || "",
            aiAdvice: session.aiAdvice || "",
            clientMotivation: session.clientMotivation || "",
          });
          if (session.menuItems && session.menuItems.length > 0) {
             setMenuItems(session.menuItems.map((m: any) => ({ ...m, isOpen: false })));
          }
          if (session.photos && session.photos.length > 0) {
             const loadedPhotos = INITIAL_PHOTO_SLOTS.map(slot => {
               const photo = session.photos.find((p: any) => p.timing === slot.timing && p.viewType === slot.viewType);
               if (photo) {
                 return { ...slot, preview: photo.url };
               }
               return slot;
             });
             setPhotoSlots(loadedPhotos);
          }
        }
      });
  }, [customerId, sessionId]);

  // =============================================
  // AI 分析結果受け取り
  // =============================================
  const handleAIAnalysis = (aiData: any) => {
    setSessionForm(prev => ({
      ...prev,
      summary:    aiData.summary    || prev.summary,
      motivation: aiData.motivation || prev.motivation,
      advice:     aiData.advice     || prev.advice,
      homework:   aiData.homework   || prev.homework,
    }));
    if (aiData.menuItems?.length > 0) {
      setMenuItems(aiData.menuItems.map((m: any) => ({ ...m, isOpen: true })));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSessionForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // =============================================
  // メニュー操作
  // =============================================
  const addMenuItem = () => {
    setMenuItems(prev => [
      ...prev,
      { name: "", type: "トレーニング", sets: 3, reps: "", weight: "", note: "", isOpen: true },
    ]);
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateMenuItem = (index: number, field: keyof MenuItem, value: any) => {
    setMenuItems(prev => {
      const next = [...prev];
      (next[index] as any)[field] = value;
      return next;
    });
  };

  const toggleMenuItem = (index: number) => {
    updateMenuItem(index, "isOpen", !menuItems[index].isOpen);
  };

  // repsをセット数に合わせて自動調整するヘルパー
  const updateSets = (index: number, sets: number) => {
    const current = menuItems[index].reps.split(",").map(s => s.trim());
    const newReps = Array.from({ length: sets }, (_, i) => current[i] || "10").join(",");
    setMenuItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], sets, reps: newReps };
      return next;
    });
  };

  const updateRep = (menuIndex: number, setIndex: number, value: string) => {
    const reps = menuItems[menuIndex].reps.split(",").map(s => s.trim());
    reps[setIndex] = value;
    updateMenuItem(menuIndex, "reps", reps.join(","));
  };

  // =============================================
  // 写真スロット操作
  // =============================================
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePhotoSelect = async (slotIndex: number, file: File | null) => {
    if (!file) return;
    try {
      const base64 = await compressImageToBase64(file);
      setPhotoSlots(prev => {
        const next = [...prev];
        next[slotIndex] = { ...next[slotIndex], file, preview: base64 };
        return next;
      });
    } catch (e) {
      alert("画像の圧縮に失敗しました。");
    }
  };

  const clearPhoto = (slotIndex: number) => {
    setPhotoSlots(prev => {
      const next = [...prev];
      next[slotIndex] = { ...next[slotIndex], file: null, preview: null };
      return next;
    });
    if (fileInputRefs.current[slotIndex]) {
      fileInputRefs.current[slotIndex]!.value = "";
    }
  };

  // =============================================
  // AI 姿勢分析
  // =============================================
  const [isAnalyzingPosture, setIsAnalyzingPosture] = useState(false);

  const handleAnalyzePosture = async () => {
    const beforeImages = photoSlots.filter(s => s.timing === 'Before' && s.preview).map(s => s.preview);
    const afterImages = photoSlots.filter(s => s.timing === 'After' && s.preview).map(s => s.preview);

    if (beforeImages.length === 0 && afterImages.length === 0) {
      alert("分析する写真がありません。");
      return;
    }

    setIsAnalyzingPosture(true);
    try {
      const res = await fetch('/api/analyze-posture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beforeImages, afterImages })
      });
      const data = await res.json();
      if (data.analysis) {
        setSessionForm(prev => ({
          ...prev,
          advice: prev.advice ? `${prev.advice}\n\n【姿勢の分析（AI）】\n${data.analysis}` : `【姿勢の分析（AI）】\n${data.analysis}`
        }));
        alert("分析が完了し、アドバイス欄に追記されました！");
      } else {
        alert(data.error || "姿勢分析に失敗しました。");
      }
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました。");
    } finally {
      setIsAnalyzingPosture(false);
    }
  };

  // =============================================
  // 保存処理
  // =============================================
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 写真をBase64で収集（将来的にはBlob APIへのアップロードに切り替え可能）
      const photosPayload = photoSlots
        .filter(s => s.preview)
        .map(s => ({
          timing:   s.timing,
          viewType: s.viewType,
          url:      s.preview, // Base64 or URL
        }));

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          ...sessionForm,
          menuItems: menuItems.map(({ isOpen, ...m }) => m),
          photos: photosPayload,
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
    } catch {
      alert("エラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // =============================================
  // レンダリング
  // =============================================
  const beforeSlots = photoSlots.filter(s => s.timing === "Before");
  const afterSlots  = photoSlots.filter(s => s.timing === "After");

  const renderPhotoGroup = (slots: PhotoSlot[], timing: "Before" | "After") => (
    <div className={styles.photoGroup}>
      <h4 className={styles.photoGroupTitle}>
        <Camera size={16} />
        {timing === "Before" ? "【Before】トレーニング前" : "【After】トレーニング後"}
      </h4>
      <div className={styles.photoGrid}>
        {slots.map((slot, si) => {
          const globalIndex = photoSlots.findIndex(
            s => s.timing === slot.timing && s.viewType === slot.viewType
          );
          return (
            <div key={si} className={styles.photoSlot}>
              {slot.preview ? (
                <div className={styles.photoPreview}>
                  <img src={slot.preview} alt={slot.label} />
                  <button
                    type="button"
                    className={styles.photoRemove}
                    onClick={() => clearPhoto(globalIndex)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.photoPlaceholder}
                  onClick={() => fileInputRefs.current[globalIndex]?.click()}
                >
                  <Camera size={20} />
                  <span>{slot.label.replace(`${timing} `, "")}</span>
                </button>
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={el => { fileInputRefs.current[globalIndex] = el; }}
                onChange={e => handlePhotoSelect(globalIndex, e.target.files?.[0] ?? null)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href={`/customers/${customerId}`} className={styles.backLink}>
          <ArrowLeft size={18} /> 戻る
        </Link>
        <h1 className={styles.title}>
          {isMonthlyMode ? <Ruler size={28} /> : <Activity size={28} />}
          セッションの編集: {customerName} 様
        </h1>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftCol}>

          {/* AI録音アシスト */}
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

            {/* ===== 計測・コンディション ===== */}
            <div className="card">
              <h2 className={styles.sectionTitle}>
                <Activity size={20} className={styles.icon} /> 計測・コンディション
              </h2>
              <div className={styles.row}>
                <div className="form-group">
                  <label>体重 (kg)</label>
                  <input type="number" step="0.1" name="weight" className="input"
                    value={sessionForm.weight} onChange={handleChange} placeholder="0.0" />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>血圧（上 / 下）</label>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input type="number" name="bloodPressureHigh" className="input"
                      value={sessionForm.bloodPressureHigh} onChange={handleChange} placeholder="上" />
                    <span>/</span>
                    <input type="number" name="bloodPressureLow" className="input"
                      value={sessionForm.bloodPressureLow} onChange={handleChange} placeholder="下" />
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
                    <input type="text" name="conditionObjective" className="input"
                      value={sessionForm.conditionObjective} onChange={handleChange}
                      placeholder="例）動きが良い" />
                  </div>
                </div>
              )}

              {/* ===== 姿勢写真アップロード ===== */}
              {!isMonthlyMode && (
                <div className={styles.photoSection}>
                  <h3 className={styles.photoSectionTitle}>
                    <Camera size={18} /> 姿勢写真（Before / After）
                  </h3>
                  <div className={styles.photoRow}>
                    {renderPhotoGroup(beforeSlots, "Before")}
                    {renderPhotoGroup(afterSlots, "After")}
                  </div>
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button 
                      type="button" 
                      onClick={handleAnalyzePosture} 
                      disabled={isAnalyzingPosture}
                      className="btn btn-secondary"
                      style={{ gap: '0.5rem' }}
                    >
                      <Sparkles size={16} /> 
                      {isAnalyzingPosture ? "画像AI解析中..." : "アップロードした写真で姿勢変化をAI分析する"}
                    </button>
                  </div>
                  <p className={styles.helpText}>タップして写真を選択（カメラ撮影・ライブラリ両方対応）</p>
                </div>
              )}

              {/* 身体サイズ計測 */}
              <details className={styles.details} open={isMonthlyMode}>
                <summary className={styles.summaryLabel}>
                  {isMonthlyMode ? "身体サイズを入力" : "身体サイズ計測（月1回）"}
                </summary>
                <div className={styles.sizeGrid}>
                  {[
                    ["ウエスト", "waist"], ["へそ周り", "belly"],
                    ["二の腕 左", "armL"], ["二の腕 右", "armR"],
                    ["太もも 左", "thighL"], ["太もも 右", "thighR"],
                    ["ふくらはぎ 左", "calfL"], ["ふくらはぎ 右", "calfR"],
                  ].map(([label, name]) => (
                    <div key={name} className="form-group">
                      <label>{label} (cm)</label>
                      <input type="number" step="0.1" name={name} className="input"
                        value={(sessionForm as any)[name]} onChange={handleChange} placeholder="0.0" />
                    </div>
                  ))}
                </div>
              </details>
            </div>

            {/* ===== トレーニング・ストレッチ メニュー ===== */}
            {!isMonthlyMode && (
              <div className="card" style={{ marginTop: "1.5rem" }}>
                <h2 className={styles.sectionTitle}>トレーニング・ストレッチ</h2>

                <div className={styles.menuList}>
                  {menuItems.map((item, idx) => {
                    const repsArr = item.reps
                      ? item.reps.split(",").map(s => s.trim())
                      : Array(item.sets).fill("");

                    return (
                      <div key={idx} className={styles.menuCard}>
                        {/* アコーディオンヘッダー */}
                        <div
                          className={styles.menuCardHeader}
                          onClick={() => toggleMenuItem(idx)}
                          role="button"
                        >
                          <div className={styles.menuCardLeft}>
                            <span className={`${styles.menuTypeBadge} ${item.type === "ストレッチ" ? styles.stretchBadge : ""}`}>
                              {item.type === "トレーニング" ? "筋トレ" : "スト"}
                            </span>
                            <span className={styles.menuCardName}>
                              {item.name || `種目 ${idx + 1}`}
                            </span>
                            {!item.isOpen && item.sets > 0 && (
                              <span className={styles.menuCardMeta}>
                                {item.sets}セット
                                {item.weight ? ` / ${item.weight}` : ""}
                              </span>
                            )}
                          </div>
                          <div className={styles.menuCardActions}>
                            <button
                              type="button"
                              className={styles.menuDeleteBtn}
                              onClick={e => { e.stopPropagation(); removeMenuItem(idx); }}
                            >
                              <Trash2 size={14} />
                            </button>
                            {item.isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>

                        {/* アコーディオン本体 */}
                        {item.isOpen && (
                          <div className={styles.menuCardBody}>
                            {/* タイプ・種目名・重量 */}
                            <div className={styles.menuTopRow}>
                              <select
                                className="input-sm"
                                value={item.type}
                                onChange={e => updateMenuItem(idx, "type", e.target.value)}
                              >
                                <option value="トレーニング">筋トレ</option>
                                <option value="ストレッチ">ストレッチ</option>
                              </select>
                              <input
                                type="text"
                                className="input"
                                value={item.name}
                                onChange={e => updateMenuItem(idx, "name", e.target.value)}
                                placeholder="種目名（例：スクワット）"
                                style={{ flex: 2 }}
                              />
                              <input
                                type="text"
                                className="input"
                                value={item.weight}
                                onChange={e => updateMenuItem(idx, "weight", e.target.value)}
                                placeholder="重量（例：20kg）"
                              />
                            </div>

                            {/* セット数 */}
                            <div className={styles.setsRow}>
                              <label className={styles.setsLabel}>セット数</label>
                              <div className={styles.setsCounter}>
                                <button type="button" className={styles.setsBtn}
                                  onClick={() => updateSets(idx, Math.max(1, item.sets - 1))}>−</button>
                                <span className={styles.setsNum}>{item.sets}</span>
                                <button type="button" className={styles.setsBtn}
                                  onClick={() => updateSets(idx, item.sets + 1)}>＋</button>
                              </div>
                            </div>

                            {/* セットごとの回数 */}
                            <div className={styles.repsGrid}>
                              {Array.from({ length: item.sets }, (_, si) => (
                                <div key={si} className={styles.repItem}>
                                  <label className={styles.repLabel}>{si + 1}セット目</label>
                                  <div className={styles.repInputRow}>
                                    <input
                                      type="number"
                                      min="1"
                                      className={`input ${styles.repInput}`}
                                      value={repsArr[si] ?? ""}
                                      onChange={e => updateRep(idx, si, e.target.value)}
                                      placeholder="10"
                                    />
                                    <span className={styles.repUnit}>回</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* メモ */}
                            <input
                              type="text"
                              className="input"
                              value={item.note}
                              onChange={e => updateMenuItem(idx, "note", e.target.value)}
                              placeholder="メモ（フォームの注意点など）"
                              style={{ marginTop: "0.5rem" }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addMenuItem}
                  className={`btn btn-secondary ${styles.addMenuBtn}`}
                >
                  <Plus size={16} /> 種目を追加
                </button>

                {/* フリーメモ・AIサマリー・宿題 */}
                <div className={styles.textareaGroup}>
                  <div className="form-group">
                    <label>フリー記入欄</label>
                    <textarea name="freeNote" className={`input ${styles.textareaSmall}`}
                      value={sessionForm.freeNote} onChange={handleChange}
                      placeholder="その他の内容・気づき" />
                  </div>
                  <div className="form-group">
                    <label>セッションの要約（AI自動入力）</label>
                    <textarea name="summary" className={`input ${styles.textareaSmall}`}
                      value={sessionForm.summary} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>宿題・次回の課題</label>
                    <textarea name="homework" className={`input ${styles.textareaSmall}`}
                      value={sessionForm.homework} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={isSaving} className={`btn btn-primary ${styles.saveBtn}`}>
              <Save style={{ marginRight: "0.5rem" }} />
              {isSaving ? "保存中..." : "セッションを保存する"}
            </button>
          </form>
        </div>

        {/* 右カラム: AI分析結果 */}
        {!isMonthlyMode && (
          <div className={styles.rightCol}>
            <div className={`card ${styles.aiCard}`}>
              <h3 className={styles.aiCardTitle}>
                <Sparkles style={{ marginRight: "0.5rem" }} /> AI 分析結果
              </h3>
              <div className={styles.aiContent}>
                <div className={styles.aiItem}>
                  <h4>モチベーション</h4>
                  <p>{sessionForm.motivation || "録音後に自動入力されます"}</p>
                </div>
                <div className={styles.aiItem}>
                  <h4>AIアドバイス</h4>
                  <p>{sessionForm.advice || "録音後に自動入力されます"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Suspense で包んでビルドエラーを解消
export default function EditSessionPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>読み込み中...</div>}>
      <EditSessionPageContent />
    </Suspense>
  );
}
