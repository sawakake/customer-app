"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface GenerateReportButtonProps {
  customerId: string;
  type?: "Session" | "Monthly";
}

export default function GenerateReportButton({ customerId, type = "Monthly" }: GenerateReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/customers/${customerId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("レポートの生成に失敗しました");
      }
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleGenerate} 
      className="btn btn-primary btn-sm" 
      disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
    >
      {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
      {loading ? "作成中..." : type === "Monthly" ? "今月のレポートを作成" : "AIレポートを生成"}
    </button>
  );
}
