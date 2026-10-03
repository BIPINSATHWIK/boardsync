import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { connectSocket } from '../store/socketStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const ok = await login(email, password);
    if (ok) {
      const token = localStorage.getItem('accessToken');
      if (token) connectSocket(token);
      navigate('/');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-header">
          <h1 className="auth-logo">Board<span>Sync</span></h1>
          <p className="auth-subtitle">Real-time collaborative Kanban</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} id="login-form">
          {error && <div className="auth-error" role="alert">{error}</div>}

          <div className="input-group">
            <label className="input-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isLoading}
            id="login-submit"
            style={{ marginTop: '0.5rem' }}
          >
            {isLoading ? <><span className="spinner" /> Signing in…</> : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
