/**
 * @fileoverview Core type definitions for the GSQT chat system
 */

// Chat Type Enums
/**
 * @fileoverview Core type definitions for the GSQT chat system
 */

// Chat Type Enums
/**
 * Available chat types in the system
 * @enum {string}
 */
export enum ChatType {
    BASE = 'BASE_CHAT',
    SEQUENTIAL = 'SEQUENTIAL_CHAT',
    REQUIREMENTS = 'REQUIREMENTS_CHAT',
  }
    //WORKFLOW = 'WORKFLOW_CREATION',
    //SCHEDULER = 'SCHEDULER_CREATION'

  export enum Role {
    SYSTEM = 'system',
    USER = 'user',
    DEVELOPER = 'developer',
    ASSISTANT = 'assistant'
  }
  
  // API Request
  
  export type ChatRequest = {
    id: string;
    role: Role;
    type: ChatType;
    step: 'chat' | 'pause';
    content?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'paused';
    response?: ChatResponse;
    isPaused?: boolean;
    number: number;
  }
  
  /**
   * API Response interface
   */
  export type ChatResponse = {
    provider: Role;
    content: string;
    responseType: TextResponse | CodeResponse | ImageResponse | ErrorResponse;
  }
  
  export interface ChatDocument {
    id: string;
    title: string;
    type: ChatType;
    settings: ChatSettings;
    messages: (BaseMessage | FileMessage)[];
    responses: ChatResponse[];  // Add this property
    executionStatus: ExecutionStatus | undefined;
    steps?: ChatStep[];        // Add this property
    lastModified: Date;
    createdAt: Date;
  }

  /**
   * Possible states for chat cards
   * @enum {string}
   */
  export enum ChatCardState {
    READY = 'ready',
    EDITING = 'editing',
    SENT = 'sent',
    COMPLETE = 'complete',
    ERROR = 'error'
  }
  
  /**
   * Types of responses that can be received from the API
   * @enum {string}
   */
  export enum ResponseType {
    TEXT = 'text',
    CODE = 'code',
    IMAGE = 'image',
    ERROR = 'error'
  }
  
  /**
   * Types of steps in a sequential chat
   * @enum {string}
   */
  export enum SequentialStepType {
    MESSAGE = 'message',
    PAUSE = 'pause',
    DELAY = 'delay'
  }
  
  // Base Interfaces
  /**
   * Base interface for all chat messages
   * @interface
   */
  export interface BaseMessage {
    id: string;
    timestamp: number;
    content: string;
    sender: 'user' | 'assistant';
  }
  
  /**
   * Interface for file attachments in messages
   * @interface
   */
  export interface FileAttachment {
    id: string;
    name: string;
    type: string;
    size: number;
    content: File | Blob;
  }
  
  /**
   * Interface for system context messages
   * @extends BaseMessage
   */
  export interface SystemContextMessage extends BaseMessage {
    type: 'system';
    context: string;
  }
  
  /**
   * Interface for chat messages with file attachments
   * @extends BaseMessage
   */
  export interface FileMessage extends BaseMessage {
    attachments: FileAttachment[];
  }
  
  // Chat Settings Interfaces
  /**
   * Interface for additional chat parameters
   * @interface
   */
  export interface ChatParameters {
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stop?: string[];
  }
  
  /**
   * Interface for chat saving parameters
   * @interface
   */
  /**
   * Interface for chat saving parameters
   * All properties are optional for partial updates,
   * but application should ensure required fields are set when saving
   * @interface
   */
  export interface ChatSavingParams {
    saveToApplication?: boolean;
    saveToFile?: boolean;
    summary?: string;
    fileName?: string;
  }
  
  /**
   * Main interface for chat settings
   * @interface
   */
  export interface ChatSettings {
    temperature: number;
    chatType: ChatType;
    systemContext?: string;
    additionalParams?: ChatParameters;
    savingParams?: ChatSavingParams;
  }
  
  // Response Types
  /**
   * Interface for text responses
   * @interface
   */
  export interface TextResponse {
    type: ResponseType.TEXT;
    content: string;
  }
  
  /**
   * Interface for code responses
   * @interface
   */
  export interface CodeResponse {
    type: ResponseType.CODE;
    content: string;
    language: string;
  }
  
  /**
   * Interface for image responses
   * @interface
   */
  export interface ImageResponse {
    type: ResponseType.IMAGE;
    content: string;
    width: number;
    height: number;
  }
  
  /**
   * Interface for error responses
   * @interface
   */
  export interface ErrorResponse {
    type: ResponseType.ERROR;
    message: string;
    code: string;
  }
  
  //export type ChatResponse = TextResponse | CodeResponse | ImageResponse | ErrorResponse;
  
  // Sequential Chat Types
  /**
   * Interface for pause steps in sequential chats
   * @interface
   */
  export interface PauseStep {
    type: SequentialStepType.PAUSE;
    id: string;
    position: number;
  }
  
  /**
   * Interface for delay steps in sequential chats
   * @interface
   */
  export interface DelayStep {
    type: SequentialStepType.DELAY;
    id: string;
    position: number;
    duration: number; // in seconds
  }
  
  /**
   * Interface for message steps in sequential chats
   * @interface
   */
  export interface MessageStep {
    type: SequentialStepType.MESSAGE;
    id: string;
    position: number;
    message: BaseMessage;
  }
  
  export type SequentialStep = PauseStep | DelayStep | MessageStep;
  
  /**
   * Interface for chat steps in sequential chats
   * @interface
   */
  export interface ChatStep {
    id: string;
    type: SequentialStepType;
    position: number;
    content?: string;
    duration?: number;  // for delay steps
    message?: BaseMessage; // for message steps
  }
  
  // Component Props Interfaces
  /**
   * Props interface for chat cards
   * @interface
   */
  export interface ChatCardProps {
    message: BaseMessage | FileMessage;
    state: ChatCardState;
    position: number;
    onMove: (id: string, newPosition: number) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string, content: string) => void;
    onSend: (id: string) => void;
  }
  
  /**
   * Props interface for response cards
   * @interface
   */
  export interface ResponseCardProps {
    response: ChatResponse;
    isEditable?: boolean;
    onEdit?: (content: string) => void;
    onSave?: (fileName: string) => void;
    onCopy?: () => void;
  }
  
  /**
   * Props interface for step cards in sequential chats
   * @interface
   */
  export interface StepCardProps {
    step: SequentialStep;
    onMove: (id: string, newPosition: number) => void;
    onDelete: (id: string) => void;
    onPause?: () => void;
    onResume?: () => void;
    onDurationChange?: (duration: number) => void;
  }
  
  /**
   * Props interface for chat banner
   * @interface
   */
  export interface ChatBannerProps {
    title: string;
    settings: ChatSettings;
    onTitleChange: (newTitle: string) => void;
    onSettingsChange: (newSettings: ChatSettings) => void;
    onAddStep?: (type: SequentialStepType) => void;
  }
  
  /**
   * Props interface for chat input
   * @interface
   */
  export interface ChatInputProps {
    onSubmit: (content: string, attachments?: FileAttachment[]) => void;
    disabled?: boolean;
    placeholder?: string;
    allowAttachments?: boolean;
  }
  
  // Chat History Types
  /**
   * Interface for managing chat history
   * @interface
   */
  export interface ChatHistory {
    messages: (BaseMessage | FileMessage | SystemContextMessage)[];
    settings: ChatSettings;
    steps?: SequentialStep[];
  }
  
  /**
   * Interface for chat session metadata
   * @interface
   */
  export interface ChatMetadata {
    id: string;
    title: string;
    type: ChatType;
    createdAt: number;
    updatedAt: number;
    summary?: string;
  }

  // Update FileMessage interface to use correct attachment type
  export interface FileMessage extends BaseMessage {
    attachments: FileAttachment[];  // Should accept File[] instead of FileAttachment[]
  }

  /**
 * Execution status for sequential chats
 */
  export enum ExecutionStatus {
    IDLE = 'idle',
    RUNNING = 'running',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    ERROR = 'error'
  }
  
