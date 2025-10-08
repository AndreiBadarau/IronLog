// /src/providers/AuthProvider.tsx
import { useRouter, useSegments } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth, db } from "../../src/config/firebaseConfig";

type Ctx = {
  user: User | null;
  initialization: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
  user: null,
  initialization: true,
  // placeholders (won't be called before provider mounts)
  signUp: async () => {
    throw new Error("Auth not ready");
  },
  signIn: async () => {
    throw new Error("Auth not ready");
  },
  logOut: async () => {
    throw new Error("Auth not ready");
  },
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [initialization, setInitialization] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Keep auth state in sync with firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitialization(false);
    });
    return () => unsub();
  }, []);

  // Redirect logic
  useEffect(() => {
    if (initialization) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(drawer)/workouts");
    }
  }, [user, initialization, segments, router]);

  async function signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<User | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      await setDoc(doc(db, "users", userCredential.user.uid), {
        displayName,
        email,
        createdAt: serverTimestamp(),
      });
      return userCredential.user;
    } catch {
      return null;
    }
  }

  async function signIn(email: string, password: string): Promise<User | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      return userCredential.user;
    } catch {
      return null;
    }
  }

  async function logOut() {
    await signOut(auth);
  }

  const value = useMemo(
    () => ({ user, initialization, signUp, signIn, logOut }),
    [user, initialization]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
