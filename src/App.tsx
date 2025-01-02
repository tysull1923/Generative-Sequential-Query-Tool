import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages';
import ChatPage from './pages/chat';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;