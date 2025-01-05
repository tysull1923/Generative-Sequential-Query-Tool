import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
import ChatPage from './pages/chat';
import NewChatPage from "@/pages/newchat.tsx"
import SettingsPage from './pages/SettingsPage';
import './styles/globals.css';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/new-chat" element={<NewChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

export default App;