// src/services/cache/BrowserCache.ts

export class BrowserCache {
    private cache: Map<string, { value: any; expiry: number | null }>;
    private defaultTTL: number;
  
    constructor(options: { stdTTL?: number } = {}) {
      this.cache = new Map();
      this.defaultTTL = (options.stdTTL || 300) * 1000; // Convert to milliseconds
    }
  
    set(key: string, value: any, ttl?: number): void {
      const expiry = ttl ? Date.now() + (ttl * 1000) : 
                          this.defaultTTL ? Date.now() + this.defaultTTL : null;
      this.cache.set(key, { value, expiry });
    }
  
    get<T>(key: string): T | undefined {
      const item = this.cache.get(key);
      
      if (!item) return undefined;
      
      if (item.expiry && item.expiry < Date.now()) {
        this.cache.delete(key);
        return undefined;
      }
  
      return item.value as T;
    }
  
    del(key: string): void {
      this.cache.delete(key);
    }
  
    flushAll(): void {
      this.cache.clear();
    }
  }