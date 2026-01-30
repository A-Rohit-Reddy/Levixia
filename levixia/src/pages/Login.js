import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile-setup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="auth-container">
        <div className="auth-background-effects" aria-hidden="true">
          <div className="glow-orb glow-orb-1" />
          <div className="glow-orb glow-orb-2" />
          <div className="glow-orb glow-orb-3" />
        </div>
        <div className="auth-wrapper">
          <div className="auth-header">
            <div className="auth-logo-accent"></div>
            <h1 className="auth-title">Welcome <span className="title-accent">Back</span></h1>
            <p className="auth-subtitle">Enter the realm of Levixia</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="alert alert-error" role="alert">
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="login-email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@levixia.com"
                  className="form-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="form-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>Accessing...</span>
                </>
              ) : (
                <>
                  <span>Enter Levixia</span>
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text">
              New to Levixia?{' '}
              <Link to="/register" className="auth-link">
                Create Account
                <span className="link-arrow">→</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}