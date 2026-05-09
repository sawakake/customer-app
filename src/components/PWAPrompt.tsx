"use client";

import { useState, useEffect } from "react";
import { Share, MoreVertical, X } from "lucide-react";

export default function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // すでにアプリモード（スタンドアロン）で起動している場合は表示しない
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    // OSの判定
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // 永久非表示が設定されている場合は表示しない
    const dismissed = localStorage.getItem("pwa-prompt-dismissed-permanent");
    if (!dismissed) {
      setShowPrompt(true);
    }
  }, []);

  const handleClose = () => {
    setShowPrompt(false);
  };

  const handlePermanentClose = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed-permanent", "true");
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      padding: '16px',
      zIndex: 9999,
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      animation: 'slideUp 0.5s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: '#1e293b' }}>
          アプリとしてホーム画面に追加
        </h3>
        <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>
        この画面をアプリとして登録すると、次回からアイコンをタップするだけで一瞬で開けるようになります！
      </p>

      <div style={{
        background: '#f8fafc',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#334155',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {isIOS ? (
          <>
            <span>下の「共有ボタン」</span>
            <Share size={18} style={{ color: '#3b82f6' }} />
            <span>を押して、**「ホーム画面に追加」** を選択してください。</span>
          </>
        ) : (
          <>
            <span>右上のメニューボタン</span>
            <MoreVertical size={18} />
            <span>を押して、**「アプリをインストール」** または **「ホーム画面に追加」** を選択してください。</span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handlePermanentClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#94a3b8', 
            fontSize: '0.75rem', 
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          今後、この案内を表示しない
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
