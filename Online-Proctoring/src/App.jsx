import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateExamPage from './pages/CreateExamPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-exam" element={<CreateExamPage />} />
      </Routes>
    </Router>
  );
}

export default App;
