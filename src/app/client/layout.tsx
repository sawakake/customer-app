"use client";

import styles from "./layout.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, PlusSquare, BookOpen, User, LogOut } from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ログインページでは非表示
  if (pathname === "/client/login") {
    return <>{children}</>;
  }

  const navItems = [
    { label: "ホーム", icon: Home, href: "/client/dashboard" },
    { label: "記録", icon: PlusSquare, href: "/client/log/new" },
    { label: "履歴", icon: History, href: "/client/log/history" },
    { label: "レポート", icon: BookOpen, href: "/client/dashboard#reports" }, // とりあえずダッシュボード内へのスクロール
  ];

  return (
    <div className={styles.layout}>
      {/* PC専用サイドバー（画面が広い時） */}
      <aside className={styles.desktopSidebar}>
        <div className={styles.sidebarHeader}>
          <img src="/images/gym-logo.png" alt="Logo" className={styles.logo} />
          <span className={styles.brandName}>CONNECT</span>
        </div>
        <nav className={styles.desktopNav}>
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ""}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <Link href="/api/auth/signout" className={styles.sidebarLogout}>
          <LogOut size={18} />
          <span>ログアウト</span>
        </Link>
      </aside>

      {/* メインコンテンツエリア */}
      <div className={styles.contentWrapper}>
        <main className={styles.main}>
          {children}
        </main>
      </div>

      {/* スマホ専用ボトムナビゲーション */}
      <nav className={styles.bottomNav}>
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`${styles.bottomNavItem} ${pathname === item.href ? styles.bottomNavActive : ""}`}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
