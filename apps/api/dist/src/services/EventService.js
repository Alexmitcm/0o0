"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class EventService {
    listeners = new Map();
    eventQueue = [];
    isProcessing = false;
    constructor() {
        // Initialize default event types
        this.initializeDefaultEvents();
    }
    initializeDefaultEvents() {
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
    registerEventType(eventType) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
            logger_1.default.info(`Registered event type: ${eventType}`);
        }
    }
    /**
     * Add an event listener for a specific event type
     */
    addEventListener(eventType, handler, listenerId) {
        this.registerEventType(eventType);
        const id = listenerId ||
            `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const listener = {
            eventType,
            handler,
            id
        };
        this.listeners.get(eventType)?.push(listener);
        logger_1.default.info(`Added event listener ${id} for event type: ${eventType}`);
        return id;
    }
    /**
     * Remove an event listener
     */
    removeEventListener(eventType, listenerId) {
        const listeners = this.listeners.get(eventType);
        if (!listeners) {
            return false;
        }
        const initialLength = listeners.length;
        const filteredListeners = listeners.filter((listener) => listener.id !== listenerId);
        this.listeners.set(eventType, filteredListeners);
        const removed = initialLength !== filteredListeners.length;
        if (removed) {
            logger_1.default.info(`Removed event listener ${listenerId} for event type: ${eventType}`);
        }
        return removed;
    }
    /**
     * Emit an event to all registered listeners
     */
    async emitEvent(event) {
        try {
            logger_1.default.info(`Emitting event: ${event.type} for wallet: ${event.walletAddress}`);
            // Add event to queue for processing
            this.eventQueue.push(event);
            // Process queue if not already processing
            if (!this.isProcessing) {
                await this.processEventQueue();
            }
        }
        catch (error) {
            logger_1.default.error(`Error emitting event ${event.type}:`, error);
        }
    }
    /**
     * Process the event queue
     */
    async processEventQueue() {
        if (this.isProcessing || this.eventQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        try {
            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                if (!event)
                    continue;
                await this.processEvent(event);
            }
        }
        catch (error) {
            logger_1.default.error("Error processing event queue:", error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Process a single event
     */
    async processEvent(event) {
        const listeners = this.listeners.get(event.type) || [];
        if (listeners.length === 0) {
            logger_1.default.debug(`No listeners for event type: ${event.type}`);
            return;
        }
        logger_1.default.info(`Processing event ${event.type} with ${listeners.length} listeners`);
        // Process all listeners concurrently
        const promises = listeners.map(async (listener) => {
            try {
                await listener.handler(event);
                logger_1.default.debug(`Event ${event.type} processed successfully by listener ${listener.id}`);
            }
            catch (error) {
                logger_1.default.error(`Error processing event ${event.type} by listener ${listener.id}:`, error);
                // Don't throw here to allow other listeners to process
            }
        });
        await Promise.allSettled(promises);
    }
    /**
     * Convenience method to emit profile linked event
     */
    async emitProfileLinked(walletAddress, profileId, metadata) {
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
    async emitProfileAutoLinked(walletAddress, profileId, metadata) {
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
    async emitRegistrationVerified(walletAddress, referrerAddress, transactionHash, metadata) {
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
    async emitPremiumStatusChanged(walletAddress, oldStatus, newStatus, metadata) {
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
    async emitProfileDeactivated(walletAddress, profileId, metadata) {
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
    getRegisteredEventTypes() {
        return Array.from(this.listeners.keys());
    }
    /**
     * Get listener count for an event type
     */
    getListenerCount(eventType) {
        return this.listeners.get(eventType)?.length || 0;
    }
    /**
     * Get queue status
     */
    getQueueStatus() {
        return {
            isProcessing: this.isProcessing,
            queueLength: this.eventQueue.length
        };
    }
    /**
     * Clear event queue (for testing/debugging)
     */
    clearEventQueue() {
        this.eventQueue = [];
        logger_1.default.info("Event queue cleared");
    }
    /**
     * Remove all listeners for an event type
     */
    removeAllListeners(eventType) {
        const listeners = this.listeners.get(eventType);
        if (!listeners) {
            return 0;
        }
        const count = listeners.length;
        this.listeners.set(eventType, []);
        logger_1.default.info(`Removed all ${count} listeners for event type: ${eventType}`);
        return count;
    }
}
exports.EventService = EventService;
exports.default = new EventService();
