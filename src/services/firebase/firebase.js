// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import { 
  getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, setDoc, getDoc, query, where 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, updateProfile, updatePassword, reauthenticateWithCredential,
  EmailAuthProvider, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import FirebaseConfig from "../../assets/json/firebaseConfig.json";

// Your web app's Firebase configuration
// Insert your Firebase configuration below this line

// Initialize Firebase
const app = initializeApp(FirebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);


// Export functions with the initialized app
// === Firestore user pins helper functions ===
export async function addPinnedLocationToDB(uid, locationName, address, latitude, longitude, description) {
  const docRef = await addDoc(collection(db, "users", uid, "pinnedLocations"), { locationName, address, latitude, longitude, description });
  return docRef.id;
}

export async function getPinnedLocationsFromDB(uid) {
  const snapshot = await getDocs(collection(db, "users", uid, "pinnedLocations"));
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function deletePinnedLocationFromDB(uid, id) {
  await deleteDoc(doc(db, "users", uid, "pinnedLocations", id));
}


// === Firestore account helper functions ===
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
}

export async function logIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    if (error.code === "auth/invalid-credential") {
      console.error("Incorrect password. Please try again.");
      throw error;
    } 
    if (error.code === "auth/invalid-email") {
      console.error("User not found. Please sign up.");
      throw error;
    }
    return;
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}

//check if user detected
export function onAuthStateChangedListener(callback) {
  return onAuthStateChanged(auth, callback);
}

//only updates the user auth's profile, not the db info
export async function updateUserProfile(updates) {
  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, updates);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  } else {
    throw new Error("No user is currently signed in.");
  }
}


export async function saveUserDataToDB(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), data);
    return { uid, ...data };
  } catch (error) {
    console.error("Error saving user data:", error);
    throw error;
  }
}


export async function updateUserPassword(newPassword, currentPassword) { // Added currentPassword parameter
  if (auth.currentUser) {
    try {
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword); // Assuming email/password login
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update the password after successful re-authentication
      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  } else {
    throw new Error("No user is currently signed in.");
  }
}


export async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}


//retrieving user data from db
export async function getUserDataFromDB(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data(); // returns { username, name, email, ... }
    } else {
      console.warn("No user data found for UID:", uid);
      return null;
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
}

export function getCurrentUser() {
  return auth.currentUser;
}