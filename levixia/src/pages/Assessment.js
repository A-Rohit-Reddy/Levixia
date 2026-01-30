import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import './Assessment.css';

const STEPS = [
  { id: 'reading', title: 'Reading', sub: 'Word decoding, speed, reversals' },
  { id: 'writing', title: 'Writing', sub: 'Spelling, phonetic errors, reversals' },
  { id: 'visual', title: 'Visual', sub: 'Visual crowding, line tracking' },
  { id: 'auditory', title: 'Auditory', sub: 'Sound-to-word, comprehension' },
  { id: 'attention', title: 'Attention', sub: 'Focus duration, task switching' },
];

const READING_QUESTIONS = [
  { id: 'r1', text: 'How often do you skip or repeat words when reading aloud?', options: ['Rarely', 'Sometimes', 'Often', 'Very often'] },
  { id: 'r2', text: 'Do you mix up similar-looking letters (b/d, p/q)?', options: ['Rarely', 'Sometimes', 'Often', 'Very often'] },
  { id: 'r3', text: 'How would you rate your reading speed compared to others?', options: ['Faster', 'Same', 'Slower', 'Much slower'] },
];

const WRITING_QUESTIONS = [
  { id: 'w1', text: 'Do you spell words the way they sound instead of correctly?', options: ['Rarely', 'Sometimes', 'Often', 'Very often'] },
  { id: 'w2', text: 'Do you reverse letters when writing (e.g. "teh" for "the")?', options: ['Rarely', 'Sometimes', 'Often', 'Very often'] },
  { id: 'w3', text: 'How confident are you with spelling unfamiliar words?', options: ['Very confident', 'Somewhat', 'Not very', 'Not at all'] },
];

const VISUAL_QUESTIONS = [
  { id: 'v1', text: 'Do letters or words seem to crowd together when you read?', options: ['Rarely', 'Sometimes', 'Often', 'Very often'] },
  { id: 'v2', text: 'Do you lose your place when moving to the next line?', options: ['Rarely', 'Sometimes', 'Often', 'Very often'] },
];

const AUDITORY_QUESTIONS = [
  { id: 'a1', text: 'Do you mix up similar-sounding words (e.g. "cat" and "bat")?', options: ['Rarely', 'Sometimes', 'Often', 'Very often'] },
  { id: 'a2', text: 'How well do you follow spoken instructions?', options: ['Very well', 'Okay', 'Struggle sometimes', 'Often struggle'] },
];

const ATTENTION_QUESTIONS = [
  { id: 't1', text: 'How long can you focus on reading or writing before losing focus?', options: ['Long (30+ min)', 'Medium (10–30 min)', 'Short (5–10 min)', 'Very short (<5 min)'] },
  { id: 't2', text: 'Do you find it hard to switch between tasks (e.g. reading then writing)?', options: ['Rarely', 'Sometimes', 'Often', 'Very often'] },
];

const SCORE_MAP = { 'Rarely': 0, 'Sometimes': 1, 'Often': 2, 'Very often': 3 };
const SCORE_MAP_ALT = { 'Very confident': 0, 'Somewhat': 1, 'Not very': 2, 'Not at all': 3 };
const SCORE_MAP_SPEED = { 'Faster': 0, 'Same': 1, 'Slower': 2, 'Much slower': 3 };
const SCORE_MAP_FOCUS = { 'Long (30+ min)': 0, 'Medium (10–30 min)': 1, 'Short (5–10 min)': 2, 'Very short (<5 min)': 3 };
const SCORE_MAP_INSTRUCT = { 'Very well': 0, 'Okay': 1, 'Struggle sometimes': 2, 'Often struggle': 3 };

function getScore(opt, map = SCORE_MAP) {
  return map[opt] ?? SCORE_MAP[opt] ?? 1;
}

function runAnalysis(answers) {
  const reading = (answers.r1 ?? 1) + (answers.r2 ?? 1) + (answers.r3 ?? 1);
  const writing = (answers.w1 ?? 1) + (answers.w2 ?? 1) + (answers.w3 ?? 1);
  const visual = (answers.v1 ?? 1) + (answers.v2 ?? 1);
  const auditory = (answers.a1 ?? 1) + (answers.a2 ?? 1);
  const attention = (answers.t1 ?? 1) + (answers.t2 ?? 1);

  const types = [];
  if (reading >= 4 || writing >= 4) types.push('Phonological');
  if (writing >= 4 && visual >= 3) types.push('Surface');
  if (visual >= 4) types.push('Visual');
  if (types.length >= 2) {
    types.length = 0;
    types.push('Mixed');
  }
  if (types.length === 0 && (reading >= 3 || writing >= 3)) types.push('Phonological');

  const cognitive = [];
  if (attention >= 4) cognitive.push('Attention difficulty');
  if (auditory >= 4) cognitive.push('Memory load sensitivity');
  if (visual >= 3) cognitive.push('Visual stress');

  let level = 'mild';
  const total = reading + writing + visual + auditory + attention;
  if (total >= 12) level = 'moderate';
  if (total >= 18) level = 'significant';

  const recommended = [];
  if (reading >= 3 || visual >= 3) recommended.push('Bionic Reading', 'Focus line highlighting', 'Dyslexia-friendly font');
  if (visual >= 2) recommended.push('Letter and line spacing', 'Color & contrast');
  if (auditory >= 2) recommended.push('Text-to-speech');
  if (writing >= 2) recommended.push('Writing support rules', 'Spelling suggestions');
  if (attention >= 3) recommended.push('Cognitive load reduction', 'Chunked text');

  return {
    dyslexiaTypes: types.length ? types : ['None identified'],
    cognitiveIndicators: cognitive,
    level,
    strengths: ['Willingness to use tools', 'Clear self-awareness'],
    challenges: types.length ? ['Reading fluency', 'Spelling consistency'] : [],
    recommendedFeatures: [...new Set(recommended)],
  };
}

export default function Assessment() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const { saveAssessmentResults, saveReport } = useUser();
  const navigate = useNavigate();

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const questions = {
    reading: READING_QUESTIONS,
    writing: WRITING_QUESTIONS,
    visual: VISUAL_QUESTIONS,
    auditory: AUDITORY_QUESTIONS,
    attention: ATTENTION_QUESTIONS,
  }[step.id];

  const setAnswer = (qId, value) => {
    setAnswers((a) => ({ ...a, [qId]: value }));
  };

  const getAnswer = (qId) => answers[qId];

  const scoreAnswer = (opt, qId) => {
    if (qId === 'r3') return getScore(opt, SCORE_MAP_SPEED);
    if (qId === 'w3') return getScore(opt, SCORE_MAP_ALT);
    if (qId === 't1') return getScore(opt, SCORE_MAP_FOCUS);
    if (qId === 'a2') return getScore(opt, SCORE_MAP_INSTRUCT);
    return getScore(opt);
  };

  const handleNext = () => {
    if (isLast) {
      const numericAnswers = {};
      Object.entries(answers).forEach(([k, v]) => {
        const q = [...READING_QUESTIONS, ...WRITING_QUESTIONS, ...VISUAL_QUESTIONS, ...AUDITORY_QUESTIONS, ...ATTENTION_QUESTIONS].find((x) => x.id === k);
        numericAnswers[k] = q ? scoreAnswer(v, k) : 1;
      });
      saveAssessmentResults({ raw: answers, numeric: numericAnswers });
      const report = runAnalysis(numericAnswers);
      saveReport(report);
      navigate('/report', { replace: true });
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const canProceed = questions.every((q) => getAnswer(q.id) !== undefined);

  return (
    <Layout>
      <div className="assessment-page">
        <div className="card">
          <div className="steps">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`step-dot ${i < stepIndex ? 'done' : ''} ${i === stepIndex ? 'active' : ''}`}
                title={s.title}
                aria-hidden
              />
            ))}
          </div>
          <h1>{step.title} assessment</h1>
          <p className="assessment-sub">{step.sub}</p>

          <div className="assessment-questions">
            {questions.map((q) => (
              <div key={q.id} className="form-group question-block">
                <label>{q.text}</label>
                <div className="options" role="group" aria-label={q.text}>
                  {q.options.map((opt) => (
                    <label key={opt} className="option-label">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={getAnswer(q.id) === opt}
                        onChange={() => setAnswer(q.id, opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="assessment-actions">
            {stepIndex > 0 && (
              <button type="button" className="btn btn-secondary" onClick={() => setStepIndex((i) => i - 1)}>
                Back
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={handleNext} disabled={!canProceed}>
              {isLast ? 'See my report' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
