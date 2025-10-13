// /src/providers/AuthProvider.tsx
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useRouter, useSegments } from "expo-router";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
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
  signInAsGuest: () => Promise<User | null>;
  signInWithGoogle: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<boolean>;
  logOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
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
  signInAsGuest: async () => {
    throw new Error("Auth not ready");
  },
  signInWithGoogle: async () => {
    throw new Error("Auth not ready");
  },
  resetPassword: async () => {
    throw new Error("Auth not ready");
  },
  logOut: async () => {
    throw new Error("Auth not ready");
  },
  reloadUser: async () => {
    throw new Error("Auth not ready");
  },
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [initialization, setInitialization] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "392332696453-23srgojfjs1stniomeu7ufsvii4vtl14.apps.googleusercontent.com",
    });
  }, []);

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

  async function signInAsGuest(): Promise<User | null> {
    try {
      const userCredential = await signInAnonymously(auth);
      return userCredential.user;
    } catch {
      return null;
    }
  }

  async function signInWithGoogle(): Promise<User | null> {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      
      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(auth, googleCredential);
      
      // Save user data to Firestore
      if (userCredential.user) {
        const { displayName, email, uid } = userCredential.user;
        await setDoc(doc(db, "users", uid), {
          displayName: displayName || "Google User",
          email: email || "",
          createdAt: serverTimestamp(),
        }, { merge: true });
      }
      
      return userCredential.user;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      return null;
    }
  }

  async function resetPassword(email: string): Promise<boolean> {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch {
      return false;
    }
  }

  async function logOut() {
    await signOut(auth);
  }

  async function reloadUser() {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
    }
  }

  const value = useMemo(
    () => ({ user, initialization, signUp, signIn, signInAsGuest, signInWithGoogle, resetPassword, logOut, reloadUser }),
    [user, initialization]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
