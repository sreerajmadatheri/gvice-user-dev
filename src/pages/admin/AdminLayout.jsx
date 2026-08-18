import {
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  FileText,
  Briefcase,
  Settings,
  Gavel,
  FolderKanban,
  Users,
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
                  to="/profile/admin"
                  className={
                    isActive("/profile/admin")
                        ? "admin-nav-link active"
                        : "admin-nav-link"
                  }
              >
                <LayoutDashboard size={20} />
                Dashboard
              </Link>


              <Link
                  to="/profile/admin/users"
                  className={
                    isActive("/profile/admin/users")
                        ? "admin-nav-link active"
                        : "admin-nav-link"
                  }
              >
                <Users size={20} />
                Manage Users
              </Link>


              <Link
                  to="/profile/admin/news"
                  className={
                    isActive("/profile/admin/news")
                        ? "admin-nav-link active"
                        : "admin-nav-link"
                  }
              >
                <FileText size={20} />
                Manage News
              </Link>


              <Link
                  to="/profile/admin/tenders"
                  className={
                    isActive("/profile/admin/tenders")
                        ? "admin-nav-link active"
                        : "admin-nav-link"
                  }
              >
                <Briefcase size={20} />
                Manage Tenders
              </Link>


              <Link
                  to="/profile/admin/equipment"
                  className={
                    isActive("/profile/admin/equipment")
                        ? "admin-nav-link active"
                        : "admin-nav-link"
                  }
              >
                <Settings size={20} />
                Manage Equipment
              </Link>


              <Link
                  to="/profile/admin/projects"
                  className={
                    isActive("/profile/admin/projects")
                        ? "admin-nav-link active"
                        : "admin-nav-link"
                  }
              >
                <FolderKanban size={20} />
                Manage Projects
              </Link>


              <Link
                  to="/profile/admin/bids"
                  className={
                    isActive("/profile/admin/bids")
                        ? "admin-nav-link active"
                        : "admin-nav-link"
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
            <h1>
              Admin Portal
            </h1>
          </header>


          <div className="admin-content-area">
            <Outlet />
          </div>

        </main>

      </div>
  );
};

export default AdminLayout;