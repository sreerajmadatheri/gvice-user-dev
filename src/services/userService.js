import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "../lib/firebase";


/**
 * Create user profile if it doesn't already exist.
 */
export const createUserProfile = async (
    firebaseUser
) => {

    if (!firebaseUser) {
        return null;
    }


    const userRef =
        doc(
            db,
            "users",
            firebaseUser.uid
        );


    const snapshot =
        await getDoc(userRef);


    if (!snapshot.exists()) {

        const profile = {

            uid:
            firebaseUser.uid,

            email:
                firebaseUser.email || "",

            displayName:
                firebaseUser.displayName || "",

            firstName:
                "",

            lastName:
                "",

            company:
                "",

            designation:
                "",

            phone:
                firebaseUser.phoneNumber || "",

            country:
                "",

            city:
                "",

            profileImage:
                firebaseUser.photoURL || "",

            role:
                "user",

            isApproved:
                true,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp(),
        };


        await setDoc(
            userRef,
            profile
        );


        return profile;
    }


    return snapshot.data();
};


/**
 * Get complete user profile.
 */
export const getUserProfile = async (
    uid
) => {

    const ref =
        doc(
            db,
            "users",
            uid
        );


    const snapshot =
        await getDoc(ref);


    if (!snapshot.exists()) {
        return null;
    }


    return snapshot.data();
};


/**
 * Get all user profiles.
 *
 * This is intended for administrator use.
 * Firestore rules already restrict the collection
 * so that only admins can read other users.
 */
export const getAllUsers = async () => {

    const usersRef =
        collection(
            db,
            "users"
        );


    const snapshot =
        await getDocs(usersRef);


    return snapshot.docs.map(
        (userDoc) => ({
            id: userDoc.id,
            ...userDoc.data(),
        })
    );
};


/**
 * Update profile.
 *
 * The Firestore rules protect:
 * - uid
 * - role
 * - isApproved
 *
 * for normal users.
 */
export const updateUserProfile = async (
    uid,
    updates
) => {

    const ref =
        doc(
            db,
            "users",
            uid
        );


    await updateDoc(
        ref,
        {
            ...updates,
            updatedAt:
                serverTimestamp(),
        }
    );
};