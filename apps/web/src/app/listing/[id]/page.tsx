"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  getMarketplaceListing, 
  getUser, 
  getShop,
  trackWhatsAppTap 
} from "@kisekka/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  formatPrice, 
  timeAgo, 
  buildWhatsAppLink 
} from "@kisekka/utils";
import styles from "../../post/[id]/PostDetail.module.css";
import type { MarketplaceListing, User, Shop } from "@kisekka/types";

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: listingId } = use(params);
  const { user, firebaseUser, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const listingData = await getMarketplaceListing(listingId);
        if (!listingData) {
          router.push("/marketplace");
          return;
        }
        setListing(listingData);

        const [sellerData, shopData] = await Promise.all([
          getUser(listingData.sellerId),
          listingData.shopId ? getShop(listingData.shopId) : Promise.resolve(null)
        ]);

        setSeller(sellerData);
        setShop(shopData);
      } catch (error) {
        console.error("Error fetching listing data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [listingId, router]);

  const handleWhatsAppContact = async () => {
    if (!listing || !seller) return;
    
    // Track activity
    // await trackWhatsAppTap(listing.id); // Listing engagement tracking

    const message = encodeURIComponent(
      `Hi ${shop ? shop.name : seller.displayName}, I saw your listing for "${listing.title}" (${formatPrice(listing.price)}) on Kisekka Online. Is it still available?`
    );
    
    const whatsappNum = shop ? shop.whatsappNumber : seller.whatsappNumber;
    window.open(`https://wa.me/${whatsappNum}?text=${message}`, "_blank");
  };

  if (loading) return <div className="text-center p-8"><span className="spinner" /></div>;
  if (!listing) return null;

  return (
    <div style={{ paddingBottom: '100px' }}>
      <header className="header">
        <button onClick={() => router.back()} className="btn btn--icon btn--ghost">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className="header__logo">Listing Detail</div>
        <div style={{ width: 40 }} />
      </header>

      <div style={{ padding: '16px' }}>
        <div className={styles.imageGrid} style={{ borderRadius: '12px' }}>
           {listing.images.map((img, i) => (
             <img key={i} src={img} alt={listing.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
           ))}
        </div>

        <div style={{ marginTop: '20px' }}>
           <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
             {formatPrice(listing.price)}
           </div>
           <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{listing.title}</h1>
           
           <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <span className="badge badge--zone">{listing.locationZone}</span>
              <span className="badge badge--active">{listing.condition}</span>
              <span className="badge badge--zone">{listing.category}</span>
           </div>

           <div style={{ marginTop: '24px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
             {listing.description}
           </div>

           <div style={{ 
             marginTop: '32px', 
             padding: '16px', 
             background: 'var(--color-bg-secondary)', 
             borderRadius: '12px',
             display: 'flex',
             alignItems: 'center',
             gap: '12px'
           }}>
              <div className="avatar avatar--md avatar--placeholder">
                {shop?.name?.[0] || seller?.displayName?.[0] || "?"}
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{shop?.name || seller?.displayName}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                  Active {timeAgo(listing.createdAt)}
                </div>
              </div>
              <button 
                className="btn btn--outline btn--sm" 
                style={{ marginLeft: 'auto' }}
                onClick={() => shop && router.push(`/shop/${shop.id}`)}
              >
                View Shop
              </button>
           </div>
        </div>
      </div>

      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: '100%', 
        maxWidth: '600px', 
        background: 'white', 
        padding: '16px', 
        borderTop: '1px solid var(--color-border-light)',
        display: 'flex',
        gap: '12px',
        zIndex: 100
      }}>
        <button 
          className="btn btn--whatsapp btn--full btn--lg"
          onClick={handleWhatsAppContact}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8 }}>
             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
             <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.504 3.935 1.389 5.61L0 24l6.597-1.351A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.87 0-3.632-.5-5.15-1.384l-.37-.218-3.82.782.818-3.727-.24-.382A9.792 9.792 0 0 1 2.18 12C2.18 6.58 6.58 2.18 12 2.18S21.82 6.58 21.82 12 17.42 21.82 12 21.82z" />
          </svg>
          Contact Seller
        </button>
      </div>
    </div>
  );
}
