"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Video, Plus, Trash2 } from "lucide-react";

export default function VideoManagementPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", url: "", description: "", category: "トレーニング" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVideos = async () => {
    const res = await fetch("/api/videos");
    if (res.ok) {
      const data = await res.json();
      setVideos(data);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setForm({ title: "", url: "", description: "", category: "トレーニング" });
        fetchVideos();
      } else {
        alert("追加に失敗しました");
      }
    } catch {
      alert("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchVideos();
      }
    } catch {
      alert("エラーが発生しました");
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', textDecoration: 'none' }}>
          <ArrowLeft size={18} /> ダッシュボードに戻る
        </Link>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.5rem', color: 'var(--foreground)' }}>
          <Video size={24} color="var(--primary)" /> おすすめ動画リスト管理
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#333' }}>新規動画を登録</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>動画タイトル</label>
            <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>YouTube URL</label>
            <input required type="url" value={form.url} onChange={e => setForm({...form, url: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>カテゴリ</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}>
              <option value="トレーニング">トレーニング</option>
              <option value="ストレッチ">ストレッチ</option>
              <option value="有酸素">有酸素</option>
              <option value="食事・栄養">食事・栄養</option>
            </select>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>説明（任意）</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }}></textarea>
          </div>
          <button type="submit" disabled={isSubmitting} style={{ background: 'var(--primary)', color: '#fff', width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> 登録する
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {videos.length === 0 ? (
             <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', textAlign: 'center', color: '#666' }}>動画が登録されていません</div>
          ) : videos.map(video => (
            <div key={video.id} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div>
                <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', background: '#fef2f2', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{video.category}</span>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                  <a href={video.url} target="_blank" rel="noreferrer" style={{ color: 'var(--foreground)', textDecoration: 'none' }}>{video.title}</a>
                </h3>
                {video.description && <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{video.description}</p>}
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#aaa' }}>{video.url}</p>
              </div>
              <button onClick={() => handleDelete(video.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
