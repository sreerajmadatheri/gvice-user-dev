import { useEffect, useState } from "react";
import {
    Bell,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
    collection,
    getDocs,
} from "firebase/firestore";

import { db } from "../lib/firebase";

import {
    registerForPushNotifications,
} from "../services/notificationService";


const ProfilePage = () => {
    const { user, profile } = useAuth();

    const [notificationsEnabled, setNotificationsEnabled] =
        useState(false);

    const [checkingNotifications, setCheckingNotifications] =
        useState(true);

    const [notificationStatus, setNotificationStatus] =
        useState("idle");

    const [notificationMessage, setNotificationMessage] =
        useState("");


    // -----------------------------------------
    // Check notification status for THIS user
    // -----------------------------------------

    useEffect(() => {
        const checkNotificationStatus = async () => {

            if (!user?.uid) {
                setNotificationsEnabled(false);
                setCheckingNotifications(false);
                return;
            }

            try {
                console.log(
                    "Checking FCM tokens for user:",
                    user.uid
                );

                const tokensRef = collection(
                    db,
                    "users",
                    user.uid,
                    "fcmTokens"
                );

                const snapshot = await getDocs(tokensRef);

                console.log(
                    "FCM token documents found:",
                    snapshot.size
                );

                setNotificationsEnabled(
                    !snapshot.empty
                );

            } catch (error) {

                console.error(
                    "Error checking FCM token status:",
                    error
                );

                setNotificationsEnabled(false);

            } finally {

                setCheckingNotifications(false);
            }
        };

        checkNotificationStatus();

    }, [user?.uid]);


    // -----------------------------------------
    // Enable Notifications
    // -----------------------------------------

    const handleEnableNotifications = async () => {

        if (!user) {

            setNotificationStatus("error");

            setNotificationMessage(
                "You must be logged in to enable notifications."
            );

            return;
        }


        setNotificationStatus("loading");
        setNotificationMessage("");


        try {

            console.log(
                "Starting notification registration for:",
                user.uid
            );


            const token =
                await registerForPushNotifications(user);


            if (token) {

                console.log(
                    "Notification registration successful."
                );

                setNotificationsEnabled(true);

                setNotificationStatus("success");

                setNotificationMessage(
                    "Notifications have been enabled successfully."
                );

            } else {

                console.warn(
                    "Notification registration did not return a token."
                );

                setNotificationsEnabled(false);

                setNotificationStatus("error");

                setNotificationMessage(
                    "Notifications could not be enabled. Please check the browser console for the FCM error."
                );
            }


        } catch (error) {

            console.error(
                "Notification setup failed:",
                error
            );

            setNotificationsEnabled(false);

            setNotificationStatus("error");

            setNotificationMessage(
                "Unable to enable notifications. Please try again."
            );
        }
    };


    return (
        <div>

            <h2>My Profile</h2>


            {/* -----------------------------------------
                Profile Information
            ----------------------------------------- */}

            <div
                className="admin-card"
                style={{
                    marginTop: "1.5rem",
                }}
            >

                <p>
                    <strong>
                        Display Name:
                    </strong>{" "}

                    {profile?.displayName ||
                        user?.displayName ||
                        "-"}
                </p>


                <p>
                    <strong>
                        Email:
                    </strong>{" "}

                    {profile?.email ||
                        user?.email ||
                        "-"}
                </p>


                <p>
                    <strong>
                        Company:
                    </strong>{" "}

                    {profile?.company || "-"}
                </p>


                <p>
                    <strong>
                        Phone:
                    </strong>{" "}

                    {profile?.phone || "-"}
                </p>


                <p>
                    <strong>
                        Role:
                    </strong>{" "}

                    {profile?.role || "user"}
                </p>

            </div>


            {/* -----------------------------------------
                Notification Settings
            ----------------------------------------- */}

            <div
                className="admin-card"
                style={{
                    marginTop: "1.5rem",
                }}
            >

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "0.75rem",
                    }}
                >

                    <Bell size={22} />

                    <h3
                        style={{
                            margin: 0,
                        }}
                    >
                        Notifications
                    </h3>

                </div>


                <p
                    style={{
                        color: "#6b7280",
                        marginBottom: "1rem",
                    }}
                >
                    Get notified when someone places a bid
                    on your equipment or updates their bid.
                </p>


                {/* -----------------------------------------
                    Checking notification status
                ----------------------------------------- */}

                {checkingNotifications ? (

                    <div>
                        Checking notification status...
                    </div>

                ) : notificationsEnabled ? (

                    /* -----------------------------------------
                       Notifications enabled
                    ----------------------------------------- */

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "#15803d",
                            fontWeight: 500,
                        }}
                    >

                        <CheckCircle size={20} />

                        <span>
                            Notifications are enabled.
                        </span>

                    </div>

                ) : (

                    /* -----------------------------------------
                       Notifications not enabled
                    ----------------------------------------- */

                    <button
                        type="button"
                        className="admin-btn"
                        onClick={
                            handleEnableNotifications
                        }
                        disabled={
                            notificationStatus === "loading"
                        }
                    >

                        <Bell size={17} />

                        {notificationStatus === "loading"
                            ? "Enabling..."
                            : "Enable Notifications"}

                    </button>
                )}


                {/* -----------------------------------------
                    Success message
                ----------------------------------------- */}

                {notificationStatus === "success" && (

                    <div
                        style={{
                            marginTop: "1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "#15803d",
                        }}
                    >

                        <CheckCircle size={18} />

                        <span>
                            {notificationMessage}
                        </span>

                    </div>
                )}


                {/* -----------------------------------------
                    Error message
                ----------------------------------------- */}

                {notificationStatus === "error" && (

                    <div
                        style={{
                            marginTop: "1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "#dc2626",
                        }}
                    >

                        <AlertCircle size={18} />

                        <span>
                            {notificationMessage}
                        </span>

                    </div>
                )}

            </div>

        </div>
    );
};


export default ProfilePage;