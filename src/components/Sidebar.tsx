"use client";

import styles from "./Sidebar.module.css";
import { Users, CreditCard, Settings, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ plans, activePlan, onSelectPlan }: { plans: string[], activePlan: string, onSelectPlan: (plan: string) => void }) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.logo}>Gym CRM</div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>メインメニュー</div>
          <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}>
            <Users size={18} /> <span>すべての顧客</span>
          </Link>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>プラン別表示</div>
          <button 
            onClick={() => onSelectPlan("すべて")}
            className={`${styles.navItem} ${activePlan === "すべて" ? styles.active : ""}`}
          >
            <div className={styles.dot} style={{ backgroundColor: '#94a3b8' }} />
            <span>すべて</span>
          </button>
          {plans.map(plan => (
            <button 
              key={plan}
              onClick={() => onSelectPlan(plan)}
              className={`${styles.navItem} ${activePlan === plan ? styles.active : ""}`}
            >
              <ChevronRight size={14} className={styles.chevron} />
              <span>{plan}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>T</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>Trainer Name</div>
            <div className={styles.userRole}>管理者</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
