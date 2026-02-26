"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getShop, getMarketplaceListings } from "@kisekka/firebase";
import { formatPrice, timeAgo } from "@kisekka/utils";
import styles from "../marketplace/marketplace.module.css";
import profileStyles from "../profile/Profile.module.css";
import type { Shop, MarketplaceListing } from "@kisekka/types";

export default function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: shopId } = use(params);
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const shopData = await getShop(shopId);
        if (!shopData) {
          router.push("/marketplace");
          return;
        }
        setShop(shopData);

        // Fetch this shop's specific listings (we need to add a filter for shopId or sellerId)
        // For now we'll fetch all and filter client-side, or use the sellerId
        const allListings = await getMarketplaceListings(); 
        const shopListings = allListings.filter(l => l.shopId === shopId);
        setListings(shopListings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [shopId, router]);

  if (loading) return <div className="text-center p-8"><span className="spinner" /></div>;
  if (!shop) return null;

  return (
    <div className={styles.page}>
      <header className="header">
        <button onClick={() => router.back()} className="btn btn--icon btn--ghost">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className="header__logo">{shop.name}</div>
        <div style={{ width: 40 }} />
      </header>

      <div className={profileStyles.profileHeader} style={{ textAlign: 'left', alignItems: 'flex-start' }}>
         <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
            <div className="avatar avatar--xl avatar--placeholder" style={{ borderRadius: '16px' }}>
              {shop.avatarUrl ? <img src={shop.avatarUrl} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : shop.name[0]}
            </div>
            <div style={{ flex: 1 }}>
               <h1 className={profileStyles.displayName}>{shop.name}</h1>
               <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '14px' }}>Zone {shop.zone}</div>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                  {shop.categories.slice(0, 3).map(c => (
                    <span key={c} className="badge badge--zone" style={{ fontSize: '10px' }}>{c}</span>
                  ))}
               </div>
            </div>
         </div>
         <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>{shop.description}</p>
         
         <button 
           className="btn btn--whatsapp btn--full mt-6"
           onClick={() => window.open(`https://wa.me/${shop.whatsappNumber}`, "_blank")}
         >
           Contact Shop
         </button>
      </div>

      <main className="main-content">
        <h2 style={{ padding: '16px', fontSize: '18px', fontWeight: 'bold' }}>Shop Items ({listings.length})</h2>
        {listings.length === 0 ? (
          <div className="text-center p-12 color-text-tertiary">
            This shop has no listings yet.
          </div>
        ) : (
          <div className={styles.listingGrid}>
            {listings.map((listing) => (
              <div 
                key={listing.id} 
                className={styles.listingCard}
                onClick={() => router.push(`/listing/${listing.id}`)}
              >
                <div className={styles.listingImage}>
                  {listing.images && listing.images[0] ? (
                    <img src={listing.images[0]} alt={listing.title} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>📷</div>
                  )}
                </div>
                <div className={styles.listingInfo}>
                  <div className={styles.listingPrice}>{formatPrice(listing.price)}</div>
                  <div className={styles.listingTitle}>{listing.title}</div>
                  <div className={styles.listingMeta}>
                    <span>{timeAgo(listing.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
