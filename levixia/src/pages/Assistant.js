import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import apiService from '../services/apiService';
import { FaPlay, FaPause, FaStop, FaFont, FaTextHeight, FaEye } from 'react-icons/fa'; // Assuming you have react-icons
import './Assistant.css';

const TASK_OPTIONS = [
  { value: 'reading', label: 'Reading Assistant' },
  { value: 'writing', label: 'Writing & Analysis' },
];

export default function Assistant() {
  const { assessmentResults, report, addProgressSession, userLearningProfile, saveLearningProfile } = useUser();
  
  // -- State: Core --
  const [userProfile, setUserProfile] = useState(userLearningProfile);
  const [taskMode, setTaskMode] = useState('reading');
  const [inputMode, setInputMode] = useState('paste');
  const [sourceText, setSourceText] = useState('');
  
  // -- State: Writing & Analytics --
  const [userText, setUserText] = useState('');
  const [writingMode, setWritingMode] = useState('copy'); 
  const [analyticsResult, setAnalyticsResult] = useState(null); // Comparison results
  const [isProcessing, setIsProcessing] = useState(false);
  const [accuracy, setAccuracy] = useState(null);

  // -- State: Active Reading Assistance (New) --
  const [readerSettings, setReaderSettings] = useState({
    font: 'sans-serif', // 'sans-serif' | 'opendyslexic'
    size: 18,
    lineSpacing: 1.5,
    letterSpacing: 0,
    bionicMode: false,
    contrastMode: 'default', // 'default' | 'sepia' | 'dark' | 'soft-blue'
    syllableBreak: false
  });
  
  // -- State: TTS & Voice --
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const synthesisRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Load Profile & Auto-Configure based on Severity
  useEffect(() => {
    if (assessmentResults && report && report.completed && !userProfile) {
      loadUserProfile();
    } else if (userProfile && report) {
      applySeveritySettings(report);
    }
  }, [assessmentResults, report, userProfile]);

  const loadUserProfile = async () => {
    try {
      const profile = await apiService.generateProfile(assessmentResults, report);
      setUserProfile(profile);
      saveLearningProfile(profile);
    } catch (error) {
      console.error('Failed to load profile, utilizing defaults');
    }
  };

  // 2. Logic: Auto-adjust defaults based on Severity
  const applySeveritySettings = (userReport) => {
    // Determine severity from report score or flagged challenges
    const score = userReport.overallScore || 0; 
    let newSettings = { ...readerSettings };

    if (score < 40) { // High Severity / High Difficulty
      newSettings.font = 'opendyslexic';
      newSettings.lineSpacing = 2.0;
      newSettings.letterSpacing = 2; // Wide tracking
      newSettings.bionicMode = true; // Help anchor attention
      newSettings.contrastMode = 'soft-blue'; // Reduce visual stress
    } else if (score < 70) { // Moderate
      newSettings.font = 'opendyslexic';
      newSettings.lineSpacing = 1.6;
      newSettings.bionicMode = false;
    }
    
    setReaderSettings(prev => ({ ...prev, ...newSettings }));
  };

  // 3. Logic: Bionic Reading Transformation (Frontend side for speed)
  const bionicifyText = (text) => {
    if (!text) return '';
    return text.split(' ').map((word, index) => {
      // Logic: Bold the first half of the word
      const midPoint = Math.ceil(word.length / 2);
      const firstHalf = word.slice(0, midPoint);
      const secondHalf = word.slice(midPoint);
      // We return specific HTML structure
      return `<span class="bionic-word"><b>${firstHalf}</b>${secondHalf}</span>`;
    }).join(' ');
  };

  // 4. Logic: Text-to-Speech
  const handleTTS = (action) => {
    if (action === 'play') {
      if (isPaused) {
        synthesisRef.current.resume();
        setIsPaused(false);
        setIsSpeaking(true);
      } else {
        synthesisRef.current.cancel(); // Stop previous
        const utterance = new SpeechSynthesisUtterance(sourceText);
        utterance.rate = userProfile?.readingPreferences?.preferredPace === 'slow' ? 0.8 : 1;
        utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
        synthesisRef.current.speak(utterance);
        utteranceRef.current = utterance;
        setIsSpeaking(true);
      }
    } else if (action === 'pause') {
      synthesisRef.current.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    } else if (action === 'stop') {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // 5. Logic: Handle Inputs
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSourceText(String(reader.result));
    reader.readAsText(file);
  };

  const startVoiceInput = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Browser not supported');
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final) setSourceText(prev => (prev + ' ' + final).trim());
    };
    recognition.onend = () => setVoiceRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setVoiceRecording(true);
  }, []);

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setVoiceRecording(false);
  };

  // 6. Logic: Writing Analysis (The "Backend" Check)
  const handleWritingCheck = async () => {
    if (!userText.trim()) return;
    setIsProcessing(true);
    try {
      // If copying, compare to source. If generic writing, just analyze grammar/spelling.
      const compareTo = writingMode === 'copy' ? sourceText : null;
      const result = await apiService.analyzeWriting(userText, compareTo, userProfile);
      
      setAnalyticsResult(result);
      if (result.accuracy) setAccuracy(result.accuracy);
      
      // Save progress
      if (writingMode === 'copy') {
        addProgressSession('writing', { accuracy: result.accuracy, date: new Date() });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // -- RENDER HELPERS --

  // Dynamic CSS Styles for the Reading Box
  const activeReaderStyle = {
    fontFamily: readerSettings.font === 'opendyslexic' ? '"OpenDyslexic", sans-serif' : 'sans-serif',
    fontSize: `${readerSettings.size}px`,
    lineHeight: readerSettings.lineSpacing,
    letterSpacing: `${readerSettings.letterSpacing}px`,
    wordSpacing: readerSettings.letterSpacing > 0 ? `${readerSettings.letterSpacing * 2}px` : 'normal',
  };

  const getContrastClass = () => `contrast-${readerSettings.contrastMode}`;

  return (
    <Layout>
      <div className="assistant-page">
        <header className="assistant-header">
          <h1>Adaptive Assistant</h1>
          <p>
            {taskMode === 'reading' 
              ? "Customize text to match your reading style." 
              : "Practice writing with AI-powered feedback."}
          </p>
        </header>

        {/* Task Toggle */}
        <div className="task-selector">
          {TASK_OPTIONS.map((opt) => (
            <button 
              key={opt.value}
              className={`task-btn ${taskMode === opt.value ? 'active' : ''}`}
              onClick={() => setTaskMode(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="main-workspace card">
          
          {/* --- INPUT SECTION --- */}
          <div className="input-toolbar">
            <button onClick={() => setInputMode('paste')} className={inputMode === 'paste' ? 'active' : ''}>Paste Text</button>
            <button onClick={() => fileInputRef.current?.click()} className={inputMode === 'file' ? 'active' : ''}>Upload File</button>
            <button onClick={() => setInputMode('voice')} className={inputMode === 'voice' ? 'active' : ''}>Voice Input</button>
            <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} accept=".txt,.md" />
          </div>

          {inputMode === 'voice' && (
            <div className="voice-controls">
              {!voiceRecording ? (
                <button 
                  className="btn btn-primary" 
                  onClick={startVoiceInput} 
                  style={{ color: '#0f172a', fontWeight: 'bold' }} /* CHANGED: Added dark color */
                >
                  🎤 Start Recording
                </button>
              ) : (
                <button className="btn btn-danger" onClick={stopVoiceInput}>⏹ Stop Recording</button>
              )}
            </div>
          )}

          {/* Source Text Input (Hidden if in pure reading mode with content) */}
          <textarea
            className="source-input"
            placeholder="Paste text here to read or copy..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={taskMode === 'reading' && sourceText ? 2 : 6}
          />

          {/* --- READING ASSISTANT INTERFACE --- */}
          {taskMode === 'reading' && sourceText && (
            <div className="reading-engine-container">
              
              {/* Toolbar */}
              <div className="reader-toolbar">
                <div className="tool-group">
                  <label><FaFont /> Font:</label>
                  <select 
                    value={readerSettings.font} 
                    onChange={(e) => setReaderSettings(prev => ({...prev, font: e.target.value}))}
                  >
                    <option value="sans-serif">Standard</option>
                    <option value="opendyslexic">OpenDyslexic (Dyslexia Friendly)</option>
                  </select>
                </div>

                <div className="tool-group">
                  <label><FaTextHeight /> Size:</label>
                  <input 
                    type="range" min="14" max="32" 
                    value={readerSettings.size}
                    onChange={(e) => setReaderSettings(prev => ({...prev, size: Number(e.target.value)}))} 
                  />
                </div>

                <div className="tool-group">
                  <label>Spacing:</label>
                  <select 
                     value={readerSettings.letterSpacing}
                     onChange={(e) => setReaderSettings(prev => ({...prev, letterSpacing: Number(e.target.value)}))}
                  >
                    <option value={0}>Normal</option>
                    <option value={1}>Wide</option>
                    <option value={2}>Extra Wide</option>
                  </select>
                </div>

                <div className="tool-group toggle">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={readerSettings.bionicMode}
                      onChange={(e) => setReaderSettings(prev => ({...prev, bionicMode: e.target.checked}))}
                    /> Bionic Reading
                  </label>
                </div>

                <div className="tool-group toggle">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={readerSettings.contrastMode === 'soft-blue'}
                      onChange={(e) => setReaderSettings(prev => ({
                        ...prev, contrastMode: e.target.checked ? 'soft-blue' : 'default'
                      }))}
                    /> Blue Tint (Irlen)
                  </label>
                </div>
              </div>

              {/* The Active Reader Box */}
              <div className={`active-reader-box ${getContrastClass()}`} style={activeReaderStyle}>
                {readerSettings.bionicMode ? (
                  <div dangerouslySetInnerHTML={{ __html: bionicifyText(sourceText) }} />
                ) : (
                  <p>{sourceText}</p>
                )}
              </div>

              {/* TTS Controls */}
              <div className="tts-controls">
                {!isSpeaking ? (
                  <button className="btn btn-icon" onClick={() => handleTTS('play')}><FaPlay /> Read Aloud</button>
                ) : (
                  <>
                    <button className="btn btn-icon" onClick={() => handleTTS('pause')}><FaPause /> Pause</button>
                    <button className="btn btn-icon warning" onClick={() => handleTTS('stop')}><FaStop /> Stop</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* --- WRITING & ANALYSIS INTERFACE --- */}
          {taskMode === 'writing' && (
            <div className="writing-workspace">
              <div className="writing-header">
                <button 
                  className={writingMode === 'copy' ? 'pill active' : 'pill'} 
                  onClick={() => setWritingMode('copy')}
                >Copy Practice</button>
                <button 
                  className={writingMode === 'free' ? 'pill active' : 'pill'} 
                  onClick={() => setWritingMode('free')}
                >Free Writing Check</button>
              </div>

              <textarea 
                className="user-writing-area"
                placeholder={writingMode === 'copy' ? "Type the text above here..." : "Write anything here to check for grammar and tone..."}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                rows={8}
              />

              <button 
                className="btn btn-primary full-width"
                onClick={handleWritingCheck}
                disabled={isProcessing || !userText}
              >
                {isProcessing ? 'Analyzing...' : 'Check My Writing'}
              </button>

              {/* Analytics Results */}
              {analyticsResult && (
                <div className="analytics-dashboard">
                  {analyticsResult.accuracy !== undefined && (
                    <div className="score-card">
                      <div className="score-circle">
                        <span>{analyticsResult.accuracy}%</span>
                        <small>Accuracy</small>
                      </div>
                    </div>
                  )}

                  <div className="feedback-section">
                    <h4>AI Feedback</h4>
                    <p>{analyticsResult.feedback}</p>
                    
                    {analyticsResult.errors && analyticsResult.errors.length > 0 && (
                      <div className="errors-list">
                        <h5>Corrections Needed:</h5>
                        <ul>
                          {analyticsResult.errors.map((err, idx) => (
                            <li key={idx}>
                              <span className="err-orig">{err.original}</span> 
                              → 
                              <span className="err-fix">{err.suggestion}</span>
                              <span className="err-reason"> ({err.message})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}