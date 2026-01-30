import React, { useState, useRef, useEffect } from 'react';

const PASSAGE =
  'The quick brown fox jumps over the lazy dog. Reading comprehension is essential for academic success and daily life. Many people with dyslexia develop strong problem-solving skills and creative thinking abilities. With the right support and tools, everyone can become a confident reader. Technology has made significant advances in accessibility, providing personalized learning experiences for individuals with different learning needs.';

function normalizeForCompare(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(text) {
  return normalizeForCompare(text).split(/\s+/).filter(Boolean).length;
}

function computeAccuracy(spoken, target) {
  const spokenWords = normalizeForCompare(spoken).split(/\s+/).filter(Boolean);
  const targetWords = normalizeForCompare(target).split(/\s+/).filter(Boolean);
  if (targetWords.length === 0) return 100;
  let correct = 0;
  const minLen = Math.min(spokenWords.length, targetWords.length);
  for (let i = 0; i < minLen; i++) {
    if (spokenWords[i] === targetWords[i]) correct++;
  }
  return targetWords.length > 0 ? Math.round((correct / targetWords.length) * 100) : 0;
}

export default function ReadingTest({ onComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [hasRecorded, setHasRecorded] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.();
          recognitionRef.current.stop?.();
        } catch (_) {}
      }
    };
  }, []);

  const startRecording = () => {
    setError('');
    setTranscript('');
    setHasRecorded(false);
    setTimeElapsed(0);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      let fullTranscript = '';
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            fullTranscript += (fullTranscript ? ' ' : '') + result[0].transcript;
            setTranscript(fullTranscript);
          }
        }
      };
      recognition.onerror = (e) => {
        if (e.error !== 'aborted') setError('Speech recognition error. Please try again.');
      };
      recognition.onend = () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      setError('Could not start speech recognition.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setHasRecorded(true);
  };

  const handleSubmit = () => {
    if (!hasRecorded) return;
    const elapsed = timeElapsed || 1;
    const words = wordCount(transcript);
    const wpm = Math.round((words / elapsed) * 60);
    const accuracyPercent = computeAccuracy(transcript, PASSAGE);
    onComplete({
      type: 'reading',
      transcript,
      passage: PASSAGE,
      timeElapsed: elapsed,
      wordCount: words,
      wpm,
      accuracyPercent,
    });
  };

  return (
    <div className="assessment-card">
      <h2>📖 Reading Assessment</h2>
      <p>
        Read the passage aloud. Click the microphone to start, then read clearly at your natural pace. Click stop when finished.
      </p>

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {isRecording && (
        <div className="timer">
          ⏱️ Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
        </div>
      )}

      <div className="reading-passage">{PASSAGE}</div>

      <div className={`voice-recorder ${isRecording ? 'recording' : ''}`}>
        <h3>
          {isRecording ? '🔴 Recording...' : hasRecorded ? '✅ Recording Complete' : '🎤 Ready to Record'}
        </h3>
        <p style={{ marginBottom: '1rem', color: 'var(--levixia-text-muted)' }}>
          {isRecording
            ? 'Click the button to stop recording'
            : hasRecorded
            ? 'You can re-record if needed'
            : 'Click the microphone to start recording'}
        </p>

        {isRecording && (
          <div className="audio-visualizer">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="visualizer-bar"
                style={{ height: `${10 + Math.random() * 30}px` }}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>

        {hasRecorded && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: 'var(--levixia-success)', fontWeight: '600' }}>
              ✓ Recording saved ({timeElapsed} seconds)
            </p>
          </div>
        )}
      </div>

      <div className="button-group">
        <button
          type="button"
          className="primary-btn"
          onClick={handleSubmit}
          disabled={!hasRecorded}
        >
          Continue to Next Test
        </button>
      </div>
    </div>
  );
}
