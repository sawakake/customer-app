"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, Coffee, Dumbbell, BookOpen, Save } from "lucide-react";
import styles from "./page.module.css";

// =============================================
// useSearchParams() を使う内側コンポーネント
// =============================================
function ClientLogNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type") || "Diary";

  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const typeConfig = {
    Meal:    { label: "食事記録",    icon: Coffee,   color: "#fda085", placeholder: "今日の食事内容を記録しましょう\n例: 朝: トースト・ヨーグルト\n昼: サラダチキン定食" },
    Workout: { label: "自主トレ記録", icon: Dumbbell, color: "#ff8a00", placeholder: "今日のトレーニングを記録しましょう\n例: ウォーキング30分\nスクワット 20回×3セット" },
    Diary:   { label: "日記・体調記録", icon: BookOpen, color: "#4facfe", placeholder: "今日の体調はどうですか？\n例: 朝から少し疲れ気味だったが、昼以降は元気。\n体が軽くなってきた気がする！" },
  };

  const currentConfig = typeConfig[type as keyof typeof typeConfig];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/client/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, content }),
      });
      if (res.ok) {
        router.push("/client/dashboard");
      } else {
        alert("保存に失敗しました。");
      }
    } catch {
      alert("エラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/client/dashboard" className={styles.backBtn}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className={styles.pageTitle}>記録を追加</h1>
        <button onClick={handleSave} disabled={isSaving || !content} className={styles.saveBtn}>
          <Save size={18} /> {isSaving ? "保存中" : "保存"}
        </button>
      </header>

      <main className={styles.main}>
        {/* タイプ選択 */}
        <div className={styles.typeSelector}>
          {Object.entries(typeConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`${styles.typeBtn} ${type === key ? styles.typeBtnActive : ""}`}
              style={type === key ? { background: config.color } : {}}
            >
              <config.icon size={18} />
              {key === "Meal" ? "食事" : key === "Workout" ? "自主トレ" : "日記"}
            </button>
          ))}
        </div>

        {/* タイトル */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>タイトル（任意）</label>
          <input
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={currentConfig.label}
          />
        </div>

        {/* 本文 */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>内容</label>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={currentConfig.placeholder}
            rows={8}
          />
        </div>

        {/* 写真（食事の場合） */}
        {type === "Meal" && (
          <div className={styles.inputGroup}>
            <label className={styles.label}>写真を追加（任意）</label>
            <div className={styles.photoPicker}>
              <Camera size={24} color="#aaa" />
              <p>タップして写真を選択</p>
              <p className={styles.photoHint}>※写真アップロード機能は今後追加予定です</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// =============================================
// ページ本体: Suspense で包む（ビルドエラー対策）
// =============================================
export default function NewClientLogPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>読み込み中...</div>}>
      <ClientLogNewContent />
    </Suspense>
  );
}
