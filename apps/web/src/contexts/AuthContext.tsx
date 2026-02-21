"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, getUser, signOut as firebaseSignOut } from "@kisekka/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "@kisekka/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (firebaseUser) {
      const userData = await getUser(firebaseUser.uid);
      setUser(userData);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const userData = await getUser(fUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut();
    setFirebaseUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        refreshUser,
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
