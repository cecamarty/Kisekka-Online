"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@kisekka/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { LOCATION_ZONES } from "@kisekka/types";
import styles from "./onboarding.module.css";
import type { UserRole, LocationZone } from "@kisekka/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, firebaseUser, refreshUser, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [zone, setZone] = useState<LocationZone | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/login");
    } else if (!authLoading && user) {
      router.push("/");
    }
  }, [firebaseUser, user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!role || !zone) {
      setError("Please select both a role and a zone.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createUser(firebaseUser.uid, {
        displayName,
        phoneNumber: firebaseUser.phoneNumber || "",
        whatsappNumber: firebaseUser.phoneNumber || "",
        role: role as UserRole,
        locationZone: zone as LocationZone,
        avatarUrl: "", // Optional in V1
        marketId: "kisekka",
      });
      
      await refreshUser();
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="text-center p-8"><span className="spinner" /></div>;

  return (
    <div className={styles.container}>
      <header className={styles.intro}>
        <h1 className={styles.title}>Welcome to Kisekka</h1>
        <p className={styles.subtitle}>Let&apos;s set up your profile to get started.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name or Shop Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Hassan Auto Spares"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">I am a...</label>
          <div className={styles.roleSelector}>
            <div 
              className={`${styles.roleCard} ${role === "shop_owner" ? styles.roleCardActive : ""}`}
              onClick={() => setRole("shop_owner")}
            >
              <div className={styles.roleIcon}>🏪</div>
              <div className={styles.roleInfo}>
                <div className={styles.roleName}>Shop Owner</div>
                <div className={styles.roleDesc}>I sell spare parts in the market.</div>
              </div>
            </div>

            <div 
              className={`${styles.roleCard} ${role === "mechanic" ? styles.roleCardActive : ""}`}
              onClick={() => setRole("mechanic")}
            >
              <div className={styles.roleIcon}>🔧</div>
              <div className={styles.roleInfo}>
                <div className={styles.roleName}>Mechanic</div>
                <div className={styles.roleDesc}>I look for parts for my customers.</div>
              </div>
            </div>

            <div 
              className={`${styles.roleCard} ${role === "buyer" ? styles.roleCardActive : ""}`}
              onClick={() => setRole("buyer")}
            >
              <div className={styles.roleIcon}>👤</div>
              <div className={styles.roleInfo}>
                <div className={styles.roleName}>Buyer</div>
                <div className={styles.roleDesc}>I am looking for parts for my car.</div>
              </div>
            </div>
          </div>
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
            <option value="" disabled>Select your zone</option>
            {LOCATION_ZONES.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <p className="form-hint">Where are you usually located in Kisekka?</p>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button 
          type="submit" 
          className="btn btn--primary btn--full btn--lg"
          disabled={loading || !displayName || !role || !zone}
        >
          {loading ? <span className="spinner" /> : "Complete Profile"}
        </button>
      </form>
    </div>
  );
}
