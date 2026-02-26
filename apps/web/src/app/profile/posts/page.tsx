"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFeedPosts, updateFeedPost } from "@kisekka/firebase";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./posts.module.css";
import type { FeedPost } from "@kisekka/types";

export default function MyPostsPage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
    } else if (firebaseUser) {
      async function fetchMyPosts(userId: string) {
        try {
          const data = await getUserFeedPosts(userId);
          setPosts(data);
        } catch (error) {
          console.error("Error fetching my posts:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchMyPosts(firebaseUser.uid);
    }
  }, [firebaseUser, authLoading, router]);

  const handleResolve = async (postId: string) => {
    try {
      await updateFeedPost(postId, { status: "resolved" });
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, status: "resolved" } : p
      ));
    } catch (err) {
      console.error("Error resolving post:", err);
    }
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case "active": return styles.statusActive;
      case "resolved": return styles.statusResolved;
      case "expired": return styles.statusExpired;
      default: return "";
    }
  };

  if (authLoading) return <div className="text-center p-8"><span className="spinner" /></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className={styles.title}>My Requests</h1>
      </header>

      <div className={styles.postList}>
        {loading ? (
          <div className="text-center p-8"><span className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You haven't posted any requests yet.</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={`${styles.statusBadge} ${getStatusClass(post.status)}`}>
                  {post.status}
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : ''}
                </span>
              </div>

              <div className={styles.cardBody} onClick={() => router.push(`/post/${post.id}`)}>
                <div className={styles.partName}>{post.partName}</div>
                <div className={styles.carModel}>{post.carModel} {post.year}</div>

                {post.images && post.images.length > 0 && (
                  <div className={`${styles.images} ${post.images.length > 1 ? styles.imagesMulti : ''}`}>
                    {post.images.slice(0, 2).map((img, i) => (
                      <img key={i} src={img} alt="" />
                    ))}
                  </div>
                )}
              </div>

              {post.status === "active" && (
                <div className={styles.cardActions}>
                  <button
                    className={styles.resolveBtn}
                    onClick={() => handleResolve(post.id)}
                  >
                    Mark as Found
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
