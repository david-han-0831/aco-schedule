import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAFLteKwxPZhjSQNpojoY0xga84XjxeFyQ",
  authDomain: "aco-project-8e5cf.firebaseapp.com",
  projectId: "aco-project-8e5cf",
  storageBucket: "aco-project-8e5cf.firebasestorage.app",
  messagingSenderId: "119245672460",
  appId: "1:119245672460:web:dd45a8d991168833825e29",
  measurementId: "G-7YNE1R9PGP"
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Analytics (only in browser)
export const analytics: Analytics | null = 
  typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
