import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithPopup,
} from "firebase/auth";

import { auth, googleProvider } from "../lib/firebase";

import {
  createUserProfile,
  getUserProfile,
} from "../services/userService";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setFirebaseUser(currentUser);

          // Create profile on first login
          await createUserProfile(currentUser);

          // Load profile
          const userProfile = await getUserProfile(currentUser.uid);

          setProfile(userProfile);
        } else {
          setFirebaseUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (email, password) => {
    const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    await sendEmailVerification(credential.user);

    return credential;
  };

  const loginWithGoogle = async () => {
    googleProvider.setCustomParameters({
      prompt: "select_account",
    });

    return signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    return signOut(auth);
  };

  const refreshProfile = async () => {
    if (!firebaseUser) return;

    const updated = await getUserProfile(firebaseUser.uid);

    setProfile(updated);
  };

  const value = {
    firebaseUser,
    profile,

    // Backward compatibility
    user: firebaseUser,

    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,

    refreshProfile,
  };

  return (
      <AuthContext.Provider value={value}>
        {!loading && children}
      </AuthContext.Provider>
  );
};