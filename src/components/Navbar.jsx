import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

import { Search, User, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Auction', path: '/auction' },
    { name: 'News', path: '/news' },
    { name: 'Tenders', path: '/tenders' },
    { name: 'Projects', path: '/projects' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (e, path) => {
    if (path === '/auction' && !user) {
      e.preventDefault();
      setShowLoginModal(true);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <div className="nav-left">
          <button className="icon-btn mobile-only" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link to="/" className="brand-logo" onClick={() => setIsMobileMenuOpen(false)}>gvice.</Link>
        </div>
        
        <ul className="nav-links desktop-only">
          {navLinks.map(link => (
            <li key={link.name}>
              <Link to={link.path} 
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={(e) => handleNavClick(e, link.path)}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          <button className="icon-btn"><Search size={20} /></button>
          <div className="divider desktop-only"></div>
          {user ? (
            <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <User size={18} />
                )}
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {user.displayName || user.email}
                </span>
              </div>
              <button className="login-btn outline" onClick={logout} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setShowLoginModal(true)}>
              <User size={18} />
              <span className="desktop-only">Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <ul className="mobile-nav-links">
            {navLinks.map(link => (
              <li key={link.name}>
                <Link 
                  to={link.path} 
                  className={`mobile-nav-link ${location.location.pathname === link.path ? 'active' : ''}`}
                  onClick={(e) => {
                    if (link.path !== '/auction' || user) {
                      setIsMobileMenuOpen(false);
                    }
                    handleNavClick(e, link.path);
                  }}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            {user && (
              <li>
                <div className="mobile-user-info">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <User size={16} />
                  )}
                  <span>{user.displayName || user.email}</span>
                </div>
                <button className="login-btn outline" onClick={() => { logout(); setIsMobileMenuOpen(false); }} style={{ marginTop: '1rem', width: '100%' }}>
                  <LogOut size={16} style={{ marginRight: '0.5rem' }} /> Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </nav>
  );
};

export default Navbar;

