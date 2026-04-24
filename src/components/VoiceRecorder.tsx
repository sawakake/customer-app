"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2, Wand2 } from "lucide-react";
import styles from "./VoiceRecorder.module.css";

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
  const [status, setStatus] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus("録音中...");
    } catch (err) {
      console.error("録音の開始に失敗しました:", err);
      alert("マイクの使用を許可してください。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setStatus("音声を処理中...");
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setStatus("文字起こし中...");

    try {
      // 1. Transcribe
      const formData = new FormData();
      formData.append("audio", blob, "session.wav");

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const contentType = transcribeRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("サーバーからエラー（HTML）が返されました。OpenAI APIキーが正しく設定されているか確認してください。");
      }

      const transcribeData = await transcribeRes.json();
      if (transcribeData.error) throw new Error(transcribeData.error);
      const text = transcribeData.text;

      // 2. Analyze
      setStatus("AIで内容を分析・自動入力中...");
      const analyzeRes = await fetch("/api/analyze-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const analyzeContentType = analyzeRes.headers.get("content-type");
      if (!analyzeContentType || !analyzeContentType.includes("application/json")) {
        throw new Error("分析中にサーバーエラーが発生しました。");
      }

      const analysisData = await analyzeRes.json();
      if (analysisData.error) throw new Error(analysisData.error);

      onAnalysisComplete(analysisData);
      setStatus("分析完了！");
    } catch (err: any) {
      console.error("処理失敗:", err);
      alert(`処理に失敗しました: ${err.message}`);
      setStatus("エラーが発生しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.recorderContainer}>
      <div className={styles.visualizer}>
        {isRecording ? (
          <div className={styles.pulseContainer}>
            <div className={styles.pulse}></div>
            <Mic className={styles.recordingIcon} />
          </div>
        ) : isProcessing ? (
          <Loader2 className={`${styles.icon} ${styles.spin}`} />
        ) : (
          <Mic className={styles.icon} />
        )}
      </div>

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
      
      {status && <div className={styles.status}>{status}</div>}
      <div className={styles.hint}>
        セッション中の会話や、終了時の口頭まとめを録音すると AIが自動で記録を作成します。
      </div>
    </div>
  );
}
