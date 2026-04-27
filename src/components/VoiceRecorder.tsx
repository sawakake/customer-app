"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react";
import styles from "./VoiceRecorder.module.css";

// 5分ごとにチャンク化（ミリ秒）
const CHUNK_INTERVAL_MS = 5 * 60 * 1000;

interface ChunkStatus {
  index: number;
  status: "pending" | "transcribing" | "done" | "error";
  text?: string;
  error?: string;
  durationMin: number;
}

interface VoiceRecorderProps {
  onAnalysisComplete: (data: {
    menuItems?: any[];
    summary: string;
    homework: string;
    motivation: string;
    advice: string;
  }) => void;
}

export default function VoiceRecorder({ onAnalysisComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [chunkStatuses, setChunkStatuses] = useState<ChunkStatus[]>([]);
  const [analysisError, setAnalysisError] = useState("");
  const [fullTranscript, setFullTranscript] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // timesliceで来る生チャンクをバッチ管理
  const pendingBlobsRef = useRef<Blob[]>([]);
  const chunkQueueRef = useRef<{ blob: Blob; index: number }[]>([]);
  const chunkIndexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 経過時間タイマー
  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // チャンクステータスを更新するヘルパー
  const updateChunk = (index: number, update: Partial<ChunkStatus>) => {
    setChunkStatuses(prev =>
      prev.map(c => c.index === index ? { ...c, ...update } : c)
    );
  };

  const startRecording = async () => {
    try {
      setChunkStatuses([]);
      setAnalysisError("");
      setFullTranscript("");
      chunkIndexRef.current = 0;
      pendingBlobsRef.current = [];
      chunkQueueRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // サポートしているMIMEタイプを選択
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000, // 64kbps：5分 ≒ 2.4MB
      });

      mediaRecorderRef.current = mediaRecorder;

      // timeslice によって CHUNK_INTERVAL_MS ごとに ondataavailable が発火
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          const currentIndex = chunkIndexRef.current;
          chunkIndexRef.current += 1;
          const durationMin = Math.round(currentIndex * (CHUNK_INTERVAL_MS / 1000 / 60));

          // UIにチャンクを追加
          setChunkStatuses(prev => [
            ...prev,
            { index: currentIndex, status: "pending", durationMin }
          ]);

          chunkQueueRef.current.push({ blob: event.data, index: currentIndex });
        }
      };

      mediaRecorder.onstop = async () => {
        stopTimer();
        setIsRecording(false);
        setStatus("文字起こしを開始します...");
        setIsProcessing(true);
        await processAllChunks(mimeType);
      };

      mediaRecorder.start(CHUNK_INTERVAL_MS);
      setIsRecording(true);
      setStatus("録音中");
      startTimer();
    } catch (err: any) {
      console.error("録音開始エラー:", err);
      setStatus(`録音を開始できませんでした: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setStatus("停止しています...");
    }
  };

  // 各チャンクを順番にWhisperへ送信
  const processAllChunks = async (mimeType: string) => {
    const queue = chunkQueueRef.current;
    const transcripts: string[] = [];
    const ext = mimeType.includes("ogg") ? "ogg" : "webm";

    for (const { blob, index } of queue) {
      updateChunk(index, { status: "transcribing" });
      const minuteLabel = `${index * 5 + 1}〜${(index + 1) * 5}分目`;
      setStatus(`文字起こし中... (${minuteLabel} / 全${queue.length}チャンク)`);

      try {
        const formData = new FormData();
        formData.append("audio", blob, `chunk_${index}.${ext}`);

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const rawText = await res.text();
          throw new Error(`サーバーエラー (HTML返却): ${rawText.substring(0, 100)}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        transcripts.push(data.text);
        updateChunk(index, { status: "done", text: data.text });
      } catch (err: any) {
        const errorMsg = err.message || "不明なエラー";
        updateChunk(index, {
          status: "error",
          error: `${minuteLabel}で失敗: ${errorMsg}`,
        });
        // エラーでも続行（部分的な文字起こしで分析を試みる）
        transcripts.push(`[${minuteLabel} 文字起こし失敗]`);
      }
    }

    // 全チャンク完了後、テキストを結合してGPT-4oへ
    const combined = transcripts.join("\n\n");
    setFullTranscript(combined);

    if (!combined.trim() || combined.split("[").length - 1 === queue.length) {
      setStatus("文字起こしに全て失敗しました。音声を確認してください。");
      setIsProcessing(false);
      return;
    }

    await analyzeTranscript(combined);
  };

  const analyzeTranscript = async (text: string) => {
    setStatus("AIでセッション内容を分析中...");
    setAnalysisError("");

    try {
      const res = await fetch("/api/analyze-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("GPT-4o分析中にサーバーエラーが発生しました（HTML返却）");
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      onAnalysisComplete(data);
      setStatus("✅ 分析完了！フォームに自動入力しました。");
    } catch (err: any) {
      const errorMsg = err.message || "不明なエラー";
      setAnalysisError(`GPT-4o分析エラー: ${errorMsg}`);
      setStatus("分析に失敗しました。文字起こし結果は下のデバッグ欄で確認できます。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.recorderContainer}>
      {/* 録音コントロール */}
      <div className={styles.visualizer}>
        {isRecording ? (
          <div className={styles.pulseContainer}>
            <div className={styles.pulse} />
            <Mic className={styles.recordingIcon} />
          </div>
        ) : isProcessing ? (
          <Loader2 className={`${styles.icon} ${styles.spin}`} />
        ) : (
          <Mic className={styles.icon} />
        )}
      </div>

      {/* 経過時間 */}
      {isRecording && (
        <div className={styles.timer}>{formatTime(elapsedSec)}</div>
      )}

      <div className={styles.controls}>
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={isProcessing}
            className={`btn btn-primary ${styles.recordBtn}`}
          >
            <Mic size={20} /> 録音開始
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className={`btn ${styles.stopBtn}`}
          >
            <Square size={20} /> 録音終了・AI分析
          </button>
        )}
      </div>

      {/* ステータスメッセージ */}
      {status && <div className={styles.status}>{status}</div>}

      {/* チャンク進捗 */}
      {chunkStatuses.length > 0 && (
        <div className={styles.chunkList}>
          {chunkStatuses.map(chunk => (
            <div key={chunk.index} className={`${styles.chunkItem} ${styles[chunk.status]}`}>
              {chunk.status === "done" && <CheckCircle2 size={14} />}
              {chunk.status === "error" && <AlertCircle size={14} />}
              {chunk.status === "transcribing" && <Loader2 size={14} className={styles.spin} />}
              {chunk.status === "pending" && <span className={styles.dot} />}
              <span className={styles.chunkLabel}>
                {chunk.durationMin}〜{chunk.durationMin + 5}分
                {chunk.status === "transcribing" && " 文字起こし中..."}
                {chunk.status === "done" && " 完了"}
                {chunk.status === "error" && " エラー"}
              </span>
              {chunk.error && (
                <span className={styles.chunkError}>{chunk.error}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* GPT-4o分析エラー表示 */}
      {analysisError && (
        <div className={styles.errorBox}>
          <AlertCircle size={16} />
          <span>{analysisError}</span>
        </div>
      )}

      {/* デバッグ：文字起こし全文（開発中のみ表示） */}
      {fullTranscript && (
        <div className={styles.debugSection}>
          <button
            type="button"
            className={styles.debugToggle}
            onClick={() => setShowDebug(p => !p)}
          >
            {showDebug ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            文字起こし全文（デバッグ用）
          </button>
          {showDebug && (
            <pre className={styles.debugText}>{fullTranscript}</pre>
          )}
        </div>
      )}

      <div className={styles.hint}>
        録音中は5分ごとに自動チャンク化されます。60分のセッションも問題ありません。
      </div>
    </div>
  );
}
