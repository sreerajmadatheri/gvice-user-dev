
import { useAuth } from '../context/AuthContext';
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // For MVP, we simply require the user to be logged in.
  // To restrict to specific admins, you can check user.email against an allowed list:
  // const adminEmails = ['admin@gvice.com'];
  // if (!user || !adminEmails.includes(user.email)) return <Navigate to="/" />;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

