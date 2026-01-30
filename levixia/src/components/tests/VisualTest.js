import React, { useState, useMemo } from 'react';

const TARGET_LETTERS = ['b', 'd', 'p', 'q'];
const GRID_SIZE = 20;

function buildRandomGrid() {
  const target = TARGET_LETTERS[Math.floor(Math.random() * TARGET_LETTERS.length)];
  const distractors = TARGET_LETTERS.filter((l) => l !== target);
  const letters = [];
  const targetCount = Math.floor(GRID_SIZE * 0.35) + 2;
  const distractorCount = GRID_SIZE - targetCount;
  for (let i = 0; i < targetCount; i++) letters.push(target);
  for (let i = 0; i < distractorCount; i++) {
    letters.push(distractors[Math.floor(Math.random() * distractors.length)]);
  }
  // Shuffle
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return { letters, target };
}

export default function VisualTest({ onComplete }) {
  const { letters, target } = useMemo(buildRandomGrid, []);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [startTime] = useState(() => Date.now());

  const correctTotal = letters.filter((l) => l === target).length;

  // FIX 1: Allow clicking ANY letter (even wrong ones)
  const handleLetterClick = (index) => {
    // If already selected, do nothing
    if (selectedIndices.includes(index)) return;
    
    // Add to selected list regardless of whether it's correct or not
    setSelectedIndices((prev) => [...prev, index]);
  };

  const handleSubmit = () => {
    const timeElapsed = (Date.now() - startTime) / 1000;
    
    // FIX 2: Calculate Hits vs. False Positives (Errors)
    let hits = 0;
    let falsePositives = 0;

    selectedIndices.forEach((index) => {
      if (letters[index] === target) {
        hits++;
      } else {
        falsePositives++;
      }
    });

    // Accuracy Formula: (Hits - False Positives) / Total Possible Targets
    // This penalizes random guessing.
    const rawAccuracy = ((hits - falsePositives) / correctTotal) * 100;
    const accuracy = Math.max(0, Math.round(rawAccuracy)); // Prevent negative scores

    onComplete({
      type: 'visual',
      target,
      correctCount: correctTotal,
      selectedCount: selectedIndices.length,
      hits,
      falsePositives, // Useful for the report (shows impulsivity)
      timeElapsed: Math.round(timeElapsed * 10) / 10,
      accuracy,
    });
  };

  return (
    <div className="assessment-card">
      <h2>👁️ Visual Processing Test</h2>
      <p>
        Click on all the letters <strong>"{target}"</strong>. Be careful not to click the wrong ones!
      </p>

      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--levixia-cyan)' }}>
          Target Letter: <span style={{ fontSize: '3rem' }}>{target}</span>
        </div>
        <div style={{ marginTop: '1rem', color: 'var(--levixia-text-muted)' }}>
          Selected: {selectedIndices.length}
        </div>
      </div>

      <div className="letter-grid">
        {letters.map((letter, index) => (
          <div
            key={`${index}-${letter}`}
            role="button"
            tabIndex={0}
            // Use a neutral class 'selected' instead of 'target' for visual feedback
            className={`letter-card ${selectedIndices.includes(index) ? 'selected' : ''}`}
            onClick={() => handleLetterClick(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLetterClick(index);
              }
            }}
          >
            {letter}
          </div>
        ))}
      </div>

      <div className="button-group">
        <button
          type="button"
          className="primary-btn"
          onClick={handleSubmit}
          disabled={selectedIndices.length === 0}
        >
          Complete Visual Test
        </button>
      </div>
    </div>
  );
}