import React, { useState } from 'react';
import apiService from '../../services/apiService';
import './WritingAssistant.css';

/**
 * Writing Assistant Component
 * Handles writing-specific features: real-time corrections, suggestions
 */
export default function WritingAssistant({ 
  userText,
  referenceText,
  suggestions = [],
  onTextChange,
  onSuggestionAccept,
  onSuggestionReject,
  userProfile
}) {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState(new Set());
  const [rejectedSuggestions, setRejectedSuggestions] = useState(new Set());

  const handleAcceptSuggestion = async (suggestion) => {
    if (onSuggestionAccept) {
      onSuggestionAccept(suggestion);
    }

    // Apply correction to text
    if (onTextChange && suggestion.corrected) {
      const correctedText = userText.replace(suggestion.original, suggestion.corrected);
      onTextChange(correctedText);
    }

    setAcceptedSuggestions(prev => new Set([...prev, suggestion.id]));

    // Send feedback to backend
    try {
      await apiService.request('/api/assistant/feedback', {
        method: 'POST',
        body: {
          suggestionId: suggestion.id,
          action: 'accepted',
          userProfile
        }
      });
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  const handleRejectSuggestion = async (suggestion) => {
    setRejectedSuggestions(prev => new Set([...prev, suggestion.id]));

    // Send feedback to backend
    try {
      await apiService.request('/api/assistant/feedback', {
        method: 'POST',
        body: {
          suggestionId: suggestion.id,
          action: 'rejected',
          userProfile
        }
      });
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }

    if (onSuggestionReject) {
      onSuggestionReject(suggestion);
    }
  };

  const visibleSuggestions = suggestions.filter(
    s => !acceptedSuggestions.has(s.id) && !rejectedSuggestions.has(s.id)
  );

  if (!showSuggestions || visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="writing-assistant">
      <div className="suggestions-header">
        <h3>Writing Suggestions ({visibleSuggestions.length})</h3>
        <button
          type="button"
          className="toggle-btn"
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          {showSuggestions ? 'Hide' : 'Show'}
        </button>
      </div>

      <div className="suggestions-list">
        {visibleSuggestions.map((suggestion) => (
          <div key={suggestion.id} className="suggestion-item">
            <div className="suggestion-content">
              <span className="suggestion-type">{suggestion.type}</span>
              <div className="suggestion-text">
                <span className="original">"{suggestion.original}"</span>
                <span className="arrow">→</span>
                <span className="corrected">"{suggestion.corrected}"</span>
              </div>
              {suggestion.explanation && (
                <p className="suggestion-explanation">{suggestion.explanation}</p>
              )}
            </div>
            <div className="suggestion-actions">
              <button
                type="button"
                className="accept-btn"
                onClick={() => handleAcceptSuggestion(suggestion)}
              >
                ✓ Accept
              </button>
              <button
                type="button"
                className="reject-btn"
                onClick={() => handleRejectSuggestion(suggestion)}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
