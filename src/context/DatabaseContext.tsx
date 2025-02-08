// src/context/DatabaseContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useDatabase } from '@/services/database/hooks/useDatabase';
import { ConnectionMetrics } from '@/services/database/DataBaseService';

interface DatabaseContextType {
  isConnected: boolean;
  isInitializing: boolean;
  error: Error | null;
  metrics: ConnectionMetrics | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const database = useDatabase();

  return (
    <DatabaseContext.Provider value={database}>
      {database.isInitializing ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Connecting to database...</div>
        </div>
      ) : database.error ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-500">
            Database Error: {database.error.message}
          </div>
        </div>
      ) : (
        children
      )}
    </DatabaseContext.Provider>
  );
}

export function useDbContext() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDbContext must be used within a DatabaseProvider');
  }
  return context;
}