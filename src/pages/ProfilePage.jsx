import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
    const { user, profile } = useAuth();

    return (
        <div>
            <h2>My Profile</h2>

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
        </div>
    );
};

export default ProfilePage;