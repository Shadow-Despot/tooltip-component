
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyApvJB9lBsAHVufkUMe7QTsaeMLKTchJgo",
  authDomain: "chat-34c20.firebaseapp.com",
  projectId: "chat-34c20",
  storageBucket: "chat-34c20.appspot.com", // Corrected storageBucket from user input
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
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}


export { app, auth, db, analytics };

