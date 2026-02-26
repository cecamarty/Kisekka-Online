"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface BottomNavProps {
  active: "home" | "search" | "create" | "market" | "profile" | "none";
}

export default function BottomNav({ active }: BottomNavProps) {
  const router = useRouter();
  const { user, firebaseUser } = useAuth();

  const handleCreatePost = () => {
    if (!firebaseUser) {
      router.push("/login");
    } else if (!user) {
      router.push("/onboarding");
    } else {
      router.push("/create");
    }
  };

  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav__item ${active === "home" ? "bottom-nav__item--active" : ""}`}
        onClick={() => router.push("/")}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill={active === "home" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          {active === "home" ? (
             <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="none" />
          ) : (
             <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          )}
        </svg>
      </button>

      <button
        className={`bottom-nav__item ${active === "search" ? "bottom-nav__item--active" : ""}`}
        onClick={() => router.push("/search")}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill={active === "search" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      <button
        className={`bottom-nav__item ${active === "create" ? "bottom-nav__item--active" : ""}`}
        onClick={handleCreatePost}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </button>

      <button
        className={`bottom-nav__item ${active === "market" ? "bottom-nav__item--active" : ""}`}
        onClick={() => router.push("/marketplace")}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill={active === "market" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
           {active === "market" ? (
               <>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="none" />
                <path d="M16 10a4 4 0 0 1-8 0" stroke="white" strokeWidth="2" />
               </>
           ) : (
               <>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
               </>
           )}
        </svg>
      </button>

      <button
        className={`bottom-nav__item ${active === "profile" ? "bottom-nav__item--active" : ""}`}
        onClick={() => router.push("/profile")}
      >
        <div className="avatar avatar--sm avatar--placeholder" style={{ width: 26, height: 26, fontSize: 12, border: active === "profile" ? "2px solid black" : "none" }}>
            {user?.displayName?.[0] || "?"}
        </div>
      </button>
    </nav>
  );
}
