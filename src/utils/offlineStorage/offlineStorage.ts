// src/utils/offlineStorage.ts
interface OfflineMessage {
    id: string;
    content: string;
    timestamp: number;
    chatId?: string;
    pending: boolean;
  }
  
  export const OfflineStorage = {
    saveMessage(message: OfflineMessage) {
      const messages = this.getMessages();
      messages.push(message);
      localStorage.setItem('offlineMessages', JSON.stringify(messages));
    },
  
    getMessages(): OfflineMessage[] {
      const stored = localStorage.getItem('offlineMessages');
      return stored ? JSON.parse(stored) : [];
    },
  
    clearMessages() {
      localStorage.removeItem('offlineMessages');
    },
  
    markMessageAsSynced(messageId: string) {
      const messages = this.getMessages();
      const updated = messages.filter(m => m.id !== messageId);
      localStorage.setItem('offlineMessages', JSON.stringify(updated));
    }
  };