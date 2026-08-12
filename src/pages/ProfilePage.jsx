import { useState } from "react";
import { Bell, CheckCircle, AlertCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { registerForPushNotifications } from "../services/notificationService";

const ProfilePage = () => {
    const { user, profile } = useAuth();

    const [notificationStatus, setNotificationStatus] =
        useState("idle");

    const [notificationMessage, setNotificationMessage] =
        useState("");

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
            const token =
                await registerForPushNotifications(user);

            if (token) {
                setNotificationStatus("success");
                setNotificationMessage(
                    "Notifications have been enabled successfully."
                );
            } else {
                setNotificationStatus("error");
                setNotificationMessage(
                    "Notifications were not enabled. Please check your browser permission settings."
                );
            }
        } catch (error) {
            console.error(
                "Notification setup failed:",
                error
            );

            setNotificationStatus("error");
            setNotificationMessage(
                "Unable to enable notifications. Please try again."
            );
        }
    };

    const notificationPermission =
        typeof window !== "undefined" &&
        "Notification" in window
            ? Notification.permission
            : "unsupported";

    const notificationsAlreadyEnabled =
        notificationPermission === "granted";

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
                    <strong>Display Name:</strong>{" "}
                    {profile?.displayName ||
                        user?.displayName ||
                        "-"}
                </p>

                <p>
                    <strong>Email:</strong>{" "}
                    {profile?.email ||
                        user?.email ||
                        "-"}
                </p>

                <p>
                    <strong>Company:</strong>{" "}
                    {profile?.company || "-"}
                </p>

                <p>
                    <strong>Phone:</strong>{" "}
                    {profile?.phone || "-"}
                </p>

                <p>
                    <strong>Role:</strong>{" "}
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

                {notificationsAlreadyEnabled ? (
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
                    <button
                        type="button"
                        className="admin-btn"
                        onClick={
                            handleEnableNotifications
                        }
                        disabled={
                            notificationStatus ===
                            "loading"
                        }
                    >
                        <Bell size={17} />

                        {notificationStatus ===
                        "loading"
                            ? "Enabling..."
                            : "Enable Notifications"}
                    </button>
                )}

                {/* Success message */}

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

                {/* Error message */}

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