import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Authentication
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

// Required by AuthContext
export const appleProvider = new OAuthProvider("apple.com");

// Firestore
export const db = getFirestore(app);

// Firebase Cloud Messaging
export const messaging = isSupported().then((supported) => {
  if (!supported) {
    console.warn("Firebase Cloud Messaging is not supported in this browser.");
    return null;
  }

  return getMessaging(app);
});

// Local Emulator Support
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  const host =
      import.meta.env.VITE_FIREBASE_EMULATOR_HOST || "127.0.0.1";

  const firestorePort = Number(
      import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080
  );

  const authPort = Number(
      import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT || 9099
  );

  try {
    connectFirestoreEmulator(db, host, firestorePort);
    connectAuthEmulator(auth, `http://${host}:${authPort}`);

    console.log("Firebase Emulator Connected");
  } catch (err) {
    console.warn("Emulator already connected.");
  }
}

export default app;