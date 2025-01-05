import { EventEmitter } from '@/utils/EventEmitter';
import { openAIService } from '@/services/api/implementations/openai_connector';
import { anthropicService } from '@/services/api/implementations/anthropic';
import { API_CONFIG } from '@/services/api/interfaces/api-config';
import {
  ApiProvider,
  ApiConfig,
  ApiStatus,
  ApiStatusHistory,
  StatusCheckResult,
  ApiStatusEvent,
  ApiStatusEventType,
} from '../interfaces/api.types';

class ApiStatusService extends EventEmitter {
  private static instance: ApiStatusService;
  private statusMap: Map<ApiProvider, ApiStatus>;
  private historyMap: Map<ApiProvider, ApiStatusHistory[]>;
  private configs: Map<ApiProvider, ApiConfig>;
  private checkIntervals: Map<ApiProvider, number>;
  private readonly DEFAULT_CHECK_INTERVAL = 60000; // 1 minute
  private readonly MAX_HISTORY_LENGTH = 100;

  private constructor() {
    super();
    this.statusMap = new Map();
    this.historyMap = new Map();
    this.configs = new Map();
    this.checkIntervals = new Map();
  }

  public static getInstance(): ApiStatusService {
    if (!ApiStatusService.instance) {
      ApiStatusService.instance = new ApiStatusService();
    }
    return ApiStatusService.instance;
  }

  public configureApi(config: ApiConfig): void {
    this.configs.set(config.provider, {
      ...config,
      timeout: config.timeout || 5000,
      maxRetries: config.maxRetries || 3
    });
    
    this.statusMap.set(config.provider, {
      provider: config.provider,
      isAvailable: false,
      latency: 0,
      lastChecked: new Date(),
    });
    this.historyMap.set(config.provider, []);

    this.startMonitoring(config.provider);
  }

  private startMonitoring(provider: ApiProvider): void {
    if (this.checkIntervals.has(provider)) {
      window.clearInterval(this.checkIntervals.get(provider));
    }

    this.checkApiStatus(provider);

    const interval = window.setInterval(
      () => this.checkApiStatus(provider),
      this.DEFAULT_CHECK_INTERVAL
    );
    this.checkIntervals.set(provider, interval);
  }

  private async checkApiStatus(provider: ApiProvider): Promise<void> {
    const config = this.configs.get(provider);
    if (!config) return;

    const startTime = Date.now();
    let result: StatusCheckResult;

    try {
      result = await this.performStatusCheck(provider);
    } catch (error) {
      result = {
        success: false,
        latency: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }

    this.updateStatus(provider, result);
  }

  private async performStatusCheck(provider: ApiProvider): Promise<StatusCheckResult> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`No configuration found for ${provider}`);
    }

    const startTime = Date.now();
    let success = false;

    try {
      if (provider === 'openai') {
        success = await openAIService.checkConnection(config.apiKey);
      } else {
        success = await anthropicService.checkConnection(config.apiKey);
      }

      return {
        success,
        latency: Date.now() - startTime,
        statusCode: success ? 200 : 500
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Status check failed',
        statusCode: 500
      };
    }
  }

  private updateStatus(provider: ApiProvider, result: StatusCheckResult): void {
    const previousStatus = this.statusMap.get(provider);
    const newStatus: ApiStatus = {
      provider, 
      isAvailable: result.success,
      latency: result.latency,
      lastChecked: new Date(),
      errorMessage: result.errorMessage,
      statusCode: result.statusCode,
    };

    this.statusMap.set(provider, newStatus);

    const history = this.historyMap.get(provider) || [];
    history.unshift({
      timestamp: new Date(),
      status: newStatus,
    });

    if (history.length > this.MAX_HISTORY_LENGTH) {
      history.pop();
    }
    this.historyMap.set(provider, history);

    if (previousStatus?.isAvailable !== newStatus.isAvailable) {
      const eventType = newStatus.isAvailable
        ? ApiStatusEventType.RECOVERED
        : ApiStatusEventType.ERROR_OCCURRED;

      const event: ApiStatusEvent = {
        type: eventType,
        provider,
        status: newStatus,
        previousStatus,
        timestamp: new Date(),
      };

      this.emit(eventType, event);
      this.emit(ApiStatusEventType.STATUS_CHANGED, event);
    }
  }

  public getStatus(provider: ApiProvider): ApiStatus | undefined {
    return this.statusMap.get(provider);
  }

  public getStatusHistory(provider: ApiProvider): ApiStatusHistory[] {
    return this.historyMap.get(provider) || [];
  }

  public getAllStatuses(): Map<ApiProvider, ApiStatus> {
    return new Map(this.statusMap);
  }

  public stopMonitoring(provider: ApiProvider): void {
    const interval = this.checkIntervals.get(provider);
    if (interval) {
      window.clearInterval(interval);
      this.checkIntervals.delete(provider);
    }
  }

  public cleanup(): void {
    this.checkIntervals.forEach(interval => window.clearInterval(interval));
    this.checkIntervals.clear();
    this.removeAllListeners();
  }
}

export default ApiStatusService;