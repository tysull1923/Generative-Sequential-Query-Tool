// src/hooks/useRequestManager.ts

import { useState } from 'react';
import { 
  ChatRequest, 
  ChatType, 
  Role, 
  SequentialStepType, 
  ChatCardState 
} from '@/utils/types/chat.types';
import { RequestManagementState, AttachmentState, FileAttachment } from '@/components/Chat/Sequential/SequentialComponents/sequentialChat.types';

export const useRequestManager = (
  initialRequests: ChatRequest[],
  setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>
) => {
  const [requestState, setRequestState] = useState<RequestManagementState>({
    selectedRequestId: null,
    showSystemContext: false
  });

  const [attachments, setAttachments] = useState<AttachmentState>({});

  const addNewRequest = () => {
    const newRequest: ChatRequest = {
      id: Date.now().toString(),
      role: Role.USER,
      type: ChatType.SEQUENTIAL,
      step: SequentialStepType.MESSAGE,
      content: '',
      status: ChatCardState.READY,
      position: initialRequests.length,
      number: initialRequests.length + 1
    };
    setRequests(prev => [...prev, newRequest]);
  };

  const addPauseStep = () => {
    const newRequest: ChatRequest = {
      id: Date.now().toString(),
      role: Role.SYSTEM,
      type: ChatType.SEQUENTIAL,
      step: SequentialStepType.PAUSE,
      content: '',
      status: ChatCardState.READY,
      position: initialRequests.length,
      number: initialRequests.length + 1,
      isPaused: true
    };
    setRequests(prev => [...prev, newRequest]);
  };

  const addDelayStep = () => {
    const newRequest: ChatRequest = {
      id: Date.now().toString(),
      role: Role.SYSTEM,
      type: ChatType.SEQUENTIAL,
      step: SequentialStepType.DELAY,
      content: '',
      status: ChatCardState.READY,
      position: initialRequests.length,
      number: initialRequests.length + 1,
      duration: 5
    };
    setRequests(prev => [...prev, newRequest]);
  };

  const moveRequest = (id: string, direction: 'up' | 'down') => {
    const index = initialRequests.findIndex(r => r.id === id);
    if ((direction === 'up' && index === 0) ||
        (direction === 'down' && index === initialRequests.length - 1)) return;

    const newRequests = [...initialRequests];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempPosition = newRequests[index].position;
    newRequests[index].position = newRequests[swapIndex].position;
    newRequests[swapIndex].position = tempPosition;
    
    [newRequests[index], newRequests[swapIndex]] = 
    [newRequests[swapIndex], newRequests[index]];

    setRequests(newRequests);
  };

  const deleteRequest = (id: string) => {
    const index = initialRequests.findIndex(r => r.id === id);
    const newRequests = initialRequests.filter(req => req.id !== id);
    
    for (let i = index; i < newRequests.length; i++) {
      newRequests[i] = {
        ...newRequests[i],
        position: i
      };
    }

    setRequests(newRequests);
    if (requestState.selectedRequestId === id) {
      setRequestState(prev => ({ ...prev, selectedRequestId: null }));
    }

    setAttachments(prev => {
      const newAttachments = { ...prev };
      delete newAttachments[id];
      return newAttachments;
    });
  };

  const updateRequestContent = (id: string, content: string) => {
    setRequests(requests => 
      requests.map(req => req.id === id ? { ...req, content } : req)
    );
  };

  const togglePauseStep = (id: string) => {
    setRequests(requests => 
      requests.map(req => {
        if (req.id === id && req.step === SequentialStepType.PAUSE) {
          return { ...req, isPaused: !req.isPaused };
        }
        return req;
      })
    );
  };

  const updateDelayDuration = (id: string, duration: number) => {
    setRequests(requests => 
      requests.map(req => {
        if (req.id === id && req.step === SequentialStepType.DELAY) {
          return { ...req, duration };
        }
        // src/hooks/useRequestManager.ts (continued)
        return req;
      })
    );
  };

  const handleAttachment = (id: string, files: FileList) => {
    const newAttachments = Array.from(files).map(file => ({
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      content: file
    }));

    setAttachments(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), ...newAttachments]
    }));
  };

  const handleRemoveAttachment = (requestId: string, attachmentId: string) => {
    setAttachments(prev => ({
      ...prev,
      [requestId]: prev[requestId]?.filter(att => att.id !== attachmentId) || []
    }));
  };

  const selectRequest = (id: string) => {
    setRequestState(prev => ({ ...prev, selectedRequestId: id }));
  };

  const toggleSystemContext = () => {
    setRequestState(prev => ({ ...prev, showSystemContext: !prev.showSystemContext }));
  };

  return {
    requestState,
    attachments,
    actions: {
      addNewRequest,
      addPauseStep,
      addDelayStep,
      moveRequest,
      deleteRequest,
      updateRequestContent,
      togglePauseStep,
      updateDelayDuration,
      handleAttachment,
      handleRemoveAttachment,
      selectRequest,
      toggleSystemContext
    }
  };
};