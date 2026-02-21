"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFeedPosts, toggleInterested } from "@kisekka/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { timeAgo } from "@kisekka/utils";
import styles from "./page.module.css";
import type { FeedPost } from "@kisekka/types";

export default function HomePage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await getFeedPosts();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const handleCreatePost = () => {
    if (!firebaseUser) {
      router.push("/login");
    } else if (!user) {
      router.push("/onboarding");
    } else {
      router.push("/create");
    }
  };

  const handleToggleInterested = async (postId: string) => {
    if (!firebaseUser) {
      router.push("/login");
      return;
    }
    
    try {
      await toggleInterested(postId);
      // Optimistic update
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, interestedCount: p.interestedCount + 1 } : p
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const openWhatsApp = (phoneNumber: string, post: FeedPost) => {
    const message = encodeURIComponent(
      `Hi, I saw your post about "${post.partName}" for ${post.carModel} on Kisekka Online. Is it still available?`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className={styles.page}>
      {/* ─── Header ────────────────────────────────────── */}
      <header className="header">
        <div className="header__logo">Kisekka Online</div>
        <div className="header__actions">
          <button className={styles["icon-btn"]} aria-label="Search">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button className={styles["icon-btn"]} aria-label="Notifications" onClick={() => router.push("/notifications")}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className={styles["icon-btn__badge"]} />
          </button>
          
          {firebaseUser ? (
             <button 
              className={styles["icon-btn"]} 
              onClick={() => router.push("/profile")}
              aria-label="Profile"
            >
              <div className="avatar avatar--sm avatar--placeholder">
                {user?.displayName?.[0] || "?"}
              </div>
            </button>
          ) : (
            <button className="btn btn--primary btn--sm" onClick={() => router.push("/login")}>
              Login
            </button>
          )}
        </div>
      </header>

      {/* ─── Feed Tabs ─────────────────────────────────── */}
      <div className={styles["feed-tabs"]}>
        <button className={`${styles["feed-tab"]} ${styles["feed-tab--active"]}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Feed
        </button>
        <button className={styles["feed-tab"]} onClick={() => router.push("/marketplace")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          Market
        </button>
      </div>

      {/* ─── Feed Content ──────────────────────────────── */}
      <main className={`main-content ${styles.feed}`}>
        {loading ? (
          <div className="text-center p-8"><span className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🔍</div>
            <h3 className="empty-state__title">No requests yet</h3>
            <p className="empty-state__description">Be the first to post a part request in Kisekka Market.</p>
            <button className="btn btn--primary mt-4" onClick={handleCreatePost}>Post a Request</button>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="post-card">
              <div className="post-card__header">
                <div className="post-card__avatar avatar avatar--placeholder">
                  {post.urgent ? "🔥" : post.partName[0]}
                </div>
                <div className="post-card__meta">
                  <div className="post-card__author">{post.authorId === firebaseUser?.uid ? "You" : "Mechanic"}</div>
                  <div className="post-card__location-time">
                    <span className="badge badge--zone">{post.locationZone}</span>
                    <span>·</span>
                    <span>{timeAgo(post.createdAt)}</span>
                    {post.urgent && (
                      <span className="badge badge--urgent">🔥 Urgent</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="post-card__body" onClick={() => router.push(`/post/${post.id}`)}>
                <div className="post-card__part-name">{post.partName}</div>
                <div className="post-card__car-model">{post.carModel} {post.year}</div>
                <p className="post-card__description">{post.description}</p>
                
                {post.images && post.images.length > 0 && (
                  <div className={`post-card__images ${post.images.length === 1 ? 'post-card__images--single' : 'post-card__images--multi'}`}>
                    {post.images.slice(0, 4).map((img, i) => (
                      <img key={i} src={img} alt={post.partName} />
                    ))}
                  </div>
                )}
              </div>

              <div className="post-card__response-count">
                {post.responseCount} responses · {post.interestedCount} interested
              </div>

              <div className="post-card__actions">
                <button 
                  className="post-card__action-btn post-card__action-btn--interested"
                  onClick={() => handleToggleInterested(post.id)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  Interested
                </button>
                <button className="post-card__action-btn" onClick={() => router.push(`/post/${post.id}`)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Respond
                </button>
              </div>
            </article>
          ))
        )}
      </main>

      {/* ─── FAB ───────────────────────────────────────── */}
      <button className="fab" aria-label="Create post" onClick={handleCreatePost}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* ─── Bottom Navigation ─────────────────────────── */}
      <nav className="bottom-nav">
        <button className="bottom-nav__item bottom-nav__item--active" onClick={() => router.push("/")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
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
          <span className="bottom-nav__badge" />
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
