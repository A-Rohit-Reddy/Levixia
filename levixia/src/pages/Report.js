import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import './Report.css';

const LEVEL_LABELS = { mild: 'Mild', moderate: 'Moderate', significant: 'Significant', severe: 'Severe' };
const TYPE_DESC = {
  Phonological: 'Difficulty linking sounds to letters; affects decoding and spelling.',
  Surface: 'Difficulty recognizing whole words; spelling may be inconsistent.',
  Visual: 'Visual stress or crowding; letters may seem to move or blur.',
  Mixed: 'Combination of the above.',
  'None identified': 'No specific dyslexia type was strongly indicated from your answers.',
};

export default function Report() {
  const { report } = useUser();
  const types = report.dyslexiaTypes || [];
  const level = report.level || 'mild';
  const cognitive = report.cognitiveIndicators || [];
  const strengths = report.strengths || [];
  const challenges = report.challenges || [];
  const features = report.recommendedFeatures || [];
  const scores = report._scores || null;
  const hasReport = report?.completed;

  if (!hasReport) {
    return (
      <Layout>
        <div className="report-page">
          <div className="card report-card">
            <h1>Your Levixia report</h1>
            <p className="report-intro">Complete the assessment to see your personalized report.</p>
            <Link to="/assessment" className="btn btn-primary btn-lg">
              Start assessment
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="report-page">
        <div className="card report-card">
          <h1>Your Levixia report</h1>
          <p className="report-intro">
            This report is based on your assessment. It helps us suggest the best settings for your assistant. It is not a medical diagnosis.
          </p>

          {scores && (
            <section className="report-section report-scores">
              <h2>Assessment scores</h2>
              <div className="results-grid">
                <div className="result-card">
                  <h3>📖 Reading</h3>
                  <div className="result-score">{scores.readingAccuracy ?? '—'}%</div>
                  <p className="report-desc">Accuracy</p>
                  {scores.readingWpm != null && <p className="report-desc">{scores.readingWpm} WPM</p>}
                </div>
                <div className="result-card">
                  <h3>✍️ Spelling</h3>
                  <div className="result-score">{scores.spellingAccuracy ?? '—'}%</div>
                  <p className="report-desc">Accuracy</p>
                </div>
                <div className="result-card">
                  <h3>👁️ Visual</h3>
                  <div className="result-score">{scores.visualAccuracy ?? '—'}%</div>
                  <p className="report-desc">Discrimination</p>
                  {scores.visualTime != null && <p className="report-desc">{scores.visualTime}s</p>}
                </div>
                <div className="result-card">
                  <h3>🧠 Memory</h3>
                  <div className="result-score">{scores.cognitiveAccuracy ?? '—'}%</div>
                  <p className="report-desc">Recall accuracy</p>
                </div>
              </div>
            </section>
          )}

          <section className="report-section">
            <h2>Identified profile</h2>
            <div className="report-badges">
              {types.map((t) => (
                <span key={t} className="badge badge-type">
                  {t}
                </span>
              ))}
              <span className="badge badge-level">{LEVEL_LABELS[level] || level}</span>
            </div>
            {types.map((t) => (
              <p key={t} className="report-desc">
                <strong>{t}:</strong> {TYPE_DESC[t] || ''}
              </p>
            ))}
          </section>

          {cognitive.length > 0 && (
            <section className="report-section">
              <h2>Cognitive indicators</h2>
              <ul className="report-list">
                {cognitive.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="report-section">
            <h2>Strengths</h2>
            <ul className="report-list report-list-good">
              {strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          {challenges.length > 0 && (
            <section className="report-section">
              <h2>Challenges</h2>
              <ul className="report-list">
                {challenges.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="report-section">
            <h2>Recommended accessibility features</h2>
            <p className="report-desc">We suggest turning these on in the next step so your assistant fits you better.</p>
            <ul className="report-list report-features">
              {features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>

          <div className="report-actions">
            <Link to="/assistant-config" className="btn btn-primary btn-lg">
              Configure my assistant
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-lg">
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
