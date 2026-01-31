/**
 * Global Font Size Component
 * Applies optimal font size from user profile globally
 */

import { useEffect } from 'react';
import { useUser } from '../context/UserContext';

export default function GlobalFontSize() {
  const { userLearningProfile } = useUser();

  useEffect(() => {
    if (userLearningProfile?.optimalFontSize) {
      // Apply global font size via CSS variable
      document.documentElement.style.setProperty(
        '--global-optimal-font-size',
        `${userLearningProfile.optimalFontSize}px`
      );
      
      // Also apply to body for immediate effect
      document.body.style.fontSize = `${userLearningProfile.optimalFontSize}px`;
    } else {
      // Reset to default if no optimal font size
      document.documentElement.style.removeProperty('--global-optimal-font-size');
      document.body.style.fontSize = '';
    }

    // Cleanup on unmount
    return () => {
      document.documentElement.style.removeProperty('--global-optimal-font-size');
      document.body.style.fontSize = '';
    };
  }, [userLearningProfile?.optimalFontSize]);

  return null; // This component doesn't render anything
}
