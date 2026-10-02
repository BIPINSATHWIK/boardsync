import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { connectSocket } from '../store/socketStore';

export default function SignupPage() {
  const { signup, isLoading, error, fieldErrors: serverFieldErrors, clearError, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [localFieldErrors, setLocalFieldErrors] = useState({});

  if (user) return <Navigate to="/" replace />;

  // Merge local (client-side) and server field errors; local takes priority
  const fieldErrors = { ...serverFieldErrors, ...localFieldErrors };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalError('');
    setLocalFieldErrors({});

    const errs = {};

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errs.email = 'Enter a valid email address — must contain @ and a domain (e.g. you@example.com)';
    }

    if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (password !== confirm) {
      errs.confirm = 'Passwords do not match';
    }

    if (Object.keys(errs).length > 0) {
      setLocalFieldErrors(errs);
      return;
    }

    const ok = await signup(email, password);
    if (ok) {
      const token = localStorage.getItem('accessToken');
      if (token) connectSocket(token);
    }
  };

  // Show a banner only for non-field errors (e.g. "Email already in use", rate-limit)
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const bannerError = !hasFieldErrors ? (localError || error) : null;

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-header">
          <h1 className="auth-logo">Board<span>Sync</span></h1>
          <p className="auth-subtitle">Create your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} id="signup-form">
          {/* Banner for non-field errors like "Email already in use" or rate-limit */}
          {bannerError && <div className="auth-error" role="alert">{bannerError}</div>}

          <div className="input-group">
            <label className="input-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              className={`input${fieldErrors.email ? ' input-error' : ''}`}
              type="text"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setLocalFieldErrors((f) => ({ ...f, email: '' })); clearError(); }}
              required
              autoComplete="email"
            />
            {fieldErrors.email && <p className="field-hint field-hint-error">⚠ {fieldErrors.email}</p>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              className={`input${fieldErrors.password ? ' input-error' : ''}`}
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLocalFieldErrors((f) => ({ ...f, password: '' })); }}
              required
              autoComplete="new-password"
            />
            {fieldErrors.password && <p className="field-hint field-hint-error">⚠ {fieldErrors.password}</p>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              className={`input${fieldErrors.confirm ? ' input-error' : ''}`}
              type="password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setLocalFieldErrors((f) => ({ ...f, confirm: '' })); }}
              required
              autoComplete="new-password"
            />
            {fieldErrors.confirm && <p className="field-hint field-hint-error">⚠ {fieldErrors.confirm}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isLoading}
            id="signup-submit"
            style={{ marginTop: '0.5rem' }}
          >
            {isLoading ? <><span className="spinner" /> Creating account…</> : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
