import { FirebaseApp, initializeApp } from '@react-native-firebase/app';

// If you used the Firebase Console + google-services files correctly,
// @react-native-firebase/app auto-configures from native resources.
// You usually don't need to pass JS config here.
let app: FirebaseApp | null = null;

export function getFirebaseApp() {
  if (!app) {
    // Calling initializeApp() with no args uses native-configured options
    // from google-services files you added.
    // @ts-ignore
    app = initializeApp();
  }
  {}
  return app;
}
