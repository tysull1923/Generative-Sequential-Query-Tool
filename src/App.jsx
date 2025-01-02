import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatPage from './pages/chat';
import NewChatPage from './pages/newchat';
import SettingsPage from './pages/SettingsPage';
import './styles/globals.css';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/newchat" element={<NewChatPage />} />
        <Route path="/SettingsPage" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

export default App;