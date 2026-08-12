importScripts(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyDeyo5FX1rahvdqZlr-gu__i0x_PbdZDys",
    authDomain: "gvice-user-dev.firebaseapp.com",
    projectId: "gvice-user-dev",
    storageBucket: "gvice-user-dev.firebasestorage.app",
    messagingSenderId: "922698000638",
    appId: "1:922698000638:web:e5db1e7576f84790ff5daf",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(
        "[firebase-messaging-sw.js] Received background message:",
        payload
    );

    const notificationTitle =
        payload.notification?.title || "GVICE Notification";

    const notificationOptions = {
        body:
            payload.notification?.body ||
            "You have a new notification.",
        icon: "/gvice-user-dev/favicon.ico",
        data: payload.data || {},
    };

    self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true,
        }).then((clientList) => {
            for (const client of clientList) {
                if ("focus" in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow("/gvice-user-dev/");
            }

            return null;
        })
    );
});