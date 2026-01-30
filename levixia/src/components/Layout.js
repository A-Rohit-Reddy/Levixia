import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';
import './Layout.css';

export default function Layout({ children, showHeader = true }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!showHeader) return <div className="app">{children}</div>;

  return (
    <div className="app">
      <header className="layout-header">
        <Link to={user ? '/dashboard' : '/'} className="brand">
          Levixia
        </Link>
        <nav>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/assistant">Assistant</Link>
              <button type="button" className="btn btn-header" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Sign up</Link>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <Footer />
    </div>
  );
}
