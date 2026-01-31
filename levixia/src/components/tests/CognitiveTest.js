import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import './Assessment.css'; // Make sure to import the CSS

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [testStartTime] = useState(Date.now());
  const [recallStartTime, setRecallStartTime] = useState(null);
  const [responseTimes, setResponseTimes] = useState([]);
  const [rounds, setRounds] = useState([]);

  /* Generate sequence ONCE per round */
  useEffect(() => {
    const newSequence = generateSequence(sequenceLength);
    setSequence(newSequence);
    setUserSequence([]);
    setRoundCorrect(null);
    setPhase('show');

    const timer = setTimeout(() => {
      setPhase('recall');
      setRecallStartTime(Date.now());
    }, SHOW_DURATION_MS);

    return () => clearTimeout(timer);
  }, [sequenceLength]);

  const handleNumberClick = (num) => {
    if (phase !== 'recall') return;

    const now = Date.now();
    if (recallStartTime) {
      const delta =
        userSequence.length === 0
          ? (now - recallStartTime) / 1000
          : (now - recallStartTime) / 1000 -
            responseTimes.reduce((a, b) => a + b, 0);

      setResponseTimes((prev) => [...prev, Math.max(0, delta)]);
    }

    setUserSequence((prev) => [...prev, num]);
  };

  const evaluateRound = () => {
    const correctCount = sequence.filter(
      (n, i) => n === userSequence[i]
    ).length;

    const isPerfect = correctCount === sequence.length;

    const roundData = {
      sequenceLength,
      correct: isPerfect,
      correctCount,
      sequence: [...sequence],
      userSequence: [...userSequence],
      responseTimes: [...responseTimes]
    };

    setRounds((prev) => [...prev, roundData]);

    return { isPerfect, correctCount, roundData };
  };

  const advanceOrFinish = async () => {
    const { isPerfect, correctCount, roundData } = evaluateRound();

    if (isPerfect && sequenceLength < MAX_LENGTH) {
      setRoundCorrect(true);
      setSequenceLength((l) => l + 1);
      setResponseTimes([]);
      setRecallStartTime(null);
    } else {
      // Test complete - send raw data to backend for AI analysis
      const allRounds = rounds.concat(roundData);
      const allResponseTimes = allRounds.flatMap((r) => r.responseTimes);
      const timeElapsed = Math.round(((Date.now() - testStartTime) / 1000) * 10) / 10;

      const totalCorrect = allRounds.reduce((sum, r) => sum + r.correctCount, 0);
      const totalAttempts = allRounds.reduce((sum, r) => sum + r.sequenceLength, 0);
      const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
      const maxLengthReached = Math.max(
        ...allRounds.filter(r => r.correct).map(r => r.sequenceLength),
        MIN_LENGTH
      );

      // Prepare raw data for backend
      const rawData = {
        sequence: sequence,
        userSequence: userSequence,
        responseTimes: allResponseTimes,
        maxLengthReached,
        rounds: allRounds,
        timeElapsed,
        correct: totalCorrect,
        total: totalAttempts
      };

      setIsAnalyzing(true);

      try {
        const analysis = await apiService.analyzeCognitive(rawData);
        onComplete({
          type: 'cognitive',
          correct: totalCorrect,
          total: totalAttempts,
          accuracy,
          timeElapsed,
          maxLengthReached,
          sequence: sequence,
          userSequence: userSequence,
          responseTimes: allResponseTimes,
          rounds: allRounds,
          workingMemoryScore: analysis.workingMemoryScore,
          attentionScore: analysis.attentionScore,
          taskSwitchingScore: analysis.taskSwitchingScore,
          cognitiveLoadScore: analysis.cognitiveLoadScore,
          executiveFunctionScore: analysis.executiveFunctionScore,
          errorPatterns: analysis.errorPatterns,
          indicators: analysis.indicators
        });
      } catch (error) {
        console.error('Cognitive analysis failed:', error);
        onComplete({
          type: 'cognitive',
          correct: totalCorrect,
          total: totalAttempts,
          accuracy,
          timeElapsed,
          maxLengthReached,
          sequence: sequence,
          userSequence: userSequence,
          responseTimes: allResponseTimes,
          rounds: allRounds,
          aiError: true,
          errorMessage: 'AI unavailable – fallback used'
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSubmit = () => {
    if (phase !== 'recall' || userSequence.length === 0) return;
    advanceOrFinish();
  };

  if (isAnalyzing) {
    return (
      <div className="assessment-card">
        <h2>🧠 Cognitive & Memory Test</h2>
        <div className="loading-state">
          <p>AI is analyzing your performance...</p>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (phase === 'show') {
    return (
      <div className="assessment-card">
        <h2>🧠 Cognitive & Memory Test</h2>
        <p className="instruction-text">Memorize this sequence.</p>
        <div className="memory-sequence">
          {sequence.map((num, i) => (
            <div key={i} className="memory-item animate-pop">{num}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-card">
      <h2>🧠 Cognitive & Memory Test</h2>

      {roundCorrect && (
        <div className="success-banner">
          ✓ Correct! Increasing difficulty.
        </div>
      )}

      <div className="sequence-display">
        <span className="label">Your sequence:</span>
        <div className="sequence-values">
          {userSequence.length > 0 ? userSequence.join(' – ') : <span className="placeholder">Tap numbers...</span>}
        </div>
      </div>

      <div className="numeric-keypad">
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <button
            key={num}
            className="keypad-btn"
            onClick={() => handleNumberClick(num)}
          >
            {num}
          </button>
        ))}
      </div>

      <div className="action-footer">
        <button className="btn btn-secondary" onClick={() => setUserSequence([])}>Clear</button>
        <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
}