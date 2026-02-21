"use client";

import React, { useState, useEffect } from "react";
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
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !user) return;
    if (!zone || !category) {
      setError("Please select both a zone and a category.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const uploadedImageUrls: string[] = [];
      
      // Upload images in parallel
      await Promise.all(images.map(async (file) => {
        const compressed = await compressImage(file);
        const path = generateImagePath("posts", firebaseUser.uid, file.name);
        const url = await uploadImage(compressed, path);
        uploadedImageUrls.push(url);
      }));

      await createFeedPost({
        type: "request",
        authorId: firebaseUser.uid,
        partName,
        carModel,
        year,
        description,
        images: uploadedImageUrls,
        urgent,
        locationZone: zone as LocationZone,
        category: category as PartCategory,
        marketId: "kisekka",
      });

      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="text-center p-8"><span className="spinner" /></div>;

  return (
    <div className={styles.container}>
      <header className="section-header">
        <button onClick={() => router.back()} className="btn btn--icon btn--ghost">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className={styles.title}>Post a Request</h1>
        <div style={{ width: 40 }} />
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">What are you looking for?</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Side Mirror, Gearbox, etc."
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Car Model & Year</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 2 }}
              placeholder="e.g. Toyota Prado TX"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="2015"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select 
            className="form-input form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as PartCategory)}
            required
            disabled={loading}
          >
            <option value="" disabled>Select category</option>
            {PART_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <textarea
            className="form-input form-textarea"
            placeholder="Mention color, side (left/right), or any specifics..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Photos (up to 4)</label>
          <div className={styles.imageUploadGrid}>
            {previews.map((src, i) => (
              <div key={i} className={styles.imageSlot}>
                <img src={src} alt="Preview" />
                <button type="button" className={styles.removeImage} onClick={() => removeImage(i)}>×</button>
              </div>
            ))}
            {previews.length < 4 && (
              <label className={styles.imageSlot}>
                <input 
                  type="file" 
                  accept="image/*" 
                  hidden 
                  multiple 
                  onChange={handleImageChange}
                  disabled={loading} 
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </label>
            )}
          </div>
        </div>

        <div className={styles.urgentToggle}>
          <span>Mark as Urgent? 🔥</span>
          <div 
            className={`${styles.toggle} ${urgent ? styles.toggleActive : ""}`}
            onClick={() => setUrgent(!urgent)}
          >
            <div className={`${styles.toggleCircle} ${urgent ? styles.toggleCircleActive : ""}`} />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '24px' }}>
          <label className="form-label">Your Location</label>
          <select 
            className="form-input form-select"
            value={zone}
            onChange={(e) => setZone(e.target.value as LocationZone)}
            required
            disabled={loading}
          >
             <option value="" disabled>Select zone</option>
            {LOCATION_ZONES.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button 
          type="submit" 
          className="btn btn--primary btn--full btn--lg"
          style={{ marginBottom: '80px' }}
          disabled={loading || !partName || !carModel || !zone || !category}
        >
          {loading ? <span className="spinner" /> : "Post Request"}
        </button>
      </form>
    </div>
  );
}
