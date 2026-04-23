import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import AvailableExamsPage from './pages/AvailableExamsPage';
import ExamPage from './pages/ExamPreviewPage';
import HomePage from './pages/HomePage';
import CreateExamPage from './pages/CreateExamPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/create-exam"
            element={
              <ProtectedRoute>
                <CreateExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId"
            element={
              <ProtectedRoute>
                <ExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/available-exams"
            element={
              <ProtectedRoute>
                <AvailableExamsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
