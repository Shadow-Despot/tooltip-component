
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyApvJB9lBsAHVufkUMe7QTsaeMLKTchJgo",
  authDomain: "chat-34c20.firebaseapp.com",
  projectId: "chat-34c20",
  storageBucket: "chat-34c20.appspot.com", // Corrected storage bucket format based on common Firebase patterns
  messagingSenderId: "613295809920",
  appId: "1:613295809920:web:d95c89fe854c3f2e618d65",
  measurementId: "G-DP37PV68J1"
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
        console.warn("Firestore persistence failed (failed-precondition). This might be due to multiple tabs open. Offline capabilities might be limited to this tab.", err);
      } else if (err.code === 'unimplemented') {
        console.warn("Firestore persistence failed (unimplemented). Your browser may not fully support offline capabilities.", err);
      } else {
        console.error("An unexpected error occurred while enabling Firestore persistence:", err);
      }
    });

  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized.");
    } else {
      console.log("Firebase Analytics is not supported in this environment.");
    }
  });
}


export { app, auth, db, analytics };

