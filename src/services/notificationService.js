import { getToken } from "firebase/messaging";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";

import { db, messaging } from "../lib/firebase";

const VAPID_PUBLIC_KEY =
    "BEfq-NXz6hq4MpP2ALkxRF0Arro9gOap1bzUHuE4j59p-bIDhqQGiKKt38nijfdYW_M_Vd0jEGlKf4XwjMNNUFw";

export const registerForPushNotifications = async (user) => {
    if (!user?.uid) {
        console.warn(
            "Push notification registration skipped: no authenticated user."
        );
        return null;
    }

    if (!("Notification" in window)) {
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
        console.log(
            "---------------------------------------------"
        );

        console.log(
            "Starting FCM registration for:",
            user.uid
        );

        console.log(
            "Firebase project:",
            import.meta.env.VITE_FIREBASE_PROJECT_ID
        );

        console.log(
            "Using Firebase emulators:",
            import.meta.env.VITE_USE_FIREBASE_EMULATORS
        );

        // --------------------------------------------------
        // Firebase Messaging
        // --------------------------------------------------

        const messagingInstance = await messaging;

        if (!messagingInstance) {
            console.warn(
                "Firebase Cloud Messaging is not supported in this browser."
            );

            return null;
        }

        // --------------------------------------------------
        // Browser notification permission
        // --------------------------------------------------

        const permission =
            Notification.permission === "granted"
                ? "granted"
                : await Notification.requestPermission();

        console.log(
            "Notification permission:",
            permission
        );

        if (permission !== "granted") {
            console.warn(
                "Notification permission was not granted."
            );

            return null;
        }

        // --------------------------------------------------
        // Service Worker
        // --------------------------------------------------

        const serviceWorkerRegistration =
            await navigator.serviceWorker.register(
                "/gvice-user-dev/firebase-messaging-sw.js"
            );

        console.log(
            "Service worker registered:",
            serviceWorkerRegistration.scope
        );

        console.log(
            "Service worker state immediately after registration:",
            serviceWorkerRegistration.active?.state || "not active yet"
        );

        // --------------------------------------------------
        // IMPORTANT:
        // Wait until a Service Worker is active
        // --------------------------------------------------

        const activeServiceWorkerRegistration =
            await navigator.serviceWorker.ready;

        console.log(
            "Service worker is active:",
            activeServiceWorkerRegistration.scope
        );

        console.log(
            "Active Service Worker state:",
            activeServiceWorkerRegistration.active?.state
        );

        if (!activeServiceWorkerRegistration.active) {
            console.error(
                "CRITICAL: Service Worker registration is ready, but no active Service Worker exists."
            );

            return null;
        }

        // --------------------------------------------------
        // Get FCM token
        // --------------------------------------------------

        console.log(
            "Requesting FCM token using active Service Worker..."
        );

        const token = await getToken(
            messagingInstance,
            {
                vapidKey: VAPID_PUBLIC_KEY,
                serviceWorkerRegistration:
                activeServiceWorkerRegistration,
            }
        );

        if (!token) {
            console.warn(
                "Firebase Messaging did not return an FCM token."
            );

            return null;
        }

        console.log(
            "FCM token received successfully."
        );

        console.log(
            "FCM token length:",
            token.length
        );

        // --------------------------------------------------
        // Firestore token document
        // --------------------------------------------------

        const tokenId = encodeURIComponent(token);

        const tokenRef = doc(
            db,
            "users",
            user.uid,
            "fcmTokens",
            tokenId
        );

        console.log(
            "FCM Firestore path:",
            `users/${user.uid}/fcmTokens/${tokenId}`
        );

        // --------------------------------------------------
        // Save token
        // --------------------------------------------------

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

        console.log(
            "FCM token setDoc() completed successfully."
        );

        // --------------------------------------------------
        // Verify the exact document
        // --------------------------------------------------

        const savedTokenSnapshot =
            await getDoc(tokenRef);

        console.log(
            "FCM token document exists after write:",
            savedTokenSnapshot.exists()
        );

        if (!savedTokenSnapshot.exists()) {
            console.error(
                "CRITICAL: setDoc() completed, but getDoc() says the document does not exist."
            );

            console.error(
                "Firestore path:",
                `users/${user.uid}/fcmTokens/${tokenId}`
            );

            return null;
        }

        const savedData =
            savedTokenSnapshot.data();

        console.log(
            "FCM token document verified successfully."
        );

        console.log(
            "Saved userId:",
            savedData?.userId
        );

        console.log(
            "Saved email:",
            savedData?.email
        );

        console.log(
            "Has token field:",
            Boolean(savedData?.token)
        );

        console.log(
            "Has createdAt:",
            Boolean(savedData?.createdAt)
        );

        console.log(
            "Has updatedAt:",
            Boolean(savedData?.updatedAt)
        );

        console.log(
            "---------------------------------------------"
        );

        return token;

    } catch (error) {
        console.error(
            "FCM registration error:",
            error
        );

        console.error(
            "FCM registration error code:",
            error?.code
        );

        console.error(
            "FCM registration error message:",
            error?.message
        );

        return null;
    }
};