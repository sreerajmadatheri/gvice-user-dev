import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = () => {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "50vh",
                }}
            >
                Checking permissions...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/profile" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;