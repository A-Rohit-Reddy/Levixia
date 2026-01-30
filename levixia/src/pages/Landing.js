import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './Landing.css';

export default function Landing() {
  const { user } = useAuth();

  return (
    <Layout>
      <section className="landing-hero">
        <h1 className="landing-title">Levixia</h1>
        <p className="landing-tagline">
          Your AI-powered companion for dyslexia and learning support
        </p>
        <p className="landing-desc">
          Take a short assessment to personalize your assistant. Get a clear report,
          recommended settings, and an adaptive assistant for reading and writing.
        </p>
        {user ? (
          <div className="landing-actions">
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              Go to Dashboard
            </Link>
            <Link to="/assistant" className="btn btn-secondary btn-lg">
              Open Assistant
            </Link>
          </div>
        ) : (
          <div className="landing-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get started
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Log in
            </Link>
          </div>
        )}
      </section>
      <section className="landing-features card">
        <h2>How it works</h2>
        <ol className="feature-list">
          <li><strong>Register & profile</strong> — Name, age group, language (optional).</li>
          <li><strong>Short assessment</strong> — Reading, writing, visual, auditory, and attention tests.</li>
          <li><strong>Your report</strong> — Dyslexia type and level, strengths, challenges, and suggested features.</li>
          <li><strong>Configure assistant</strong> — Bionic reading, spacing, font, colors, text-to-speech, and more.</li>
          <li><strong>Use the assistant</strong> — Paste text or upload files; get adapted content and compare your accuracy.</li>
        </ol>
      </section>
    </Layout>
  );
}
