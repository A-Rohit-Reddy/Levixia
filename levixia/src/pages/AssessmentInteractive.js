import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAssessment } from '../context/AssessmentContext';
import { useUser } from '../context/UserContext';
import { computeReportFromResults } from '../utils/diagnosisAlgorithm';
import apiService from '../services/apiService';
import ReadingTest from '../components/tests/ReadingTest';
import SpellingTest from '../components/tests/SpellingTest';
import VisualTest from '../components/tests/VisualTest';
import CognitiveTest from '../components/tests/CognitiveTest';
import './AssessmentInteractive.css';

export default function AssessmentInteractive() {
  const navigate = useNavigate();
  const { currentStepIndex, currentStep, totalSteps, progressPercent, results, completeStep, goBack } = useAssessment();
  const { saveAssessmentResults, saveReport, saveLearningProfile } = useUser();

  useEffect(() => {
    if (currentStepIndex >= totalSteps && results.reading && results.spelling && results.visual && results.cognitive) {
      const generateReport = async () => {
        try {
          const report = await computeReportFromResults(results);
          saveAssessmentResults(results);
          saveReport(report);
          
          // Generate user learning profile after report is created
          try {
            const profile = await apiService.generateProfile(results, report);
            saveLearningProfile(profile);
            console.log('✅ User learning profile generated and saved');
          } catch (profileError) {
            console.warn('Profile generation failed, will be generated on assistant load:', profileError);
          }
          
          navigate('/report', { replace: true });
        } catch (error) {
          console.error('Failed to generate report:', error);
          // Still save results even if report generation fails
          saveAssessmentResults(results);
          navigate('/report', { replace: true });
        }
      };
      generateReport();
    }
  }, [currentStepIndex, totalSteps, results, saveAssessmentResults, saveReport, navigate]);

  const handleStepComplete = (data) => {
    completeStep(data.type, data);
  };

  if (currentStepIndex >= totalSteps) {
    return (
      <Layout>
        <div className="assessment-interactive-page">
          <div className="bg-animation" />
          <div className="container">
            <div className="assessment-card">
              <div className="analysis-loading">
                <div className="spinner" />
                <h2>Generating your report…</h2>
                <p style={{ color: 'var(--levixia-text-muted)', marginTop: '1rem' }}>
                  Analyzing your results and preparing recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="assessment-interactive-page">
        <div className="bg-animation" />
        <div className="container">
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="progress-text">
              Step {currentStepIndex + 1} of {totalSteps}: {currentStep?.title}
            </div>
          </div>

          {currentStep?.type === 'reading' && <ReadingTest onComplete={handleStepComplete} />}
          {currentStep?.type === 'spelling' && <SpellingTest onComplete={handleStepComplete} />}
          {currentStep?.type === 'visual' && <VisualTest onComplete={handleStepComplete} />}
          {currentStep?.type === 'cognitive' && <CognitiveTest onComplete={handleStepComplete} />}

          {currentStepIndex > 0 && (
            <div className="button-group" style={{ marginTop: '1rem' }}>
              <button type="button" className="secondary-btn" onClick={goBack}>
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
