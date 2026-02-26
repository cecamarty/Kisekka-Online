"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getNotifications, markNotificationRead } from "@kisekka/firebase";
import { timeAgo } from "@kisekka/utils";
import BottomNav from "@/components/BottomNav";
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

       <BottomNav active="none" />
    </div>
  );
}
