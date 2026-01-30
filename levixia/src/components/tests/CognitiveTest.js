import React, { useState, useEffect, useMemo } from 'react';

const MIN_LENGTH = 4;
const MAX_LENGTH = 8;
const SHOW_DURATION_MS = 4000;

function generateSequence(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
}

export default function CognitiveTest({ onComplete }) {
  const [phase, setPhase] = useState('show');
  const [sequenceLength, setSequenceLength] = useState(MIN_LENGTH);
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [roundCorrect, setRoundCorrect] = useState(null);
  const [startTime] = useState(() => Date.now());

  const displaySequence = useMemo(() => generateSequence(sequenceLength), [sequenceLength]);

  useEffect(() => {
    setSequence(displaySequence);
    setPhase('show');
    setUserSequence([]);
    setRoundCorrect(null);
    const timer = setTimeout(() => setPhase('recall'), SHOW_DURATION_MS);
    return () => clearTimeout(timer);
  }, [sequenceLength, displaySequence]);

  const handleNumberClick = (num) => {
    if (phase !== 'recall') return;
    setUserSequence((prev) => [...prev, num]);
  };

  const checkAndAdvance = () => {
    const correct =
      sequence.length === userSequence.length &&
      sequence.every((n, i) => n === userSequence[i]);

    if (correct && sequenceLength < MAX_LENGTH) {
      setRoundCorrect(true);
      setSequenceLength((l) => l + 1);
    } else {
      const finalCorrect = correct
        ? sequence.length
        : sequence.filter((n, i) => n === userSequence[i]).length;
      const timeElapsed = (Date.now() - startTime) / 1000;
      const accuracy = sequence.length > 0
        ? Math.round((finalCorrect / sequence.length) * 100)
        : 0;
      onComplete({
        type: 'cognitive',
        correct: finalCorrect,
        total: sequence.length,
        timeElapsed: Math.round(timeElapsed * 10) / 10,
        accuracy,
        maxLengthReached: sequenceLength,
      });
    }
  };

  const handleSubmit = () => {
    if (phase !== 'recall' || userSequence.length === 0) return;
    checkAndAdvance();
  };

  if (phase === 'show') {
    return (
      <div className="assessment-card">
        <h2>🧠 Cognitive & Memory Test</h2>
        <p>
          Memorize this sequence of numbers. It will disappear in {SHOW_DURATION_MS / 1000} seconds.
        </p>
        <div className="memory-sequence">
          {sequence.map((num, index) => (
            <div key={`${index}-${num}`} className="memory-item">
              {num}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-card">
      <h2>🧠 Cognitive & Memory Test</h2>
      <p>
        Click the numbers below in the order you remember them. Get it right to try a longer sequence.
      </p>

      {roundCorrect && (
        <p style={{ color: 'var(--levixia-success)', fontWeight: '600', marginBottom: '1rem' }}>
          ✓ Correct! Next round has one more number.
        </p>
      )}

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--levixia-cyan)', fontWeight: '600', fontSize: '1.2rem' }}>
          Your sequence: {userSequence.join(' – ') || 'Click numbers below...'}
        </p>
      </div>

      <div className="visual-test-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <div
            key={num}
            role="button"
            tabIndex={0}
            className="visual-card"
            onClick={() => handleNumberClick(num)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNumberClick(num);
              }
            }}
          >
            {num}
          </div>
        ))}
      </div>

      <div className="button-group">
        <button
          type="button"
          className="secondary-btn"
          onClick={() => setUserSequence([])}
        >
          Clear
        </button>
        <button
          type="button"
          className="primary-btn"
          onClick={handleSubmit}
          disabled={userSequence.length === 0}
        >
          Complete Memory Test
        </button>
      </div>
    </div>
  );
}
