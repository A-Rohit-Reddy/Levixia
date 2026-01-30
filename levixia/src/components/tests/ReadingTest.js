import React, { useState, useEffect, useRef } from 'react';

// ----------------------------------------------------------------------
// MOCK AI SERVICE (Replace with real API)
// ----------------------------------------------------------------------
const AIService = {
  // 1. Generate a unique story based on user age/level
  fetchReadingPassage: async () => {
    // Prompt: "Generate a 3-sentence story for a 10-year-old. Include words with 'th' and 'sh' sounds."
    return new Promise(resolve => setTimeout(() => resolve({
      text: "The giant ship sailed across the shiny ocean. Three distinct thoughts came to the captain's mind. 'We must share our treasure with the shore,' he shouted.",
      difficulty: "Medium"
    }), 1500));
  },

  // 2. Analyze the recording transcript using NLP
  analyzeReading: async (original, transcript, time) => {
    // Prompt: "Compare these two texts. Calculate WPM. Identify if errors are phonological (sound-based) or visual (skipping lines)."
    console.log("Analyzing:", transcript);
    return new Promise(resolve => setTimeout(() => resolve({
      accuracy: 88,
      wpm: 110,
      feedback: "User struggles with 'sh' blends (ship/sip), indicating phonological processing issues.",
      errorType: "Phonological"
    }), 2000));
  }
};

export default function ReadingTest({ onComplete }) {
  const [status, setStatus] = useState('loading'); // loading, ready, recording, analyzing
  const [passage, setPassage] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // --- Step 1: Get Content from AI ---
  useEffect(() => {
    AIService.fetchReadingPassage().then(data => {
      setPassage(data.text);
      setStatus('ready');
    });
  }, []);

  const startRecording = () => {
    setTranscript('');
    setTimeElapsed(0);
    setStatus('recording');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser not supported");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        final += event.results[i][0].transcript + ' ';
      }
      setTranscript(final);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };

  const stopAndGrade = async () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
    setStatus('analyzing');

    // --- Step 2: Send to AI for NLP Grading ---
    try {
      const report = await AIService.analyzeReading(passage, transcript, timeElapsed);
      
      onComplete({
        type: 'reading',
        accuracyPercent: report.accuracy,
        wpm: report.wpm,
        aiDiagnosis: report.feedback, // The "Perfect Data"
        rawTranscript: transcript
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (status === 'loading') return <div className="assessment-card"><h2>🤖 AI is writing a story for you...</h2></div>;
  if (status === 'analyzing') return <div className="assessment-card"><h2>🧠 AI is listening to your reading...</h2></div>;

  return (
    <div className="assessment-card">
      <h2>📖 Reading Assessment</h2>
      <p>Read the story below aloud.</p>
      
      <div className="reading-passage" style={{ fontSize: '1.2rem', lineHeight: '1.6', margin: '2rem 0', padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
        {passage}
      </div>

      <div className="voice-recorder">
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          {isRecording ? `🔴 ${timeElapsed}s` : 'Ready'}
        </div>
        
        <button 
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopAndGrade : startRecording}
        >
          {isRecording ? 'Stop & Grade' : 'Start Recording'}
        </button>
      </div>
    </div>
  );
}