import { useState, useEffect } from 'react';
import { X, Mail, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../lib/firebase';
import './LoginModal.css';

const getFriendlyErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Login window was closed before finishing.';
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format. Include country code.';
    case 'auth/billing-not-enabled':
      return 'Phone login requires a Firebase billing upgrade.';
    case 'auth/operation-not-allowed':
      return 'This login method is not enabled right now.';
    default:
      // Strip out the "Firebase: Error (auth/xxxxx)." format
      let msg = error.message || 'An unexpected error occurred.';
      msg = msg.replace(/Firebase:\s*/, '').replace(/\s*\(auth\/.*\)\.?/, '');
      return msg;
  }
};

const LoginModal = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginWithApple, loginWithEmail, signupWithEmail } = useAuth();
  const [view, setView] = useState('options'); // options, email, phone, phone-verify
  
  // Email state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Setup Recaptcha when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: (response) => {
              // reCAPTCHA solved
            }
          });
        } catch (err) {
          console.warn("Recaptcha init warning: ", err);
        }
      } else {
        // If it already exists, clear it and recreate it to attach to the new DOM node
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible'
          });
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    setView('options');
    setError('');
    setEmail('');
    setPassword('');
    setVerificationSent(false);
    setPhoneNumber('');
    setVerificationCode('');
    onClose();
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await loginWithGoogle();
      handleClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  const handleAppleLogin = async () => {
    try {
      setError('');
      await loginWithApple();
      handleClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await signupWithEmail(email, password);
        setVerificationSent(true);
      } else {
        await loginWithEmail(email, password);
        handleClose();
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setView('phone-verify');
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      // Reset recaptcha if error
      if (window.recaptchaVerifier) window.recaptchaVerifier.render().then(id => window.grecaptcha.reset(id));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await confirmationResult.confirm(verificationCode);
      handleClose();
    } catch (err) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="login-modal glass-panel">
        <button className="close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="login-header">
          {view !== 'options' && (
            <button className="back-btn" onClick={() => { setView('options'); setError(''); }}>
              <ArrowLeft size={20} />
            </button>
          )}
          <h2>{view === 'options' ? 'Welcome to GVICE' : view === 'email' ? (isSignUp ? 'Create Account' : 'Welcome Back') : 'Phone Login'}</h2>
          <p>{view === 'options' ? 'Sign in to access premium project intelligence.' : view === 'email' ? 'Enter your details below.' : 'We will send you a verification code.'}</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="login-content">
          {view === 'options' && (
            <div className="auth-options">
              <button className="auth-btn google-btn" onClick={handleGoogleLogin}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                Continue with Google
              </button>
              
              <div className="auth-divider">
                <span>or</span>
              </div>
              
              <button className="auth-btn outline-btn" onClick={() => { setView('email'); setError(''); }}>
                <Mail size={18} />
                Continue with Email
              </button>
            </div>
          )}

          {view === 'email' && (
          verificationSent ? (
            <div className="verification-success" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Mail size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Verification Email Sent</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Please check your inbox at <strong>{email}</strong> and click the link to verify your account.
              </p>
              <button className="auth-submit-btn" onClick={handleClose}>
                Got it
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleEmailAuth}>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  required 
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                  disabled={loading}
                />
              </div>
              
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>

              <p className="auth-switch">
                {isSignUp ? 'Already have an account? ' : 'Need an account? '}
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={loading}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </form>
          )
        )}

          {view === 'phone' && (
            <form className="auth-form" onSubmit={handlePhoneAuth}>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  required 
                  placeholder="+966 50 123 4567"
                  style={{ letterSpacing: '1px' }}
                />
                <small>Format: +[Country Code] [Number]</small>
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {view === 'phone-verify' && (
            <form className="auth-form" onSubmit={verifyOtp}>
              <div className="form-group">
                <label>6-Digit Verification Code</label>
                <input 
                  type="text" 
                  value={verificationCode} 
                  onChange={(e) => setVerificationCode(e.target.value)} 
                  required 
                  placeholder="Enter code"
                  maxLength={6}
                />
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
          )}
        </div>
        
        {/* Invisible Recaptcha Container for Phone Auth */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default LoginModal;

