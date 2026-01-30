import React, { useState } from 'react';

const WORDS = ['beautiful', 'necessary', 'because', 'definitely', 'separate'];

// Embedded Levenshtein Algorithm for standalone functionality
const calculateSimilarity = (a, b) => {
  if (a.length === 0) return b.length; 
  if (b.length === 0) return a.length; 

  const matrix = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLength = Math.max(a.length, b.length);
  return Math.max(0, ((maxLength - distance) / maxLength) * 100);
};

export default function SpellingTest({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [input, setInput] = useState('');

  const playWord = (word) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8; 
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = () => {
    const word = WORDS[currentIndex];
    const score = calculateSimilarity(input.toLowerCase().trim(), word);
    
    const newResults = [...results, { word, input, score }];
    setResults(newResults);
    setInput('');

    if (currentIndex < WORDS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Calculate final average
      const avgAccuracy = Math.round(newResults.reduce((a, b) => a + b.score, 0) / newResults.length);
      onComplete({
        type: 'spelling',
        accuracyPercent: avgAccuracy,
        details: newResults
      });
    }
  };

  return (
    <div className="assessment-card">
      <h2>✍️ Spelling Assessment</h2>
      <p>Word {currentIndex + 1} of {WORDS.length}</p>

      <div style={{ margin: '2rem 0', textAlign: 'center' }}>
        <button className="play-audio-btn" onClick={() => playWord(WORDS[currentIndex])}>
           🔊 Listen to Word
        </button>
      </div>

      <input 
        className="spelling-input"
        type="text" 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
        placeholder="Type what you hear..."
        autoFocus
      />

      <div className="button-group">
        <button className="primary-btn" onClick={handleNext} disabled={!input}>
            {currentIndex === WORDS.length - 1 ? 'Finish Test' : 'Next Word'}
        </button>
      </div>
    </div>
  );
}