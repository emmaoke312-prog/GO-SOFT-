import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAP2Z-K5DuUdsodsixXM9FjXWKPsQjOU5M",
  authDomain: "go-soft-ef57b.firebaseapp.com",
  projectId: "go-soft-ef57b",
  storageBucket: "go-soft-ef57b.firebasestorage.app",
  messagingSenderId: "32368688692",
  appId: "1:32368688692:web:bc821ebf3681dadee81461",
  measurementId: "G-N6YHMQSPM5",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");
