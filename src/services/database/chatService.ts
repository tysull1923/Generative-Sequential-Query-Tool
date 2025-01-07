import mongoose, { ClientSession } from 'mongoose';
import { Chat, IChat } from './schemas';
import { ChatDocument } from '@/utils/types/chat.types';
import { DatabaseService } from './DataBaseService';
//import NodeCache from 'node-cache';
import { BrowserCache } from '../cache/BrowserCache';


// ==================== Types & Interfaces ====================

export interface MessageDocument {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}


export interface ChatFilter {
  userId?: string;
  type?: 'base' | 'sequential' | 'requirements';
  status?: 'active' | 'archived' | 'deleted';
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ChatServiceOptions {
  cacheEnabled?: boolean;
  cacheTTL?: number;
  batchSize?: number;
}

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'ChatServiceError';
  }
}

// ==================== Service Implementation ====================

export class ChatService {
  private static instance: ChatService;
  private dbService: DatabaseService;
  private cache: BrowserCache;
  private readonly options: Required<ChatServiceOptions>;

  private constructor(options: ChatServiceOptions = {}) {
    this.dbService = DatabaseService.getInstance();
    this.options = {
      cacheEnabled: options.cacheEnabled ?? true,
      cacheTTL: options.cacheTTL ?? 300, // 5 minutes
      batchSize: options.batchSize ?? 100
    };
    this.cache = new BrowserCache({
      stdTTL: this.options.cacheTTL,
    });
  }

  public static getInstance(options?: ChatServiceOptions): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService(options);
    }
    return ChatService.instance;
  }

  // ==================== CRUD Operations ====================

  public async createChat(chat: ChatDocument): Promise<string> {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const newChat = new Chat(chat);
        await newChat.validate();
        await newChat.save({ session });

        await session.commitTransaction();
        
        if (this.options.cacheEnabled) {
          this.cache.set(newChat._id.toString(), newChat);
        }

        return newChat._id.toString();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      throw this.handleError(error, 'Error creating chat');
    }
  }

  public async getChat(id: string): Promise<ChatDocument> {
    try {
      if (this.options.cacheEnabled) {
        const cachedChat = this.cache.get<ChatDocument>(id);
        if (cachedChat) {
          return cachedChat;
        }
      }

      const chat = await Chat.findById(id).exec();
      if (!chat) {
        throw new ChatServiceError('Chat not found', 'CHAT_NOT_FOUND');
      }

      if (this.options.cacheEnabled) {
        this.cache.set(id, chat);
      }

      return chat;
    } catch (error) {
      throw this.handleError(error, 'Error retrieving chat');
    }
  }

  public async updateChat(id: string, update: Partial<ChatDocument>): Promise<void> {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const chat = await Chat.findById(id).session(session);
        if (!chat) {
          throw new ChatServiceError('Chat not found', 'CHAT_NOT_FOUND');
        }

        Object.assign(chat, update);
        await chat.validate();
        await chat.save({ session });

        await session.commitTransaction();

        if (this.options.cacheEnabled) {
          this.cache.set(id, chat);
        }
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      throw this.handleError(error, 'Error updating chat');
    }
  }

  public async deleteChat(id: string): Promise<void> {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const result = await Chat.findByIdAndDelete(id).session(session);
        if (!result) {
          throw new ChatServiceError('Chat not found', 'CHAT_NOT_FOUND');
        }

        await session.commitTransaction();

        if (this.options.cacheEnabled) {
          this.cache.del(id);
        }
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      throw this.handleError(error, 'Error deleting chat');
    }
  }

  public async listChats(filter: ChatFilter): Promise<ChatDocument[]> {
    try {
      const query = this.buildQuery(filter);
      const sort = this.buildSort(filter);
      const { skip, limit } = this.buildPagination(filter);

      const chats = await Chat.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();

      return chats;
    } catch (error) {
      throw this.handleError(error, 'Error listing chats');
    }
  }

  public async addMessage(chatId: string, message: MessageDocument): Promise<void> {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const chat = await Chat.findById(chatId).session(session);
        if (!chat) {
          throw new ChatServiceError('Chat not found', 'CHAT_NOT_FOUND');
        }

        chat.messages.push(message);
        await chat.save({ session });

        await session.commitTransaction();

        if (this.options.cacheEnabled) {
          this.cache.set(chatId, chat);
        }
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      throw this.handleError(error, 'Error adding message');
    }
  }

  // ==================== Bulk Operations ====================

  public async bulkCreateChats(chats: ChatDocument[]): Promise<string[]> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const chatIds: string[] = [];
      const batches = this.splitIntoBatches(chats, this.options.batchSize);

      for (const batch of batches) {
        const result = await Chat.insertMany(batch, { session });
        chatIds.push(...result.map(chat => chat._id.toString()));
      }

      await session.commitTransaction();
      return chatIds;
    } catch (error) {
      await session.abortTransaction();
      throw this.handleError(error, 'Error in bulk chat creation');
    } finally {
      session.endSession();
    }
  }

  // ==================== Search & Aggregation ====================

  public async searchChats(query: string, filter: ChatFilter = {}): Promise<ChatDocument[]> {
    try {
      const searchQuery = {
        $text: { $search: query },
        ...this.buildQuery(filter)
      };

      return await Chat.find(searchQuery)
        .sort({ score: { $meta: 'textScore' } })
        .exec();
    } catch (error) {
      throw this.handleError(error, 'Error searching chats');
    }
  }

  public async aggregateChats(pipeline: any[]): Promise<any[]> {
    try {
      return await Chat.aggregate(pipeline).exec();
    } catch (error) {
      throw this.handleError(error, 'Error in chat aggregation');
    }
  }

  // ==================== Helper Methods ====================

  private buildQuery(filter: ChatFilter): any {
    const query: any = {};

    if (filter.userId) query.userId = filter.userId;
    if (filter.type) query.type = filter.type;
    if (filter.status) query['metadata.status'] = filter.status;
    if (filter.tags?.length) query['metadata.tags'] = { $all: filter.tags };

    if (filter.startDate || filter.endDate) {
      query['metadata.created'] = {};
      if (filter.startDate) query['metadata.created'].$gte = filter.startDate;
      if (filter.endDate) query['metadata.created'].$lte = filter.endDate;
    }

    return query;
  }

  private buildSort(filter: ChatFilter): any {
    const sort: any = {};
    
    if (filter.sortBy) {
      sort[filter.sortBy] = filter.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort['metadata.created'] = -1; // Default sort by creation date
    }

    return sort;
  }

  private buildPagination(filter: ChatFilter): { skip: number; limit: number } {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, filter.limit || 10);
    const skip = (page - 1) * limit;

    return { skip, limit };
  }

  private splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private handleError(error: any, context: string): ChatServiceError {
    if (error instanceof ChatServiceError) {
      return error;
    }

    if (error.name === 'ValidationError') {
      return new ChatServiceError(
        `Validation error: ${error.message}`,
        'VALIDATION_ERROR'
      );
    }

    if (error.name === 'MongoError') {
      if (error.code === 11000) {
        return new ChatServiceError(
          'Duplicate key error',
          'DUPLICATE_KEY_ERROR'
        );
      }
    }

    return new ChatServiceError(
      `${context}: ${error.message}`,
      'INTERNAL_ERROR',
      false
    );
  }

  // ==================== Cache Management ====================

  public clearCache(): void {
    this.cache.flushAll();
  }

  public invalidateChatCache(chatId: string): void {
    this.cache.del(chatId);
  }
}

// ==================== Usage Example ====================

/*
// Example usage:
async function main() {
  const chatService = ChatService.getInstance({
    cacheEnabled: true,
    cacheTTL: 300,
    batchSize: 100
  });

  // Create a new chat
  const chatId = await chatService.createChat({
    type: 'base',
    title: 'Test Chat',
    messages: [],
    settings: {
      temperature: 0.7,
      model: 'gpt-4'
    },
    metadata: {
      created: new Date(),
      modified: new Date(),
      status: 'active',
      tags: ['test']
    },
    userId: 'user123'
  });

  // Add a message
  await chatService.addMessage(chatId, {
    role: 'user',
    content: 'Hello!',
    timestamp: new Date()
  });

  // List chats with filtering
  const chats = await chatService.listChats({
    userId: 'user123',
    type: 'base',
    status: 'active',
    page: 1,
    limit: 10,
    sortBy: 'metadata.created',
    sortOrder: 'desc'
  });

  // Search chats
  const searchResults = await chatService.searchChats('query', {
    userId: 'user123',
    status: 'active'
  });

  // Perform aggregation
  const stats = await chatService.aggregateChats([
    { $match: { userId: 'user123' } },
    { $group: { 
      _id: '$type',
      count: { $sum: 1 },
      avgMessages: { $avg: { $size: '$messages' } }
    }}
  ]);
}
*/

export default ChatService;