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
import styles from "../create/create.module.css";
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
    if (!category || !zone) {
      setError("Please select category and location.");
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
    <div style={{ padding: '16px' }}>
      <header className="section-header">
        <button onClick={() => router.back()} className="btn btn--icon btn--ghost">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Sell an Item</h1>
        <div style={{ width: 40 }} />
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Item Title</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Original Toyota Bumper"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Price (UGX)</label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g. 150000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Condition</label>
          <div style={{ display: 'flex', gap: '8px' }}>
             {["used", "new", "refurbished"].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`btn btn--sm ${condition === c ? "btn--primary" : "btn--outline"}`}
                  style={{ flex: 1, textTransform: 'capitalize' }}
                  onClick={() => setCondition(c as ListingCondition)}
                >
                  {c}
                </button>
             ))}
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
          <label className="form-label">Car Models It Fits (optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Fits Toyota IST 2002-2007"
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input form-textarea"
            placeholder="Mention any defects, warranty, or details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Photos (up to 5)</label>
          <div className={styles.imageUploadGrid}>
            {previews.map((src, i) => (
              <div key={i} className={styles.imageSlot}>
                <img src={src} alt="Preview" />
                <button type="button" className={styles.removeImage} onClick={() => removeImage(i)}>×</button>
              </div>
            ))}
            {previews.length < 5 && (
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

        <div className="form-group">
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
          style={{ marginBottom: '40px', marginTop: '20px' }}
          disabled={loading || !title || !price || !zone || !category}
        >
          {loading ? <span className="spinner" /> : "Post Listing"}
        </button>
      </form>
    </div>
  );
}
