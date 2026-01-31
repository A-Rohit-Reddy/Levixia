import React from 'react';
import './AdaptiveControls.css';

/**
 * Adaptive Controls Component
 * Shows active features and allows user interaction
 */
export default function AdaptiveControls({ 
  activeFeatures = [], 
  adaptiveConfig,
  onFeatureToggle,
  onRequestSimplification,
  onRequestExpansion 
}) {
  if (!adaptiveConfig || activeFeatures.length === 0) {
    return null;
  }

  return (
    <div className="adaptive-controls">
      <div className="controls-header">
        <h3>Active Features</h3>
        {adaptiveConfig.explanation && (
          <p className="config-explanation">{adaptiveConfig.explanation}</p>
        )}
      </div>

      <div className="features-list">
        {activeFeatures.map(feature => (
          <div key={feature} className="feature-item">
            <span className="feature-name">
              {feature.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            {onFeatureToggle && (
              <button
                type="button"
                className="feature-toggle"
                onClick={() => onFeatureToggle(feature)}
                aria-label={`Toggle ${feature}`}
              >
                ⚙️
              </button>
            )}
          </div>
        ))}
      </div>

      {(onRequestSimplification || onRequestExpansion) && (
        <div className="content-actions">
          {onRequestSimplification && (
            <button
              type="button"
              className="action-btn"
              onClick={onRequestSimplification}
            >
              Simplify Content
            </button>
          )}
          {onRequestExpansion && (
            <button
              type="button"
              className="action-btn"
              onClick={onRequestExpansion}
            >
              Expand Content
            </button>
          )}
        </div>
      )}

      {adaptiveConfig.recommendedActions && adaptiveConfig.recommendedActions.length > 0 && (
        <div className="recommendations">
          <strong>💡 Recommendations:</strong>
          <ul>
            {adaptiveConfig.recommendedActions.map((action, idx) => (
              <li key={idx}>{action}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
