import React, { useState, useMemo } from 'react';
import apiService from '../../services/apiService';
import './VisualTest.css';

const TARGET_LETTERS = ['b', 'd', 'p', 'q'];
const GRID_SIZE = 20;

function buildGrid() {
  const target = TARGET_LETTERS[Math.floor(Math.random() * TARGET_LETTERS.length)];
  const distractors = TARGET_LETTERS.filter(l => l !== target);

  const targetCount = Math.floor(GRID_SIZE * 0.35);
  const letters = [
    ...Array(targetCount).fill(target),
    ...Array(GRID_SIZE - targetCount).fill(0).map(
      () => distractors[Math.floor(Math.random() * distractors.length)]
    )
  ];

  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  return { letters, target };
}

export default function VisualTest({ onComplete }) {
  const { letters, target } = useMemo(buildGrid, []);
  const [selected, setSelected] = useState([]);
  const [clickPattern, setClickPattern] = useState([]);
  const [startTime] = useState(Date.now());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleClick = (i) => {
    setSelected(prev => {
      if (prev.some(s => s.index === i)) return prev;
      return [...prev, { index: i, correct }];
    });    

    const correct = letters[i] === target;
    const timeSinceStart =
      Math.round((Date.now() - startTime) / 100) / 10;

    setSelected(prev => [...prev, { index: i, correct }]);
    setClickPattern(prev => [
      ...prev,
      { index: i, correct, timeSinceStart }
    ]);
  };

  const handleSubmit = async () => {
    const hits = selected.filter(s => s.correct).length;
    const falsePositives = selected.length - hits;
    const correctCount = letters.filter(l => l === target).length;
    const timeElapsed =
      Math.round(((Date.now() - startTime) / 1000) * 10) / 10;

    const rawData = {
      target,
      correctCount,
      hits,
      falsePositives,
      selectedCount: selected.length,
      timeElapsed,
      clickPattern
    };

    setIsAnalyzing(true);

    try {
      const analysis = await apiService.analyzeVisual(rawData);

      onComplete({
        type: 'visual',
        ...rawData,
        // Display-only metric
        accuracy: Math.round((Math.min(hits, correctCount) / correctCount) * 100),
        // AI-derived metrics
        ...analysis
      });
    } catch {
      onComplete({
        type: 'visual',
        ...rawData,
        accuracy: Math.round((hits / correctCount) * 100),
        aiError: true,
        errorMessage: 'AI unavailable – fallback used'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="assessment-card">
      <h2>👁️ Visual Processing Test</h2>
      <p>Click all <strong>{target}</strong> letters</p>

      <div className="letter-grid">
        {letters.map((letter, i) => {
          const selectedItem = selected.find(s => s.index === i);

          return (
            <div
              key={i}
              className={`letter-card ${
                selectedItem
                  ? selectedItem.correct
                    ? 'selected-correct'
                    : 'selected-wrong'
                  : ''
              }`}
              onClick={() => handleClick(i)}
            >
              {letter}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '1rem', color: '#888' }}>
        Selected: {selected.length}
      </div>

      <button onClick={handleSubmit} disabled={selected.length === 0}>
        Complete Visual Test
      </button>
    </div>
  );
}
