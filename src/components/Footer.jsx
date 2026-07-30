import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <h2 className="brand-logo">gvice.</h2>
          <p className="brand-desc">
            Your premium source for project intelligence, tenders, and news focused on Aramco and the Middle East.
          </p>
        </div>
        
        <div className="footer-links-grid">
          <div className="footer-col">
            <h3>Explore</h3>
            <ul>
              <li><Link to="/news">News Room</Link></li>
              <li><Link to="/tenders">Tenders</Link></li>
              <li><Link to="/projects">Projects</Link></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h3>Company</h3>
            <ul>
              <li><Link to="/">About Us</Link></li>
              <li><Link to="/">Careers</Link></li>
              <li><Link to="/">Contact</Link></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h3>Connect</h3>
            <ul className="social-links" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <li>
                <a href="https://www.linkedin.com/in/gvice/" aria-label="LinkedIn Profile" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'background 0.3s' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom container">
        <p>&copy; {new Date().getFullYear()} gvice. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

