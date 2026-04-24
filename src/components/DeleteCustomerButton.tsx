"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteCustomerButton({ customerId, customerName }: { customerId: string, customerName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm(`【最終確認】\n顧客「${customerName}」様に関連するすべてのデータ（セッション記録、身体データ等）が完全に削除されます。\n本当に削除してよろしいですか？`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert("削除が完了しました。");
        router.push("/dashboard");
        router.refresh();
      } else {
        throw new Error("削除に失敗しました");
      }
    } catch (error) {
      alert("エラーが発生しました。削除を中断しました。");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      className="btn btn-secondary"
      style={{ 
        color: 'var(--destructive)',
        borderColor: 'var(--destructive)',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}
    >
      {isDeleting ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Trash2 size={18} />
      )}
      {isDeleting ? "削除中..." : "顧客を削除"}
    </button>
  );
}
