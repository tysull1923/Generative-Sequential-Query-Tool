import mongoose, { ClientSession } from 'mongoose';
import { Settings, ISettings } from './schemas';
import { DatabaseService } from './DatabaseService';
import { EncryptionService } from '../encryption/EncryptionService';
import NodeCache from 'node-cache';

// ==================== Types & Interfaces ====================

export interface ApiKeyDocument {
  id?: string;
  service: 'openai' | 'anthropic' | 'custom';
  key: string;
  label?: string;
  status: 'active' | 'expired' | 'revoked';
  metadata?: {
    created: Date;
    lastUsed?: Date;
    expiresAt?: Date;
    revokedAt?: Date;
    revokedReason?: string;
  };
}

export interface WorkerConfigDocument {
  id?: string;
  type: string;
  name: string;
  enabled: boolean;
  configuration: Record<string, any>;
  status: 'active' | 'inactive';
  metadata?: {
    created: Date;
    modified: Date;
    lastActive?: Date;
  };
}

export interface SettingsDocument extends Omit<ISettings, '_id'> {
  id?: string;
  version: number;
  apiKeys: ApiKeyDocument[];
  workerConfigurations: WorkerConfigDocument[];
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultChatSettings: {
      temperature: number;
      maxTokens?: number;
      model: string;
    };
    notifications: boolean;
    autoSave: boolean;
  };
  metadata: {
    created: Date;
    modified: Date;
    version: number;
  };
}

export interface SettingsHistory {
  version: number;
  timestamp: Date;
  changes: {
    path: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata: {
    userId: string;
    reason?: string;
  };
}

export interface SettingsValidationRule {
  path: string;
  type: 'required' | 'format' | 'range' | 'enum' | 'custom';
  validate: (value: any) => boolean | Promise<boolean>;
  message: string;
}

export class SettingsServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'SettingsServiceError';
  }
}

// ==================== Service Implementation ====================

export class SettingsService {
  private static instance: SettingsService;
  private dbService: DatabaseService;
  private encryptionService: EncryptionService;
  private cache: NodeCache;
  private validationRules: SettingsValidationRule[];

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.encryptionService = new EncryptionService();
    this.cache = new NodeCache({ stdTTL: 300 });
    this.validationRules = this.setupValidationRules();
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  // ==================== API Key Management ====================

  public async saveApiKey(key: ApiKeyDocument): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const settings = await this.getOrCreateSettings(session);

      // Encrypt the API key
      const encryptedKey = await this.encryptionService.encrypt(key.key);
      const apiKey = {
        ...key,
        key: encryptedKey,
        metadata: {
          ...key.metadata,
          created: new Date(),
        }
      };

      // Find and update or add new
      const existingIndex = settings.apiKeys.findIndex(k => 
        k.service === key.service && k.label === key.label
      );

      if (existingIndex >= 0) {
        settings.apiKeys[existingIndex] = apiKey;
      } else {
        settings.apiKeys.push(apiKey);
      }

      await this.saveSettingsWithHistory(
        settings,
        'API key updated',
        session
      );

      await session.commitTransaction();
      this.invalidateCache();
    } catch (error) {
      await session.abortTransaction();
      throw this.handleError(error, 'Error saving API key');
    } finally {
      session.endSession();
    }
  }

  public async getApiKeys(): Promise<ApiKeyDocument[]> {
    try {
      const settings = await this.getOrCreateSettings();
      return settings.apiKeys.map(key => ({
        ...key,
        key: '********' // Never return actual keys
      }));
    } catch (error) {
      throw this.handleError(error, 'Error retrieving API keys');
    }
  }

  // ==================== Worker Configuration ====================

  public async updateWorkerConfig(config: WorkerConfigDocument): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const settings = await this.getOrCreateSettings(session);

      const existingIndex = settings.workerConfigurations.findIndex(
        w => w.type === config.type && w.name === config.name
      );

      const workerConfig = {
        ...config,
        metadata: {
          ...config.metadata,
          modified: new Date()
        }
      };

      if (existingIndex >= 0) {
        settings.workerConfigurations[existingIndex] = workerConfig;
      } else {
        settings.workerConfigurations.push(workerConfig);
      }

      await this.saveSettingsWithHistory(
        settings,
        'Worker configuration updated',
        session
      );

      await session.commitTransaction();
      this.invalidateCache();
    } catch (error) {
      await session.abortTransaction();
      throw this.handleError(error, 'Error updating worker configuration');
    } finally {
      session.endSession();
    }
  }

  public async getWorkerConfigs(): Promise<WorkerConfigDocument[]> {
    try {
      const settings = await this.getOrCreateSettings();
      return settings.workerConfigurations;
    } catch (error) {
      throw this.handleError(error, 'Error retrieving worker configurations');
    }
  }

  // ==================== Application Settings ====================

  public async saveApplicationSettings(settings: Partial<SettingsDocument>): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const currentSettings = await this.getOrCreateSettings(session);
      
      // Merge new settings
      const updatedSettings = {
        ...currentSettings,
        ...settings,
        metadata: {
          ...currentSettings.metadata,
          modified: new Date(),
          version: currentSettings.metadata.version + 1
        }
      };

      // Validate settings
      await this.validateSettings(updatedSettings);

      await this.saveSettingsWithHistory(
        updatedSettings,
        'Application settings updated',
        session
      );

      await session.commitTransaction();
      this.invalidateCache();
    } catch (error) {
      await session.abortTransaction();
      throw this.handleError(error, 'Error saving application settings');
    } finally {
      session.endSession();
    }
  }

  public async getApplicationSettings(): Promise<SettingsDocument> {
    try {
      return await this.getOrCreateSettings();
    } catch (error) {
      throw this.handleError(error, 'Error retrieving application settings');
    }
  }

  // ==================== Backup & Restore ====================

  public async createBackup(): Promise<string> {
    try {
      const settings = await this.getOrCreateSettings();
      const backup = {
        ...settings,
        metadata: {
          ...settings.metadata,
          backupCreated: new Date()
        }
      };

      // Encrypt the entire backup
      const encryptedBackup = await this.encryptionService.encrypt(
        JSON.stringify(backup)
      );

      return encryptedBackup;
    } catch (error) {
      throw this.handleError(error, 'Error creating settings backup');
    }
  }

  public async restoreFromBackup(encryptedBackup: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Decrypt and parse backup
      const backupJson = await this.encryptionService.decrypt(encryptedBackup);
      const backup = JSON.parse(backupJson);

      // Validate backup data
      await this.validateSettings(backup);

      // Create restore point before applying backup
      await this.createRestorePoint(session);

      // Apply backup
      const settings = new Settings(backup);
      await settings.save({ session });

      await session.commitTransaction();
      this.invalidateCache();
    } catch (error) {
      await session.abortTransaction();
      throw this.handleError(error, 'Error restoring settings from backup');
    } finally {
      session.endSession();
    }
  }

  // ==================== Helper Methods ====================

  private async getOrCreateSettings(session?: ClientSession): Promise<SettingsDocument> {
    const cached = this.cache.get<SettingsDocument>('settings');
    if (cached) return cached;

    let settings = await Settings.findOne().session(session);

    if (!settings) {
      settings = new Settings({
        version: 1,
        apiKeys: [],
        workerConfigurations: [],
        preferences: {
          theme: 'system',
          defaultChatSettings: {
            temperature: 0.7,
            model: 'gpt-4'
          },
          notifications: true,
          autoSave: true
        },
        metadata: {
          created: new Date(),
          modified: new Date(),
          version: 1
        }
      });

      if (session) {
        await settings.save({ session });
      } else {
        await settings.save();
      }
    }

    this.cache.set('settings', settings);
    return settings;
  }

  private async saveSettingsWithHistory(
    settings: SettingsDocument,
    reason: string,
    session: ClientSession
  ): Promise<void> {
    const currentSettings = await Settings.findOne().session(session);
    
    if (currentSettings) {
      // Calculate changes
      const changes = this.calculateChanges(currentSettings, settings);
      
      // Create history entry
      const historyEntry: SettingsHistory = {
        version: settings.version + 1,
        timestamp: new Date(),
        changes,
        metadata: {
          userId: 'system', // Replace with actual user ID
          reason
        }
      };

      // Update settings with new version and history
      settings.version = historyEntry.version;
      settings.metadata.version = historyEntry.version;
      
      await Settings.findOneAndUpdate(
        {},
        {
          $set: settings,
          $push: { history: historyEntry }
        },
        { session, new: true }
      );
    } else {
      // First time settings creation
      settings.version = 1;
      settings.metadata.version = 1;
      
      const newSettings = new Settings(settings);
      await newSettings.save({ session });
    }
  }

  private setupValidationRules(): SettingsValidationRule[] {
    return [
      {
        path: 'preferences.theme',
        type: 'enum',
        validate: (value) => ['light', 'dark', 'system'].includes(value),
        message: 'Invalid theme value'
      },
      {
        path: 'preferences.defaultChatSettings.temperature',
        type: 'range',
        validate: (value) => value >= 0 && value <= 2,
        message: 'Temperature must be between 0 and 2'
      },
      {
        path: 'apiKeys[].service',
        type: 'enum',
        validate: (value) => ['openai', 'anthropic', 'custom'].includes(value),
        message: 'Invalid API service'
      }
      // Add more validation rules as needed
    ];
  }

  private async validateSettings(settings: SettingsDocument): Promise<void> {
    const errors: string[] = [];

    for (const rule of this.validationRules) {
      const value = this.getValueByPath(settings, rule.path);
      if (value !== undefined) {
        const isValid = await rule.validate(value);
        if (!isValid) {
          errors.push(rule.message);
        }
      }
    }

    if (errors.length > 0) {
      throw new SettingsServiceError(
        `Validation failed: ${errors.join(', ')}`,
        'VALIDATION_ERROR'
      );
    }
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => {
      if (key.includes('[')) {
        const [arrayName, index] = key.split(/[\[\]]/);
        return curr[arrayName][parseInt(index)];
      }
      return curr[key];
    }, obj);
  }

  private calculateChanges(oldSettings: any, newSettings: any): any[] {
    const changes: any[] = [];
    const compareObjects = (path: string, oldObj: any, newObj: any) => {
      for (const key in newObj) {
        const currentPath = path ? `${path}.${key}` : key;
        if (typeof newObj[key] === 'object' && !Array.isArray(newObj[key])) {
          compareObjects(currentPath, oldObj[key] || {}, newObj[key]);
        } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
          changes.push({
            path: currentPath,
            oldValue: oldObj[key],
            newValue: newObj[key]
          });
        }
      }
    };

    compareObjects('', oldSettings, newSettings);
    return changes;
  }

  private async createRestorePoint(session: ClientSession): Promise<void> {
    const currentSettings = await Settings.findOne().session(session);
    if (currentSettings) {
      await Settings.create([{
        ...currentSettings.toObject(),
        metadata: {
          ...currentSettings.metadata,
          isRestorePoint: true,
          restorePointCreated: new Date()
        }
      }], { session });
    }
  }

  private invalidateCache(): void {
    this.cache.del('settings');
  }

  private handleError(error: any, context: string): SettingsServiceError {
    if (error instanceof SettingsServiceError) {
      return error;
    }

    if (error.name === 'ValidationError') {
      return new SettingsServiceError(
        `Validation error: ${error.message}`,
        'VALIDATION_ERROR'
      );
    }

    return new SettingsServiceError(
      `${context}: ${error.message}`,
      'INTERNAL_ERROR',
      false
    );
  }
}

// ==================== Usage Example ====================

/*
async function example() {
  const settingsService = SettingsService.getInstance();

  try {
    // Save API key
    await settingsService.saveApiKey({
      service: 'openai',
      key: 'sk-your-api-key',
      label: 'Production OpenAI',
      status: 'active',
      metadata: {
        created: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      }
    });

    // Update worker configuration
    await settingsService.updateWorkerConfig({
      type: 'dataProcessor',
      name: 'CSV Processor',
      enabled: true,
      configuration: {
        maxBatchSize: 1000,
        timeout: 30000,
        retryAttempts: 3
      },
      status: 'active',
      metadata: {
        created: new Date(),
        modified: new Date()
      }
    });

    // Save application settings
    await settingsService.saveApplicationSettings({
      preferences: {
        theme: 'dark',
        defaultChatSettings: {
          temperature: 0.8,
          maxTokens: 2000,
          model: 'gpt-4'
        },
        notifications: true,
        autoSave: true
      }
    });

    // Retrieve settings
    const apiKeys = await settingsService.getApiKeys();
    console.log('API Keys:', apiKeys);

    const workerConfigs = await settingsService.getWorkerConfigs();
    console.log('Worker Configs:', workerConfigs);

    const settings = await settingsService.getApplicationSettings();
    console.log('Application Settings:', settings);

  } catch (error) {
    if (error instanceof SettingsServiceError) {
      console.error('Settings error:', error.message, 'Code:', error.code);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example of backup and restore
async function backupExample() {
  const settingsService = SettingsService.getInstance();

  try {
    // Create backup
    const backup = await settingsService.createBackup();
    console.log('Backup created:', backup);

    // Restore from backup
    await settingsService.restoreFromBackup(backup);
    console.log('Settings restored successfully');

  } catch (error) {
    console.error('Backup/restore error:', error);
  }
}

// Example of settings validation and migration
async function settingsValidationExample() {
  const settingsService = SettingsService.getInstance();

  try {
    // Update settings with validation
    await settingsService.saveApplicationSettings({
      preferences: {
        theme: 'dark', // Valid theme
        defaultChatSettings: {
          temperature: 0.7, // Valid temperature
          model: 'gpt-4'
        }
      }
    });

    // This would fail validation
    await settingsService.saveApplicationSettings({
      preferences: {
        theme: 'invalid-theme', // Invalid theme
        defaultChatSettings: {
          temperature: 3.0 // Invalid temperature
        }
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
  }
}

// Example of managing API keys
async function apiKeyManagementExample() {
  const settingsService = SettingsService.getInstance();

  try {
    // Add new API key
    await settingsService.saveApiKey({
      service: 'openai',
      key: 'sk-new-api-key',
      label: 'Development',
      status: 'active'
    });

    // Update existing API key status
    const keys = await settingsService.getApiKeys();
    const keyToUpdate = keys.find(k => k.label === 'Development');
    
    if (keyToUpdate) {
      await settingsService.saveApiKey({
        ...keyToUpdate,
        status: 'revoked',
        metadata: {
          ...keyToUpdate.metadata,
          revokedAt: new Date(),
          revokedReason: 'Security rotation'
        }
      });
    }

  } catch (error) {
    console.error('API key management error:', error);
  }
}

// Example of worker configuration management
async function workerConfigExample() {
  const settingsService = SettingsService.getInstance();

  try {
    // Add new worker configuration
    await settingsService.updateWorkerConfig({
      type: 'dataProcessor',
      name: 'Large File Processor',
      enabled: true,
      configuration: {
        chunkSize: 5000,
        maxConcurrent: 3,
        timeout: 60000
      },
      status: 'active'
    });

    // Update existing worker configuration
    const configs = await settingsService.getWorkerConfigs();
    const configToUpdate = configs.find(c => c.name === 'Large File Processor');

    if (configToUpdate) {
      await settingsService.updateWorkerConfig({
        ...configToUpdate,
        configuration: {
          ...configToUpdate.configuration,
          maxConcurrent: 5,
          timeout: 120000
        }
      });
    }

  } catch (error) {
    console.error('Worker configuration error:', error);
  }
}
*/

export default SettingsService;