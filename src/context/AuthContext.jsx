import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db, googleProvider } from "../lib/firebase";

import {
  createUserProfile,
  getUserProfile,
} from "../services/userService";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          try {
            if (currentUser) {
              setFirebaseUser(currentUser);

              // -----------------------------------------
              // Create user profile if required
              // -----------------------------------------

              await createUserProfile(currentUser);

              // -----------------------------------------
              // Load user profile
              // -----------------------------------------

              const userProfile = await getUserProfile(
                  currentUser.uid
              );

              setProfile(userProfile);

              // -----------------------------------------
              // Check admin role
              // -----------------------------------------

              const adminRef = doc(
                  db,
                  "admins",
                  currentUser.uid
              );

              const adminSnap = await getDoc(adminRef);

              const adminStatus =
                  adminSnap.exists() &&
                  adminSnap.data()?.role === "admin";

              setIsAdmin(adminStatus);

              console.log(
                  "Firebase User:",
                  currentUser.email
              );

              console.log(
                  "Firebase UID:",
                  currentUser.uid
              );

              console.log(
                  "Admin:",
                  adminStatus
              );
            } else {
              setFirebaseUser(null);
              setProfile(null);
              setIsAdmin(false);
            }
          } catch (err) {
            console.error(
                "Auth initialization error:",
                err
            );

            setFirebaseUser(currentUser);

            // Keep profile/admin state safe if initialization
            // fails for any reason.
            setProfile(null);
            setIsAdmin(false);
          } finally {
            setLoading(false);
          }
        }
    );

    return unsubscribe;
  }, []);

  // -----------------------------------------
  // Email Login
  // -----------------------------------------

  const loginWithEmail = async (email, password) => {
    return signInWithEmailAndPassword(
        auth,
        email,
        password
    );
  };

  // -----------------------------------------
  // Email Signup
  // -----------------------------------------

  const signupWithEmail = async (
      email,
      password
  ) => {
    const credential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

    await sendEmailVerification(
        credential.user
    );

    return credential;
  };

  // -----------------------------------------
  // Google Login
  // -----------------------------------------

  const loginWithGoogle = async () => {
    googleProvider.setCustomParameters({
      prompt: "select_account",
    });

    return signInWithPopup(
        auth,
        googleProvider
    );
  };

  // -----------------------------------------
  // Logout
  // -----------------------------------------

  const logout = async () => {
    setFirebaseUser(null);
    setProfile(null);
    setIsAdmin(false);

    return signOut(auth);
  };

  // -----------------------------------------
  // Refresh Profile + Admin Status
  // -----------------------------------------

  const refreshProfile = async () => {
    if (!firebaseUser) return;

    try {
      const updated =
          await getUserProfile(
              firebaseUser.uid
          );

      setProfile(updated);

      // Re-check admin role
      const adminRef = doc(
          db,
          "admins",
          firebaseUser.uid
      );

      const adminSnap =
          await getDoc(adminRef);

      const adminStatus =
          adminSnap.exists() &&
          adminSnap.data()?.role === "admin";

      setIsAdmin(adminStatus);
    } catch (err) {
      console.error(
          "Error refreshing profile:",
          err
      );
    }
  };

  const value = {
    firebaseUser,
    profile,
    isAdmin,

    // Backward compatibility
    user: firebaseUser,

    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,

    refreshProfile,

    loading,
  };

  return (
      <AuthContext.Provider value={value}>
        {!loading && children}
      </AuthContext.Provider>
  );
};