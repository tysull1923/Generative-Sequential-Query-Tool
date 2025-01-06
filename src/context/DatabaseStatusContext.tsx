// src/contexts/DatabaseStatusContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import DatabaseService from '@/services/database/DataBaseService';

interface DatabaseStatusContextType {
  isConnected: boolean;
  lastChecked: Date | null;
  checkConnection: () => Promise<void>;
}

const DatabaseStatusContext = createContext<DatabaseStatusContextType>({
  isConnected: false,
  lastChecked: null,
  checkConnection: async () => {},
});

export const DatabaseStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    try {
      const dbService = DatabaseService.getInstance();
      const connected = dbService.isConnected();
      setIsConnected(connected);
      setLastChecked(new Date());
    } catch (error) {
      setIsConnected(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DatabaseStatusContext.Provider value={{ isConnected, lastChecked, checkConnection }}>
      {children}
    </DatabaseStatusContext.Provider>
  );
};

export const useDatabaseStatus = () => useContext(DatabaseStatusContext);