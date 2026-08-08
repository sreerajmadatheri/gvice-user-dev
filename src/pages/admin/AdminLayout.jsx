import {
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  FileText,
  Briefcase,
  Settings,
  Gavel,
  FolderKanban,
} from "lucide-react";

import {
  Link,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import "./Admin.css";

const AdminLayout = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <h2>
              gvice. <span>Admin</span>
            </h2>

            <p className="admin-user">
              {user?.email || "Administrator"}
            </p>
          </div>

          <nav className="admin-nav">
            <div className="admin-menu">
              <Link
                  to="/admin"
                  className={isActive("/admin") ? "active" : ""}
              >
                <LayoutDashboard size={20} />
                Dashboard
              </Link>

              <Link
                  to="/admin/news"
                  className={isActive("/admin/news") ? "active" : ""}
              >
                <FileText size={20} />
                Manage News
              </Link>

              <Link
                  to="/admin/tenders"
                  className={isActive("/admin/tenders") ? "active" : ""}
              >
                <Briefcase size={20} />
                Manage Tenders
              </Link>

              <Link
                  to="/admin/equipment"
                  className={
                    isActive("/admin/equipment")
                        ? "active"
                        : ""
                  }
              >
                <Settings size={20} />
                Manage Equipment
              </Link>

              <Link
                  to="/admin/projects"
                  className={
                    isActive("/admin/projects")
                        ? "active"
                        : ""
                  }
              >
                <FolderKanban size={20} />
                Manage Projects
              </Link>

              <Link
                  to="/admin/bids"
                  className={
                    isActive("/admin/bids")
                        ? "active"
                        : ""
                  }
              >
                <Gavel size={20} />
                Manage Bids
              </Link>
            </div>
          </nav>

          <div className="admin-sidebar-footer">
            <Link
                to="/"
                className="admin-nav-link"
            >
              <ArrowLeft size={20} />
              Back to Site
            </Link>

            <button
                onClick={logout}
                className="admin-nav-link logout-btn"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main */}
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