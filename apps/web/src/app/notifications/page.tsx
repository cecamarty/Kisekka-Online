"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getNotifications, markNotificationRead } from "@kisekka/firebase";
import { timeAgo } from "@kisekka/utils";
import type { Notification } from "@kisekka/types";

export default function NotificationsPage() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
      return;
    }

    async function fetchNotifications() {
      if (!firebaseUser) return;
      try {
        const data = await getNotifications(firebaseUser.uid);
        setNotifications(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [firebaseUser, authLoading, router]);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }
    
    if (notif.referenceType === "feed") {
      router.push(`/post/${notif.referenceId}`);
    } else if (notif.referenceType === "marketplace") {
      router.push(`/listing/${notif.referenceId}`);
    }
  };

  if (authLoading) return <div className="text-center p-8"><span className="spinner" /></div>;

  return (
    <div style={{ paddingBottom: 80 }}>
      <header className="header">
        <button onClick={() => router.back()} className="btn btn--icon btn--ghost">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className="header__logo">Alerts</div>
        <div style={{ width: 40 }} />
      </header>

      <main className="main-content">
        {loading ? (
          <div className="text-center p-8"><span className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🔔</div>
            <h3 className="empty-state__title">No alerts yet</h3>
            <p className="empty-state__description">You will get notified when someone responds to your posts or likes your items.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`notification-item ${notif.read ? '' : 'notification-item--unread'}`}
              onClick={() => handleNotificationClick(notif)}
              style={{
                padding: '16px',
                borderBottom: '1px solid var(--color-border-light)',
                backgroundColor: notif.read ? 'transparent' : 'var(--color-primary-subtle)',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{notif.title}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '2px' }}>{notif.body}</div>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: '12px', marginTop: '4px' }}>{timeAgo(notif.createdAt)}</div>
            </div>
          ))
        )}
      </main>

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
        <button className="bottom-nav__item bottom-nav__item--active" onClick={() => router.push("/notifications")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Alerts
        </button>
        <button className="bottom-nav__item" onClick={() => router.push("/profile")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </button>
      </nav>
    </div>
  );
}
