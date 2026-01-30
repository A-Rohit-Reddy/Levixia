import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, report, progress } = useUser();
  const name = profile?.name || user?.name || 'there';
  const hasReport = report?.completed;
  const sessions = [...(progress?.readingSessions || []), ...(progress?.writingSessions || [])];
  const recentAccuracy = progress?.accuracyHistory?.slice(-5) || [];

  return (
    <Layout>
      <div className="dashboard-page">
        <h1 className="dashboard-greeting">Hello, {name}</h1>
        <p className="dashboard-tagline">Your Levixia dashboard</p>

        <div className="dashboard-grid">
          <Link to="/assistant" className="card dashboard-card dashboard-card-primary">
            <h2>Adaptive assistant</h2>
            <p>Paste text or upload a file. Get adapted reading or writing support and track your accuracy.</p>
            <span className="card-cta">Open assistant →</span>
          </Link>

          {!hasReport && (
            <Link to="/screening" className="card dashboard-card">
              <h2>Take assessment</h2>
              <p>Complete the short screening to get a personalized report and recommended settings.</p>
              <span className="card-cta">Start assessment →</span>
            </Link>
          )}

          {hasReport && (
            <Link to="/report" className="card dashboard-card">
              <h2>Your report</h2>
              <p>View your profile, dyslexia type and level, and recommended features.</p>
              <span className="card-cta">View report →</span>
            </Link>
          )}

          <Link to="/assistant-config" className="card dashboard-card">
            <h2>Assistant settings</h2>
            <p>Adjust Bionic Reading, spacing, font, contrast, text-to-speech, and more.</p>
            <span className="card-cta">Configure →</span>
          </Link>

          <div className="card dashboard-card dashboard-card-stats">
            <h2>Progress</h2>
            <p>Sessions: {sessions.length}</p>
            {recentAccuracy.length > 0 && (
              <p>Recent accuracy: {Math.round(recentAccuracy.reduce((a, x) => a + (x.accuracy || 0), 0) / recentAccuracy.length)}%</p>
            )}
            {sessions.length === 0 && <p className="muted">Use the assistant to see your progress here.</p>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
