import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
//import ChatPage from './pages/chats/Chats/chat';
import NewChatPage from "@/pages/chats/NewChats/new_sequential_chat"
import SettingsPage from './pages/SettingsPage';
import './styles/globals.css';
import BaseChat from './pages/chats/basechat';
import ChatPage from './pages/chats/chat';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* <Route path="/chat" element={<ChatPage />} /> */}
        {/* <Route path="/base-chat" element={<BaseChat />} />
        <Route path="/new-chat" element={<NewChatPage />} /> */}
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

export default App;