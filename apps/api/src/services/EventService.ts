import logger from "../utils/logger";

export interface PremiumEvent {
  type: string;
  walletAddress: string;
  profileId?: string;
  referrerAddress?: string;
  transactionHash?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface EventListener {
  id: string;
  eventType: string;
  handler: (event: PremiumEvent) => Promise<void>;
}

export class EventService {
  private listeners: Map<string, EventListener[]> = new Map();
  private eventQueue: PremiumEvent[] = [];
  private isProcessing = false;

  constructor() {
    // Initialize default event types
    this.initializeDefaultEvents();
  }

  private initializeDefaultEvents() {
    // Register default event types
    this.registerEventType("profile.linked");
    this.registerEventType("profile.auto-linked");
    this.registerEventType("registration.verified");
    this.registerEventType("premium.status.changed");
    this.registerEventType("profile.deactivated");
  }

  /**
   * Register a new event type
   */
  private registerEventType(eventType: string): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
      logger.info(`Registered event type: ${eventType}`);
    }
  }

  /**
   * Add an event listener for a specific event type
   */
  addEventListener(
    eventType: string,
    handler: (event: PremiumEvent) => Promise<void>,
    listenerId?: string
  ): string {
    this.registerEventType(eventType);

    const id =
      listenerId ||
      `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const listener: EventListener = {
      eventType,
      handler,
      id
    };

    this.listeners.get(eventType)?.push(listener);
    logger.info(`Added event listener ${id} for event type: ${eventType}`);

    return id;
  }

  /**
   * Remove an event listener
   */
  removeEventListener(eventType: string, listenerId: string): boolean {
    const listeners = this.listeners.get(eventType);
    if (!listeners) {
      return false;
    }

    const initialLength = listeners.length;
    const filteredListeners = listeners.filter(
      (listener) => listener.id !== listenerId
    );
    this.listeners.set(eventType, filteredListeners);

    const removed = initialLength !== filteredListeners.length;
    if (removed) {
      logger.info(
        `Removed event listener ${listenerId} for event type: ${eventType}`
      );
    }

    return removed;
  }

  /**
   * Emit an event to all registered listeners
   */
  async emitEvent(event: PremiumEvent): Promise<void> {
    try {
      logger.info(
        `Emitting event: ${event.type} for wallet: ${event.walletAddress}`
      );

      // Add event to queue for processing
      this.eventQueue.push(event);

      // Process queue if not already processing
      if (!this.isProcessing) {
        await this.processEventQueue();
      }
    } catch (error) {
      logger.error(`Error emitting event ${event.type}:`, error);
    }
  }

  /**
   * Process the event queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (!event) continue;
        await this.processEvent(event);
      }
    } catch (error) {
      logger.error("Error processing event queue:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: PremiumEvent): Promise<void> {
    const listeners = this.listeners.get(event.type) || [];

    if (listeners.length === 0) {
      logger.debug(`No listeners for event type: ${event.type}`);
      return;
    }

    logger.info(
      `Processing event ${event.type} with ${listeners.length} listeners`
    );

    // Process all listeners concurrently
    const promises = listeners.map(async (listener) => {
      try {
        await listener.handler(event);
        logger.debug(
          `Event ${event.type} processed successfully by listener ${listener.id}`
        );
      } catch (error) {
        logger.error(
          `Error processing event ${event.type} by listener ${listener.id}:`,
          error
        );
        // Don't throw here to allow other listeners to process
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Convenience method to emit profile linked event
   */
  async emitProfileLinked(
    walletAddress: string,
    profileId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.emitEvent({
      metadata,
      profileId,
      timestamp: new Date(),
      type: "profile.linked",
      walletAddress
    });
  }

  /**
   * Convenience method to emit profile auto-linked event
   */
  async emitProfileAutoLinked(
    walletAddress: string,
    profileId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.emitEvent({
      metadata,
      profileId,
      timestamp: new Date(),
      type: "profile.auto-linked",
      walletAddress
    });
  }

  /**
   * Convenience method to emit registration verified event
   */
  async emitRegistrationVerified(
    walletAddress: string,
    referrerAddress: string,
    transactionHash: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.emitEvent({
      metadata,
      referrerAddress,
      timestamp: new Date(),
      transactionHash,
      type: "registration.verified",
      walletAddress
    });
  }

  /**
   * Convenience method to emit premium status changed event
   */
  async emitPremiumStatusChanged(
    walletAddress: string,
    oldStatus: string,
    newStatus: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.emitEvent({
      metadata: {
        ...metadata,
        newStatus,
        oldStatus
      },
      timestamp: new Date(),
      type: "premium.status.changed",
      walletAddress
    });
  }

  /**
   * Convenience method to emit profile deactivated event
   */
  async emitProfileDeactivated(
    walletAddress: string,
    profileId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.emitEvent({
      metadata,
      profileId,
      timestamp: new Date(),
      type: "profile.deactivated",
      walletAddress
    });
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get listener count for an event type
   */
  getListenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.length || 0;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.eventQueue.length
    };
  }

  /**
   * Clear event queue (for testing/debugging)
   */
  clearEventQueue(): void {
    this.eventQueue = [];
    logger.info("Event queue cleared");
  }

  /**
   * Remove all listeners for an event type
   */
  removeAllListeners(eventType: string): number {
    const listeners = this.listeners.get(eventType);
    if (!listeners) {
      return 0;
    }

    const count = listeners.length;
    this.listeners.set(eventType, []);
    logger.info(`Removed all ${count} listeners for event type: ${eventType}`);

    return count;
  }
}

export default new EventService();
