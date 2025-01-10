// src/types/sequentialChat.types.ts

import { ChatRequest, ChatDocument, ExecutionStatus } from '@/utils/types/chat.types';

export interface SequentialChatProps {
  requests: ChatRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>;
  systemContext: string;
  setSystemContext: React.Dispatch<React.SetStateAction<string>>;
  onProcessRequests: (requestId: string) => Promise<void>;
  isProcessing: boolean;
  onSave?: (chat: ChatDocument) => void;
  title?: string;
  executionStatus?: ExecutionStatus;
}

export interface ExecutionState {
  status: ExecutionStatus;
  currentIndex: number;
  isExecuting: boolean;
  error: string | null;
}

export interface RequestManagementState {
  selectedRequestId: string | null;
  showSystemContext: boolean;
}

export interface UIPanelState {
  leftPanelWidth: number;
  isResizing: boolean;
}

export interface AttachmentState {
  [key: string]: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: File;
}