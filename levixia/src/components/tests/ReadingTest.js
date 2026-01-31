import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../context/UserContext';
import apiService from '../../services/apiService';
import './Assessment.css';

export default function ReadingTest({ onComplete }) {
  const [status, setStatus] = useState('loading');
  const [passage, setPassage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const bufferRef = useRef('');

  const { profile } = useUser();

  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.generateReadingPassage(profile);
        setPassage(data.text);
      } catch (error) {
        console.error('Failed to generate passage:', error);
        setPassage(
          "The ship sailed across the ocean. The captain shared the treasure."
        );
      }
      setStatus('ready');
    })();
  }, [profile]);

  const startRecording = () => {
    bufferRef.current = '';
    setFinalTranscript('');
    setTimeElapsed(0);
    setStatus('recording');

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      bufferRef.current +=
        e.results[e.results.length - 1][0].transcript + ' ';
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);

    timerRef.current = setInterval(
      () => setTimeElapsed(t => t + 1),
      1000
    );
  };

  const stopAndGrade = async () => {
    recognitionRef.current?.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
    setStatus('analyzing');

    const transcript = bufferRef.current.trim();
    setFinalTranscript(transcript);

    try {
      const report = await apiService.analyzeReading(
        passage,
        transcript,
        timeElapsed
      );

      onComplete({
        type: 'reading',
        accuracyPercent: report.accuracyPercent,
        wpm: report.wpm,
        errorType: report.errorType,
        errorPatterns: report.errorPatterns || [],
        phonologicalIssues: report.phonologicalIssues || [],
        visualIssues: report.visualIssues || [],
        strengths: report.strengths || [],
        dyslexiaLikelihood: report.dyslexiaLikelihood,
        feedback: report.feedback,
        rawTranscript: transcript,
        timeElapsed,
        totalWords: passage.split(/\s+/).length
      });
    } catch (error) {
      console.error('Reading analysis failed:', error);
      const totalWords = passage.split(/\s+/).length;
      const spokenWords = transcript.split(/\s+/).length;
      const wpm = timeElapsed > 0 ? Math.round((spokenWords / timeElapsed) * 60) : 0;
      
      const originalWords = passage.toLowerCase().split(/\s+/);
      const transcriptWords = transcript.toLowerCase().split(/\s+/);
      let matches = 0;
      for (let i = 0; i < Math.min(originalWords.length, transcriptWords.length); i++) {
        if (originalWords[i] === transcriptWords[i]) matches++;
      }
      const accuracy = Math.round((matches / originalWords.length) * 100);

      onComplete({
        type: 'reading',
        accuracyPercent: accuracy,
        wpm,
        errorType: 'Unclassified',
        errorPatterns: [],
        phonologicalIssues: [],
        visualIssues: [],
        strengths: ['Completed reading'],
        dyslexiaLikelihood: accuracy < 70 ? 'High' : 'Low',
        feedback: 'AI unavailable – fallback used',
        rawTranscript: transcript,
        timeElapsed,
        totalWords,
        aiError: true
      });
    }
  };

  if (status === 'loading')
    return (
      <div className="assessment-card">
        <h2>📖 Reading Assessment</h2>
        <div className="loading-state">
           <p>AI is generating a passage for you...</p>
           <div className="spinner" />
        </div>
      </div>
    );

  if (status === 'analyzing')
    return (
      <div className="assessment-card">
        <h2>📖 Reading Assessment</h2>
        <div className="loading-state">
          <p>AI is analyzing your reading performance...</p>
          <div className="spinner" />
        </div>
      </div>
    );

  return (
    <div className="assessment-card">
      <h2>📖 Reading Assessment</h2>
      <p className="instruction-text">Read the following passage aloud:</p>

      <div className="reading-passage-container">
        <p className="reading-passage">{passage}</p>
      </div>

      <div className="reading-controls">
        <div className={`status-badge ${isRecording ? 'recording' : 'ready'}`}>
          {isRecording ? (
            <>
              <span className="pulse-dot"></span> Recording: {timeElapsed}s
            </>
          ) : 'Ready to Start'}
        </div>

        <button 
          className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`} 
          onClick={isRecording ? stopAndGrade : startRecording}
        >
          {isRecording ? 'Stop & Analyze' : 'Start Reading'}
        </button>
      </div>
    </div>
  );
}