"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./TrainerHeader.module.css";
import { Activity, Users, Settings } from "lucide-react";

export default function TrainerHeader() {
  const pathname = usePathname();
  
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Activity className={styles.logoIcon} />
          <span>Gym CRM</span>
        </div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navLink} ${pathname.includes("/dashboard") || pathname === "/" ? styles.active : ""}`}>
            <Users size={18} />
            <span>顧客リスト</span>
          </Link>
          <button className={styles.navLink}>
            <Settings size={18} />
            <span>設定</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
