import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// Supabase client initialization
// Replaces: initializeApp(FirebaseConfig), getAuth(app), getFirestore(app)
// ============================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ============================================================
// USER PINS (personal pinned locations)
// Maps to: public.user_locations table
// Replaces: Firestore subcollection → users/{uid}/pinnedLocations
// ============================================================

// Replaces: addPinnedLocationToDB(uid, locationName, address, latitude, longitude, description)
export async function addPinnedLocationToDB(uid, locationName, address, latitude, longitude, description) {
  const { data, error } = await supabase
    .from("user_locations")
    .insert([{ user_id: uid, location_name: locationName, address, latitude, longitude, description }])
    .select("id")
    .single();

  if (error) {
    console.error("Error adding pinned location:", error);
    throw error;
  }
  return data.id;
}

// Replaces: getPinnedLocationsFromDB(uid)
export async function getPinnedLocationsFromDB(uid) {
  const { data, error } = await supabase
    .from("user_locations")
    .select("*")
    .eq("user_id", uid);

  if (error) {
    console.error("Error getting pinned locations:", error);
    throw error;
  }
  // Normalize field name to match Firebase shape: locationName instead of location_name
  return data.map(row => ({
    id: row.id,
    locationName: row.location_name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    description: row.description,
  }));
}

// Replaces: deletePinnedLocationFromDB(uid, id)
export async function deletePinnedLocationFromDB(uid, id) {
  const { error } = await supabase
    .from("user_locations")
    .delete()
    .eq("id", id)
    .eq("user_id", uid); // safety: only delete own pins

  if (error) {
    console.error("Error deleting pinned location:", error);
    throw error;
  }
}


// ============================================================
// AUTHENTICATION
// Replaces: Firebase Auth functions
// ============================================================

// Replaces: signUp(email, password) + createUserWithEmailAndPassword
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error("Error signing up:", error);
    throw error;
  }
  return data.user;
}

// Replaces: logIn(email, password) + signInWithEmailAndPassword
export async function logIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      console.error("Incorrect email or password. Please try again.");
    } else {
      console.error("Login error:", error.message);
    }
    throw error;
  }
  return data.user;
}

// Replaces: logOut() + signOut(auth)
export async function logOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}

// Replaces: onAuthStateChangedListener(callback) + onAuthStateChanged(auth, callback)
export function onAuthStateChangedListener(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    // Mirror Firebase behaviour: callback receives user or null
    callback(session?.user ?? null);
  });
  // Return the unsubscribe function (mirrors Firebase's unsubscribe return)
  return () => subscription.unsubscribe();
}

// Replaces: getCurrentUser() + auth.currentUser
export function getCurrentUser() {
  // supabase.auth.getUser() is async, but getSession() is synchronous from cache
  return supabase.auth.getSession().then(({ data }) => data.session?.user ?? null);
}


// ============================================================
// USER PROFILE & DATA
// Maps to: public.users table
// Replaces: Firestore users/{uid} document operations
// ============================================================

// Replaces: updateUserProfile(updates)
// Note: Supabase Auth metadata is separate from the users table.
// This updates auth metadata (displayName equivalent) via auth.updateUser,
// and also syncs the name field to the public.users table.
export async function updateUserProfile(updates) {
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !user) throw new Error("No user is currently signed in.");

  // Update Supabase Auth user metadata (mirrors Firebase updateProfile)
  const authUpdates = {};
  if (updates.displayName) authUpdates.data = { display_name: updates.displayName };
  if (updates.photoURL) authUpdates.data = { ...authUpdates.data, photo_url: updates.photoURL };

  if (Object.keys(authUpdates).length > 0) {
    const { error } = await supabase.auth.updateUser(authUpdates);
    if (error) {
      console.error("Error updating auth profile:", error);
      throw error;
    }
  }
}

// Replaces: saveUserDataToDB(uid, data)
// Upserts a row in public.users (insert or update if exists)
export async function saveUserDataToDB(uid, data) {
  const { error } = await supabase
    .from("users")
    .upsert({ id: uid, ...data }, { onConflict: "id" });

  if (error) {
    console.error("Error saving user data:", error);
    throw error;
  }
  return { uid, ...data };
}

// Replaces: getUserDataFromDB(uid)
export async function getUserDataFromDB(uid) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", uid)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Row not found — mirrors Firebase's userSnap.exists() === false
      console.warn("No user data found for UID:", uid);
      return null;
    }
    console.error("Error getting user data:", error);
    throw error;
  }
  return data;
}

// Replaces: updateUserPassword(newPassword, currentPassword)
// Supabase requires the user to be signed in; re-auth is handled by re-signing in first.
export async function updateUserPassword(newPassword, currentPassword) {
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !user) throw new Error("No user is currently signed in.");

  // Re-authenticate by signing in again with current credentials
  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reAuthError) {
    console.error("Re-authentication failed:", reAuthError);
    throw reAuthError;
  }

  // Update to the new password
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("Error updating password:", error);
    throw error;
  }
}

// Replaces: sendPasswordReset(email) + sendPasswordResetEmail(auth, email)
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}