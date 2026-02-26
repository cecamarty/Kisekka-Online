"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFeedPosts, toggleInterested, getUser } from "@kisekka/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { timeAgo } from "@kisekka/utils";
import BottomNav from "@/components/BottomNav";
import styles from "./page.module.css";
import type { FeedPost, User } from "@kisekka/types";
import { DocumentSnapshot } from "firebase/firestore";

export default function HomePage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading, unreadCount } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorMap, setAuthorMap] = useState<Record<string, User>>({});
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  async function fetchAuthors(postsData: FeedPost[]) {
     const authorIds = Array.from(new Set(postsData.map(p => p.authorId)));
     const newAuthors: Record<string, User> = {};

     // Only fetch authors we don't have yet
     const toFetch = authorIds.filter(id => !authorMap[id]);

     if (toFetch.length === 0) return;

     await Promise.all(toFetch.map(async (id) => {
       const author = await getUser(id);
       if (author) {
         newAuthors[id] = author;
       }
     }));

     setAuthorMap(prev => ({ ...prev, ...newAuthors }));
  }

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { posts: data, lastDoc: last } = await getFeedPosts();
        setPosts(data);
        setLastDoc(last);
        await fetchAuthors(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const handleLoadMore = async () => {
      if (!lastDoc || loadingMore) return;
      setLoadingMore(true);
      try {
          const { posts: newPosts, lastDoc: newLast } = await getFeedPosts(20, lastDoc);
          setPosts(prev => [...prev, ...newPosts]);
          setLastDoc(newLast);
          await fetchAuthors(newPosts);
      } catch (error) {
          console.error("Error loading more posts:", error);
      } finally {
          setLoadingMore(false);
      }
  };

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

  // Mock stories data
  const mockStories = [
    { id: '1', username: 'wako_parts', unviewed: true, avatar: null },
    { id: '2', username: 'kisekka_auto', unviewed: true, avatar: null },
    { id: '3', username: 'japan_motors', unviewed: false, avatar: null },
    { id: '4', username: 'lubowa_spares', unviewed: false, avatar: null },
    { id: '5', username: 'city_tyres', unviewed: false, avatar: null },
  ];

  return (
    <div className={styles.page}>
      {/* ─── Header ────────────────────────────────────── */}
      <header className="header" style={{ position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex' }}>
          <button className={styles["icon-btn"]} onClick={handleCreatePost} aria-label="Create Post">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>
        
        <div className="header__logo">Kisekka</div>
        
        <div className="header__actions" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button className={styles["icon-btn"]} aria-label="Notifications" onClick={() => router.push("/notifications")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {unreadCount > 0 && <span className={styles["icon-btn__badge"]} />}
          </button>
        </div>
      </header>

      {/* ─── Stories ───────────────────────────────────── */}
      <div className={styles.storiesContainer}>
        {/* Current User Story Add */}
        <div className={styles.storyItem} onClick={handleCreatePost}>
          <div className={styles.storyAvatarWrapper}>
            <div className={styles.storyAvatarInner}>
              {user?.displayName?.[0] || "?"}
            </div>
            <div className={styles.storyAddIcon}>
               <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 12, height: 12 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
          <span className={styles.storyUsername}>Your story</span>
        </div>
        
        {/* Mock Stories */}
        {mockStories.map(story => (
          <div key={story.id} className={styles.storyItem}>
            <div className={`${styles.storyAvatarWrapper} ${story.unviewed ? styles.storyUnviewed : ''}`}>
              <div className={styles.storyAvatarInner}>
                {story.avatar ? (
                  <img src={story.avatar} alt={story.username} />
                ) : (
                  story.username[0].toUpperCase()
                )}
              </div>
            </div>
            <span className={styles.storyUsername}>{story.username}</span>
          </div>
        ))}
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
          <>
            {posts.map((post) => (
              <article key={post.id} className="post-card">
                <div className="post-card__header">
                  <div className="post-card__avatar avatar avatar--placeholder">
                    {authorMap[post.authorId]?.avatarUrl ? (
                      <img src={authorMap[post.authorId].avatarUrl} alt="" />
                    ) : (
                      authorMap[post.authorId]?.displayName?.[0] || "?"
                    )}
                  </div>
                  <div className="post-card__meta">
                    <div className="post-card__author">
                      {post.authorId === firebaseUser?.uid
                        ? "You"
                        : (authorMap[post.authorId]?.displayName || "Unknown User")}
                    </div>
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
            ))}

            {lastDoc && (
              <div className="text-center p-4">
                <button 
                  className="btn btn--outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? <span className="spinner spinner--sm" /> : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav active="home" />
    </div>
  );
}
