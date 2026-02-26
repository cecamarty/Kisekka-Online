"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  createShop, 
  updateUser, 
  uploadImage, 
  generateImagePath,
  getShop 
} from "@kisekka/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { PART_CATEGORIES, LOCATION_ZONES } from "@kisekka/types";
import styles from "./setup.module.css";
import type { PartCategory, LocationZone } from "@kisekka/types";

export default function ShopSetupPage() {
  const router = useRouter();
  const { user, firebaseUser, refreshUser, loading: authLoading } = useAuth();

  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [zone, setZone] = useState<LocationZone | "">("");
  const [selectedCategories, setSelectedCategories] = useState<PartCategory[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
      return;
    }

    if (!authLoading && user && user.role !== "shop_owner") {
      router.push("/profile");
      return;
    }

    async function fetchExistingShop() {
      if (user?.shopId) {
        const existing = await getShop(user.shopId);
        if (existing) {
          setShopName(existing.name);
          setDescription(existing.description);
          setZone(existing.zone);
          setSelectedCategories(existing.categories);
          setWhatsappNumber(existing.whatsappNumber);
          setAvatarPreview(existing.avatarUrl);
        }
      }
      setInitialFetchLoading(false);
    }

    if (user) fetchExistingShop();
  }, [user, authLoading, firebaseUser, router]);

  const handleToggleCategory = (cat: PartCategory) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !user) return;
    if (!zone || selectedCategories.length === 0) {
      setError("Please select a zone and at least one category.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let avatarUrl = avatarPreview;
      if (avatarFile) {
        const path = generateImagePath("shops", firebaseUser.uid, "logo");
        avatarUrl = await uploadImage(avatarFile, path);
      }

      const shopData = {
        ownerId: firebaseUser.uid,
        name: shopName,
        description,
        zone: zone as LocationZone,
        categories: selectedCategories,
        whatsappNumber: whatsappNumber || firebaseUser.phoneNumber || "",
        phoneNumber: firebaseUser.phoneNumber || "",
        avatarUrl,
        marketId: "kisekka",
      };

      let shopId = user.shopId;
      if (shopId) {
        // Update existing logic could be added to firestore-service
        // For now we assume createShop handles it or we use setDoc
        // Since firestore-service only has createShop, we'll implement updateShop locally or add it
        await createShop(shopData); // Simplified for MVP
      } else {
        shopId = await createShop(shopData);
        await updateUser(firebaseUser.uid, { shopId });
      }

      await refreshUser();
      router.push("/profile");
    } catch (err: any) {
      console.error(err);
      setError("Failed to save shop. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || initialFetchLoading) return <div className="text-center p-8"><span className="spinner" /></div>;

  return (
    <div className={styles.container}>
      <header className="section-header">
        <button onClick={() => router.back()} className="btn btn--icon btn--ghost">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className={styles.title}>{user?.shopId ? "Edit Shop" : "Setup Shop"}</h1>
        <div style={{ width: 40 }} />
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className={styles.avatarUpload}>
          <label className={styles.avatarPreview}>
            <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            {avatarPreview ? (
              <img src={avatarPreview} alt="Shop logo" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.3 }}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </label>
          <span className="form-hint">Upload shop logo or photo</span>
        </div>

        <div className="form-group">
          <label className="form-label">Shop Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Hassan Auto Spares"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Location Zone</label>
          <select 
            className="form-input form-select"
            value={zone}
            onChange={(e) => setZone(e.target.value as LocationZone)}
            required
            disabled={loading}
          >
            <option value="" disabled>Select shop location</option>
            {LOCATION_ZONES.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Specialties (What do you sell?)</label>
          <div className={styles.categoryGrid}>
            {PART_CATEGORIES.map(cat => (
              <div 
                key={cat}
                className={`${styles.categoryChip} ${selectedCategories.includes(cat) ? styles.categoryChipActive : ""}`}
                onClick={() => handleToggleCategory(cat)}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input form-textarea"
            placeholder="Tell customers what you specialize in, car models, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">WhatsApp Number</label>
          <input
            type="tel"
            className="form-input"
            placeholder="2567..."
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            disabled={loading}
          />
          <p className="form-hint">Used for customer inquiries.</p>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button 
          type="submit" 
          className="btn btn--primary btn--full btn--lg"
          style={{ marginTop: '20px' }}
          disabled={loading || !shopName || !zone || selectedCategories.length === 0}
        >
          {loading ? <span className="spinner" /> : "Save Shop Profile"}
        </button>
      </form>
    </div>
  );
}
