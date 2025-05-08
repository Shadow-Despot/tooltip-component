
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
let analytics;

if (typeof window !== 'undefined') {
  // Enable Firestore offline persistence
  enableIndexedDbPersistence(db, { synchronizeTabs: true, cacheSizeBytes: CACHE_SIZE_UNLIMITED })
    .then(() => {
      console.log("Firestore offline persistence enabled with multi-tab synchronization.");
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // This can happen if multiple tabs are open.
        // The SDK will still work offline in the current tab,
        // but changes in other tabs might not be reflected immediately.
        console.warn("Firestore persistence failed (failed-precondition). This might be due to multiple tabs open. Offline capabilities might be limited to this tab.", err);
      } else if (err.code === 'unimplemented') {
        // The browser does not support all features required for persistence.
        console.warn("Firestore persistence failed (unimplemented). Your browser may not fully support offline capabilities.", err);
      } else {
        console.error("An unexpected error occurred while enabling Firestore persistence:", err);
      }
    });

  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}


export { app, auth, db, analytics };
