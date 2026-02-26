"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  createFeedPost, 
  uploadImage, 
  generateImagePath 
} from "@kisekka/firebase";
import { compressImage } from "@kisekka/utils";
import { useAuth } from "@/contexts/AuthContext";
import { LOCATION_ZONES, PART_CATEGORIES } from "@kisekka/types";
import styles from "./create.module.css";
import type { LocationZone, PartCategory } from "@kisekka/types";

export default function CreatePostPage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [partName, setPartName] = useState("");
  const [carModel, setCarModel] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [zone, setZone] = useState<LocationZone | "">("");
  const [category, setCategory] = useState<PartCategory | "">("");
  const [urgent, setUrgent] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    if (images.length + files.length > 4) {
      setError("Maximum 4 images allowed.");
      return;
    }
    
    setImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    setError("");
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid = partName.trim() && carModel.trim() && zone && category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !user) return;
    if (!zone || !category) {
      setError("Please select both a zone and a category.");
      return;
    }

    setLoading(true);
    setError("");
    setUploadProgress(0);

    try {
      const uploadedImageUrls: string[] = [];
      const total = images.length;
      
      // Upload images sequentially for progress tracking
      for (let i = 0; i < total; i++) {
        const compressed = await compressImage(images[i]);
        const path = generateImagePath("posts", firebaseUser.uid, images[i].name);
        const url = await uploadImage(compressed, path);
        uploadedImageUrls.push(url);
        setUploadProgress(Math.round(((i + 1) / total) * 80));
      }

      setUploadProgress(90);

      await createFeedPost({
        type: "request",
        authorId: firebaseUser.uid,
        partName: partName.trim(),
        carModel: carModel.trim(),
        year: year.trim(),
        description: description.trim(),
        images: uploadedImageUrls,
        urgent,
        locationZone: zone as LocationZone,
        category: category as PartCategory,
        marketId: "kisekka",
      });

      setUploadProgress(100);

      // Small delay so user sees 100%
      setTimeout(() => router.push("/"), 300);
    } catch (err: any) {
      console.error(err);
      setError("Failed to create post. Please try again.");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="text-center p-8"><span className="spinner" /></div>;

  return (
    <div className={styles.page}>
      {/* ─── Header ────────────────────────── */}
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn} aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>New Request</h1>
        <button 
          type="submit" 
          form="create-form"
          className={styles.shareBtn}
          disabled={loading || !isFormValid}
        >
          {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : "Share"}
        </button>
      </header>

      {/* ─── Upload Progress ──────────────── */}
      {loading && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {/* ─── Form ─────────────────────────── */}
      <form id="create-form" className={styles.form} onSubmit={handleSubmit}>
        
        {/* Photos Section */}
        <div className={styles.photoSection}>
          <div className={styles.photoGrid}>
            {previews.map((src, i) => (
              <div key={i} className={styles.photoSlot}>
                <img src={src} alt={`Preview ${i + 1}`} />
                <button type="button" className={styles.photoRemove} onClick={() => removeImage(i)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            {previews.length < 4 && (
              <button type="button" className={styles.photoAdd} onClick={() => fileInputRef.current?.click()}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span>Add Photo</span>
              </button>
            )}
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            hidden 
            multiple 
            onChange={handleImageChange}
            disabled={loading} 
          />
        </div>

        {/* Part Name */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>What part do you need?</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Side Mirror, Gearbox, Radiator..."
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
            required
            disabled={loading}
            autoFocus
          />
        </div>

        {/* Car Model + Year */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Vehicle</label>
          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.input}
              style={{ flex: 2 }}
              placeholder="e.g. Toyota Prado TX"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="text"
              className={styles.input}
              style={{ flex: 1, maxWidth: 90 }}
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={loading}
              inputMode="numeric"
              maxLength={4}
            />
          </div>
        </div>

        {/* Category Chips */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Category</label>
          <div className={styles.chipGrid}>
            {PART_CATEGORIES.map(c => (
              <button 
                key={c} 
                type="button"
                className={`${styles.chip} ${category === c ? styles.chipActive : ""}`}
                onClick={() => setCategory(c)}
                disabled={loading}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            Details <span className={styles.labelHint}>(optional)</span>
          </label>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            placeholder="Color, side (left/right), OEM vs aftermarket..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
          />
        </div>

        {/* Zone */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Your Zone</label>
          <div className={styles.chipGrid}>
            {LOCATION_ZONES.map(z => (
              <button 
                key={z} 
                type="button"
                className={`${styles.chip} ${zone === z ? styles.chipActive : ""}`}
                onClick={() => setZone(z)}
                disabled={loading}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* Urgent Toggle */}
        <div className={styles.urgentRow} onClick={() => !loading && setUrgent(!urgent)}>
          <div className={styles.urgentLeft}>
            <span className={styles.urgentIcon}>🔥</span>
            <div>
              <div className={styles.urgentTitle}>Urgent Request</div>
              <div className={styles.urgentSub}>Shop owners see this first</div>
            </div>
          </div>
          <div className={`${styles.toggle} ${urgent ? styles.toggleOn : ""}`}>
            <div className={styles.toggleKnob} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.error}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
