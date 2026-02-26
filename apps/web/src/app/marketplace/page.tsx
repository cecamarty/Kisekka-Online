"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMarketplaceListings } from "@kisekka/firebase";
import { formatPrice, timeAgo } from "@kisekka/utils";
import { PART_CATEGORIES } from "@kisekka/types";
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

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="bottom-nav__item" onClick={() => router.push("/")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </button>
        <button className="bottom-nav__item bottom-nav__item--active" onClick={() => router.push("/marketplace")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
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
