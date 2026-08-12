import { NavLink, Outlet } from "react-router-dom";
import {
    User,
    Gavel,
    Inbox,
    ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AccountPage = () => {
    const { user, profile, isAdmin } = useAuth();

    const displayName =
        profile?.displayName ||
        user?.displayName ||
        user?.email ||
        "My Account";

    const profileImage =
        profile?.profileImage ||
        user?.photoURL ||
        "";

    return (
        <div
            style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "3rem 1.5rem",
            }}
        >
            {/* Account Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "2rem",
                }}
            >
                {profileImage ? (
                    <img
                        src={profileImage}
                        alt="Profile"
                        style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            background: "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <User size={30} />
                    </div>
                )}

                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "1.5rem",
                        }}
                    >
                        {displayName}
                    </h1>

                    <p
                        style={{
                            margin: "0.25rem 0 0",
                            color: "#6b7280",
                        }}
                    >
                        {user?.email}
                    </p>
                </div>
            </div>

            {/* Account Navigation */}
            <div
                style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    marginBottom: "2rem",
                    borderBottom: "1px solid var(--border-color)",
                    paddingBottom: "1rem",
                }}
            >
                <NavLink
                    to="/profile"
                    end
                    className={({ isActive }) =>
                        `admin-btn ${
                            isActive ? "" : "admin-btn-secondary"
                        }`
                    }
                >
                    <User size={17} />
                    Profile
                </NavLink>

                <NavLink
                    to="/profile/bids"
                    className={({ isActive }) =>
                        `admin-btn ${
                            isActive ? "" : "admin-btn-secondary"
                        }`
                    }
                >
                    <Gavel size={17} />
                    My Bids
                </NavLink>

                <NavLink
                    to="/profile/received-bids"
                    className={({ isActive }) =>
                        `admin-btn ${
                            isActive ? "" : "admin-btn-secondary"
                        }`
                    }
                >
                    <Inbox size={17} />
                    Received Bids
                </NavLink>

                {isAdmin === true && (
                    <NavLink
                        to="/profile/admin"
                        className={({ isActive }) =>
                            `admin-btn ${
                                isActive ? "" : "admin-btn-secondary"
                            }`
                        }
                    >
                        <ShieldCheck size={17} />
                        Admin Dashboard
                    </NavLink>
                )}
            </div>

            {/* Current Account Page */}
            <Outlet />
        </div>
    );
};

export default AccountPage;