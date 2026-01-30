import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import './ProfileSetup.css';

const AGE_GROUPS = [
  { value: 'child', label: 'Under 12' },
  { value: 'teen', label: '12–17' },
  { value: 'adult', label: '18–25' },
  { value: 'adult_plus', label: '26+' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'other', label: 'Other' },
];

export default function ProfileSetup() {
  const { profile, updateProfile } = useUser();
  const [name, setName] = useState(profile.name || '');
  const [ageGroup, setAgeGroup] = useState(profile.ageGroup || '');
  const [preferredLanguage, setPreferredLanguage] = useState(profile.preferredLanguage || 'en');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile({ name, ageGroup, preferredLanguage });
    navigate('/screening', { replace: true });
  };

  return (
    <Layout>
      <div className="profile-setup-page">
        <div className="card">
          <h1>Basic profile</h1>
          <p className="profile-intro">
            A few details help us personalize your experience. All fields except age group are optional.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="profile-name">Name (optional)</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile-age">Age group</label>
              <select
                id="profile-age"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                required
              >
                <option value="">Select age group</option>
                {AGE_GROUPS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="profile-lang">Preferred language</label>
              <select
                id="profile-lang"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
              >
                {LANGUAGES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Continue
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
