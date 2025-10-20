import type { ReferralState } from "../store/referralStore";
import { useReferralStore } from "../store/referralStore";

export interface ReferralUpdateEvent {
  type: "balance_update" | "status_change" | "new_referral" | "depth_change";
  address: string;
  data: {
    balance?: string;
    status?: boolean;
    depth?: number;
    timestamp: number;
  };
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private config: WebSocketConfig;
  private store: ReferralState | undefined = undefined;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  // Initialize the service with store
  initialize(store: ReferralState): void {
    this.store = store;
  }

  // Connect to WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error("Already connecting"));
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.store?.setConnected(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.store?.setConnected(false);

          if (
            !event.wasClean &&
            this.reconnectAttempts < this.config.maxReconnectAttempts
          ) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.store?.setConnected(false);
  }

  // Send message to WebSocket
  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }

  // Subscribe to referral updates
  subscribeToReferralUpdates(address: string): void {
    this.send({
      data: {
        address,
        events: [
          "balance_update",
          "status_change",
          "new_referral",
          "depth_change"
        ]
      },
      type: "subscribe"
    });
  }

  // Unsubscribe from referral updates
  unsubscribeFromReferralUpdates(address: string): void {
    this.send({
      data: {
        address,
        events: [
          "balance_update",
          "status_change",
          "new_referral",
          "depth_change"
        ]
      },
      type: "unsubscribe"
    });
  }

  // Handle incoming messages
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "referral_update":
          this.handleReferralUpdate(data.payload as ReferralUpdateEvent);
          break;
        case "heartbeat":
          this.handleHeartbeat();
          break;
        case "error":
          console.error("WebSocket server error:", data.message);
          break;
        default:
          console.warn("Unknown WebSocket message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  // Handle referral update events
  private handleReferralUpdate(event: ReferralUpdateEvent): void {
    if (!this.store) return;

    console.log("Received referral update:", event);

    // Update store optimistically
    this.store.optimisticUpdate(event.address, {
      ...(event.data.balance && { balance: event.data.balance }),
      ...(event.data.depth && { depth: event.data.depth }),
      ...(event.data.status !== undefined && {
        unbalancedAllowance: event.data.status
      })
    });

    // Update activity timestamp
    this.store.updateActivity();

    // Trigger a refresh after a short delay to sync with contract
    setTimeout(() => {
      // This would trigger a contract read to verify the update
      console.log("Syncing with contract for address:", event.address);
    }, 2000);
  }

  // Handle heartbeat
  private handleHeartbeat(): void {
    // Reset heartbeat timer
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.startHeartbeat();
    }
  }

  // Start heartbeat
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: "heartbeat" });
    }, this.config.heartbeatInterval);
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Schedule reconnection
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay =
      this.config.reconnectInterval * 2 ** (this.reconnectAttempts - 1);

    console.log(
      `Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
      });
    }, delay);
  }

  // Get connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Get connection state
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Create singleton instance
const websocketService = new WebSocketService({
  heartbeatInterval: 30000,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  url:
    process.env.NODE_ENV === "production"
      ? "wss://your-api-domain.com/ws/referral"
      : "ws://localhost:3001/ws/referral"
});

export default websocketService;

// Hook for using WebSocket service
export const useWebSocketService = () => {
  const store = useReferralStore();

  const connect = async (address: string) => {
    websocketService.initialize(store);
    await websocketService.connect();
    websocketService.subscribeToReferralUpdates(address);
  };

  const disconnect = () => {
    websocketService.disconnect();
  };

  const isConnected = websocketService.isConnected;

  return {
    connect,
    disconnect,
    isConnected,
    readyState: websocketService.readyState
  };
};
