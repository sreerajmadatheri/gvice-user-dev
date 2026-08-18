import { useEffect, useState } from "react";

import {
    Bell,
    CheckCircle,
    AlertCircle,
    Edit3,
    Save,
    X,
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

import {
    updateUserProfile,
} from "../services/userService";


const ProfilePage = () => {

    const {
        user,
        profile,
        refreshProfile,
    } = useAuth();


    // =====================================================
    // PROFILE EDITING
    // =====================================================

    const [isEditing, setIsEditing] =
        useState(false);

    const [savingProfile, setSavingProfile] =
        useState(false);

    const [profileStatus, setProfileStatus] =
        useState("idle");

    const [profileMessage, setProfileMessage] =
        useState("");


    const [formData, setFormData] =
        useState({
            displayName: "",
            firstName: "",
            lastName: "",
            company: "",
            designation: "",
            phone: "",
            country: "",
            city: "",
        });


    // =====================================================
    // NOTIFICATIONS
    // =====================================================

    const [notificationsEnabled, setNotificationsEnabled] =
        useState(false);

    const [checkingNotifications, setCheckingNotifications] =
        useState(true);

    const [notificationStatus, setNotificationStatus] =
        useState("idle");

    const [notificationMessage, setNotificationMessage] =
        useState("");


    // =====================================================
    // LOAD PROFILE INTO FORM
    // =====================================================

    useEffect(() => {

        if (!profile && !user) {
            return;
        }

        setFormData({
            displayName:
                profile?.displayName ||
                user?.displayName ||
                "",

            firstName:
                profile?.firstName || "",

            lastName:
                profile?.lastName || "",

            company:
                profile?.company || "",

            designation:
                profile?.designation || "",

            phone:
                profile?.phone ||
                user?.phoneNumber ||
                "",

            country:
                profile?.country || "",

            city:
                profile?.city || "",
        });

    }, [
        profile,
        user,
    ]);


    // =====================================================
    // START EDITING
    // =====================================================

    const handleStartEditing = () => {

        setProfileStatus("idle");
        setProfileMessage("");

        setFormData({
            displayName:
                profile?.displayName ||
                user?.displayName ||
                "",

            firstName:
                profile?.firstName || "",

            lastName:
                profile?.lastName || "",

            company:
                profile?.company || "",

            designation:
                profile?.designation || "",

            phone:
                profile?.phone ||
                user?.phoneNumber ||
                "",

            country:
                profile?.country || "",

            city:
                profile?.city || "",
        });

        setIsEditing(true);
    };


    // =====================================================
    // CANCEL EDITING
    // =====================================================

    const handleCancelEditing = () => {

        setProfileStatus("idle");
        setProfileMessage("");

        setFormData({
            displayName:
                profile?.displayName ||
                user?.displayName ||
                "",

            firstName:
                profile?.firstName || "",

            lastName:
                profile?.lastName || "",

            company:
                profile?.company || "",

            designation:
                profile?.designation || "",

            phone:
                profile?.phone ||
                user?.phoneNumber ||
                "",

            country:
                profile?.country || "",

            city:
                profile?.city || "",
        });

        setIsEditing(false);
    };


    // =====================================================
    // HANDLE FORM CHANGE
    // =====================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    // =====================================================
    // SAVE PROFILE
    // =====================================================

    const handleSaveProfile = async () => {

        if (!user?.uid) {

            setProfileStatus("error");

            setProfileMessage(
                "Unable to save profile. User information is not available."
            );

            return;
        }


        setSavingProfile(true);
        setProfileStatus("idle");
        setProfileMessage("");


        try {

            const updates = {
                displayName:
                    formData.displayName.trim(),

                firstName:
                    formData.firstName.trim(),

                lastName:
                    formData.lastName.trim(),

                company:
                    formData.company.trim(),

                designation:
                    formData.designation.trim(),

                phone:
                    formData.phone.trim(),

                country:
                    formData.country.trim(),

                city:
                    formData.city.trim(),
            };


            await updateUserProfile(
                user.uid,
                updates
            );


            // Refresh AuthContext so the rest
            // of the application immediately sees
            // the updated profile.
            await refreshProfile();


            setProfileStatus("success");

            setProfileMessage(
                "Profile updated successfully."
            );

            setIsEditing(false);

        } catch (error) {

            console.error(
                "Error updating profile:",
                error
            );

            setProfileStatus("error");

            setProfileMessage(
                "Unable to update your profile. Please try again."
            );

        } finally {

            setSavingProfile(false);
        }
    };


    // =====================================================
    // CHECK NOTIFICATION STATUS
    // =====================================================

    useEffect(() => {

        const checkNotificationStatus =
            async () => {

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


                    const tokensRef =
                        collection(
                            db,
                            "users",
                            user.uid,
                            "fcmTokens"
                        );


                    const snapshot =
                        await getDocs(tokensRef);


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

    }, [
        user?.uid,
    ]);


    // =====================================================
    // ENABLE NOTIFICATIONS
    // =====================================================

    const handleEnableNotifications =
        async () => {

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
                    await registerForPushNotifications(
                        user
                    );


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


    // =====================================================
    // FIELD COMPONENT
    // =====================================================

    const renderField = (
        label,
        name,
        value,
        placeholder
    ) => {

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                }}
            >

                <label
                    htmlFor={name}
                    style={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                    }}
                >
                    {label}
                </label>

                <input
                    id={name}
                    name={name}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    style={{
                        width: "100%",
                        padding: "0.7rem 0.8rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "0.95rem",
                        boxSizing: "border-box",
                    }}
                />

            </div>
        );
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div>

            <h2>
                My Profile
            </h2>


            {/* =================================================
                PROFILE INFORMATION
            ================================================= */}

            <div
                className="admin-card"
                style={{
                    marginTop: "1.5rem",
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                        marginBottom: "1.25rem",
                    }}
                >

                    <h3
                        style={{
                            margin: 0,
                        }}
                    >
                        Profile Information
                    </h3>


                    {!isEditing && (
                        <button
                            type="button"
                            className="admin-btn"
                            onClick={
                                handleStartEditing
                            }
                        >
                            <Edit3 size={17} />
                            Edit Profile
                        </button>
                    )}

                </div>


                {!isEditing ? (

                    <div>

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
                                First Name:
                            </strong>{" "}

                            {profile?.firstName ||
                                "-"}
                        </p>


                        <p>
                            <strong>
                                Last Name:
                            </strong>{" "}

                            {profile?.lastName ||
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

                            {profile?.company ||
                                "-"}
                        </p>


                        <p>
                            <strong>
                                Designation:
                            </strong>{" "}

                            {profile?.designation ||
                                "-"}
                        </p>


                        <p>
                            <strong>
                                Phone:
                            </strong>{" "}

                            {profile?.phone ||
                                "-"}
                        </p>


                        <p>
                            <strong>
                                Country:
                            </strong>{" "}

                            {profile?.country ||
                                "-"}
                        </p>


                        <p>
                            <strong>
                                City:
                            </strong>{" "}

                            {profile?.city ||
                                "-"}
                        </p>


                        <p>
                            <strong>
                                Role:
                            </strong>{" "}

                            {profile?.role ||
                                "user"}
                        </p>

                    </div>

                ) : (

                    <div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(240px, 1fr))",
                                gap: "1rem",
                            }}
                        >

                            {renderField(
                                "Display Name",
                                "displayName",
                                formData.displayName,
                                "Enter display name"
                            )}


                            {renderField(
                                "First Name",
                                "firstName",
                                formData.firstName,
                                "Enter first name"
                            )}


                            {renderField(
                                "Last Name",
                                "lastName",
                                formData.lastName,
                                "Enter last name"
                            )}


                            {renderField(
                                "Company",
                                "company",
                                formData.company,
                                "Enter company name"
                            )}


                            {renderField(
                                "Designation",
                                "designation",
                                formData.designation,
                                "Enter designation"
                            )}


                            {renderField(
                                "Phone",
                                "phone",
                                formData.phone,
                                "Enter phone number"
                            )}


                            {renderField(
                                "Country",
                                "country",
                                formData.country,
                                "Enter country"
                            )}


                            {renderField(
                                "City",
                                "city",
                                formData.city,
                                "Enter city"
                            )}

                        </div>


                        {/* Email / Role are intentionally read-only */}

                        <div
                            style={{
                                marginTop: "1.25rem",
                                paddingTop: "1rem",
                                borderTop: "1px solid #e5e7eb",
                            }}
                        >

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
                                    Role:
                                </strong>{" "}

                                {profile?.role ||
                                    "user"}
                            </p>

                        </div>


                        {/* Save / Cancel */}

                        <div
                            style={{
                                display: "flex",
                                gap: "0.75rem",
                                marginTop: "1.25rem",
                                flexWrap: "wrap",
                            }}
                        >

                            <button
                                type="button"
                                className="admin-btn"
                                onClick={
                                    handleSaveProfile
                                }
                                disabled={
                                    savingProfile
                                }
                            >

                                <Save size={17} />

                                {savingProfile
                                    ? "Saving..."
                                    : "Save Changes"}

                            </button>


                            <button
                                type="button"
                                className="admin-btn"
                                onClick={
                                    handleCancelEditing
                                }
                                disabled={
                                    savingProfile
                                }
                                style={{
                                    background:
                                        "#6b7280",
                                }}
                            >

                                <X size={17} />

                                Cancel

                            </button>

                        </div>

                    </div>
                )}


                {/* Profile success/error */}

                {profileStatus === "success" && (

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
                            {profileMessage}
                        </span>

                    </div>
                )}


                {profileStatus === "error" && (

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
                            {profileMessage}
                        </span>

                    </div>
                )}

            </div>


            {/* =================================================
                NOTIFICATION SETTINGS
            ================================================= */}

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


                {/* Checking notification status */}

                {checkingNotifications ? (

                    <div>
                        Checking notification status...
                    </div>

                ) : notificationsEnabled ? (

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


                {/* Notification success */}

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


                {/* Notification error */}

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