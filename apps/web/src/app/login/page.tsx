"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setupRecaptcha, sendOTP, verifyOTP } from "@kisekka/firebase";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./login.module.css";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, firebaseUser } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // If user is already logged in and has a profile, redirect to home
    if (firebaseUser && user) {
      router.push("/");
    } else if (firebaseUser && !user) {
      // If logged in but no profile, go to onboarding
      router.push("/onboarding");
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [firebaseUser, user, router]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = setupRecaptcha("recaptcha-container");
        // Explicitly render to ensure it's ready
        await recaptchaVerifierRef.current.render();
      }

      const fullNumber = phoneNumber.startsWith("+") 
        ? phoneNumber 
        : `+256${phoneNumber.replace(/^0/, "")}`;
        
      const result = await sendOTP(fullNumber, recaptchaVerifierRef.current);
      confirmationResultRef.current = result;
      setStep("otp");
    } catch (err: any) {
      console.error("Firebase Auth Error:", err.code, err.message);
      
      let friendlyMessage = "Failed to send OTP. Please try again.";
      if (err.code === "auth/invalid-phone-number") friendlyMessage = "The phone number is invalid.";
      if (err.code === "auth/too-many-requests") friendlyMessage = "Too many attempts. Please try again later.";
      if (err.code === "auth/invalid-app-credential") {
        friendlyMessage = "Auth setup error. Please ensure localhost is whitelisted in Firebase Console.";
      }

      setError(friendlyMessage);
      
      // Reset recaptcha on failure
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!confirmationResultRef.current) throw new Error("No confirmation result");
      await verifyOTP(confirmationResultRef.current, otp);
      // AuthProvider will detect the change and useEffect will handle the redirect
    } catch (err: any) {
      console.error(err);
      setError("Invalid code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Kisekka Online</h1>
        <p className={styles.subtitle}>
          The fastest way to find spare parts in Kampala.
        </p>
      </div>

      {step === "phone" ? (
        <form className={styles.form} onSubmit={handleSendOTP}>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div className={styles.phoneInputWrapper}>
              <span className={styles.countryCode}>+256</span>
              <input
                type="tel"
                placeholder="772 123 456"
                className="form-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <p className="form-hint">Enter your MTN or Airtel number.</p>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading || !phoneNumber}
          >
            {loading ? <span className="spinner" /> : "Continue"}
          </button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={handleVerifyOTP}>
          <div className="form-group">
            <label className="form-label">Enter 6-digit Code</label>
            <input
              type="text"
              placeholder="000000"
              className={`form-input ${styles.otpInput}`}
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
            <p className="form-hint">We sent a SMS code to +256 {phoneNumber.replace(/^0/, "")}</p>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading || otp.length !== 6}
          >
            {loading ? <span className="spinner" /> : "Verify & Sign In"}
          </button>

          <button
            type="button"
            className="btn btn--ghost btn--full"
            onClick={() => setStep("phone")}
            disabled={loading}
          >
            Change Phone Number
          </button>
        </form>
      )}

      {/* Keep container always in DOM to avoid Re-rendering issues */}
      <div id="recaptcha-container"></div>

      <footer className={styles.footer}>
        By continuing, you verify that you are in Kisekka Market or looking for parts there.
      </footer>
    </div>
  );
}
