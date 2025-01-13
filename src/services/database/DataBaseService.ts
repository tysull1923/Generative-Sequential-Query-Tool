// src/services/database/DatabaseService.ts
import   mongoose  from 'mongoose';
import { EventEmitter } from '@/utils/EventEmitter';
import { Chat, Workflow, Settings } from './schemas';

// Types remain the same
export interface DatabaseConfig {
  uri: string;
  dbName: string;
  options: {
    poolSize?: number;
    connectTimeoutMS?: number;
    socketTimeoutMS?: number;
    maxRetries?: number;
    retryDelay?: number;
    ssl?: boolean;
    sslValidate?: boolean;
    sslCA?: string;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
  };
}

export interface ConnectionMetrics {
  isConnected: boolean;
  poolSize: number;
  activeConnections: number;
  availableConnections: number;
  waitingRequests: number;
  lastReconnectAttempt?: Date;
}

export interface DatabaseError extends Error {
  code?: string;
  isOperational?: boolean;
}

export class DatabaseService extends EventEmitter {
  private static instance: DatabaseService;
  private connection: mongoose.Connection | null = null;
  private config: DatabaseConfig;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private reconnectTimeout?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private metrics: ConnectionMetrics = {
    isConnected: false,
    poolSize: 0,
    activeConnections: 0,
    availableConnections: 0,
    waitingRequests: 0
  };

  private constructor() {
    super();
    this.config = this.loadConfig();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private loadConfig(): DatabaseConfig {
    return {
      uri: import.meta.env.VITE_MONGODB_URI || 'mongodb://localhost:27017',
      dbName: import.meta.env.VITE_MONGODB_DB_NAME || 'gsqt_db',
      options: {
        poolSize: 10,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxRetries: 5,
        retryDelay: 5000,
        ssl: false,
        sslValidate: false,
        logLevel: 'info'
      }
    };
  }

  private setupEventListeners(): void {
    if (!this.connection) return;
    
    this.connection.on('connected', () => {
      this.log('info', 'MongoDB connected successfully');
      this.metrics.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.connection.on('disconnected', () => {
      this.log('warn', 'MongoDB disconnected');
      this.metrics.isConnected = false;
      this.emit('disconnected');
      this.handleDisconnect();
    });

    this.connection.on('error', (error: DatabaseError) => {
      this.log('error', `MongoDB connection error: ${error.message}`);
      this.emit('error', error);
    });
  }

  // Change this line at the top of the file

  // And update the connect method to use mongoose.connect instead:
  public async connect(): Promise<void> {
      try {
          if (this.isConnected()) return;

          // Use mongoose.connect directly
          await mongoose.connect(this.config.uri); 
        
          //   , {
          //     dbName: this.config.dbName,
          //     autoCreate: true,
          //     autoIndex: true
          // });

          this.connection = mongoose.connection;
          this.setupEventListeners();
          
          this.metrics.isConnected = true;
          this.emit('connected');
          console.log('Successfully connected to database');

      } catch (error) {
          this.emit('error', error);
          console.error('Database connection failed:', error);
          throw error;
      }
  }

  // public async connect(): Promise<void> {
  //   try {
  //     if (this.isConnected()) return;

  //     // Create Mongoose connection
  //     this.connection = mongoose.connect(this.config.uri, {
  //       dbName: this.config.dbName,
  //       autoCreate: true,
  //       autoIndex: true
  //     });

  //     // Wait for connection to be ready
  //     await new Promise<void>((resolve, reject) => {
  //       if (!this.connection) {
  //         reject(new Error('Connection failed to initialize'));
  //         return;
  //       }

  //       this.connection.once('connected', () => {
  //         this.setupEventListeners();
  //         resolve();
  //       });

  //       this.connection.once('error', (error) => {
  //         reject(error);
  //       });
  //     });

  //     this.metrics.isConnected = true;
  //     this.emit('connected');
  //     console.log('Successfully connected to database');

  //   } catch (error) {
  //     this.emit('error', error);
  //     console.error('Database connection failed:', error);
  //     throw error;
  //   }
  // }

  public isConnected(): boolean {
    return this.connection?.readyState === 1;
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
        this.metrics.isConnected = false;
        this.emit('disconnected');
      }
    } catch (error) {
      this.log('error', `Error disconnecting from MongoDB: ${error.message}`);
      throw error;
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.log('info', `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      this.reconnectTimeout = setTimeout(async () => {
        try {
          await this.connect();
        } catch (error) {
          this.log('error', `Reconnection attempt failed: ${error.message}`);
        }
      }, this.config.options.retryDelay);
    } else {
      this.log('error', 'Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  public getCollection(name: string): mongoose.Collection {
    if (!this.isConnected() || !this.connection) {
      throw new Error('Database not connected');
    }
    return this.connection.collection(name);
  }

  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  private log(level: 'error' | 'warn' | 'info' | 'debug', message: string): void {
    const logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    const configuredLevel = this.config.options.logLevel || 'info';
    
    if (logLevels[level] <= logLevels[configuredLevel]) {
      const timestamp = new Date().toISOString();
      console[level](`[${timestamp}] [MongoDB] ${message}`);
    }
  }
}

export default DatabaseService;



// import mongoose, { Connection, Collection } from 'mongoose';
// import { EventEmitter } from '@/utils/EventEmitter';
// import { Chat, Workflow, Settings } from './schemas';

// // ==================== Types & Interfaces ====================

// export interface DatabaseConfig {
//   uri: string;
//   dbName: string;
//   options: {
//     poolSize?: number;
//     connectTimeoutMS?: number;
//     socketTimeoutMS?: number;
//     maxRetries?: number;
//     retryDelay?: number;
//     ssl?: boolean;
//     sslValidate?: boolean;
//     sslCA?: string;
//     logLevel?: 'error' | 'warn' | 'info' | 'debug';
//   };
// }

// export interface ConnectionMetrics {
//   isConnected: boolean;
//   poolSize: number;
//   activeConnections: number;
//   availableConnections: number;
//   waitingRequests: number;
//   lastReconnectAttempt?: Date;
// }

// export interface DatabaseError extends Error {
//   code?: string;
//   isOperational?: boolean;
// }

// // ==================== Service Implementation ====================

// export class DatabaseService extends EventEmitter {
//   private static instance: DatabaseService;
//   private connection: Connection | null = null;
//   private config: DatabaseConfig;
//   private reconnectAttempts: number = 0;
//   private readonly maxReconnectAttempts: number = 5;
//   private reconnectTimeout?: NodeJS.Timeout;
//   private healthCheckInterval?: NodeJS.Timeout;
//   private metrics: ConnectionMetrics = {
//     isConnected: false,
//     poolSize: 0,
//     activeConnections: 0,
//     availableConnections: 0,
//     waitingRequests: 0
//   };

//   private constructor() {
//     super();
//     this.config = this.loadConfig();
//   }

//   public static getInstance(): DatabaseService {
//     if (!DatabaseService.instance) {
//       DatabaseService.instance = new DatabaseService();
//     }
//     return DatabaseService.instance;
//   }

//   private loadConfig(): DatabaseConfig {
//     return {
//       uri: 'mongodb://localhost:27017', //process.env.MONGODB_URI ||
//       dbName: 'gsqt_db', //process.env.MONGODB_DB_NAME ||
//       options: {
//         poolSize: 10,
//         connectTimeoutMS: 10000,
//         socketTimeoutMS: 45000,
//         maxRetries: 5,
//         retryDelay: 5000,
//         ssl: false,
//         sslValidate: false,
//         logLevel: 'info'
//         // poolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10'),
//         // connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT || '10000'),
//         // socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000'),
//         // maxRetries: parseInt(process.env.MONGODB_MAX_RETRIES || '5'),
//         // retryDelay: parseInt(process.env.MONGODB_RETRY_DELAY || '5000'),
//         // ssl: process.env.MONGODB_SSL === 'true',
//         // sslValidate: process.env.MONGODB_SSL_VALIDATE === 'true',
//         // sslCA: process.env.MONGODB_SSL_CA,
//         // logLevel: (process.env.MONGODB_LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info'
//       }
//     };
//   }

//   private setupEventListeners(): void {
//     mongoose.connection.on('connected', () => {
//       this.log('info', 'MongoDB connected successfully');
//       this.metrics.isConnected = true;
//       this.reconnectAttempts = 0;
//       this.emit('connected');
//     });

//     mongoose.connection.on('disconnected', () => {
//       this.log('warn', 'MongoDB disconnected');
//       this.metrics.isConnected = false;
//       this.emit('disconnected');
//       this.handleDisconnect();
//     });

//     mongoose.connection.on('error', (error: DatabaseError) => {
//       this.log('error', `MongoDB connection error: ${error.message}`);
//       this.emit('error', error);
//     });
//   }

//   private handleDisconnect(): void {
//     if (this.reconnectAttempts < this.maxReconnectAttempts) {
//       this.reconnectAttempts++;
//       this.log('info', `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
//       if (this.reconnectTimeout) {
//         clearTimeout(this.reconnectTimeout);
//       }

//       this.reconnectTimeout = setTimeout(async () => {
//         try {
//           await this.connect();
//         } catch (error) {
//           this.log('error', `Reconnection attempt failed: ${error.message}`);
//         }
//       }, this.config.options.retryDelay);
//     } else {
//       this.log('error', 'Max reconnection attempts reached');
//       this.emit('maxReconnectAttemptsReached');
//     }
//   }

//   public isConnected(): boolean {
//     try {
//       return mongoose.connection.readyState === 1;
//     } catch (error) {
//       return false;
//     }
//   }

//   public async connect(): Promise<void> {
//     try {
//       if (this.isConnected()) return;
//       const connectionOptions = {
//               useNewUrlParser: true,
//               useUnifiedTopology: true,
//               useCreateIndex: true,
//               useFindAndModify: false,
//               poolSize: this.config.options.poolSize,
//               connectTimeoutMS: this.config.options.connectTimeoutMS,
//               socketTimeoutMS: this.config.options.socketTimeoutMS,
//               ssl: this.config.options.ssl,
//               sslValidate: this.config.options.sslValidate,
//               sslCA: this.config.options.sslCA,
//               dbName: this.config.dbName,
//               autoReconnect: true,
//               reconnectTries: this.config.options.maxRetries,
//               reconnectInterval: this.config.options.retryDelay
//             };
      
//       await mongoose.connect(this.config.uri, connectionOptions);
//       this.connection = mongoose.connection;
//       this.emit('connected');
//       console.log("trying to connect to database");
//       this.setupEventListeners(); // Set up listeners after connection is established

//     } catch (error) {
//       this.emit('error', error);
//       // Don't throw error, just log it
//       console.error('Database connection failed:', error);
//     }
//   }
 


  // public async connect(): Promise<void> {
  //   try {
  //     if (this.isConnected()) {
  //       return;
  //     }

  //     const connectionOptions = {
  //       useNewUrlParser: true,
  //       useUnifiedTopology: true,
  //       useCreateIndex: true,
  //       useFindAndModify: false,
  //       poolSize: this.config.options.poolSize,
  //       connectTimeoutMS: this.config.options.connectTimeoutMS,
  //       socketTimeoutMS: this.config.options.socketTimeoutMS,
  //       ssl: this.config.options.ssl,
  //       sslValidate: this.config.options.sslValidate,
  //       sslCA: this.config.options.sslCA,
  //       dbName: this.config.dbName,
  //       autoReconnect: true,
  //       reconnectTries: this.config.options.maxRetries,
  //       reconnectInterval: this.config.options.retryDelay
  //     };

  //     await mongoose.connect(this.config.uri, connectionOptions);
  //     this.connection = mongoose.connection;
      
  //     await this.createIndexes();
  //     this.startHealthCheck();
  //     this.updateMetrics();
      
  //   } catch (error) {
  //     const dbError: DatabaseError = error;
  //     dbError.isOperational = true;
  //     this.log('error', `Failed to connect to MongoDB: ${error.message}`);
  //     throw dbError;
  //   }
  // }

//   public async disconnect(): Promise<void> {
//     try {
//       if (this.healthCheckInterval) {
//         clearInterval(this.healthCheckInterval);
//       }
      
//       if (this.reconnectTimeout) {
//         clearTimeout(this.reconnectTimeout);
//       }

//       if (this.connection) {
//         await mongoose.disconnect();
//         this.connection = null;
//         this.metrics.isConnected = false;
//         this.emit('disconnected');
//       }
//     } catch (error) {
//       this.log('error', `Error disconnecting from MongoDB: ${error.message}`);
//       throw error;
//     }
//   }


//   public getCollection(name: string): Collection {
//     if (!this.isConnected()) {
//       throw new Error('Database not connected');
//     }
//     return mongoose.connection.collection(name);
//   }

//   public async createIndexes(): Promise<void> {
//     try {
//       this.log('info', 'Creating indexes...');
      
//       // Create indexes for Chat collection
//       await Chat.createIndexes();
      
//       // Create indexes for Workflow collection
//       await Workflow.createIndexes();
      
//       // Create indexes for Settings collection
//       await Settings.createIndexes();
      
//       this.log('info', 'Indexes created successfully');
//     } catch (error) {
//       this.log('error', `Error creating indexes: ${error.message}`);
//       throw error;
//     }
//   }

//   private startHealthCheck(): void {
//     const healthCheckInterval = parseInt(process.env.MONGODB_HEALTH_CHECK_INTERVAL || '30000');
    
//     this.healthCheckInterval = setInterval(async () => {
//       try {
//         await this.performHealthCheck();
//       } catch (error) {
//         this.log('error', `Health check failed: ${error.message}`);
//       }
//     }, healthCheckInterval);
//   }

//   private async performHealthCheck(): Promise<void> {
//     if (!this.isConnected()) {
//       return;
//     }

//     try {
//       await mongoose.connection.db.admin().ping();
//       this.updateMetrics();
//     } catch (error) {
//       this.log('error', `Health check ping failed: ${error.message}`);
//       this.emit('healthCheckFailed', error);
//     }
//   }

//   private updateMetrics(): void {
//     if (this.connection) {
//       const serverStatus = this.connection.db.serverConfig;
      
//       this.metrics = {
//         isConnected: this.isConnected(),
//         poolSize: this.config.options.poolSize || 0,
//         activeConnections: serverStatus?.connections?.current || 0,
//         availableConnections: serverStatus?.connections?.available || 0,
//         waitingRequests: serverStatus?.connections?.pending || 0,
//         lastReconnectAttempt: this.reconnectAttempts > 0 ? new Date() : undefined
//       };

//       this.emit('metricsUpdated', this.metrics);
//     }
//   }

//   public getMetrics(): ConnectionMetrics {
//     return { ...this.metrics };
//   }

//   private log(level: 'error' | 'warn' | 'info' | 'debug', message: string): void {
//     const logLevels = {
//       error: 0,
//       warn: 1,
//       info: 2,
//       debug: 3
//     };

//     const configuredLevel = this.config.options.logLevel || 'info';
    
//     if (logLevels[level] <= logLevels[configuredLevel]) {
//       const timestamp = new Date().toISOString();
//       console[level](`[${timestamp}] [MongoDB] ${message}`);
//     }
//   }
// }

// ==================== Usage Example ====================

/* 
// Example usage:
async function initializeDatabase() {
  try {
    const dbService = DatabaseService.getInstance();
    
    // Connect to database
    await dbService.connect();
    
    // Listen for events
    dbService.on('connected', () => {
      console.log('Database connected successfully');
    });
    
    dbService.on('error', (error) => {
      console.error('Database error:', error);
    });
    
    dbService.on('metricsUpdated', (metrics) => {
      console.log('Database metrics:', metrics);
    });
    
    // Get collection
    const chatCollection = dbService.getCollection('chats');
    
    // Perform operations...
    
    // Disconnect when done
    await dbService.disconnect();
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}
*/

//export default DatabaseService;