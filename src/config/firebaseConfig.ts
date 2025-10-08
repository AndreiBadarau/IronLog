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
  apiKey: "AIzaSyCnkyOnzSp1JGzlmF7-7LPOba_oMiyGlRk",
  authDomain: "ironlog-fbac6.firebaseapp.com",
  databaseURL: "https://ironlog-fbac6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ironlog-fbac6",
  storageBucket: "ironlog-fbac6.firebasestorage.app",
  messagingSenderId: "392332696453",
  appId: "1:392332696453:web:1e0ff7d357543aa71d42ec",
  measurementId: "G-T67F5WDCSX"
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

