import React, { useState, useRef, useEffect } from 'react';
import './ReadingAssistant.css';

/**
 * Reading Assistant Component
 * Handles reading-specific features: TTS, word highlighting, pace control
 */
export default function ReadingAssistant({ 
  processedText, 
  wordHighlighting, 
  ttsMetadata,
  readingPace,
  onPause,
  onResume,
  onStop 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const ttsRef = useRef(null);
  const highlightIntervalRef = useRef(null);

  // Word-by-word highlighting animation
  useEffect(() => {
    if (isPlaying && wordHighlighting?.words && wordHighlighting.words.length > 0) {
      highlightIntervalRef.current = setInterval(() => {
        setCurrentWordIndex(prev => {
          const next = prev + 1;
          if (next >= wordHighlighting.words.length) {
            setIsPlaying(false);
            return prev;
          }
          return next;
        });
      }, 600 / playbackRate); // Adjust based on WPM

      return () => {
        if (highlightIntervalRef.current) {
          clearInterval(highlightIntervalRef.current);
        }
      };
    }
  }, [isPlaying, wordHighlighting, playbackRate]);

  const handlePlay = () => {
    if (ttsMetadata && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(ttsMetadata.text);
      utterance.rate = ttsMetadata.config.rate * playbackRate;
      utterance.pitch = ttsMetadata.config.pitch;
      utterance.volume = ttsMetadata.config.volume;

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentWordIndex(0);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
      ttsRef.current = utterance;
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      if (onPause) onPause();
    }
  };

  const handleResume = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      if (onResume) onResume();
    }
  };

  const handleStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentWordIndex(0);
      if (onStop) onStop();
    }
  };

  // Render text with word-by-word highlighting
  const renderHighlightedText = () => {
    if (!wordHighlighting?.words || wordHighlighting.words.length === 0) {
      return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
    }

    const words = processedText.replace(/<[^>]*>/g, '').split(/\s+/);
    
    return (
      <div className="reading-text-container">
        {words.map((word, index) => {
          const wordMeta = wordHighlighting.words[index];
          const isCurrent = index === currentWordIndex && isPlaying;
          const isHighlighted = wordMeta?.highlight;
          const isEmphasis = wordMeta?.emphasis;

          return (
            <span
              key={index}
              className={`reading-word ${
                isCurrent ? 'current' : ''
              } ${
                isHighlighted ? 'highlighted' : ''
              } ${
                isEmphasis ? 'emphasis' : ''
              }`}
            >
              {word}{' '}
            </span>
          );
        })}
      </div>
    );
  };

  if (!processedText) return null;

  return (
    <div className="reading-assistant">
      {ttsMetadata && (
        <div className="tts-controls">
          <div className="playback-controls">
            {!isPlaying ? (
              <button onClick={handlePlay} className="play-btn">
                ▶️ Play
              </button>
            ) : (
              <>
                <button onClick={handlePause} className="pause-btn">
                  ⏸️ Pause
                </button>
                <button onClick={handleResume} className="resume-btn">
                  ▶️ Resume
                </button>
              </>
            )}
            <button onClick={handleStop} className="stop-btn">
              ⏹️ Stop
            </button>
          </div>
          
          <div className="playback-settings">
            <label>
              Speed:
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              />
              {playbackRate.toFixed(1)}x
            </label>
          </div>

          {readingPace && (
            <div className="pace-info">
              <span>Estimated time: {readingPace.estimatedTimeMinutes} min</span>
              <span>Pace: {readingPace.wordsPerMinute} WPM</span>
            </div>
          )}
        </div>
      )}

      <div className="reading-content">
        {renderHighlightedText()}
      </div>
    </div>
  );
}
