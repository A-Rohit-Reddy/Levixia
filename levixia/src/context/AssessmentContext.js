import React, { createContext, useContext, useState, useCallback } from 'react';

const AssessmentContext = createContext(null);

const ASSESSMENT_STEPS = [
  { id: 'reading', title: 'Reading Test', type: 'reading' },
  { id: 'spelling', title: 'Spelling Test', type: 'spelling' },
  { id: 'visual', title: 'Visual Processing', type: 'visual' },
  { id: 'cognitive', title: 'Cognitive & Memory', type: 'cognitive' },
];

const defaultResults = {
  reading: null,
  spelling: null,
  visual: null,
  cognitive: null,
};

export function AssessmentProvider({ children }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [results, setResults] = useState(defaultResults);

  const currentStep = ASSESSMENT_STEPS[currentStepIndex];
  const totalSteps = ASSESSMENT_STEPS.length;
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;
  const isComplete = currentStepIndex >= totalSteps && Object.values(results).every(Boolean);

  const setResult = useCallback((type, data) => {
    setResults((prev) => ({ ...prev, [type]: data }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((i) => Math.min(i + 1, totalSteps));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setResults(defaultResults);
  }, []);

  const completeStep = useCallback(
    (type, data) => {
      setResult(type, data);
      nextStep();
    },
    [setResult, nextStep]
  );

  return (
    <AssessmentContext.Provider
      value={{
        steps: ASSESSMENT_STEPS,
        currentStepIndex,
        currentStep,
        totalSteps,
        progressPercent,
        results,
        setResult,
        completeStep,
        nextStep,
        goBack,
        reset,
        isComplete,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
