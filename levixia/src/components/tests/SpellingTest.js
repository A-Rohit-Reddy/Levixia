import React, { useState } from 'react';
import { spellingScore } from '../../utils/levenshtein';

const WORDS = [
  'beautiful',
  'necessary',
  'because',
  'definitely',
  'separate',
];

export default function SpellingTest({ onComplete }) {
  const [currentWord, setCurrentWord] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const speakWord = (word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    const userAnswer = inputValue.trim();
    const newAnswers = [...answers, { word: WORDS[currentWord], userAnswer }];
    setAnswers(newAnswers);
    setInputValue('');

    if (currentWord < WORDS.length - 1) {
      setCurrentWord(currentWord + 1);
    } else {
      const scores = newAnswers.map((a) => spellingScore(a.word, a.userAnswer));
      const accuracyPercent = Math.round(
        scores.reduce((sum, s) => sum + s, 0) / scores.length
      );
      onComplete({
        type: 'spelling',
        answers: newAnswers,
        scores,
        accuracyPercent,
      });
    }
  };

  return (
    <div className="assessment-card">
      <h2>✍️ Spelling Assessment</h2>
      <p>
        Listen to each word and type it in the box below. You can replay the word as many times as needed.
      </p>

      <div style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--levixia-text-muted)' }}>
        Word {currentWord + 1} of {WORDS.length}
      </div>

      <div className="word-prompt">
        <h3>Word #{currentWord + 1}</h3>
        <button
          type="button"
          className="play-audio-btn"
          onClick={() => speakWord(WORDS[currentWord])}
        >
          🔊 Play Word
        </button>
      </div>

      <input
        type="text"
        className="spelling-input"
        placeholder="Type the word here..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && handleNext()}
        autoFocus
        autoComplete="off"
      />

      <div className="button-group">
        <button
          type="button"
          className="primary-btn"
          onClick={handleNext}
          disabled={!inputValue.trim()}
        >
          {currentWord < WORDS.length - 1 ? 'Next Word' : 'Complete Spelling Test'}
        </button>
      </div>
    </div>
  );
}
