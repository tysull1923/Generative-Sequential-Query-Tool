// src/hooks/useSequentialExecution.ts

import { useState, useRef, useEffect } from 'react';
import { ChatRequest, ExecutionStatus, SequentialStepType, ChatCardState } from '@/utils/types/chat.types';
import { ExecutionState } from '@/components/Chat/Sequential/SequentialComponents/sequentialChat.types';

export const useSequentialExecution = (
  requests: ChatRequest[],
  onProcessRequests: (requestId: string) => Promise<void>
) => {
  const [executionState, setExecutionState] = useState<ExecutionState>({
    status: ExecutionStatus.IDLE,
    currentIndex: 0,
    isExecuting: false,
    error: null
  });

  const executionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processSequentialRequests = async () => {
    if (executionState.status === ExecutionStatus.RUNNING) return;
    
    try {
      setExecutionState(prev => ({
        ...prev,
        status: ExecutionStatus.RUNNING,
        isExecuting: true,
        error: null
      }));
      
      const sortedRequests = [...requests].sort((a, b) => a.position - b.position);
      
      for (let i = executionState.currentIndex; i < sortedRequests.length; i++) {
        if (executionState.status === ExecutionStatus.PAUSED) break;
        
        const request = sortedRequests[i];
        setExecutionState(prev => ({ ...prev, currentIndex: i }));

        if (request.step === SequentialStepType.PAUSE && request.isPaused) {
          setExecutionState(prev => ({ ...prev, status: ExecutionStatus.PAUSED }));
          break;
        }

        if (request.step === SequentialStepType.DELAY && request.duration) {
          await new Promise(resolve => {
            executionTimeoutRef.current = setTimeout(resolve, request.duration * 1000);
          });
        }

        if (request.step === SequentialStepType.MESSAGE) {
          try {
            await onProcessRequests(request.id);
            request.status = ChatCardState.COMPLETE;
          } catch (error) {
            request.status = ChatCardState.ERROR;
            throw error;
          }
        }
      }

      if (executionState.currentIndex === sortedRequests.length - 1) {
        setExecutionState(prev => ({
          ...prev,
          status: ExecutionStatus.COMPLETED,
          currentIndex: 0
        }));
      }

    } catch (error) {
      setExecutionState(prev => ({
        ...prev,
        status: ExecutionStatus.ERROR,
        error: error.message || 'Failed to process requests'
      }));
    } finally {
      setExecutionState(prev => ({ ...prev, isExecuting: false }));
    }
  };

  const pauseExecution = () => {
    if (executionTimeoutRef.current) {
      clearTimeout(executionTimeoutRef.current);
    }
    setExecutionState(prev => ({
      ...prev,
      status: ExecutionStatus.PAUSED,
      isExecuting: false
    }));
  };

  const resumeExecution = () => {
    setExecutionState(prev => ({ ...prev, status: ExecutionStatus.RUNNING }));
    processSequentialRequests();
  };

  useEffect(() => {
    return () => {
      if (executionTimeoutRef.current) {
        clearTimeout(executionTimeoutRef.current);
      }
    };
  }, []);

  return {
    executionState,
    processSequentialRequests,
    pauseExecution,
    resumeExecution
  };
};