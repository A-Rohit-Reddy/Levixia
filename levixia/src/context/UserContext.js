import React, { createContext, useContext, useState, useCallback } from 'react';

const UserContext = createContext(null);

const defaultProfile = {
  name: '',
  ageGroup: '',
  preferredLanguage: 'en',
};

const defaultReport = {
  dyslexiaTypes: [],
  cognitiveIndicators: [],
  strengths: [],
  challenges: [],
  recommendedFeatures: [],
  level: 'mild',
  completed: false,
};

const defaultAssistantConfig = {
  bionicReading: false,
  letterSpacing: 1,
  wordSpacing: 1.2,
  lineSpacing: 1.5,
  font: 'opendyslexic',
  contrast: 'default',
  textToSpeech: true,
  writingSupport: true,
  cognitiveLoadReduction: true,
};

export function UserProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('levixia_profile');
      return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });

  const [assessmentResults, setAssessmentResults] = useState(() => {
    try {
      const saved = localStorage.getItem('levixia_assessment');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [report, setReport] = useState(() => {
    try {
      const saved = localStorage.getItem('levixia_report');
      return saved ? { ...defaultReport, ...JSON.parse(saved) } : defaultReport;
    } catch {
      return defaultReport;
    }
  });

  const [assistantConfig, setAssistantConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('levixia_assistant_config');
      return saved ? { ...defaultAssistantConfig, ...JSON.parse(saved) } : defaultAssistantConfig;
    } catch {
      return defaultAssistantConfig;
    }
  });

  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('levixia_progress');
      return saved ? JSON.parse(saved) : { readingSessions: [], writingSessions: [], accuracyHistory: [] };
    } catch {
      return { readingSessions: [], writingSessions: [], accuracyHistory: [] };
    }
  });

  const [userLearningProfile, setUserLearningProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('levixia_learning_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const updateProfile = useCallback((updates) => {
    setProfile((p) => {
      const next = { ...p, ...updates };
      localStorage.setItem('levixia_profile', JSON.stringify(next));
      return next;
    });
  }, []);

  const saveAssessmentResults = useCallback((results) => {
    setAssessmentResults(results);
    localStorage.setItem('levixia_assessment', JSON.stringify(results));
  }, []);

  const saveReport = useCallback((reportData) => {
    setReport((r) => {
      const next = { ...r, ...reportData, completed: true };
      localStorage.setItem('levixia_report', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateAssistantConfig = useCallback((updates) => {
    setAssistantConfig((c) => {
      const next = { ...c, ...updates };
      localStorage.setItem('levixia_assistant_config', JSON.stringify(next));
      return next;
    });
  }, []);

  const addProgressSession = useCallback((type, data) => {
    setProgress((p) => {
      const key = type === 'reading' ? 'readingSessions' : 'writingSessions';
      const next = {
        ...p,
        [key]: [...(p[key] || []), { ...data, date: new Date().toISOString() }],
      };
      if (data.accuracy != null) {
        next.accuracyHistory = [...(p.accuracyHistory || []), { ...data, date: new Date().toISOString() }];
      }
      localStorage.setItem('levixia_progress', JSON.stringify(next));
      return next;
    });
  }, []);

  const saveLearningProfile = useCallback((profile) => {
    setUserLearningProfile(profile);
    localStorage.setItem('levixia_learning_profile', JSON.stringify(profile));
  }, []);

  const updateLearningProfile = useCallback((updates) => {
    setUserLearningProfile((p) => {
      const next = p ? { ...p, ...updates, updatedAt: new Date().toISOString() } : updates;
      localStorage.setItem('levixia_learning_profile', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <UserContext.Provider
      value={{
        profile,
        updateProfile,
        assessmentResults,
        saveAssessmentResults,
        report,
        saveReport,
        assistantConfig,
        updateAssistantConfig,
        progress,
        addProgressSession,
        userLearningProfile,
        saveLearningProfile,
        updateLearningProfile,
        defaultReport,
        defaultAssistantConfig,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
