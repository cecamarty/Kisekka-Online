"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthChange,
  getUser,
  signOut as firebaseSignOut,
  getUnreadNotificationCount
} from "@kisekka/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "@kisekka/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  unreadCount: number;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUser = async () => {
    if (firebaseUser) {
      const userData = await getUser(firebaseUser.uid);
      setUser(userData);
      await refreshNotifications();
    } else {
      setUser(null);
      setUnreadCount(0);
    }
  };

  const refreshNotifications = async () => {
    if (firebaseUser) {
      try {
        const count = await getUnreadNotificationCount(firebaseUser.uid);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const userData = await getUser(fUser.uid);
        setUser(userData);
        try {
          const count = await getUnreadNotificationCount(fUser.uid);
          setUnreadCount(count);
        } catch (error) {
          console.error(error);
        }
      } else {
        setUser(null);
        setUnreadCount(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut();
    setFirebaseUser(null);
    setUser(null);
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        unreadCount,
        refreshUser,
        refreshNotifications,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
