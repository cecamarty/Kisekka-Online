"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./Profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { user, firebaseUser, signOut, loading: authLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (authLoading) return <div className="text-center p-8"><span className="spinner" /></div>;
  if (!firebaseUser) {
    router.push("/login");
    return null;
  }

  return (
    <div className={styles.container}>
      <header className="header">
        <div className="header__logo">My Profile</div>
      </header>

      <div className={styles.profileHeader}>
        <div className="avatar avatar--xl avatar--placeholder">
          {user?.displayName?.[0] || "?"}
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.displayName}>{user?.displayName}</h1>
          <p className={styles.phone}>{firebaseUser.phoneNumber}</p>
          <div className={styles.stats}>
             <div className={styles.statItem}>
                <span className={styles.statValue}>{user?.role?.replace('_', ' ')}</span>
                <span className={styles.statLabel}>Role</span>
             </div>
             <div className={styles.statItem}>
                <span className={styles.statValue}>{user?.locationZone}</span>
                <span className={styles.statLabel}>Zone</span>
             </div>
          </div>
        </div>
      </div>

      <div className={styles.menu}>
        <button className={styles.menuItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Profile
        </button>
        <button className={styles.menuItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          My Posts
        </button>
        <button className={`${styles.menuItem} ${styles.signOut}`} onClick={handleSignOut}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
      
      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="bottom-nav__item" onClick={() => router.push("/")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </button>
        <button className="bottom-nav__item" onClick={() => router.push("/marketplace")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          Market
        </button>
        <button className="bottom-nav__item" onClick={() => router.push("/notifications")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Alerts
        </button>
        <button className="bottom-nav__item bottom-nav__item--active" onClick={() => router.push("/profile")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </button>
      </nav>
    </div>
  );
}
