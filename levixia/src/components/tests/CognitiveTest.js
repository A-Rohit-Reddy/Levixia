import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

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
        // Call backend AI analysis
        const analysis = await apiService.analyzeCognitive(rawData);

        // Combine raw data with AI analysis
        onComplete({
          type: 'cognitive',
          // Raw data
          correct: totalCorrect,
          total: totalAttempts,
          accuracy,
          timeElapsed,
          maxLengthReached,
          sequence: sequence,
          userSequence: userSequence,
          responseTimes: allResponseTimes,
          rounds: allRounds,
          // AI analysis results
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
        // Fallback - send raw data without AI analysis
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

  /* ---------- UI unchanged ---------- */

  if (isAnalyzing) {
    return (
      <div className="assessment-card">
        <h2>🧠 Cognitive & Memory Test</h2>
        <p>AI is analyzing your performance...</p>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (phase === 'show') {
    return (
      <div className="assessment-card">
        <h2>🧠 Cognitive & Memory Test</h2>
        <p>Memorize this sequence.</p>
        <div className="memory-sequence">
          {sequence.map((num, i) => (
            <div key={i} className="memory-item">{num}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-card">
      <h2>🧠 Cognitive & Memory Test</h2>

      {roundCorrect && (
        <p style={{ color: 'green', fontWeight: 600 }}>
          ✓ Correct! Increasing difficulty.
        </p>
      )}

      <p>Your sequence: {userSequence.join(' – ') || '...'}</p>

      <div className="visual-test-grid">
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <div
            key={num}
            className="visual-card"
            onClick={() => handleNumberClick(num)}
          >
            {num}
          </div>
        ))}
      </div>

      <div className="button-group">
        <button onClick={() => setUserSequence([])}>Clear</button>
        <button onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
}
