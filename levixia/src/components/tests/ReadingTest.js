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
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [fontSizeIncrement] = useState(2);
  const [matchPercent, setMatchPercent] = useState(null);
  const [readingAttempts, setReadingAttempts] = useState([]);
  const [optimalFontSize, setOptimalFontSize] = useState(null);
  const [accuracyAchieved, setAccuracyAchieved] = useState(false);

  // FIX: Store the supported mimeType in a ref so we use the same one for starting and stopping
  const mimeTypeRef = useRef('audio/webm'); 
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const { profile, updateLearningProfile } = useUser();

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioChunksRef.current = [];
      setFinalTranscript('');
      setTimeElapsed(0);
      setStatus('recording');

      // FIX: Dynamic MIME Type Detection
      const mimeTypes = [
        'audio/webm;codecs=opus', 
        'audio/webm', 
        'audio/mp4', 
        'audio/ogg'
      ];
      
      // Find the first supported type
      const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
      mimeTypeRef.current = supportedType;

      console.log(`Using MIME type: ${supportedType}`);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedType
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        // FIX: Create blob using the SAME mimeType we determined earlier
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        
        // Validation check
        if (audioBlob.size === 0) {
           console.error("Recording failed: Empty audio blob");
           setStatus('ready');
           alert("Microphone captured no audio. Please check settings.");
           return;
        }

        await processAudioRecording(audioBlob);
      };

      // Start recording with 1000ms timeslices for better data handling
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      timerRef.current = setInterval(
        () => setTimeElapsed(t => t + 1),
        1000
      );
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Please allow microphone access to continue.');
      setStatus('ready');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      setStatus('transcribing');
    }
  };

  const processAudioRecording = async (audioBlob) => {
    try {
      const transcriptionResult = await apiService.transcribeAudio(audioBlob, 'en');
      
      if (!transcriptionResult || !transcriptionResult.transcript) {
        throw new Error("Received empty transcript from API");
      }

      const transcript = transcriptionResult.transcript;
      setFinalTranscript(transcript);

      // Check accuracy and determine if font size needs to increase
      await checkAccuracyAndAdjustFont(transcript);
    } catch (error) {
      console.error('Transcription error details:', error);
      alert(`Transcription failed: ${error.message || "Please check your microphone and try again."}`);
      setStatus('ready');
    }
  };

  const checkAccuracyAndAdjustFont = async (transcript) => {
    setStatus('analyzing');

    try {
      // Calculate accuracy
      const optimizationResult = await apiService.optimizeFontSize(
        passage,
        transcript,
        currentFontSize,
        fontSizeIncrement
      );

      const accuracy = optimizationResult.matchPercent;
      setMatchPercent(accuracy);

      // Store this reading attempt
      const attempt = {
        fontSize: currentFontSize,
        accuracy,
        transcript,
        timeElapsed
      };
      setReadingAttempts(prev => [...prev, attempt]);

      // Check if accuracy threshold (70%) is reached
      if (optimizationResult.thresholdReached) {
        // Accuracy achieved! Save optimal font size and complete assessment
        setOptimalFontSize(currentFontSize);
        setAccuracyAchieved(true);
        
        // Save to user profile
        updateLearningProfile({
          optimalFontSize: currentFontSize,
          fontSizeReachedInNormalRange: optimizationResult.reachedInNormalRange,
          readingAssistantNeeded: !optimizationResult.reachedInNormalRange
        });

        // Proceed to final analysis
        await completeReadingAssessment(transcript, currentFontSize, accuracy, optimizationResult.reachedInNormalRange);
      } else {
        // Accuracy not reached - increase font size and ask user to read again
        const nextFontSize = optimizationResult.nextFontSize;
        setCurrentFontSize(nextFontSize);
        
        // Show message and prepare for next reading
        setStatus('font_adjusted');
        
        // Wait a moment to show the message, then reset for next reading
        setTimeout(() => {
          setStatus('ready');
          setFinalTranscript('');
          setTimeElapsed(0);
        }, 2000);
      }
    } catch (error) {
      console.error('Accuracy check error:', error);
      // Fallback: complete with current data
      await completeReadingAssessment(transcript, currentFontSize, 0, false);
    }
  };

  const completeReadingAssessment = async (transcript, finalFontSize, finalAccuracy, reachedInNormalRange) => {
    setStatus('analyzing');

    try {
      const report = await apiService.analyzeReading(
        passage,
        transcript,
        timeElapsed
      );

      onComplete({
        type: 'reading',
        accuracyPercent: report.accuracyPercent || finalAccuracy,
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
        totalWords: passage.split(/\s+/).length,
        optimalFontSize: finalFontSize,
        reachedInNormalRange,
        readingAssistantNeeded: !reachedInNormalRange,
        matchPercent: finalAccuracy,
        readingAttempts: readingAttempts,
        fontSizeOptimization: {
          initialFontSize: 16,
          optimalFontSize: finalFontSize,
          attempts: readingAttempts.length,
          accuracyAchieved: accuracyAchieved
        }
      });
    } catch (analyzeError) {
      console.error('Analysis failed', analyzeError);
      // Fallback completion
      const totalWords = passage.split(/\s+/).length;
      const spokenWords = transcript.split(/\s+/).length;
      const wpm = timeElapsed > 0 ? Math.round((spokenWords / timeElapsed) * 60) : 0;
      
      onComplete({
        type: 'reading',
        accuracyPercent: finalAccuracy,
        wpm,
        errorType: 'Unclassified',
        errorPatterns: [],
        phonologicalIssues: [],
        visualIssues: [],
        strengths: ['Completed reading'],
        dyslexiaLikelihood: finalAccuracy < 70 ? 'High' : 'Low',
        feedback: 'AI analysis unavailable',
        rawTranscript: transcript,
        timeElapsed,
        totalWords,
        aiError: true,
        optimalFontSize: finalFontSize,
        reachedInNormalRange,
        readingAssistantNeeded: !reachedInNormalRange,
        matchPercent: finalAccuracy,
        readingAttempts: readingAttempts,
        fontSizeOptimization: {
          initialFontSize: 16,
          optimalFontSize: finalFontSize,
          attempts: readingAttempts.length,
          accuracyAchieved: accuracyAchieved
        }
      });
    }
  };

  const passageStyle = {
    fontSize: `${currentFontSize}px`,
    transition: 'font-size 0.5s ease'
  };

  if (status === 'loading') {
    return (
      <div className="assessment-card">
        <h2>📖 Reading Assessment</h2>
        <div className="loading-state">
          <p>AI is generating a passage for you...</p>
          <div className="spinner" />
        </div>
      </div>
    );
  }
  
  if (status === 'transcribing' || status === 'analyzing') {
    return (
      <div className="assessment-card">
        <h2>📖 Reading Assessment</h2>
        <div className="loading-state">
          <p>
            {status === 'transcribing' && 'Transcribing your reading...'}
            {status === 'analyzing' && `Analyzing accuracy... (${matchPercent ? matchPercent.toFixed(1) : '...'}%)`}
          </p>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (status === 'font_adjusted') {
    return (
      <div className="assessment-card">
        <h2>📖 Reading Assessment</h2>
        <div className="loading-state">
          <p>
            Accuracy: {matchPercent?.toFixed(1)}% (Target: 70%)<br/>
            Font size increased to {currentFontSize}px<br/>
            <small>Please read the passage again...</small>
          </p>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-card">
      <h2>📖 Reading Assessment</h2>
      <p className="instruction-text">
        Read the following passage aloud. 
        {readingAttempts.length > 0 && (
          <span style={{ color: '#666', fontSize: '14px' }}>
            {' '}(Attempt {readingAttempts.length + 1})
          </span>
        )}
      </p>

      <div className="reading-passage-container">
        <p className="reading-passage" style={passageStyle}>{passage}</p>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          <p>Font size: {currentFontSize}px</p>
          {readingAttempts.length > 0 && (
            <p>Previous attempts: {readingAttempts.map((a, i) => 
              `${a.fontSize}px (${a.accuracy.toFixed(1)}%)`
            ).join(', ')}</p>
          )}
        </div>
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
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? 'Stop & Analyze' : 'Start Reading'}
        </button>
      </div>
    </div>
  );
}
