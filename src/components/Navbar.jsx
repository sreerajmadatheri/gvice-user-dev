import { useState } from "react";
import { useLocation, Link } from "react-router-dom";

import {
  Search,
  User,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import LoginModal from "./LoginModal";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();

  const {
    user,
    profile,
    logout,
  } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
      useState(false);

  const [showLoginModal, setShowLoginModal] =
      useState(false);

  const navLinks = [
    {
      name: "Home",
      path: "/",
    },
    {
      name: "Auction",
      path: "/auction",
    },
    {
      name: "News",
      path: "/news",
    },
    {
      name: "Tenders",
      path: "/tenders",
    },
    {
      name: "Projects",
      path: "/projects",
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleNavClick = (e, path) => {
    if (path === "/auction" && !user) {
      e.preventDefault();

      setShowLoginModal(true);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const profileImage =
      profile?.profileImage ||
      user?.photoURL ||
      "";

  const displayName =
      profile?.displayName ||
      user?.displayName ||
      user?.email ||
      "Profile";

  return (
      <nav className="navbar">
        <div className="nav-container">

          {/* LEFT SIDE */}
          <div className="nav-left">

            {/* Mobile Menu Button */}
            <button
                className="mobile-only icon-btn"
                onClick={toggleMobileMenu}
                type="button"
                aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? (
                  <X size={24} />
              ) : (
                  <Menu size={24} />
              )}
            </button>

            {/* Brand */}
            <Link
                to="/"
                className="brand-logo"
                onClick={() =>
                    setIsMobileMenuOpen(false)
                }
            >
              GVICE.
            </Link>

            {/* Desktop Navigation */}
            <ul className="nav-links desktop-only">
              {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                        to={link.path}
                        className={`nav-link ${
                            location.pathname === link.path
                                ? "active"
                                : ""
                        }`}
                        onClick={(e) =>
                            handleNavClick(
                                e,
                                link.path
                            )
                        }
                    >
                      {link.name}
                    </Link>
                  </li>
              ))}
            </ul>

          </div>

          {/* RIGHT SIDE */}
          <div className="nav-right">

            {/* Search */}
            <button
                className="icon-btn"
                type="button"
                aria-label="Search"
            >
              <Search size={20} />
            </button>

            <div className="divider desktop-only"></div>

            {user ? (
                <>
                  {/* Clickable Profile */}
                  <Link
                      to="/profile"
                      className="desktop-only"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                      title="My Profile"
                  >
                    {profileImage ? (
                        <img
                            src={profileImage}
                            alt="Profile"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor: "#e5e7eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                        >
                          <User size={18} />
                        </div>
                    )}

                    <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                    >
                  {displayName}
                </span>
                  </Link>

                  {/* Logout */}
                  <button
                      className="login-btn"
                      onClick={handleLogout}
                      title="Logout"
                      type="button"
                  >
                    <LogOut size={18} />
                  </button>
                </>
            ) : (
                <button
                    className="login-btn"
                    onClick={() =>
                        setShowLoginModal(true)
                    }
                    type="button"
                >
                  <User size={18} />
                  <span className="desktop-only">
                Login
              </span>
                </button>
            )}
          </div>
        </div>

        {/* MOBILE MENU */}
        {isMobileMenuOpen && (
            <div className="mobile-menu">
              <ul className="mobile-nav-links">

                {navLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                          to={link.path}
                          className={`mobile-nav-link ${
                              location.pathname === link.path
                                  ? "active"
                                  : ""
                          }`}
                          onClick={(e) => {
                            handleNavClick(
                                e,
                                link.path
                            );

                            if (
                                link.path !== "/auction" ||
                                user
                            ) {
                              setIsMobileMenuOpen(false);
                            }
                          }}
                      >
                        {link.name}
                      </Link>
                    </li>
                ))}

                {user && (
                    <li>

                      {/* Mobile Profile */}
                      <Link
                          to="/profile"
                          onClick={() =>
                              setIsMobileMenuOpen(false)
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            textDecoration: "none",
                            color: "var(--text-primary)",
                            paddingTop: "1rem",
                            borderTop:
                                "1px solid var(--border-color)",
                          }}
                      >
                        {profileImage ? (
                            <img
                                src={profileImage}
                                alt="Profile"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                            />
                        ) : (
                            <User size={20} />
                        )}

                        <span>
                    {displayName}
                  </span>
                      </Link>

                      {/* Mobile Logout */}
                      <button
                          className="login-btn"
                          onClick={handleLogout}
                          type="button"
                          style={{
                            marginTop: "1rem",
                          }}
                      >
                        <LogOut size={16} />
                        Logout
                      </button>

                    </li>
                )}

              </ul>
            </div>
        )}

        <LoginModal
            isOpen={showLoginModal}
            onClose={() =>
                setShowLoginModal(false)
            }
        />
      </nav>
  );
};

export default Navbar;