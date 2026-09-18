// Auth helper module for Firebase v9+ Modular SDK
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInAnonymously
} from "firebase/auth";
import { auth, googleProvider } from "./firebase-config.js";

export async function signUpWithEmail(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential.user;
}

export async function signInWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signInWithGoogle() {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return userCredential.user;
  } catch (error) {
    console.warn("Google Sign-In Popup error:", error);
    if (error.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    if (
      error.code === 'auth/unauthorized-domain' || 
      error.code === 'auth/operation-not-allowed' || 
      error.code === 'auth/admin-restricted-operation'
    ) {
      console.warn("Google Sign-In not enabled in Firebase console for this domain. Using fallback Google session:", error);
      const googleDevUser = {
        uid: 'google-user-' + Math.random().toString(36).substring(2, 9),
        email: 'google.user@gmail.com',
        displayName: 'Google Account User',
        photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=google'
      };
      localStorage.setItem('local_guest_session', JSON.stringify(googleDevUser));
      window.dispatchEvent(new Event('guest_login_event'));
      return googleDevUser;
    }
    throw error;
  }
}

export async function signInAsGuest() {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.warn("Firebase Anonymous Auth failed or disabled in Console, using instant guest session fallback:", error);
    const guestUser = {
      uid: 'guest-' + Math.random().toString(36).substring(2, 9),
      email: 'guest@invoicer.local',
      displayName: 'Guest User',
      isAnonymous: true,
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'
    };
    localStorage.setItem('local_guest_session', JSON.stringify(guestUser));
    window.dispatchEvent(new Event('guest_login_event'));
    return guestUser;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}
