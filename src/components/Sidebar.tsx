"use client";

import styles from "./Sidebar.module.css";
import { LayoutDashboard, Users, UserPlus, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.logoContainer}>
          <img src="/images/logo.png" alt="BodyCareGym CONNECT" className={styles.topLogo} />
          <div className={styles.logoText}>BodyCareGym CONNECT</div>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>メインメニュー</div>
          <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}>
            <LayoutDashboard size={18} /> <span>ダッシュボード</span>
          </Link>
          <Link href="/dashboard/customers" className={`${styles.navItem} ${pathname === '/dashboard/customers' ? styles.active : ''}`}>
            <Users size={18} /> <span>顧客一覧</span>
          </Link>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>アクション</div>
          <Link href="/register" target="_blank" className={styles.navItem}>
            <UserPlus size={18} /> <span>新規登録URLを開く</span>
          </Link>
        </div>
      </nav>

      <div className={styles.footer}>
        <button onClick={() => signOut()} className={styles.logoutBtn}>
          <LogOut size={16} /> ログアウト
        </button>
      </div>
    </aside>
  );
}
