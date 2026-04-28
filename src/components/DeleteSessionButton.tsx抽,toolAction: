"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

interface Props {
  sessionId: string;
  onDeleted: () => void;
}

export default function DeleteSessionButton({ sessionId, onDeleted }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("このセッション記録を削除してもよろしいですか？\n※この操作は取り消せません。回数管理にも影響します。")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted();
      } else {
        alert("削除に失敗しました");
      }
    } catch (err) {
      alert("エラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      style={{
        background: 'none',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        padding: '0.5rem',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s'
      }}
      title="削除"
    >
      {isDeleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
    </button>
  );
}
