"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  getFeedPost, 
  getResponsesForPost, 
  createResponse, 
  getUser,
  trackWhatsAppTap,
  createNotification
} from "@kisekka/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { timeAgo, formatPrice, buildWhatsAppLink, buildResponseWhatsAppMessage } from "@kisekka/utils";
import styles from "./PostDetail.module.css";
import type { FeedPost, PostResponse, User } from "@kisekka/types";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: postId } = use(params);
  const { user, firebaseUser, loading: authLoading } = useAuth();

  const [post, setPost] = useState<FeedPost | null>(null);
  const [responses, setResponses] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyPrice, setReplyPrice] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [author, setAuthor] = useState<User | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const postData = await getFeedPost(postId);
        if (!postData) {
          router.push("/");
          return;
        }
        setPost(postData);

        const [responsesData, authorData] = await Promise.all([
          getResponsesForPost(postId),
          getUser(postData.authorId)
        ]);

        setResponses(responsesData);
        setAuthor(authorData);
      } catch (error) {
        console.error("Error fetching post data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [postId, router]);

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !user || !post) {
      router.push("/login");
      return;
    }

    if (!replyText) return;

    setSendingReply(true);
    try {
      const respId = await createResponse({
        postId: post.id,
        postType: "feed",
        responderId: firebaseUser.uid,
        shopId: user.shopId || undefined,
        message: replyText,
        price: replyPrice ? parseInt(replyPrice) : undefined,
      });

      // Create local notification for the author (in V2 this would be Cloud Functions)
      if (post.authorId !== firebaseUser.uid) {
        await createNotification({
          userId: post.authorId,
          type: "response",
          title: "New Response",
          body: `${user.displayName} responded to your request for ${post.partName}`,
          referenceId: post.id,
          referenceType: "feed",
        });
      }

      // Success
      setReplyText("");
      setReplyPrice("");
      
      // Refresh responses
      const updatedResponses = await getResponsesForPost(postId);
      setResponses(updatedResponses);
      
      // Update post locally
      setPost({ ...post, responseCount: post.responseCount + 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleWhatsAppContact = async (response: PostResponse) => {
     // We need the responder phone number, but responses don't store it for privacy
     // So we'd usually fetch the responder user object.
     // For V1, we'll assume we can get it or use the shop details.
     try {
       const responderUser = await getUser(response.responderId);
       if (!responderUser) return;

       await trackWhatsAppTap(response.id);
       
       const message = buildResponseWhatsAppMessage({
         partName: post?.partName || "part",
         carModel: post?.carModel,
         responderName: responderUser.displayName
       });

       const link = buildWhatsAppLink(responderUser.whatsappNumber, message);
       window.open(link, "_blank");
     } catch (err) {
       console.error(err);
     }
  };

  if (loading) return <div className="text-center p-8"><span className="spinner" /></div>;
  if (!post) return null;

  return (
    <div className={styles.container}>
      <header className="header">
        <button onClick={() => router.back()} className="btn btn--icon btn--ghost">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className="header__logo">Post Detail</div>
        <div style={{ width: 40 }} />
      </header>

      <div className={styles.content}>
        <div className={styles.meta}>
          <div className="avatar avatar--md avatar--placeholder">
            {author?.displayName?.[0] || post.partName[0]}
          </div>
          <div className={styles.authorInfo}>
            <div className={styles.authorName}>{author?.displayName || "Mechanic"}</div>
            <div className={styles.dateZone}>
              {post.locationZone} · {timeAgo(post.createdAt)}
            </div>
          </div>
          {post.urgent && <span className="badge badge--urgent">🔥 Urgent</span>}
        </div>

        <h1 className={styles.title}>{post.partName}</h1>
        <div className={styles.carModel}>{post.carModel} {post.year}</div>
        
        <p className={styles.description}>{post.description}</p>

        {post.images && post.images.length > 0 && (
          <div className={styles.imageGrid}>
             {post.images.map((img, i) => (
               <img key={i} src={img} alt={post.partName} />
             ))}
          </div>
        )}
      </div>

      <section className={styles.responsesSection}>
        <h2 className={styles.responsesTitle}>
          Responses ({post.responseCount})
        </h2>

        {responses.length === 0 ? (
          <div className="text-center p-8 color-text-tertiary">
            No responses yet.
          </div>
        ) : (
          responses.map((resp) => (
            <div key={resp.id} className={styles.responseCard}>
              <div className={styles.responseHeader}>
                 <div className="avatar avatar--sm avatar--placeholder">
                   {resp.message[0]}
                 </div>
                 <div className={styles.responderName}>Shop Owner</div>
                 <span className={styles.responseTime}>{timeAgo(resp.createdAt)}</span>
              </div>
              
              {resp.price && (
                <div className={styles.responsePrice}>{formatPrice(resp.price)}</div>
              )}
              
              <p className={styles.responseMessage}>{resp.message}</p>
              
              {/* Only the buyer/author sees the WhatsApp button */}
              {post.authorId === firebaseUser?.uid && (
                <div className={styles.responseActions}>
                  <button 
                    className="btn btn--whatsapp btn--sm"
                    onClick={() => handleWhatsAppContact(resp)}
                  >
                    Chat on WhatsApp
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {/* Reply form for Shop Owners / Others */}
      {firebaseUser && post.authorId !== firebaseUser.uid && (
        <form className={styles.respondForm} onSubmit={handleSendResponse}>
          <div className={styles.respondInputWrapper}>
             <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input 
                  type="number"
                  placeholder="Price (optional)"
                  className="form-input form-input--sm"
                  style={{ width: '140px' }}
                  value={replyPrice}
                  onChange={(e) => setReplyPrice(e.target.value)}
                />
             </div>
             <input 
                type="text"
                placeholder="Type your response..."
                className={styles.respondInput}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                required
             />
          </div>
          <button 
            type="submit" 
            className={styles.sendBtn}
            disabled={sendingReply || !replyText}
          >
            {sendingReply ? <span className="spinner" style={{ borderColor: 'white' }} /> : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
