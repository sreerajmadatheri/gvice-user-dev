import { getToken } from "firebase/messaging";
import {
    doc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";

import { db, messaging } from "../lib/firebase";

// Firebase Console → Project Settings → Cloud Messaging
const VAPID_PUBLIC_KEY =
    "BEfq-NXz6hq4MpP2ALkxRF0Arro9gOap1bzUHuE4j59p-bIDhqQGiKKt38nijfdYW_M_Vd0jEGlKf4XwjMNNUFw";


export const registerForPushNotifications = async (user) => {
    // -----------------------------------------
    // Validate authenticated user
    // -----------------------------------------

    if (!user?.uid) {
        console.warn(
            "Push notification registration skipped: no authenticated user."
        );

        return null;
    }


    // -----------------------------------------
    // Check browser support
    // -----------------------------------------

    if (
        typeof window === "undefined" ||
        !("Notification" in window)
    ) {
        console.warn(
            "Push notifications are not supported by this browser."
        );

        return null;
    }

    if (!("serviceWorker" in navigator)) {
        console.warn(
            "Service workers are not supported by this browser."
        );

        return null;
    }


    try {
        // -----------------------------------------
        // Wait for Firebase Messaging instance
        // -----------------------------------------

        const messagingInstance = await messaging;

        if (!messagingInstance) {
            console.warn(
                "Firebase Cloud Messaging is not supported in this browser."
            );

            return null;
        }


        // -----------------------------------------
        // Request notification permission
        // -----------------------------------------

        let permission = Notification.permission;

        console.log(
            "Current notification permission:",
            permission
        );

        if (permission === "default") {
            console.log(
                "Requesting notification permission..."
            );

            permission =
                await Notification.requestPermission();

            console.log(
                "Notification permission result:",
                permission
            );
        }

        if (permission !== "granted") {
            console.warn(
                "Notification permission was not granted:",
                permission
            );

            return null;
        }


        // -----------------------------------------
        // Register Firebase Messaging Service Worker
        // -----------------------------------------

        const serviceWorkerUrl =
            `${import.meta.env.BASE_URL}firebase-messaging-sw.js`;

        console.log(
            "Registering Firebase Messaging service worker:",
            serviceWorkerUrl
        );

        const serviceWorkerRegistration =
            await navigator.serviceWorker.register(
                serviceWorkerUrl
            );

        console.log(
            "Firebase Messaging service worker registered:",
            serviceWorkerRegistration.scope
        );


        // -----------------------------------------
        // Wait until service worker is ready
        // -----------------------------------------

        await navigator.serviceWorker.ready;

        console.log(
            "Firebase Messaging service worker is ready."
        );


        // -----------------------------------------
        // Get FCM token
        // -----------------------------------------

        console.log(
            "Requesting FCM token..."
        );

        const token = await getToken(
            messagingInstance,
            {
                vapidKey: VAPID_PUBLIC_KEY,
                serviceWorkerRegistration,
            }
        );


        // -----------------------------------------
        // Validate FCM token
        // -----------------------------------------

        if (!token) {
            console.warn(
                "Firebase Messaging did not return an FCM token."
            );

            return null;
        }

        console.log(
            "FCM token received successfully."
        );


        // -----------------------------------------
        // Save token to Firestore
        // -----------------------------------------

        const tokenId =
            encodeURIComponent(token);

        const tokenRef = doc(
            db,
            "users",
            user.uid,
            "fcmTokens",
            tokenId
        );

        await setDoc(
            tokenRef,
            {
                token,
                userId: user.uid,
                email: user.email || "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            },
            {
                merge: true,
            }
        );


        // -----------------------------------------
        // Success
        // -----------------------------------------

        console.log(
            "FCM token registered successfully."
        );

        console.log(
            "FCM token saved for user:",
            user.uid
        );

        return token;

    } catch (error) {
        // -----------------------------------------
        // Detailed error information
        // -----------------------------------------

        console.error(
            "FCM registration error:",
            error
        );

        console.error(
            "FCM error code:",
            error?.code
        );

        console.error(
            "FCM error message:",
            error?.message
        );

        return null;
    }
};