import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider, appleProvider } from "./firebase";

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    callback({
      uid: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      provider: firebaseUser.providerData[0]?.providerId?.includes("apple")
        ? "apple"
        : "google",
    });
  });
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithApple() {
  const result = await signInWithPopup(auth, appleProvider);
  return result.user;
}

export async function signOutUser() {
  await firebaseSignOut(auth);
}
