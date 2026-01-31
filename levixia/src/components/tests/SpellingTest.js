import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

/* Levenshtein similarity → accuracy */
const similarityPercent = (a, b) => {
  if (!a || !b) return 0;
  const dp = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));
  for (let i = 0; i <= b.length; i++) dp[i][0] = i;
  for (let j = 0; j <= a.length; j++) dp[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      dp[i][j] = b[i - 1] === a[j - 1] ? dp[i - 1][j - 1] : Math.min(dp[i - 1][j - 1] + 1, dp[i][j - 1] + 1, dp[i - 1][j] + 1);
    }
  }
  const dist = dp[b.length][a.length];
  return Math.round(((Math.max(a.length, b.length) - dist) / Math.max(a.length, b.length)) * 100);
};

export default function SpellingTest({ onComplete }) {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const wordPool = await apiService.getSpellingWords();
        const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
        setWords(shuffled.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch words:', error);
        setWords(['beautiful', 'necessary', 'because', 'definitely', 'separate']);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const playWord = (word) => {
    const u = new SpeechSynthesisUtterance(word);
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  };

  const handleNext = async () => {
    if (words.length === 0) return;
    const word = words[index];
    const typed = input.toLowerCase().trim();
    const accuracy = similarityPercent(typed, word);
    const errorType = accuracy === 100 ? 'Correct' : 'Error';
    const newResponses = [...responses, { word, typed, accuracy, errorType }];

    setResponses(newResponses);
    setInput('');

    if (index < words.length - 1) {
      setIndex(i => i + 1);
      return;
    }

    setIsAnalyzing(true);

    try {
      const analysis = await apiService.analyzeSpelling(newResponses);
      const avgAccuracy = Math.round(newResponses.reduce((s, r) => s + r.accuracy, 0) / newResponses.length);
      onComplete({
        type: 'spelling',
        accuracyPercent: avgAccuracy,
        errorTypes: analysis.errorTypes || [],
        orthographicWeakness: analysis.orthographicWeakness || 0,
        phonemeGraphemeMismatch: analysis.phonemeGraphemeMismatch || 0,
        errorClassifications: analysis.errorClassifications || [],
        feedback: analysis.feedback || 'Spelling patterns analyzed.'
      });
    } catch (error) {
      console.error('Spelling analysis failed:', error);
      const avgAccuracy = Math.round(newResponses.reduce((s, r) => s + r.accuracy, 0) / newResponses.length);
      onComplete({
        type: 'spelling',
        accuracyPercent: avgAccuracy,
        errorTypes: ['Mixed'],
        orthographicWeakness: Math.round(100 - avgAccuracy),
        phonemeGraphemeMismatch: Math.round(100 - avgAccuracy),
        errorClassifications: newResponses,
        feedback: 'AI unavailable – fallback used',
        aiError: true
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- INTERNAL STYLES ---
  const styles = {
    // Main Container (matches the dark blue background)
    pageContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      backgroundColor: '#0f172a', // Dark slate blue background
      padding: '2rem',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
    },
    // The Progress Bar Container (top of card)
    progressContainer: {
      width: '100%',
      maxWidth: '500px',
      height: '6px',
      backgroundColor: '#1e293b',
      borderRadius: '3px',
      marginBottom: '2rem',
      overflow: 'hidden',
    },
    // The Gradient Fill
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #06b6d4 0%, #a855f7 100%)', // Cyan to Purple gradient
      transition: 'width 0.4s ease',
    },
    // The Main Card
    card: {
      width: '100%',
      maxWidth: '500px',
      backgroundColor: '#162032', // Slightly lighter than bg
      borderRadius: '24px',
      padding: '40px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
      border: '1px solid #2d3748',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    // Text Styles
    title: {
      fontSize: '1.5rem',
      fontWeight: '700',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    subtitle: {
      color: '#94a3b8', // Muted text
      fontSize: '0.95rem',
      marginBottom: '2.5rem',
    },
    // Listen Button (White Pill)
    listenButton: {
      width: '100%',
      padding: '14px',
      backgroundColor: '#ffffff',
      color: '#0f172a',
      border: 'none',
      borderRadius: '50px', // Pill shape
      fontSize: '1rem',
      fontWeight: '700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 6px rgba(255, 255, 255, 0.1)',
      transition: 'transform 0.1s ease',
    },
    // Input Field
    input: {
      width: '100%',
      padding: '16px',
      backgroundColor: '#0f172a',
      border: '1px solid #334155',
      borderRadius: '12px',
      color: '#ffffff',
      fontSize: '1.1rem',
      textAlign: 'center',
      marginBottom: '1.5rem',
      outline: 'none',
    },
    // Next Button (Dark with Glow)
    nextButton: {
      width: '100%',
      padding: '16px',
      backgroundColor: '#1e293b',
      color: '#ffffff',
      border: '1px solid #334155',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginTop: '1rem',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #1e293b',
      borderTop: '4px solid #06b6d4',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto',
    },
    spinnerContainer: {
        textAlign: 'center',
        padding: '3rem',
        color: '#94a3b8'
    }
  };

  // Helper for hover states (inline styles limitation workarounds)
  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = 'scale(1.02)';
  };
  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  if (isLoading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.card}>
          <h2 style={styles.title}>✍️ Spelling Assessment</h2>
          <div style={styles.spinnerContainer}>
              <div style={styles.spinner} />
              <p style={{marginTop: '1rem'}}>Loading words...</p>
          </div>
        </div>
        {/* Inject keyframes for spinner */}
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.card}>
          <h2 style={styles.title}>✍️ Spelling Assessment</h2>
          <div style={styles.spinnerContainer}>
            <div style={styles.spinner} />
            <p style={{marginTop: '1rem'}}>AI is analyzing results...</p>
          </div>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.card}>
          <h2 style={styles.title}>Error</h2>
          <p style={{color: '#ef4444'}}>Failed to load words.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {/* Progress Bar Top */}
      <div style={styles.progressContainer}>
        <div style={{
            ...styles.progressFill,
            width: `${((index) / words.length) * 100}%`
        }}></div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>
            <span>✍️</span> Spelling Assessment
        </h2>
        <p style={styles.subtitle}>Word {index + 1} of {words.length}</p>

        <div style={{ width: '100%' }}>
          <button 
            style={styles.listenButton} 
            onClick={() => playWord(words[index])}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            🔊 Listen to Word
          </button>

          <input
            style={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNext()}
            placeholder="Type what you hear..."
            autoFocus
            autoComplete="off"
          />

          <button 
            style={{
                ...styles.nextButton,
                opacity: input ? 1 : 0.5,
                cursor: input ? 'pointer' : 'not-allowed'
            }} 
            onClick={handleNext} 
            disabled={!input}
          >
            {index === words.length - 1 ? 'Finish Test' : 'Next Word'}
          </button>
        </div>
      </div>
      
      {/* Small Inline Style for Placeholder Color */}
      <style>{`
        ::placeholder { color: #475569; opacity: 1; }
        input:focus { border-color: #06b6d4 !important; box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2); }
      `}</style>
    </div>
  );
}