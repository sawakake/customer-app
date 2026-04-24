"use client";

import { useState, useEffect } from "react";
import { X, Copy, QrCode } from "lucide-react";
import styles from "./ShareFormModal.module.css";

export default function ShareFormModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!isOpen) return null;

  const regUrl = `${origin}/register`;

  const handleCopy = () => {
    navigator.clipboard.writeText(regUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.content}>
          <div className={styles.header}>
            <QrCode size={32} color="var(--primary)" />
            <h2>お客様への共有</h2>
            <p>カウンセリングシートのURLとQRコードです</p>
          </div>

          <div className={styles.qrSection}>
            {origin && (
              <div className={styles.qrWrapper}>
                <img 
                  src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(regUrl)}&choe=UTF-8`} 
                  alt="QR Code"
                  className={styles.qrImage}
                />
              </div>
            )}
            <span className={styles.qrHint}>スマホのカメラで読み取ってください</span>
          </div>

          <div className={styles.urlSection}>
            <label>コピー用URL</label>
            <div className={styles.urlInputGroup}>
              <input type="text" readOnly value={regUrl} />
              <button 
                onClick={handleCopy} 
                className={`btn ${copied ? styles.btnCopied : "btn-primary"}`}
              >
                {copied ? "完了！" : <Copy size={18} />}
              </button>
            </div>
            {copied && <p className={styles.copySuccess}>クリップボードにコピーしました</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
