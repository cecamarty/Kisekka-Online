"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
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
          {user?.avatarUrl ? (
             <img src={user.avatarUrl} alt={user.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
             user?.displayName?.[0] || "?"
          )}
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

          {user?.role === "shop_owner" && (
            <button 
              className="btn btn--outline btn--sm mt-6"
              onClick={() => router.push("/shop/setup")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              {user.shopId ? "Manage My Shop" : "Setup My Shop"}
            </button>
          )}
        </div>
      </div>

      <div className={styles.menu}>
        <button className={styles.menuItem} onClick={() => router.push("/profile/edit")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Profile
        </button>
        <button className={styles.menuItem} onClick={() => router.push("/profile/posts")}>
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
      
      <BottomNav active="profile" />
    </div>
  );
}
