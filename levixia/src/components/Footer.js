import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="layout-footer">
      <p className="layout-footer-text">
        © {new Date().getFullYear()} Levixia. Built for accessibility and inclusion.
      </p>
      <nav className="layout-footer-nav" aria-label="Footer">
        <Link to="/">Home</Link>
        <Link to="/login">Log in</Link>
      </nav>
    </footer>
  );
}
