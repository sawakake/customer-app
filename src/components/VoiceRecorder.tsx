"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic, Square, Loader2, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, RefreshCw, RotateCcw
} from "lucide-react";
import styles from "./VoiceRecorder.module.css";

// =============================================
// 定数
// =============================================
const CHUNK_INTERVAL_MS = 2 * 60 * 1000; // 2分ごとにチャンク化（タイムアウト対策）
const MAX_RETRIES = 3;                     // Whisper最大リトライ回数
const RETRY_DELAY_BASE_MS = 2000;          // リトライ初期待機時間（指数バックオフ）
const LS_KEY = "voicerecorder_draft";      // localStorage キー

// =============================================
// 型定義
// =============================================
interface ChunkStatus {
  index: number;
  status: "pending" | "transcribing" | "retrying" | "done" | "error" | "skipped";
  text?: string;
  error?: string;
  retryCount?: number;
  durationStart: number; // 分
  durationEnd: number;   // 分
  fileSizeMB?: string;
}

interface DraftData {
  chunkStatuses: ChunkStatus[];
  fullTranscript: string;
  savedAt: string;
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

// =============================================
// ユーティリティ
// =============================================
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// =============================================
// コンポーネント本体
// =============================================
export default function VoiceRecorder({ onAnalysisComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [chunkStatuses, setChunkStatuses] = useState<ChunkStatus[]>([]);
  const [analysisError, setAnalysisError] = useState("");
  const [fullTranscript, setFullTranscript] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [showRestore, setShowRestore] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkQueueRef = useRef<{ blob: Blob; index: number; startMin: number }[]>([]);
  const chunkIndexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const chunkCountRef = useRef(0); // 録音開始からのチャンク数
  const transcriptsMapRef = useRef<Map<number, string>>(new Map());
  const wakeLockRef = useRef<any>(null);
  const requestDataIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedSecRef = useRef(0);

  // =============================================
  // localStorage 復元チェック（マウント時）
  // =============================================
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed: DraftData = JSON.parse(raw);
        if (parsed.chunkStatuses?.length > 0) {
          setDraftData(parsed);
          setShowRestore(true);
        }
      }
    } catch {
      // 壊れたデータは無視
    }
  }, []);

  // =============================================
  // localStorage 保存ヘルパー
  // =============================================
  const saveDraft = (chunks: ChunkStatus[], transcript: string) => {
    try {
      const draft: DraftData = {
        chunkStatuses: chunks,
        fullTranscript: transcript,
        savedAt: new Date().toLocaleString("ja-JP"),
      };
      localStorage.setItem(LS_KEY, JSON.stringify(draft));
    } catch {
      // quota over などは無視
    }
  };

  const clearDraft = () => {
    try { localStorage.removeItem(LS_KEY); } catch {}
    setDraftData(null);
    setShowRestore(false);
  };

  // 下書きを復元してGPT分析だけ再実行
  const handleRestore = async () => {
    if (!draftData) return;
    setShowRestore(false);
    setChunkStatuses(draftData.chunkStatuses);
    setFullTranscript(draftData.fullTranscript);
    setStatus("復元したテキストで再分析します...");
    setIsProcessing(true);
    await analyzeTranscript(draftData.fullTranscript);
  };

  // =============================================
  // チャンクステータス更新ヘルパー
  // =============================================
  const updateChunk = (index: number, update: Partial<ChunkStatus>) => {
    setChunkStatuses(prev => {
      const next = prev.map(c => c.index === index ? { ...c, ...update } : c);
      return next;
    });
  };

  // =============================================
  // 録音タイマー
  // =============================================
  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSec(sec);
      elapsedSecRef.current = sec;
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  // =============================================
  // 録音開始
  // =============================================
  const startRecording = async () => {
    try {
      // リセット
      setChunkStatuses([]);
      setAnalysisError("");
      setFullTranscript("");
      setStatus("");
      chunkIndexRef.current = 0;
      chunkCountRef.current = 0;
      chunkQueueRef.current = [];
      clearDraft();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find(t => MediaRecorder.isTypeSupported(t)) ?? "";

      const mediaRecorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 64000,
      });

      mediaRecorderRef.current = mediaRecorder;

      // Wake Lock リクエスト（サポートされている場合）
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.warn("Wake Lock request failed:", err);
        }
      }

      // timeslice ではなく setInterval で手動で requestData を呼ぶことで確実にチャンクを生成する
      mediaRecorder.ondataavailable = async (event) => {
        if (!event.data || event.data.size === 0) return;

        const currentIndex = chunkIndexRef.current;
        const currentTotalSec = elapsedSecRef.current;
        const startMin = Math.floor(currentTotalSec / 60);
        const endMin = startMin + Math.floor(CHUNK_INTERVAL_MS / 60000);
        chunkIndexRef.current += 1;

        setChunkStatuses(prev => [
          ...prev,
          { index: currentIndex, status: "pending", durationStart: startMin, durationEnd: endMin }
        ]);

        // 録音中からバックグラウンドで文字起こし開始
        transcribeChunk(event.data, currentIndex, startMin, mimeType || "audio/webm");
      };

      mediaRecorder.onstop = async () => {
        stopTimer();
        if (requestDataIntervalRef.current) {
          clearInterval(requestDataIntervalRef.current);
          requestDataIntervalRef.current = null;
        }
        setIsRecording(false);
        
        // Wake Lock 解除
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }

        setStatus("最後のチャンクを処理中...");
        setIsProcessing(true);
        
        // 全てのチャンクが完了するのを待機
        await waitForAllChunks();
        await finalizeTranscription();
      };

      // 録音開始 (timesliceなし)
      mediaRecorder.start();
      setIsRecording(true);
      setStatus("録音中");
      startTimer();

      // 手動チャンクタイマー
      requestDataIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.requestData();
        }
      }, CHUNK_INTERVAL_MS);
    } catch (err: any) {
      setStatus(`録音を開始できませんでした: ${err.message}`);
    }
  };

  // =============================================
  // 録音停止
  // =============================================
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (requestDataIntervalRef.current) {
        clearInterval(requestDataIntervalRef.current);
        requestDataIntervalRef.current = null;
      }
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setStatus("停止しています...");
    }
  };

  // =============================================
  // Whisper送信（リトライ付き）
  // =============================================
  const transcribeWithRetry = async (
    blob: Blob,
    index: number,
    startMin: number,
    ext: string
  ): Promise<string | null> => {
    const labelRange = `${startMin}〜${startMin + 5}分`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 1) {
        const waitMs = RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 2); // 2s, 4s
        updateChunk(index, {
          status: "retrying",
          retryCount: attempt - 1,
          error: `リトライ ${attempt - 1}回目 (${waitMs / 1000}秒後)...`,
        });
        await sleep(waitMs);
      }

      try {
        const formData = new FormData();
        formData.append("audio", blob, `chunk_${index}.${ext}`);

        const res = await fetch("/api/transcribe", { method: "POST", body: formData });

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          throw new Error(`サーバーエラー (非JSON返却, status=${res.status})`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        updateChunk(index, {
          status: "done",
          text: data.text,
          error: undefined,
          retryCount: attempt - 1,
          fileSizeMB: data.fileSizeMB,
        });
        return data.text;
      } catch (err: any) {
        const msg = err.message || "不明なエラー";
        console.error(`[Chunk ${index} / ${labelRange}] attempt ${attempt} failed: ${msg}`);

        if (attempt === MAX_RETRIES) {
          updateChunk(index, {
            status: "error",
            error: `${labelRange}で失敗（${MAX_RETRIES}回試行）: ${msg}`,
            retryCount: attempt,
          });
          return null;
        }
      }
    }
    return null;
  };

  // 個別チャンクの文字起こし（録音中に並列実行）
  const transcribeChunk = async (blob: Blob, index: number, startMin: number, mimeType: string) => {
    const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
    updateChunk(index, { status: "transcribing" });
    
    const text = await transcribeWithRetry(blob, index, startMin, ext);
    if (text) {
      transcriptsMapRef.current.set(index, text);
    } else {
      transcriptsMapRef.current.set(index, `[${startMin}分付近：文字起こし失敗]`);
    }
  };

  // 全チャンクの完了を待機
  const waitForAllChunks = async () => {
    let allDone = false;
    while (!allDone) {
      const currentStatuses = await new Promise<ChunkStatus[]>(resolve => {
        setChunkStatuses(prev => {
          resolve(prev);
          return prev;
        });
      });
      
      allDone = currentStatuses.every(c => c.status === "done" || c.status === "error");
      if (!allDone) {
        const pendingCount = currentStatuses.filter(c => c.status !== "done" && c.status !== "error").length;
        setStatus(`残りのチャンクを処理中... (残り${pendingCount}個)`);
        await sleep(1000);
      }
    }
  };

  // 最終的な文字起こし結果の統合と分析
  const finalizeTranscription = async () => {
    const sortedIndices = Array.from(transcriptsMapRef.current.keys()).sort((a, b) => a - b);
    const transcripts = sortedIndices.map(i => transcriptsMapRef.current.get(i));
    const combined = transcripts.join("\n\n");
    
    setFullTranscript(combined);

    // localStorage 保存用
    const currentStatuses = await new Promise<ChunkStatus[]>(resolve => {
      setChunkStatuses(prev => { resolve(prev); return prev; });
    });
    saveDraft(currentStatuses, combined);

    const successCount = currentStatuses.filter(c => c.status === "done").length;
    if (successCount === 0) {
      setStatus("❌ 文字起こしに失敗しました。");
      setIsProcessing(false);
      return;
    }

    setStatus(`文字起こし完了。AIで分析中...`);
    await analyzeTranscript(combined);
  };

  // =============================================
  // GPT-4o 分析
  // =============================================
  const analyzeTranscript = async (text: string) => {
    setAnalysisError("");
    try {
      const res = await fetch("/api/analyze-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error("GPT-4o分析中にサーバーエラーが発生しました（HTML返却）");
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      onAnalysisComplete(data);
      clearDraft(); // 分析成功したら下書き削除
      setStatus("✅ 分析完了！フォームに自動入力しました。");
    } catch (err: any) {
      const msg = err.message || "不明なエラー";
      setAnalysisError(`GPT-4o 分析エラー: ${msg}`);
      setStatus("⚠️ 分析に失敗しました。文字起こし結果は保存されています。");
      // 分析失敗時は下書きを保持したままにする
    } finally {
      setIsProcessing(false);
    }
  };

  // 分析のみ手動で再実行
  const handleReanalyze = async () => {
    if (!fullTranscript) return;
    setIsProcessing(true);
    setStatus("再分析中...");
    await analyzeTranscript(fullTranscript);
  };

  // =============================================
  // レンダリング
  // =============================================
  const doneCount = chunkStatuses.filter(c => c.status === "done").length;
  const errorCount = chunkStatuses.filter(c => c.status === "error").length;

  return (
    <div className={styles.recorderContainer}>

      {/* 下書き復元バナー */}
      {showRestore && draftData && (
        <div className={styles.restoreBanner}>
          <div className={styles.restoreInfo}>
            <RefreshCw size={16} />
            <span>前回の録音データが残っています（{draftData.savedAt}）</span>
          </div>
          <div className={styles.restoreActions}>
            <button type="button" className={styles.restoreBtn} onClick={handleRestore}>
              復元して再分析
            </button>
            <button type="button" className={styles.discardBtn} onClick={clearDraft}>
              破棄
            </button>
          </div>
        </div>
      )}

      {/* マイクアイコン */}
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

      {/* 録音ボタン */}
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

      {/* ステータス */}
      {status && <div className={styles.status}>{status}</div>}

      {/* チャンク進捗リスト */}
      {chunkStatuses.length > 0 && (
        <div className={styles.chunkList}>
          <div className={styles.chunkSummary}>
            チャンク処理: ✅ {doneCount} / ❌ {errorCount} / 合計 {chunkStatuses.length}
          </div>
          {chunkStatuses.map(chunk => (
            <div key={chunk.index} className={`${styles.chunkItem} ${styles[chunk.status]}`}>
              <span className={styles.chunkIcon}>
                {chunk.status === "done" && <CheckCircle2 size={14} />}
                {chunk.status === "error" && <AlertCircle size={14} />}
                {(chunk.status === "transcribing" || chunk.status === "retrying") &&
                  <Loader2 size={14} className={styles.spin} />}
                {chunk.status === "pending" && <span className={styles.dot} />}
                {chunk.status === "skipped" && <span>—</span>}
              </span>
              <div className={styles.chunkInfo}>
                <span className={styles.chunkLabel}>
                  {chunk.durationStart}〜{chunk.durationEnd}分
                  {chunk.fileSizeMB && ` (${chunk.fileSizeMB}MB)`}
                </span>
                <span className={styles.chunkState}>
                  {chunk.status === "done" && " ✅ 完了"}
                  {chunk.status === "transcribing" && " 🔄 文字起こし中"}
                  {chunk.status === "retrying" && ` 🔄 リトライ ${chunk.retryCount}回目`}
                  {chunk.status === "error" && " ❌ 失敗・スキップ"}
                  {chunk.status === "pending" && " 待機中"}
                </span>
                {chunk.error && chunk.status === "error" && (
                  <div className={styles.chunkError}>{chunk.error}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GPT-4o 分析エラー */}
      {analysisError && (
        <div className={styles.errorBox}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <div>
            <div>{analysisError}</div>
            {fullTranscript && (
              <button type="button" className={styles.reanalyzeBtn} onClick={handleReanalyze} disabled={isProcessing}>
                <RotateCcw size={14} /> 再分析する
              </button>
            )}
          </div>
        </div>
      )}

      {/* デバッグ：文字起こし全文 */}
      {fullTranscript && (
        <div className={styles.debugSection}>
          <button type="button" className={styles.debugToggle} onClick={() => setShowDebug(p => !p)}>
            {showDebug ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            文字起こし全文・デバッグ表示（{fullTranscript.length}文字）
          </button>
          {showDebug && (
            <pre className={styles.debugText}>{fullTranscript}</pre>
          )}
        </div>
      )}

      <div className={styles.hint}>
        録音は2分ごとにバックグラウンドで文字起こしされます。60分のセッションも問題ありません。
        画面を閉じずに録音を続けてください。
      </div>
    </div>
  );
}
