import {
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  FileText,
  Briefcase,
  Settings,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Admin.css";

const AdminLayout = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <h2>
              gvice. <span>Admin</span>
            </h2>
            <p className="admin-user">{user?.email}</p>
          </div>

          <nav className="admin-nav">
            <div className="admin-menu">
              <Link
                  to="/admin"
                  className={location.pathname === "/admin" ? "active" : ""}
              >
                <LayoutDashboard size={20} />
                Dashboard
              </Link>

              <Link
                  to="/admin/news"
                  className={location.pathname === "/admin/news" ? "active" : ""}
              >
                <FileText size={20} />
                Manage News
              </Link>

              <Link
                  to="/admin/tenders"
                  className={location.pathname === "/admin/tenders" ? "active" : ""}
              >
                <Briefcase size={20} />
                Manage Tenders
              </Link>

              <Link
                  to="/admin/equipment"
                  className={
                    location.pathname === "/admin/equipment" ? "active" : ""
                  }
              >
                <Settings size={20} />
                Manage Equipment
              </Link>
            </div>
          </nav>

          <div className="admin-sidebar-footer">
            <Link to="/" className="admin-nav-link">
              <ArrowLeft size={20} />
              Back to Site
            </Link>

            <button onClick={logout} className="admin-nav-link logout-btn">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </aside>

        <main className="admin-main">
          <header className="admin-header">
            <h1>Admin Portal</h1>
          </header>

          <div className="admin-content-area">
            <Outlet />
          </div>
        </main>
      </div>
  );
};

export default AdminLayout;