import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { AssessmentProvider } from './context/AssessmentContext';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalFontSize from './components/GlobalFontSize';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import Screening from './pages/Screening';
import AssessmentInteractive from './pages/AssessmentInteractive';
import Report from './pages/Report';
import AssistantConfig from './pages/AssistantConfig';
import Dashboard from './pages/Dashboard';
import Assistant from './pages/Assistant';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <GlobalFontSize />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/profile-setup"
              element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/screening"
              element={
                <ProtectedRoute>
                  <Screening />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <AssessmentProvider>
                    <AssessmentInteractive />
                  </AssessmentProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <Report />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant-config"
              element={
                <ProtectedRoute>
                  <AssistantConfig />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant"
              element={
                <ProtectedRoute>
                  <Assistant />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
