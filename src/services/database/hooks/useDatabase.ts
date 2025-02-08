import { useState, useEffect } from 'react';
import DatabaseService from '@/services/database/DataBaseService';
import { ConnectionMetrics } from '@/services/database/DataBaseService';

interface UseDatabaseReturn {
  isConnected: boolean;
  isInitializing: boolean;
  error: Error | null;
  metrics: ConnectionMetrics | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Hook for managing database connection lifecycle
 * @returns Database connection state and control functions
 */
export const useDatabase = (): UseDatabaseReturn => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState<ConnectionMetrics | null>(null);

  // Get database service instance
  const dbService = DatabaseService.getInstance();

  // Initialize database connection
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Setup event listeners
        dbService.on('connected', () => {
          setIsConnected(true);
          setError(null);
        });

        dbService.on('disconnected', () => {
          setIsConnected(false);
        });

        dbService.on('error', (err: Error) => {
          setError(err);
        });

        dbService.on('metricsUpdated', (newMetrics: ConnectionMetrics) => {
          setMetrics(newMetrics);
        });

        // Initial connection attempt
        await dbService.connect();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize database'));
      } finally {
        setIsInitializing(false);
      }
    };

    initializeDatabase();

    // Cleanup function
    return () => {
      // Remove event listeners if needed
      // Currently DatabaseService doesn't have removeListener method
      // but you might want to add it for cleanup
    };
  }, []);

  // Connect function
  const connect = async () => {
    try {
      setError(null);
      await dbService.connect();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect to database'));
      throw err;
    }
  };

  // Disconnect function
  const disconnect = async () => {
    try {
      await dbService.disconnect();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to disconnect from database'));
      throw err;
    }
  };

  return {
    isConnected,
    isInitializing,
    error,
    metrics,
    connect,
    disconnect
  };
};

export default useDatabase;