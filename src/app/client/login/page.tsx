"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { Lock, Mail, Phone, ChevronRight } from "lucide-react";

export default function ClientLoginPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password: phone, // 電話番号をパスワードとして使用
        redirect: false,
      });

      if (result?.error) {
        setError("メールアドレスまたは電話番号が正しくありません。");
      } else {
        router.push("/client/dashboard");
      }
    } catch (err) {
      setError("エラーが発生しました。");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <img src="/images/gym-logo.png" alt="Logo" className={styles.logo} />
          <h1>BodyCareGymCONNECT</h1>
          <p className={styles.subtitle}>メンバー専用マイページ</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label><Mail size={16} /> 登録メールアドレス (ID)</label>
            <input 
              required 
              type="email" 
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
            />
          </div>

          <div className={styles.inputGroup}>
            <label><Phone size={16} /> 登録電話番号 (パスワード)</label>
            <input 
              required 
              type="tel" 
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09000000000"
            />
            <p className={styles.hint}>※ハイフンなしで入力してください</p>
          </div>

          <button type="submit" disabled={isLoggingIn} className={styles.loginBtn}>
            {isLoggingIn ? "認証中..." : "マイページにログイン"}
            {!isLoggingIn && <ChevronRight size={20} />}
          </button>
        </form>

        <div className={styles.footer}>
          <p>ログインできない場合は、店舗スタッフまでお問い合わせください。</p>
        </div>
      </div>
    </div>
  );
}
