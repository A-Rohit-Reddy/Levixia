import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import apiService from '../services/apiService';
import './Assistant.css';

const TASK_OPTIONS = [
  { value: 'reading', label: 'Reading' },
  { value: 'writing', label: 'Writing' },
  { value: 'mixed', label: 'Mixed (read & write)' },
];

export default function Assistant() {
  const { assessmentResults, report, addProgressSession, userLearningProfile, saveLearningProfile } = useUser();
  const [userProfile, setUserProfile] = useState(userLearningProfile);
  const [inputMode, setInputMode] = useState('paste');
  const [taskMode, setTaskMode] = useState('reading');
  const [sourceText, setSourceText] = useState('');
  const [userText, setUserText] = useState('');
  const [processedResult, setProcessedResult] = useState(null);
  const [adaptiveConfig, setAdaptiveConfig] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const fileInputRef = useRef(null);

  // Load user profile on mount or when assessment results change
  useEffect(() => {
    if (assessmentResults && report && report.completed && !userProfile) {
      loadUserProfile();
    }
  }, [assessmentResults, report]);

  const loadUserProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const profile = await apiService.generateProfile(assessmentResults, report);
      setUserProfile(profile);
      saveLearningProfile(profile);
      console.log('✅ User profile loaded:', profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Use fallback profile
      setUserProfile({
        enabledFeatures: {
          bionicReading: false,
          dyslexiaFont: false,
          smartSpacing: false,
          tts: false,
          writingSupport: true,
          cognitiveLoadReduction: true,
          focusMode: false
        },
        readingPreferences: { preferredPace: 120, chunkSize: 6, highlightKeywords: true, showProgress: true },
        writingPreferences: { realTimeCorrection: true, suggestionLevel: 'moderate', grammarCheck: true, spellingCheck: true },
        attentionProfile: { focusDuration: 20, breakFrequency: 5, distractionReduction: false, timeTracking: true },
        learningStyle: { dominantModality: 'mixed', processingSpeed: 'moderate', detailPreference: 'moderate' }
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Process text when source changes
  const processText = useCallback(async (text) => {
    if (!text.trim()) {
      setProcessedResult(null);
      setAdaptiveConfig(null);
      return;
    }

    if (!userProfile) {
      console.warn('User profile not loaded yet');
      return;
    }

    setIsProcessing(true);
    setSessionStartTime(Date.now());

    try {
      // Step 1: Get adaptive configuration
      const config = await apiService.getAdaptiveConfig(userProfile, {
        text,
        inputMode,
        taskMode
      });
      setAdaptiveConfig(config);

      // Step 2: Process text through backend
      const result = await apiService.processText(text, config, userProfile);
      setProcessedResult(result);

      console.log('✅ Text processed with adaptive assistance');
      console.log('🎯 Active features:', config.activeFeatures);
    } catch (error) {
      console.error('Text processing failed:', error);
      // Fallback: basic processing
      setProcessedResult({
        originalText: text,
        processedText: text,
        layoutConfig: {},
        readingPace: { wordsPerMinute: 120, estimatedTimeMinutes: 1 },
        metadata: {},
        config: {},
        activeFeatures: []
      });
    } finally {
      setIsProcessing(false);
    }
  }, [userProfile, inputMode, taskMode]);

  const handlePasteChange = (e) => {
    const text = e.target.value;
    setSourceText(text);
    processText(text);
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
      processText(text);
      setIsProcessing(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCompare = async () => {
    if (!sourceText.trim() || !userText.trim()) return;

    setIsProcessing(true);
    try {
      // Analyze writing through backend
      const analysis = await apiService.analyzeWriting(userText, sourceText, userProfile);
      setAccuracy(analysis.accuracy);
      setShowComparison(true);

      // Track performance
      const timeSpent = sessionStartTime ? (Date.now() - sessionStartTime) / 1000 : 0;
      const sessionData = {
        textLength: sourceText.length,
        timeSpent,
        accuracy: analysis.accuracy,
        featuresUsed: adaptiveConfig?.activeFeatures || []
      };

      try {
        await apiService.trackPerformance('writing', sessionData);
        addProgressSession('writing', {
          accuracy: analysis.accuracy,
          sourceLength: sourceText.split(/\s+/).length,
          userLength: userText.split(/\s+/).length,
        });
      } catch (error) {
        console.error('Performance tracking failed:', error);
      }
    } catch (error) {
      console.error('Writing analysis failed:', error);
      // Fallback accuracy calculation
      const sourceWords = sourceText.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const userWords = userText.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let match = 0;
      const minLen = Math.min(sourceWords.length, userWords.length);
      for (let i = 0; i < minLen; i++) {
        if (sourceWords[i] === userWords[i]) match++;
      }
      const acc = sourceWords.length > 0 ? Math.round((match / sourceWords.length) * 100) : 0;
      setAccuracy(acc);
      setShowComparison(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetComparison = () => {
    setAccuracy(null);
    setShowComparison(false);
    setUserText('');
  };

  // Get layout config from processed result
  const layoutConfig = processedResult?.layoutConfig || {};
  const fontClass = adaptiveConfig?.assistantConfig?.dyslexiaFont ? 'dyslexia-font' : '';

  if (isLoadingProfile) {
    return (
      <Layout>
        <div className="assistant-page">
          <div className="card assistant-card">
            <h1>Levixia Adaptive Assistant</h1>
            <p>Loading your personalized learning profile...</p>
            <div className="spinner" style={{ margin: '2rem auto' }} />
          </div>
        </div>
      </Layout>
    );
  }

  if (!userProfile && (!assessmentResults || !report?.completed)) {
    return (
      <Layout>
        <div className="assistant-page">
          <div className="card assistant-card">
            <h1>Levixia Adaptive Assistant</h1>
            <p>Please complete the assessment first to enable personalized assistance.</p>
            <Link to="/assessment" className="btn btn-primary">
              Take Assessment
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="assistant-page">
        <h1>Levixia Adaptive Assistant</h1>
        <p className="assistant-intro">
          Your personalized learning assistant adapts content based on your learning profile.
          {adaptiveConfig?.explanation && (
            <span className="config-explanation"> {adaptiveConfig.explanation}</span>
          )}
        </p>

        {adaptiveConfig?.recommendedActions && adaptiveConfig.recommendedActions.length > 0 && (
          <div className="recommendations-banner">
            <strong>💡 Recommendations:</strong> {adaptiveConfig.recommendedActions.join(', ')}
          </div>
        )}

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
                    onChange={() => {
                      setTaskMode(t.value);
                      if (sourceText) processText(sourceText);
                    }}
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
                disabled={isProcessing}
              />
            )}
            {inputMode === 'file' && (
              <div className="file-zone" onClick={() => fileInputRef.current?.click()}>
                {isProcessing ? 'Processing...' : 'Click to choose a .txt or .md file'}
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

          {isProcessing && (
            <div className="processing-indicator">
              <div className="spinner" />
              <p>AI is adapting content for you...</p>
            </div>
          )}

          {processedResult && (
            <>
              <div className="form-group adapted-block">
                <label>Adapted text (personalized for you)</label>
                {processedResult.readingPace && (
                  <div className="reading-pace-info">
                    <span>Estimated reading time: {processedResult.readingPace.estimatedTimeMinutes} minutes</span>
                    <span>Pace: {processedResult.readingPace.wordsPerMinute} WPM</span>
                  </div>
                )}
                <div
                  className={`assistant-output ${fontClass}`}
                  style={{
                    ...layoutConfig,
                    letterSpacing: layoutConfig.letterSpacing || 'normal',
                    wordSpacing: layoutConfig.wordSpacing || 'normal',
                    lineHeight: layoutConfig.lineHeight || 1.5,
                    fontSize: layoutConfig.fontSize || '1.1rem',
                    ...(layoutConfig.contrast || {})
                  }}
                  dangerouslySetInnerHTML={{ __html: processedResult.processedText }}
                />
                {adaptiveConfig?.activeFeatures && adaptiveConfig.activeFeatures.length > 0 && (
                  <div className="active-features">
                    <strong>Active features:</strong> {adaptiveConfig.activeFeatures.join(', ')}
                  </div>
                )}
              </div>

              {(taskMode === 'writing' || taskMode === 'mixed') && sourceText && (
                <div className="form-group">
                  <label>Your writing (type or paste)</label>
                  <textarea
                    className="assistant-textarea user"
                    placeholder="Type what you read or write here..."
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    rows={5}
                    disabled={isProcessing}
                  />
                  <div className="assistant-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCompare}
                      disabled={!userText.trim() || isProcessing}
                    >
                      Analyze & Compare
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
                  <h3>Accuracy Analysis</h3>
                  <p className="accuracy-value">{accuracy}%</p>
                  <p className="accuracy-desc">
                    Your text matched the source at {accuracy}% (word-level). This is saved to your progress.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <p className="assistant-hint">
          Your assistant adapts based on your learning profile. 
          {userProfile && (
            <>
              {' '}Active features: {Object.entries(userProfile.enabledFeatures)
                .filter(([_, enabled]) => enabled)
                .map(([feature]) => feature)
                .join(', ')}
            </>
          )}
          {' '}Adjust in <Link to="/assistant-config">Assistant settings</Link>.
        </p>
      </div>
    </Layout>
  );
}
