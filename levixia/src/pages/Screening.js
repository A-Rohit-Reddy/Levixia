import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import './Screening.css';

export default function Screening() {
  return (
    <Layout>
      <div className="screening-page">
        <div className="card screening-card">
          <h1>Take a short assessment to personalize your assistant</h1>
          <p className="screening-desc">
            You'll go through five short sections: reading, writing, visual processing,
            auditory processing, and attention. This helps us understand your strengths
            and suggest the best settings and support for you.
          </p>
          <ul className="screening-list">
            <li><strong>Reading</strong> — Word decoding, speed, skipping or reversals</li>
            <li><strong>Writing</strong> — Spelling patterns, phonetic errors, letter reversals</li>
            <li><strong>Visual</strong> — Visual crowding, line tracking</li>
            <li><strong>Auditory</strong> — Sound-to-word matching, listening comprehension</li>
            <li><strong>Attention</strong> — Focus duration, task switching</li>
          </ul>
          <p className="screening-note">
            There are no right or wrong answers. Take your time.
          </p>
          <Link to="/assessment" className="btn btn-primary btn-lg">
            Start assessment
          </Link>
        </div>
      </div>
    </Layout>
  );
}
