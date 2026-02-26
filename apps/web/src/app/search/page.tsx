"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getFeedPosts,
  getMarketplaceListings,
  getAllShops,
} from "@kisekka/firebase";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import type { FeedPost, MarketplaceListing, Shop, User } from "@kisekka/types";
import styles from "./search.module.css";

export default function SearchPage() {
  const router = useRouter();
  const { user, firebaseUser } = useAuth();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

  const [filteredPosts, setFilteredPosts] = useState<FeedPost[]>([]);
  const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);

  const [loading, setLoading] = useState(true);

  // Initial data fetch
  useEffect(() => {
    async function fetchData() {
      try {
        const [postsData, listingsData, shopsData] = await Promise.all([
          getFeedPosts(100), // Fetch more to filter client-side
          getMarketplaceListings(undefined, 100),
          getAllShops(100),
        ]);

        setPosts(postsData.posts); // Adjusted because getFeedPosts now returns { posts, lastDoc }
        setListings(listingsData);
        setShops(shopsData);
      } catch (error) {
        console.error("Error fetching search data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Debounce query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Filter logic
  useEffect(() => {
    if (!debouncedQuery) {
      setFilteredPosts([]);
      setFilteredListings([]);
      setFilteredShops([]);
      return;
    }

    const lowerQuery = debouncedQuery.toLowerCase();

    const fPosts = posts.filter(p =>
      p.partName.toLowerCase().includes(lowerQuery) ||
      p.carModel.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    const fListings = listings.filter(l =>
      l.title.toLowerCase().includes(lowerQuery) ||
      l.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    const fShops = shops.filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    setFilteredPosts(fPosts);
    setFilteredListings(fListings);
    setFilteredShops(fShops);

  }, [debouncedQuery, posts, listings, shops]);

  const handleCreatePost = () => {
    if (!firebaseUser) {
      router.push("/login");
    } else if (!user) {
      router.push("/onboarding");
    } else {
      router.push("/create");
    }
  };

  const handleClear = () => {
      setQuery("");
      setDebouncedQuery("");
  };

  const recentSearches = ["Toyota Corolla", "Headlights", "Brake Pads", "Subaru", "Tyres"];

  return (
    <div className={styles.container}>
      {/* ─── Search Header ──────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.searchContainer}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            autoFocus
            type="text"
            className={styles.searchInput}
            placeholder="Search parts, shops..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className={styles.clearButton} onClick={handleClear}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ─── Results ───────────────────────────────────── */}
      <div className="content">
        {loading ? (
             <div className="text-center p-8"><span className="spinner" /></div>
        ) : !debouncedQuery ? (
          <div className={styles.emptyState}>
             <h3 className={styles.recentSearchesTitle}>Recent Searches</h3>
             <div className={styles.chipsContainer}>
                {recentSearches.map(s => (
                    <button key={s} className={styles.chip} onClick={() => setQuery(s)}>
                        {s}
                    </button>
                ))}
             </div>
          </div>
        ) : (
          <>
            {/* Requests Section */}
            {filteredPosts.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Requests</h3>
                  {/* <button className={styles.seeAll}>See all</button> */}
                </div>
                {filteredPosts.map(post => (
                  <div key={post.id} className={styles.resultItem} onClick={() => router.push(`/post/${post.id}`)}>
                    {post.images && post.images.length > 0 ? (
                        <img src={post.images[0]} alt="" className={styles.itemImage} />
                    ) : (
                        <div className={styles.itemPlaceholder}>{post.partName[0]}</div>
                    )}
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>{post.partName}</div>
                      <div className={styles.itemSubtitle}>{post.carModel} {post.year}</div>
                      <div className={styles.itemMeta}>{post.locationZone} · {post.responseCount} responses</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* For Sale Section */}
            {filteredListings.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>For Sale</h3>
                  {/* <button className={styles.seeAll}>See all</button> */}
                </div>
                {filteredListings.map(listing => (
                  <div key={listing.id} className={styles.resultItem} onClick={() => router.push(`/listing/${listing.id}`)}>
                     {listing.images && listing.images.length > 0 ? (
                        <img src={listing.images[0]} alt="" className={styles.itemImage} />
                    ) : (
                        <div className={styles.itemPlaceholder}>{listing.title[0]}</div>
                    )}
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>{listing.title}</div>
                      <div className={styles.itemSubtitle}>UGX {listing.price.toLocaleString()}</div>
                       <div className={styles.itemMeta}>{listing.condition} · {listing.locationZone}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Shops Section */}
            {filteredShops.length > 0 && (
              <div className={styles.section}>
                 <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Shops</h3>
                  {/* <button className={styles.seeAll}>See all</button> */}
                </div>
                {filteredShops.map(shop => (
                  <div key={shop.id} className={styles.resultItem} onClick={() => router.push(`/shop/${shop.id}`)}>
                     {shop.avatarUrl ? (
                        <img src={shop.avatarUrl} alt="" className={styles.itemImage} />
                    ) : (
                        <div className={styles.itemPlaceholder}>{shop.name[0]}</div>
                    )}
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>{shop.name}</div>
                      <div className={styles.itemSubtitle}>{shop.zone}</div>
                      <div className={styles.itemMeta}>{shop.categories.slice(0, 2).join(", ")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

             {filteredPosts.length === 0 && filteredListings.length === 0 && filteredShops.length === 0 && (
                 <div className="text-center p-8 text-gray-500">No results found for "{debouncedQuery}"</div>
             )}
          </>
        )}
      </div>

       {/* ─── Bottom Navigation ─────────────────────────── */}
       <BottomNav active="search" />
    </div>
  );
}
