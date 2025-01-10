// src/hooks/useSequentialUI.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { UIPanelState } from '@/components/Chat/Sequential/SequentialComponents/sequentialChat.types';

const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 1200;

export const useSequentialUI = () => {
  const [uiState, setUiState] = useState<UIPanelState>({
    leftPanelWidth: window.innerWidth / 3,
    isResizing: false
  });

  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!uiState.isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    const constrainedWidth = Math.max(
      MIN_PANEL_WIDTH,
      Math.min(MAX_PANEL_WIDTH, newWidth)
    );
    
    setUiState(prev => ({ ...prev, leftPanelWidth: constrainedWidth }));
  }, [uiState.isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setUiState(prev => ({ ...prev, isResizing: true }));
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResizeEnd = () => {
    setUiState(prev => ({ ...prev, isResizing: false }));
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  useEffect(() => {
    if (uiState.isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [uiState.isResizing, handleResize]);

  return {
    uiState,
    refs: {
      resizeHandleRef,
      containerRef,
      chatContainerRef
    },
    handlers: {
      handleResizeStart,
      handleResizeEnd
    }
  };
};