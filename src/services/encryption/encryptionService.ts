// src/services/encryption/EncryptionService.ts

import crypto from 'crypto';
import { Buffer } from 'buffer';
import { DatabaseService } from '../database/DataBaseService';

// ==================== Types & Interfaces ====================

export interface EncryptionConfig {
  algorithm?: string;
  keySize?: number;
  saltSize?: number;
  iterations?: number;
  digest?: string;
  seperator?: string;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  tag?: string;
}

export interface KeyData {
  id: string;
  key: string;
  version: number;
  created: Date;
  lastUsed?: Date;
  status: 'active' | 'rotated' | 'revoked';
}

export class EncryptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

// ==================== Key Manager ====================

export class KeyManager {
  private static instance: KeyManager;
  private dbService: DatabaseService;
  private activeKey?: KeyData;
  private readonly collectionName = 'encryption_keys';

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      await this.loadActiveKey();
    } catch (error) {
      throw new EncryptionError(
        'Failed to initialize key manager',
        'KEY_MANAGER_INIT_ERROR'
      );
    }
  }

  private async loadActiveKey(): Promise<void> {
    const collection = this.dbService.getCollection(this.collectionName);
    const key = await collection.findOne({ status: 'active' });

    if (!key) {
      const newKey = await this.generateNewKey();
      await this.saveKey(newKey);
      this.activeKey = newKey;
    } else {
      this.activeKey = key as KeyData;
    }
  }

  private async generateNewKey(): Promise<KeyData> {
    const key = await this.generateSecureKey();
    return {
      id: crypto.randomUUID(),
      key,
      version: 1,
      created: new Date(),
      status: 'active'
    };
  }

  private async generateSecureKey(): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.generateKey('aes-256-gcm', { length: 256 }, (err, key) => {
        if (err) reject(err);
        resolve(key.export().toString('hex'));
      });
    });
  }

  private async saveKey(key: KeyData): Promise<void> {
    const collection = this.dbService.getCollection(this.collectionName);
    await collection.insertOne(key);
  }

  public async getActiveKey(): Promise<KeyData> {
    if (!this.activeKey) {
      await this.loadActiveKey();
    }
    return this.activeKey!;
  }

  public async rotateKey(): Promise<void> {
    if (this.activeKey) {
      // Mark current key as rotated
      const collection = this.dbService.getCollection(this.collectionName);
      await collection.updateOne(
        { id: this.activeKey.id },
        { $set: { status: 'rotated' } }
      );
    }

    // Generate and save new key
    const newKey = await this.generateNewKey();
    await this.saveKey(newKey);
    this.activeKey = newKey;
  }
}

// ==================== Encryption Service ====================

export class EncryptionService {
  private keyManager: KeyManager;
  private readonly config: Required<EncryptionConfig>;
  private static instance: EncryptionService;

  private constructor(config: EncryptionConfig = {}) {
    this.keyManager = KeyManager.getInstance();
    this.config = {
      algorithm: config.algorithm || 'aes-256-gcm',
      keySize: config.keySize || 32,
      saltSize: config.saltSize || 16,
      iterations: config.iterations || 100000,
      digest: config.digest || 'sha256',
      seperator: config.seperator || '.'
    };
  }

  public static getInstance(config?: EncryptionConfig): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService(config);
    }
    return EncryptionService.instance;
  }

  public async initialize(): Promise<void> {
    await this.keyManager.initialize();
  }

  public async encrypt(data: string): Promise<string> {
    try {
      const salt = crypto.randomBytes(this.config.saltSize);
      const iv = crypto.randomBytes(12); // GCM mode requires 12 bytes IV
      const key = await this.getKeyFromActiveKey(salt);

      const cipher = crypto.createCipheriv(
        this.config.algorithm,
        key,
        iv,
        { authTagLength: 16 }
      );

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      const encryptedData: EncryptedData = {
        data: encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tag: authTag.toString('hex')
      };

      return this.serializeEncryptedData(encryptedData);
    } catch (error) {
      throw new EncryptionError(
        'Encryption failed',
        'ENCRYPTION_ERROR',
        true
      );
    }
  }

  public async decrypt(encrypted: string): Promise<string> {
    try {
      const encryptedData = this.deserializeEncryptedData(encrypted);
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag!, 'hex');
      const key = await this.getKeyFromActiveKey(salt);

      const decipher = crypto.createDecipheriv(
        this.config.algorithm,
        key,
        iv,
        { authTagLength: 16 }
      );

      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new EncryptionError(
        'Decryption failed',
        'DECRYPTION_ERROR',
        true
      );
    }
  }

  public async generateKey(): Promise<string> {
    try {
      await this.keyManager.rotateKey();
      const key = await this.keyManager.getActiveKey();
      return key.id;
    } catch (error) {
      throw new EncryptionError(
        'Key generation failed',
        'KEY_GENERATION_ERROR'
      );
    }
  }

  public async validateKey(key: string): Promise<boolean> {
    try {
      const testData = 'validation_test';
      const encrypted = await this.encrypt(testData);
      const decrypted = await this.decrypt(encrypted);
      return decrypted === testData;
    } catch (error) {
      return false;
    }
  }

  private async getKeyFromActiveKey(salt: Buffer): Promise<Buffer> {
    const activeKey = await this.keyManager.getActiveKey();
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        activeKey.key,
        salt,
        this.config.iterations,
        this.config.keySize,
        this.config.digest,
        (err, key) => {
          if (err) reject(err);
          resolve(key);
        }
      );
    });
  }

  private serializeEncryptedData(data: EncryptedData): string {
    return [
      data.data,
      data.iv,
      data.salt,
      data.tag
    ].join(this.config.seperator);
  }

  private deserializeEncryptedData(serialized: string): EncryptedData {
    const [data, iv, salt, tag] = serialized.split(this.config.seperator);
    return { data, iv, salt, tag };
  }
}

// ==================== Usage Example ====================

/*
async function example() {
  // Initialize encryption service
  const encryptionService = EncryptionService.getInstance({
    algorithm: 'aes-256-gcm',
    keySize: 32,
    saltSize: 16,
    iterations: 100000
  });

  try {
    await encryptionService.initialize();

    // Encrypt sensitive data
    const sensitiveData = 'api_key_123456';
    const encrypted = await encryptionService.encrypt(sensitiveData);
    console.log('Encrypted:', encrypted);

    // Decrypt data
    const decrypted = await encryptionService.decrypt(encrypted);
    console.log('Decrypted:', decrypted);

    // Generate new key
    const newKeyId = await encryptionService.generateKey();
    console.log('Generated new key:', newKeyId);

    // Validate key
    const isValid = await encryptionService.validateKey(newKeyId);
    console.log('Key validation:', isValid);

  } catch (error) {
    if (error instanceof EncryptionError) {
      console.error('Encryption error:', error.message, 'Code:', error.code);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example of key rotation
async function keyRotationExample() {
  const encryptionService = EncryptionService.getInstance();

  try {
    // Encrypt data with current key
    const encrypted1 = await encryptionService.encrypt('test data');
    
    // Rotate key
    await encryptionService.generateKey();
    
    // Data encrypted with old key can still be decrypted
    const decrypted1 = await encryptionService.decrypt(encrypted1);
    console.log('Old data decrypted:', decrypted1);
    
    // New data uses new key
    const encrypted2 = await encryptionService.encrypt('new data');
    const decrypted2 = await encryptionService.decrypt(encrypted2);
    console.log('New data decrypted:', decrypted2);

  } catch (error) {
    console.error('Key rotation error:', error);
  }
}

// Example of secure configuration
async function secureConfigExample() {
  const encryptionService = EncryptionService.getInstance();

  try {
    // Encrypt configuration
    const config = {
      apiKey: 'sensitive_api_key',
      secret: 'app_secret',
      credentials: {
        username: 'admin',
        password: 'secure_password'
      }
    };

    const encryptedConfig = await encryptionService.encrypt(
      JSON.stringify(config)
    );

    // Store encrypted configuration safely
    await storeConfig(encryptedConfig);

    // Later, retrieve and decrypt
    const storedConfig = await retrieveConfig();
    const decryptedConfig = JSON.parse(
      await encryptionService.decrypt(storedConfig)
    );

    console.log('Decrypted config:', decryptedConfig);

  } catch (error) {
    console.error('Config encryption error:', error);
  }
}
*/

export default EncryptionService;