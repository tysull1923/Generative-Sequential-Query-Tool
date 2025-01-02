import { Routes, Route } from 'react-router-dom';
import HomePage from './pages';
import ChatPage from './pages/chat';
import './styles/globals.css';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </div>
  );
}

export default App;