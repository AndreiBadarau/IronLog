// /src/config/firebaseConfig.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { Firestore, initializeFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_ID || process.env.FIREBASE_MESSAGING_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID
};

declare global {
   
  var __FIREBASE_APP__: FirebaseApp | undefined;
   
  var __FIRESTORE__: Firestore | undefined;
   
  var __FIREBASE_AUTH__: Auth | undefined;

  var __FIREBASE_STORAGE__: FirebaseStorage | undefined;
}

// App (create once)
export const app: FirebaseApp =
  globalThis.__FIREBASE_APP__ ?? (getApps().length ? getApp() : initializeApp(firebaseConfig));
if (!globalThis.__FIREBASE_APP__) globalThis.__FIREBASE_APP__ = app;

// Firestore (Expo/RN-friendly transport)
export const db: Firestore =
  globalThis.__FIRESTORE__ ??
  initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true, // keep forced for reliability
  });
if (!globalThis.__FIRESTORE__) globalThis.__FIRESTORE__ = db;

export const storage: FirebaseStorage =
  globalThis.__FIREBASE_STORAGE__ ?? getStorage(app);
if (!globalThis.__FIREBASE_STORAGE__) globalThis.__FIREBASE_STORAGE__ = storage;

// Auth (persist to AsyncStorage on native; normal getAuth on web)
let _auth: Auth;
if (globalThis.__FIREBASE_AUTH__) {
  _auth = globalThis.__FIREBASE_AUTH__;
} else {
  _auth =
    Platform.OS === "web"
      ? getAuth(app)
      : initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
  globalThis.__FIREBASE_AUTH__ = _auth;
}
export const auth = _auth;

