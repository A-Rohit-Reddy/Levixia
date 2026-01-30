import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import './AssistantConfig.css';

const FONTS = [
  { value: 'atkinson', label: 'Atkinson Hyperlegible' },
  { value: 'opendyslexic', label: 'OpenDyslexic (dyslexia-friendly)' },
  { value: 'system', label: 'System default' },
];

const CONTRASTS = [
  { value: 'default', label: 'Default' },
  { value: 'high', label: 'High contrast' },
  { value: 'sepia', label: 'Sepia' },
];

export default function AssistantConfig() {
  const { assistantConfig, updateAssistantConfig, report } = useUser();
  const navigate = useNavigate();
  const [config, setConfig] = useState(assistantConfig);

  const recommended = report.recommendedFeatures || [];

  const handleChange = (key, value) => {
    setConfig((c) => ({ ...c, [key]: value }));
  };

  const handleSave = () => {
    updateAssistantConfig(config);
    navigate('/dashboard', { replace: true });
  };

  return (
    <Layout>
      <div className="assistant-config-page">
        <div className="card">
          <h1>Adaptive assistant configuration</h1>
          <p className="config-intro">
            Adjust these settings to match your report. You can change them anytime from the assistant or dashboard.
          </p>
          {recommended.length > 0 && (
            <p className="config-recommended">
              <strong>Suggested for you:</strong> {recommended.join(', ')}
            </p>
          )}

          <div className="config-section">
            <h2>Reading</h2>
            <label className="config-toggle">
              <input
                type="checkbox"
                checked={config.bionicReading}
                onChange={(e) => handleChange('bionicReading', e.target.checked)}
              />
              <span>Enable Bionic Reading</span>
            </label>
            <p className="config-hint">Bolds the first part of each word to guide the eye.</p>
          </div>

          <div className="config-section">
            <h2>Spacing & layout</h2>
            <div className="form-group">
              <label>Letter spacing</label>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={config.letterSpacing}
                onChange={(e) => handleChange('letterSpacing', parseFloat(e.target.value))}
              />
              <span className="config-value">{config.letterSpacing}</span>
            </div>
            <div className="form-group">
              <label>Word spacing</label>
              <input
                type="range"
                min="1"
                max="2"
                step="0.1"
                value={config.wordSpacing}
                onChange={(e) => handleChange('wordSpacing', parseFloat(e.target.value))}
              />
              <span className="config-value">{config.wordSpacing}</span>
            </div>
            <div className="form-group">
              <label>Line spacing</label>
              <input
                type="range"
                min="1.2"
                max="2.5"
                step="0.1"
                value={config.lineSpacing}
                onChange={(e) => handleChange('lineSpacing', parseFloat(e.target.value))}
              />
              <span className="config-value">{config.lineSpacing}</span>
            </div>
          </div>

          <div className="config-section">
            <h2>Font & contrast</h2>
            <div className="form-group">
              <label>Font</label>
              <select
                value={config.font}
                onChange={(e) => handleChange('font', e.target.value)}
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Color & contrast</label>
              <select
                value={config.contrast}
                onChange={(e) => handleChange('contrast', e.target.value)}
              >
                {CONTRASTS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="config-section">
            <h2>Features</h2>
            <label className="config-toggle">
              <input
                type="checkbox"
                checked={config.textToSpeech}
                onChange={(e) => handleChange('textToSpeech', e.target.checked)}
              />
              <span>Text-to-speech</span>
            </label>
            <label className="config-toggle">
              <input
                type="checkbox"
                checked={config.writingSupport}
                onChange={(e) => handleChange('writingSupport', e.target.checked)}
              />
              <span>Writing support (spelling & grammar suggestions)</span>
            </label>
            <label className="config-toggle">
              <input
                type="checkbox"
                checked={config.cognitiveLoadReduction}
                onChange={(e) => handleChange('cognitiveLoadReduction', e.target.checked)}
              />
              <span>Cognitive load reduction (chunked text, focus line)</span>
            </label>
          </div>

          <div className="config-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={handleSave}>
              Save and go to dashboard
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
