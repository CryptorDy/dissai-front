import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { GenerationProvider } from './context/GenerationContext';
import { PrivateRoute } from './components/PrivateRoute';
import { GenerationStatus } from './components/GenerationStatus';

// Импорт страниц
import Home from './pages/Home';
import Chat from './pages/Chat';
import Roadmap from './pages/Roadmap';
import RoadmapResult from './pages/RoadmapResult';
import Knowledge from './pages/Knowledge';
import RegularArticle from './pages/articles/RegularArticle';
import EducationalArticle from './pages/articles/EducationalArticle';
import NotesArticle from './pages/articles/NotesArticle';
import SimplifyArticle from './pages/articles/SimplifyArticle';
import ContentPlan from './pages/articles/ContentPlan';
import ReelsTranscription from './pages/articles/ReelsTranscription';
import ReelsResult from './pages/articles/ReelsResult';
import TaskResult from './pages/TaskResult';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmailConfirmation from './pages/auth/EmailConfirmation';
import SetupNickname from './pages/auth/SetupNickname';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import TaskProgress from './pages/TaskProgress';
import Landing from './pages/Landing';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <GenerationProvider>
              <Router>
                <div className="min-h-screen">
                  <Routes>
                    {/* Публичные маршруты */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/register" element={<Register />} />
                    <Route path="/auth/email-confirmation" element={<EmailConfirmation />} />
                    <Route path="/auth/setup-nickname" element={<SetupNickname />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                    {/* Защищенные маршруты */}
                    <Route path="/studio" element={<PrivateRoute><Home /></PrivateRoute>} />
                    <Route path="/studio/" element={<PrivateRoute><Home /></PrivateRoute>} />
                    <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
                    <Route path="/articles/regular" element={<PrivateRoute><RegularArticle /></PrivateRoute>} />
                    <Route path="/articles/educational" element={<PrivateRoute><EducationalArticle /></PrivateRoute>} />
                    <Route path="/articles/notes" element={<PrivateRoute><NotesArticle /></PrivateRoute>} />
                    <Route path="/articles/simplify" element={<PrivateRoute><SimplifyArticle /></PrivateRoute>} />
                    <Route path="/articles/content-plan" element={<PrivateRoute><ContentPlan /></PrivateRoute>} />
                    <Route path="/articles/reels" element={<PrivateRoute><ReelsTranscription /></PrivateRoute>} />
                    <Route path="/articles/reels/result" element={<PrivateRoute><ReelsResult /></PrivateRoute>} />
                    <Route path="/roadmap" element={<PrivateRoute><Roadmap /></PrivateRoute>} />
                    <Route path="/roadmap/result" element={<PrivateRoute><RoadmapResult /></PrivateRoute>} />
                    <Route path="/knowledge" element={<PrivateRoute><Knowledge /></PrivateRoute>} />
                    <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                    <Route path="/tasks" element={<PrivateRoute><TaskProgress /></PrivateRoute>} />
                    <Route path="/task/result" element={<PrivateRoute><TaskResult /></PrivateRoute>} />

                    {/* Поддержка старого маршрута для обратной совместимости */}
                    <Route path="/dashboard" element={<PrivateRoute><Navigate to="/studio" replace /></PrivateRoute>} />
                  </Routes>
                  <GenerationStatus />
                </div>
              </Router>
            </GenerationProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;