import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

/* Levenshtein similarity → accuracy */
const similarityPercent = (a, b) => {
  if (!a || !b) return 0;

  const dp = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0));

  for (let i = 0; i <= b.length; i++) dp[i][0] = i;
  for (let j = 0; j <= a.length; j++) dp[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      dp[i][j] =
        b[i - 1] === a[j - 1]
          ? dp[i - 1][j - 1]
          : Math.min(
              dp[i - 1][j - 1] + 1,
              dp[i][j - 1] + 1,
              dp[i - 1][j] + 1
            );
    }
  }

  const dist = dp[b.length][a.length];
  return Math.round(((Math.max(a.length, b.length) - dist) /
    Math.max(a.length, b.length)) * 100);
};

export default function SpellingTest({ onComplete }) {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch word pool from backend
  useEffect(() => {
    (async () => {
      try {
        const wordPool = await apiService.getSpellingWords();
        // Randomize and select 5 words
        const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
        setWords(shuffled.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch words:', error);
        // Fallback words
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

    // Basic error classification (frontend only for display)
    const errorType = accuracy === 100 ? 'Correct' : 'Error';

    const newResponses = [
      ...responses,
      { word, typed, accuracy, errorType }
    ];

    setResponses(newResponses);
    setInput('');

    if (index < words.length - 1) {
      setIndex(i => i + 1);
      return;
    }

    // Test complete - send raw data to backend for AI analysis
    setIsAnalyzing(true);

    try {
      // Call backend AI analysis
      const analysis = await apiService.analyzeSpelling(newResponses);

      const avgAccuracy = Math.round(
        newResponses.reduce((s, r) => s + r.accuracy, 0) / newResponses.length
      );

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
      // Fallback
      const avgAccuracy = Math.round(
        newResponses.reduce((s, r) => s + r.accuracy, 0) / newResponses.length
      );

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

  if (isLoading) {
    return (
      <div className="assessment-card">
        <h2>✍️ Spelling Assessment</h2>
        <p>Loading words...</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="assessment-card">
        <h2>✍️ Spelling Assessment</h2>
        <p>AI is analyzing your spelling patterns...</p>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="assessment-card">
        <h2>✍️ Spelling Assessment</h2>
        <p>Failed to load words. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="assessment-card">
      <h2>✍️ Spelling Assessment</h2>
      <p>Word {index + 1} of {words.length}</p>

      <button onClick={() => playWord(words[index])}>
        🔊 Listen
      </button>

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleNext()}
        placeholder="Type the word"
        autoFocus
      />

      <button onClick={handleNext} disabled={!input}>
        {index === words.length - 1 ? 'Finish Test' : 'Next'}
      </button>
    </div>
  );
}
