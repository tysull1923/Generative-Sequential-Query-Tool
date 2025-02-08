import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Types and Interfaces
export interface FileStorageConfig {
  basePath: string;
  maxFileSize: number;
  allowedExtensions: string[];
  encoding: BufferEncoding;
}

export interface SaveOptions {
  fileName: string;
  format: 'text' | 'code' | 'image' | 'json';
  overwrite?: boolean;
  createDirectory?: boolean;
}

export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  type: string;
  created: Date;
  modified: Date;
  hash?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Error Class
export class FileStorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FileStorageError';
  }
}

// Utility Functions
const validateFileName = (name: string): boolean => {
  const validNamePattern = /^[a-zA-Z0-9_-][\w\.-]*$/;
  return validNamePattern.test(name);
};

const validateFileSize = (size: number, maxSize: number): boolean => {
  return size > 0 && size <= maxSize;
};

const validateFileType = (extension: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(extension.toLowerCase());
};

const sanitizePath = (filePath: string): string => {
  return path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
};

// Main Service Class
export class FileStorageService {
  private config: FileStorageConfig;
  private activeWrites: Set<string>;

  constructor(config: FileStorageConfig) {
    this.config = {
      ...config,
      basePath: path.resolve(config.basePath)
    };
    this.activeWrites = new Set();
  }

  // Core Methods
  async saveFile(content: string | Buffer, options: SaveOptions): Promise<FileMetadata> {
    try {
      const filePath = this.buildFilePath(options.fileName, options.format);
      
      if (this.activeWrites.has(filePath)) {
        throw new FileStorageError(
          'File is currently being written',
          'CONCURRENT_WRITE'
        );
      }

      if (!options.overwrite && await this.fileExists(filePath)) {
        throw new FileStorageError(
          'File already exists',
          'FILE_EXISTS'
        );
      }

      const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
      
      if (!this.validateFileSize(contentBuffer.length)) {
        throw new FileStorageError(
          'File size exceeds maximum allowed size',
          'SIZE_LIMIT_EXCEEDED'
        );
      }

      if (options.createDirectory) {
        await this.ensureDirectory(path.dirname(filePath));
      }

      this.activeWrites.add(filePath);

      try {
        await fs.writeFile(filePath, contentBuffer);
        const stats = await fs.stat(filePath);
        const hash = crypto.createHash('sha256').update(contentBuffer).digest('hex');

        return {
          name: path.basename(filePath),
          path: filePath,
          size: stats.size,
          type: options.format,
          created: stats.birthtime,
          modified: stats.mtime,
          hash
        };
      } finally {
        this.activeWrites.delete(filePath);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async readFile(filePath: string): Promise<Buffer> {
    try {
      const sanitizedPath = this.resolvePath(filePath);
      return await fs.readFile(sanitizedPath);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const sanitizedPath = this.resolvePath(filePath);
      await fs.unlink(sanitizedPath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw this.handleError(error);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(filePath));
      return true;
    } catch {
      return false;
    }
  }

  // Chat-specific Methods
  async saveChatResponse(chatId: string, response: any, format: string): Promise<FileMetadata> {
    const fileName = `response_${Date.now()}.${format}`;
    const content = typeof response === 'string' ? response : JSON.stringify(response, null, 2);
    
    return await this.saveFile(content, {
      fileName: path.join('chats', chatId, fileName),
      format: this.getFormatType(format),
      createDirectory: true
    });
  }

  async saveAttachment(chatId: string, file: File): Promise<FileMetadata> {
    const validation = await this.validateFile(file);
    if (!validation.isValid) {
      throw new FileStorageError(
        validation.error || 'Invalid file',
        'VALIDATION_ERROR'
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return await this.saveFile(buffer, {
      fileName: path.join('attachments', chatId, file.name),
      format: this.getFormatType(path.extname(file.name)),
      createDirectory: true
    });
  }

  async getChatFiles(chatId: string): Promise<FileMetadata[]> {
    try {
      const chatDir = path.join(this.config.basePath, 'chats', chatId);
      const files = await fs.readdir(chatDir, { withFileTypes: true });
      
      const metadataPromises = files
        .filter(file => file.isFile())
        .map(async (file) => {
          const filePath = path.join(chatDir, file.name);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath);
          const hash = crypto.createHash('sha256').update(content).digest('hex');

          return {
            name: file.name,
            path: filePath,
            size: stats.size,
            type: this.getFormatType(path.extname(file.name)),
            created: stats.birthtime,
            modified: stats.mtime,
            hash
          };
        });

      return await Promise.all(metadataPromises);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Utility Methods
  async validateFile(file: File): Promise<ValidationResult> {
    const extension = path.extname(file.name).toLowerCase();
    
    if (!validateFileName(file.name)) {
      return { isValid: false, error: 'Invalid file name' };
    }

    if (!validateFileSize(file.size, this.config.maxFileSize)) {
      return { isValid: false, error: 'File size exceeds limit' };
    }

    if (!validateFileType(extension, this.config.allowedExtensions)) {
      return { isValid: false, error: 'File type not allowed' };
    }

    return { isValid: true };
  }

  async generateFileName(baseName: string, format: string): Promise<string> {
    const timestamp = Date.now();
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${sanitizedName}_${timestamp}.${format}`;
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Private Helper Methods
  private validateFileSize(size: number): boolean {
    return validateFileSize(size, this.config.maxFileSize);
  }

  private resolvePath(filePath: string): string {
    const sanitizedPath = sanitizePath(filePath);
    const resolvedPath = path.resolve(this.config.basePath, sanitizedPath);

    if (!resolvedPath.startsWith(this.config.basePath)) {
      throw new FileStorageError(
        'Invalid file path: Path traversal not allowed',
        'INVALID_PATH'
      );
    }

    return resolvedPath;
  }

  private buildFilePath(fileName: string, format: string): string {
    if (!validateFileName(fileName)) {
      throw new FileStorageError(
        'Invalid file name',
        'INVALID_FILENAME'
      );
    }

    return this.resolvePath(fileName);
  }

  private getFormatType(extension: string): SaveOptions['format'] {
    const ext = extension.toLowerCase().replace('.', '');
    const formatMap: Record<string, SaveOptions['format']> = {
      txt: 'text',
      json: 'json',
      js: 'code',
      ts: 'code',
      py: 'code',
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
      svg: 'image'
    };

    return formatMap[ext] || 'text';
  }

  private handleError(error: any): FileStorageError {
    if (error instanceof FileStorageError) {
      return error;
    }

    const nodeError = error as NodeJS.ErrnoException;
    switch (nodeError.code) {
      case 'ENOENT':
        return new FileStorageError('File not found', 'FILE_NOT_FOUND', error);
      case 'EACCES':
        return new FileStorageError('Permission denied', 'PERMISSION_DENIED', error);
      case 'EEXIST':
        return new FileStorageError('File already exists', 'FILE_EXISTS', error);
      default:
        return new FileStorageError(
          'An unexpected error occurred',
          'UNKNOWN_ERROR',
          error
        );
    }
  }
}