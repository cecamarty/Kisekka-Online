"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  createMarketplaceListing, 
  uploadImage, 
  generateImagePath 
} from "@kisekka/firebase";
import { compressImage } from "@kisekka/utils";
import { useAuth } from "@/contexts/AuthContext";
import { LOCATION_ZONES, PART_CATEGORIES } from "@kisekka/types";
import styles from "./create.module.css";
import type { LocationZone, PartCategory, ListingCondition } from "@kisekka/types";

export default function CreateListingPage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<ListingCondition>("used");
  const [category, setCategory] = useState<PartCategory | "">("");
  const [carModel, setCarModel] = useState("");
  const [description, setDescription] = useState("");
  const [zone, setZone] = useState<LocationZone | "">("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
    } else if (user) {
      setZone(user.locationZone);
    }
  }, [firebaseUser, user, authLoading, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      setError("Maximum 5 images allowed.");
      return;
    }
    
    // Create previews
    const newPreviews = files.map(file => window.URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!firebaseUser || !user) return;
    if (!title || !price || !category || !zone) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const uploadedImageUrls: string[] = [];
      
      await Promise.all(images.map(async (file) => {
        const compressed = await compressImage(file);
        const path = generateImagePath("listings", firebaseUser.uid, file.name);
        const url = await uploadImage(compressed, path);
        uploadedImageUrls.push(url);
      }));

      await createMarketplaceListing({
        sellerId: firebaseUser.uid,
        shopId: user.shopId,
        title,
        price: parseInt(price),
        currency: "UGX",
        condition,
        category: category as PartCategory,
        carModel,
        description,
        images: uploadedImageUrls,
        locationZone: zone as LocationZone,
        marketId: "kisekka",
      });

      router.push("/marketplace");
    } catch (err: any) {
      console.error(err);
      setError("Failed to create listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="text-center p-8"><span className="spinner" /></div>;

  return (
    <div className={styles.page}>
      {/* ─── Header ────────────────────────────────────── */}
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>New Listing</h1>
        <button
          className={styles.shareBtn}
          disabled={loading || !title || !price || !category || !zone}
          onClick={handleSubmit}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </header>

      {/* ─── Form ──────────────────────────────────────── */}
      <div className={styles.form}>

        {/* Photo Upload */}
        <div className={styles.photoSection}>
          <div className={styles.photoGrid}>
            {previews.map((src, i) => (
              <div key={i} className={styles.photoSlot}>
                <img src={src} alt="Preview" />
                <button
                  type="button"
                  className={styles.photoRemove}
                  onClick={() => removeImage(i)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}

            {previews.length < 5 && (
              <label className={styles.photoAdd}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageChange}
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>Add Photos</span>
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Title</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Original Toyota Bumper"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Price */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Price (UGX)</label>
          <input
            type="number"
            className={styles.input}
            placeholder="e.g. 150000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        {/* Condition Chips */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Condition</label>
          <div className={styles.chipGrid}>
            {(["new", "used", "refurbished"] as const).map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.chip} ${condition === c ? styles.chipActive : ""}`}
                onClick={() => setCondition(c)}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Category Chips */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Category</label>
          <div className={styles.chipGrid}>
            {PART_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.chip} ${category === cat ? styles.chipActive : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Car Model */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            Fits Car Model <span className={styles.labelHint}>(Optional)</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Toyota IST 2002-2007"
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Description</label>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            placeholder="Mention any defects, details, etc..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Location Zone Chips */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Location Zone</label>
          <div className={styles.chipGrid}>
            {LOCATION_ZONES.map((z) => (
              <button
                key={z}
                type="button"
                className={`${styles.chip} ${zone === z ? styles.chipActive : ""}`}
                onClick={() => setZone(z)}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}
