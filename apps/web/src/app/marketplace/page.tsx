"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMarketplaceListings } from "@kisekka/firebase";
import { formatPrice, timeAgo } from "@kisekka/utils";
import { PART_CATEGORIES } from "@kisekka/types";
import BottomNav from "@/components/BottomNav";
import styles from "./marketplace.module.css";
import type { MarketplaceListing, PartCategory } from "@kisekka/types";

export default function MarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PartCategory | "All">("All");

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const filters = selectedCategory === "All" ? undefined : { category: selectedCategory as PartCategory };
        const data = await getMarketplaceListings(filters);
        setListings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, [selectedCategory]);

  return (
    <div className={styles.page}>
      <header className="header">
        <div className="header__logo">Marketplace</div>
        <div className="header__actions">
           <button className="btn btn--primary btn--sm" onClick={() => router.push("/marketplace/create")}>
             Sell Item
           </button>
        </div>
      </header>

      {/* Category Nav */}
      <div className={styles.categoryNav}>
        <button 
          className={`${styles.categoryNavItem} ${selectedCategory === "All" ? styles.categoryNavItemActive : ""}`}
          onClick={() => setSelectedCategory("All")}
        >
          All
        </button>
        {PART_CATEGORIES.map(cat => (
          <button 
            key={cat}
            className={`${styles.categoryNavItem} ${selectedCategory === cat ? styles.categoryNavItemActive : ""}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <main className="main-content">
        {loading ? (
          <div className="text-center p-8"><span className="spinner" /></div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🛒</div>
            <h3 className="empty-state__title">No items for sale yet</h3>
            <p className="empty-state__description">
              {selectedCategory === "All" 
                ? "Be the first to list a part for sale." 
                : `No items found in ${selectedCategory}.`}
            </p>
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
                    <span>{listing.locationZone}</span>
                    <span>{timeAgo(listing.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav active="market" />
    </div>
  );
}
