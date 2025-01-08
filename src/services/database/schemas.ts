import { Schema, model, Document, Types } from 'mongoose';
//import { EncryptionService } from '../encryption/encryptionService';
import { BaseMessage, FileMessage, ChatResponse, ChatStep, ChatType, ChatSavingParams } from '@/utils/types/chat.types';
import { ChatRequest } from '@/lib/api/openai.api-requests.types';
// ==================== Chat Interfaces ====================

interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface IFileAttachment {
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploadDate: Date;
}

interface IChatMetadata {
  created: Date;
  modified: Date;
  lastAccessed: Date;
  status: 'active' | 'archived' | 'deleted';
  tags: string[];
}


// Update IChatSettings interface to include chatType
interface IChatSettings {
  temperature: number;
  chatType: ChatType;  // Add this property
  savingParams?: ChatSavingParams;
  // ... other settings
}

interface IChatSettings {
  temperature: number;
  chatType: ChatType;  // Add this property
  savingParams?: ChatSavingParams;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  model: string;
}

export interface IChat extends Document {
  id: string;
  type: 'base' | 'sequential' | 'requirements';
  title: string;
  messages: ChatRequest[];
  systemContext?: string;
  settings: IChatSettings;
  metadata: IChatMetadata;
  attachments?: IFileAttachment[];
  parentChat?: Types.ObjectId;
  userId: Types.ObjectId;
  summary?: string;
  saveToFile: boolean;
  saveToApp: boolean;
}

// ==================== Workflow Interfaces ====================

interface IWorkflowComponent {
  type: 'requirements' | 'prompts' | 'data_analysis' | 'sequential' | 'code';
  title: string;
  content: string;
  position: { x: number; y: number };
  status: 'pending' | 'executing' | 'completed' | 'error';
  metadata: Record<string, any>;
}

interface IWorkflowRelationship {
  source: Types.ObjectId;
  target: Types.ObjectId;
  type: string;
  metadata?: Record<string, any>;
}

interface IExecutionHistory {
  timestamp: Date;
  status: 'started' | 'completed' | 'failed';
  duration: number;
  error?: string;
  results?: Record<string, any>;
}

export interface IWorkflow extends Document {
  title: string;
  description?: string;
  components: IWorkflowComponent[];
  relationships: IWorkflowRelationship[];
  configuration: Record<string, any>;
  executionHistory: IExecutionHistory[];
  status: 'draft' | 'active' | 'archived';
  metadata: {
    created: Date;
    modified: Date;
    lastExecuted?: Date;
    version: number;
  };
  userId: Types.ObjectId;
}

// ==================== Settings Interfaces ====================

interface IApiKey {
  service: 'openai' | 'anthropic' | 'custom';
  encryptedKey: string;
  label?: string;
  lastUsed?: Date;
  status: 'active' | 'expired' | 'revoked';
}

interface IWorkerConfig {
  type: string;
  configuration: Record<string, any>;
  status: 'active' | 'inactive';
  lastUpdated: Date;
}

interface IUserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultChatSettings: IChatSettings;
  notifications: boolean;
  autoSave: boolean;
}

export interface ISettings extends Document {
  userId: Types.ObjectId;
  apiKeys: IApiKey[];
  workerConfigurations: IWorkerConfig[];
  preferences: IUserPreferences;
  metadata: {
    created: Date;
    modified: Date;
    version: number;
  };
}

// ==================== Schema Definitions ====================

const MessageSchema = new Schema<IMessage>({
  role: { 
    type: String, 
    required: true, 
    enum: ['user', 'assistant', 'system'] 
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Map, of: Schema.Types.Mixed }
});

const FileAttachmentSchema = new Schema<IFileAttachment>({
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
});

const ChatSettingsSchema = new Schema<IChatSettings>({
  temperature: { type: Number, required: true, min: 0, max: 2, default: 0.7 },
  maxTokens: { type: Number, min: 1 },
  topP: { type: Number, min: 0, max: 1 },
  frequencyPenalty: { type: Number, min: -2, max: 2 },
  presencePenalty: { type: Number, min: -2, max: 2 },
  model: { type: String, required: true }
});

export const ChatSchema = new Schema<IChat>({
  type: { 
    type: String, 
    required: true, 
    enum: ['base', 'sequential', 'requirements']
  },
  title: { type: String, required: true },
  messages: [MessageSchema],
  systemContext: String,
  settings: { type: ChatSettingsSchema, required: true },
  metadata: {
    created: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now },
    lastAccessed: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['active', 'archived', 'deleted'],
      default: 'active'
    },
    tags: [String]
  },
  attachments: [FileAttachmentSchema],
  parentChat: { type: Schema.Types.ObjectId, ref: 'Chat' },
  userId: { type: Schema.Types.ObjectId, required: true },
  summary: String,
  saveToFile: { type: Boolean, default: false },
  saveToApp: { type: Boolean, default: true }
});

const WorkflowComponentSchema = new Schema<IWorkflowComponent>({
  type: { 
    type: String, 
    required: true,
    enum: ['requirements', 'prompts', 'data_analysis', 'sequential', 'code']
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  status: { 
    type: String,
    enum: ['pending', 'executing', 'completed', 'error'],
    default: 'pending'
  },
  metadata: { type: Map, of: Schema.Types.Mixed }
});

const WorkflowRelationshipSchema = new Schema<IWorkflowRelationship>({
  source: { type: Schema.Types.ObjectId, required: true },
  target: { type: Schema.Types.ObjectId, required: true },
  type: { type: String, required: true },
  metadata: { type: Map, of: Schema.Types.Mixed }
});

export const WorkflowSchema = new Schema<IWorkflow>({
  title: { type: String, required: true },
  description: String,
  components: [WorkflowComponentSchema],
  relationships: [WorkflowRelationshipSchema],
  configuration: { type: Map, of: Schema.Types.Mixed },
  executionHistory: [{
    timestamp: { type: Date, required: true },
    status: { 
      type: String,
      enum: ['started', 'completed', 'failed'],
      required: true
    },
    duration: { type: Number, required: true },
    error: String,
    results: { type: Map, of: Schema.Types.Mixed }
  }],
  status: { 
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  metadata: {
    created: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now },
    lastExecuted: Date,
    version: { type: Number, default: 1 }
  },
  userId: { type: Schema.Types.ObjectId, required: true }
});

const ApiKeySchema = new Schema<IApiKey>({
  service: { 
    type: String, 
    required: true,
    enum: ['openai', 'anthropic', 'custom']
  },
  encryptedKey: { type: String, required: true },
  label: String,
  lastUsed: Date,
  status: { 
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  }
});

export const SettingsSchema = new Schema<ISettings>({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true },
  apiKeys: [ApiKeySchema],
  workerConfigurations: [{
    type: { type: String, required: true },
    configuration: { type: Map, of: Schema.Types.Mixed },
    status: { 
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    lastUpdated: { type: Date, default: Date.now }
  }],
  preferences: {
    theme: { 
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    defaultChatSettings: { type: ChatSettingsSchema },
    notifications: { type: Boolean, default: true },
    autoSave: { type: Boolean, default: true }
  },
  metadata: {
    created: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now },
    version: { type: Number, default: 1 }
  }
});

// ==================== Indexes ====================

ChatSchema.index({ userId: 1, 'metadata.created': -1 });
ChatSchema.index({ userId: 1, type: 1 });
ChatSchema.index({ 'metadata.tags': 1 });
ChatSchema.index({ title: 'text', summary: 'text' });

WorkflowSchema.index({ userId: 1, 'metadata.modified': -1 });
WorkflowSchema.index({ userId: 1, status: 1 });
WorkflowSchema.index({ title: 'text', description: 'text' });

// SettingsSchema.index({ userId: 1 }, { unique: true });
// SettingsSchema.index({ 'apiKeys.service': 1 });

// ==================== Middleware ====================

ChatSchema.pre('save', function(next) {
  this.metadata.modified = new Date();
  next();
});

WorkflowSchema.pre('save', function(next) {
  this.metadata.modified = new Date();
  next();
});

// SettingsSchema.pre('save', function(next) {
//   this.metadata.modified = new Date();
//   next();
// });

// Encrypt API keys before saving
// SettingsSchema.pre('save', async function(next) {
//   const encryptionService = new EncryptionService();
  
//   for (const key of this.apiKeys) {
//     if (!key.encryptedKey.startsWith('enc_')) {
//       try {
//         key.encryptedKey = await encryptionService.encrypt(key.encryptedKey);
//       } catch (error) {
//         next(error);
//       }
//     }
//   }
//   next();
// });

// ==================== Models ====================

export const Chat = model<IChat>('Chat', ChatSchema);
export const Workflow = model<IWorkflow>('Workflow', WorkflowSchema);
export const Settings = model<ISettings>('Settings', SettingsSchema);