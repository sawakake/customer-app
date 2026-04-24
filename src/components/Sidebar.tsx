"use client";

import { useState } from "react";
import styles from "./Sidebar.module.css";
import { LayoutDashboard, Users, UserPlus, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* モバイル用ヘッダー */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileLogo}>BodyCareGymCONNECT</div>
        <button onClick={toggleMenu} className={styles.menuToggle}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* オーバーレイ（スマホのみ） */}
      {isOpen && <div className={styles.overlay} onClick={closeMenu}></div>}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.top}>
          <div className={styles.logoContainer}>
            <img src="/images/gym-logo.png" alt="BodyCareGymCONNECT" className={styles.topLogo} />
            <div className={styles.logoText}>BodyCareGymCONNECT</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>メインメニュー</div>
            <Link 
              href="/dashboard" 
              className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}
              onClick={closeMenu}
            >
              <LayoutDashboard size={18} /> <span>ダッシュボード</span>
            </Link>
            <Link 
              href="/dashboard/customers" 
              className={`${styles.navItem} ${pathname === '/dashboard/customers' ? styles.active : ''}`}
              onClick={closeMenu}
            >
              <Users size={18} /> <span>顧客一覧</span>
            </Link>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>アクション</div>
            <Link href="/register" target="_blank" className={styles.navItem} onClick={closeMenu}>
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
    </>
  );
}
