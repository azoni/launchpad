"use client";

import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, googleProvider } from "./firebase/client";

export type SignInResult = {
  user: User;
  accessToken: string | null;
};

export async function signInWithGoogle(): Promise<SignInResult> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  return { user: result.user, accessToken: credential?.accessToken ?? null };
}

export async function signOut() {
  return fbSignOut(auth);
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);
  return { user, loading };
}
