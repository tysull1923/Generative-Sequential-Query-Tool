type EventCallback = (...args: any[]) => void;

/**
 * Custom EventEmitter implementation for browser environments
 */
export class EventEmitter {
  private events: { [key: string]: EventCallback[] } = {};

  /**
   * Add an event listener
   */
  public on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Remove an event listener
   */
  public removeListener(event: string, callbackToRemove: EventCallback): void {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(
      callback => callback !== callbackToRemove
    );
  }

  /**
   * Remove all listeners for an event or all events
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
  }

  /**
   * Emit an event
   */
  protected emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      callback(...args);
    });
  }
}