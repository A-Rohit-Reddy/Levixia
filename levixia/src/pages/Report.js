import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import './Report.css';

const LEVEL_LABELS = {
  'no-significant-difficulty': 'No Significant Difficulty',
  mild: 'Mild',
  moderate: 'Moderate',
  significant: 'Significant',
  severe: 'Severe'
};

const TYPE_DESC = {
  'Phonological Dyslexia': 'Difficulty linking sounds to letters; affects decoding and spelling.',
  'Surface Dyslexia': 'Difficulty recognizing whole words; spelling may be inconsistent.',
  'Rapid Naming Dyslexia': 'Slower naming speed affecting reading fluency.',
  'Double Deficit Dyslexia': 'Both phonological and rapid naming difficulties.',
  'Visual (Orthographic) Dyslexia': 'Visual stress or crowding; letters may seem to move or blur.',
  'Auditory Dyslexia': 'Sound discrimination and listening processing difficulties.',
  'Developmental Dyslexia': 'Learning differences present from early development.',
  'Acquired Dyslexia': 'Reading difficulties following injury or illness (rare in screening).',
  'ADHD-related indicators': 'Patterns suggesting attention or executive function support may help.',
  Phonological: 'Difficulty linking sounds to letters; affects decoding and spelling.',
  Surface: 'Difficulty recognizing whole words; spelling may be inconsistent.',
  Visual: 'Visual stress or crowding; letters may seem to move or blur.',
  Mixed: 'Combination of the above.',
  'None identified': 'No specific learning pattern was strongly indicated from this screening.',
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

  const llmReport = report._llmReport || null;
  const executiveSummary = llmReport?.executiveSummary;
  const personalizedFeedback = llmReport?.personalizedFeedback;
  const perTestBreakdown = llmReport?.perTestBreakdown;
  const detectedConditions = llmReport?.detectedConditions || types.filter(t => t !== 'None identified');
  const primaryType = llmReport?.primaryType || types[0] || 'None identified';
  const adhdIndicators = llmReport?.adhdIndicators || [];
  const severityLevel = llmReport?.severityLevel || LEVEL_LABELS[level] || level;
  const confidenceScore = llmReport?.confidenceScore ?? report._inference?.confidence ?? null;
  const disclaimer = llmReport?.disclaimer;
  const recommendProfessional = llmReport?.recommendProfessionalEvaluation === true;

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
            This screening covers reading & language, writing & spelling, visual processing, auditory (inferred), and cognitive & attention. Results are used to personalize your assistant—not as a clinical diagnosis.
          </p>

          {recommendProfessional && (
            <section className="report-section report-professional-banner">
              <strong>Recommendation:</strong> For persistent difficulties or if you want a formal assessment, we recommend a professional evaluation by a qualified specialist.
            </section>
          )}

          {executiveSummary && (
            <section className="report-section">
              <h2>Executive Summary</h2>
              <p className="report-desc" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                {executiveSummary}
              </p>
            </section>
          )}

          {perTestBreakdown && (
            <section className="report-section">
              <h2>Test Breakdown</h2>
              {perTestBreakdown.cognitive && (
                <p className="report-desc"><strong>Cognitive:</strong> {perTestBreakdown.cognitive}</p>
              )}
              {perTestBreakdown.visual && (
                <p className="report-desc"><strong>Visual:</strong> {perTestBreakdown.visual}</p>
              )}
              {perTestBreakdown.reading && (
                <p className="report-desc"><strong>Reading:</strong> {perTestBreakdown.reading}</p>
              )}
              {perTestBreakdown.spelling && (
                <p className="report-desc"><strong>Spelling:</strong> {perTestBreakdown.spelling}</p>
              )}
            </section>
          )}

          {scores && (
            <section className="report-section report-scores">
              <h2>Assessment scores</h2>
              <div className="results-grid">
                <div className="result-card">
                  <h3>📖 Reading</h3>
                  <div className="result-score">{scores.readingAccuracy ?? '—'}%</div>
                  <p className="report-desc">Accuracy</p>
                  {scores.readingWpm != null && <p className="report-desc">{scores.readingWpm} WPM</p>}
                  {scores.optimalFontSize && (
                    <p className="report-desc" style={{ color: '#00d4ff', fontWeight: 'bold', marginTop: '8px' }}>
                      Optimal Font Size: {scores.optimalFontSize}px
                    </p>
                  )}
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
              
              {/* Font Size Optimization Details */}
              {scores.fontSizeOptimization && (
                <div className="report-section" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0 }}>📏 Font Size Optimization</h3>
                  <p className="report-desc">
                    <strong>Initial Font Size:</strong> {scores.fontSizeOptimization.initialFontSize}px<br/>
                    <strong>Optimal Font Size:</strong> {scores.fontSizeOptimization.optimalFontSize}px<br/>
                    <strong>Reading Attempts:</strong> {scores.fontSizeOptimization.attempts}<br/>
                    <strong>Accuracy Achieved:</strong> {scores.fontSizeOptimization.accuracyAchieved ? '✅ Yes (≥70%)' : '❌ No'}
                  </p>
                  <p className="report-desc" style={{ marginTop: '10px', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    This optimal font size will be automatically applied in your personalized assistant for the best reading experience.
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="report-section">
            <h2>Detected condition(s)</h2>
            <p className="report-desc">Screening suggests the following patterns (for personalization only; not a diagnosis):</p>
            <div className="report-badges">
              {(detectedConditions.length ? detectedConditions : types).filter(Boolean).length > 0
                ? (detectedConditions.length ? detectedConditions : types).map((t) => (
                    <span key={t} className="badge badge-type">{t}</span>
                  ))
                : <span className="badge badge-type">None identified</span>
              }
            </div>
          </section>

          <section className="report-section">
            <h2>Primary type</h2>
            <p className="report-desc">
              <strong>{primaryType}</strong>
              {TYPE_DESC[primaryType] && ` — ${TYPE_DESC[primaryType]}`}
            </p>
          </section>

          {adhdIndicators.length > 0 && (
            <section className="report-section">
              <h2>Attention & executive indicators</h2>
              <ul className="report-list">
                {adhdIndicators.map((ind) => (
                  <li key={ind}>{ind}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="report-section">
            <h2>Severity level</h2>
            <div className="report-badges">
              <span className="badge badge-level">{severityLevel}</span>
              {confidenceScore != null && (
                <span className="badge badge-confidence">Confidence: {Math.round(confidenceScore * 100)}%</span>
              )}
            </div>
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

          {personalizedFeedback && (
            <section className="report-section">
              <h2>Personalized feedback</h2>
              <p className="report-desc" style={{ fontSize: '1.05rem', lineHeight: '1.6', fontStyle: 'italic' }}>
                {personalizedFeedback}
              </p>
            </section>
          )}

          <section className="report-section report-disclaimer">
            <h2>Disclaimer</h2>
            <p className="report-desc">
              {disclaimer || 'This report is from a screening and personalization tool only. It is not a medical or clinical diagnosis. For diagnosis or treatment, please see a qualified professional.'}
            </p>
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
