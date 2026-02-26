"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateUser, uploadImage, generateImagePath } from "@kisekka/firebase";
import { compressImage } from "@kisekka/utils";
import { useAuth } from "@/contexts/AuthContext";
import { LOCATION_ZONES } from "@kisekka/types";
import styles from "./edit.module.css";
import type { LocationZone } from "@kisekka/types";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, firebaseUser, refreshUser, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [zone, setZone] = useState<LocationZone | "">("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
    } else if (user) {
      setDisplayName(user.displayName || "");
      setWhatsappNumber(user.whatsappNumber || "");
      setZone(user.locationZone || "");
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [firebaseUser, user, authLoading, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !zone) return;

    setLoading(true);
    try {
      let avatarUrl = user?.avatarUrl;

      if (avatarFile) {
        const compressed = await compressImage(avatarFile);
        const path = generateImagePath("avatars", firebaseUser.uid, "profile.jpg");
        avatarUrl = await uploadImage(compressed, path);
      }

      await updateUser(firebaseUser.uid, {
        displayName,
        whatsappNumber,
        locationZone: zone as LocationZone,
        avatarUrl,
      });

      await refreshUser();
      router.push("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="text-center p-8"><span className="spinner" /></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className={styles.title}>Edit Profile</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" />
            ) : (
              displayName?.[0] || "?"
            )}
          </div>
          <label className={styles.changePhotoBtn}>
            Change Photo
            <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          </label>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Display Name</label>
          <input
            type="text"
            className={styles.input}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>WhatsApp Number</label>
          <input
            type="tel"
            className={styles.input}
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+256..."
            required
          />
        </div>

        <div className={styles.formGroup}>
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

        <button type="submit" className={styles.saveBtn} disabled={loading}>
          {loading ? <span className="spinner" /> : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
