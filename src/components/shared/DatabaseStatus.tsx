// src/components/shared/DatabaseStatus/DatabaseStatus.tsx
import React from 'react';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useDatabaseStatus } from '@/context/DatabaseStatusContext';

export const DatabaseStatus: React.FC = () => {
  const { isConnected, lastChecked } = useDatabaseStatus();

  if (isConnected) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Database Disconnected</AlertTitle>
      <p>The application is running in offline mode. Some features may be limited.</p>
      {lastChecked && (
        <p className="text-sm mt-2">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}
    </Alert>
  );
};