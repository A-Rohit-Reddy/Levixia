import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import './Assistant.css';

const TASK_OPTIONS = [
  { value: 'reading', label: 'Reading' },
  { value: 'writing', label: 'Writing' },
  { value: 'mixed', label: 'Mixed (read & write)' },
];

// Simple bionic-style: bold first ~half of each word
function bionicText(text) {
  return text.replace(/\b(\w{1,3})(\w*)\b/g, (_, a, b) => (b ? `<b>${a}</b>${b}` : a));
}

// Chunk into short lines for cognitive load
function chunkText(text, maxWords = 5) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks.join('\n');
}

export default function Assistant() {
  const { assistantConfig, addProgressSession } = useUser();
  const [inputMode, setInputMode] = useState('paste'); // paste | file | voice
  const [taskMode, setTaskMode] = useState('reading');
  const [sourceText, setSourceText] = useState('');
  const [userText, setUserText] = useState('');
  const [adaptedText, setAdaptedText] = useState('');
  const [accuracy, setAccuracy] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const fileInputRef = useRef(null);

  const config = assistantConfig || {};

  const processSource = useCallback((text) => {
    if (!text.trim()) {
      setAdaptedText('');
      return;
    }
    let out = text;
    if (config.cognitiveLoadReduction) out = chunkText(out, 5);
    if (config.bionicReading) {
      const withBionic = bionicText(out);
      setAdaptedText(withBionic);
      return;
    }
    setAdaptedText(out);
  }, [config.bionicReading, config.cognitiveLoadReduction]);

  const handlePasteChange = (e) => {
    const v = e.target.value;
    setSourceText(v);
    processSource(v);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      let text = reader.result;
      if (typeof text !== 'string') text = String(text);
      setSourceText(text);
      processSource(text);
      setIsProcessing(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCompare = () => {
    if (!sourceText.trim() || !userText.trim()) return;
    const sourceWords = sourceText.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const userWords = userText.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let match = 0;
    const minLen = Math.min(sourceWords.length, userWords.length);
    for (let i = 0; i < minLen; i++) {
      if (sourceWords[i] === userWords[i]) match++;
    }
    const acc = sourceWords.length > 0 ? Math.round((match / Math.max(sourceWords.length, userWords.length)) * 100) : 0;
    setAccuracy(acc);
    setShowComparison(true);
    addProgressSession(taskMode === 'reading' ? 'reading' : 'writing', {
      accuracy: acc,
      sourceLength: sourceWords.length,
      userLength: userWords.length,
    });
  };

  const resetComparison = () => {
    setAccuracy(null);
    setShowComparison(false);
  };

  const spacingStyle = {
    letterSpacing: `${(config.letterSpacing || 1) * 0.05}em`,
    wordSpacing: `${(config.wordSpacing || 1.2) * 0.25}em`,
    lineHeight: config.lineSpacing || 1.5,
  };

  const fontClass = config.font === 'opendyslexic' ? 'dyslexia-font' : '';

  return (
    <Layout>
      <div className="assistant-page">
        <h1>Levixia adaptive assistant</h1>
        <p className="assistant-intro">
          Paste text or upload a file. Choose reading or writing. We adapt the content and can compare your input to the original for accuracy.
        </p>

        <div className="card assistant-card">
          <div className="form-group">
            <label>Task</label>
            <div className="task-options">
              {TASK_OPTIONS.map((t) => (
                <label key={t.value} className="task-option">
                  <input
                    type="radio"
                    name="task"
                    value={t.value}
                    checked={taskMode === t.value}
                    onChange={() => setTaskMode(t.value)}
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Input content</label>
            <div className="input-mode-tabs">
              <button
                type="button"
                className={inputMode === 'paste' ? 'active' : ''}
                onClick={() => setInputMode('paste')}
              >
                Paste text
              </button>
              <button
                type="button"
                className={inputMode === 'file' ? 'active' : ''}
                onClick={() => { setInputMode('file'); fileInputRef.current?.click(); }}
              >
                Upload file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.html"
                className="sr-only"
                onChange={handleFileSelect}
              />
            </div>
            {inputMode === 'paste' && (
              <textarea
                className="assistant-textarea source"
                placeholder="Paste or type the text you want to read or write from..."
                value={sourceText}
                onChange={handlePasteChange}
                rows={6}
              />
            )}
            {inputMode === 'file' && (
              <div className="file-zone" onClick={() => fileInputRef.current?.click()}>
                {isProcessing ? 'Loading...' : 'Click to choose a .txt or .md file'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.html"
                  className="sr-only"
                  onChange={handleFileSelect}
                />
              </div>
            )}
          </div>

          {adaptedText && (
            <div className="form-group adapted-block">
              <label>Adapted text (for you)</label>
              <div
                className={`assistant-output ${fontClass}`}
                style={spacingStyle}
                dangerouslySetInnerHTML={{ __html: adaptedText }}
              />
            </div>
          )}

          {(taskMode === 'writing' || taskMode === 'mixed') && sourceText && (
            <div className="form-group">
              <label>Your writing (type or paste)</label>
              <textarea
                className="assistant-textarea user"
                placeholder="Type what you read or write here..."
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                rows={5}
              />
              <div className="assistant-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCompare}
                  disabled={!userText.trim()}
                >
                  Compare accuracy
                </button>
                {showComparison && (
                  <button type="button" className="btn btn-secondary" onClick={resetComparison}>
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {showComparison && accuracy != null && (
            <div className="accuracy-block card">
              <h3>Accuracy</h3>
              <p className="accuracy-value">{accuracy}%</p>
              <p className="accuracy-desc">
                Your text matched the source at {accuracy}% (word-level). This is saved to your progress.
              </p>
            </div>
          )}
        </div>

        <p className="assistant-hint">
          Your assistant uses: {config.bionicReading ? 'Bionic Reading, ' : ''}
          {config.cognitiveLoadReduction ? 'chunked text, ' : ''}
          {config.textToSpeech ? 'Text-to-speech (use browser or OS), ' : ''}
          {config.writingSupport ? 'writing support. ' : ''}
          Adjust in <Link to="/assistant-config">Assistant settings</Link>.
        </p>
      </div>
    </Layout>
  );
}
