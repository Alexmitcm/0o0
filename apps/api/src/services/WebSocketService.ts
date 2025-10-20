import { parse } from "node:url";
import { WebSocketServer } from "ws";
import logger from "../utils/logger";

export interface WebSocketMessage {
  type:
    | "transaction_status"
    | "registration_update"
    | "premium_status"
    | "profile_linked"
    | "connection_established"
    | "pong"
    | "error";
  data: any;
  timestamp: string;
  userId?: string;
  walletAddress?: string;
}

export interface TransactionStatusUpdate {
  transactionHash: string;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
  confirmations?: number;
  gasUsed?: string;
  message: string;
}

export interface RegistrationUpdate {
  walletAddress: string;
  status:
    | "started"
    | "validating"
    | "confirmed"
    | "profile_linked"
    | "completed"
    | "failed";
  message: string;
  userStatus?: "Standard" | "OnChainUnlinked" | "ProLinked";
  linkedProfile?: {
    profileId: string;
    handle: string;
    linkedAt: Date;
  };
}

export interface PremiumStatusUpdate {
  walletAddress: string;
  userStatus: "Standard" | "OnChainUnlinked" | "ProLinked";
  isPremiumOnChain: boolean;
  hasLinkedProfile: boolean;
  availableFeatures: string[];
  message: string;
}

export interface ProfileLinkedUpdate {
  walletAddress: string;
  profileId: string;
  handle: string;
  linkedAt: Date;
  message: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, any> = new Map();
  private transactionSubscriptions: Map<string, Set<string>> = new Map();
  private walletSubscriptions: Map<string, Set<string>> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ noServer: true });
    this.setupWebSocketServer();
    this.setupServerUpgrade(server);
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws, request) => {
      const url = parse(request.url || "", true);
      const walletAddress = url.query.walletAddress as string;
      const clientId = this.generateClientId();

      logger.info(
        `WebSocket client connected: ${clientId}, wallet: ${walletAddress}`
      );

      // Store client connection
      this.clients.set(clientId, {
        connectedAt: new Date(),
        subscriptions: new Set(),
        walletAddress,
        ws
      });

      // Send welcome message
      this.sendToClient(clientId, {
        data: {
          clientId,
          message: "WebSocket connection established",
          walletAddress
        },
        timestamp: new Date().toISOString(),
        type: "connection_established"
      });

      // Handle client messages
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          logger.error(`Error parsing WebSocket message: ${error}`);
        }
      });

      // Handle client disconnect
      ws.on("close", () => {
        this.handleClientDisconnect(clientId);
      });

      ws.on("error", (error) => {
        logger.error(`WebSocket error for client ${clientId}: ${error}`);
        this.handleClientDisconnect(clientId);
      });
    });
  }

  private setupServerUpgrade(server: any) {
    server.on("upgrade", (request: any, socket: any, head: any) => {
      const pathname = parse(request.url).pathname;

      if (pathname === "/ws") {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit("connection", ws, request);
        });
      } else {
        socket.destroy();
      }
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleClientMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    logger.info(`Received message from client ${clientId}: ${message.type}`);

    switch (message.type) {
      case "subscribe_transaction":
        this.subscribeToTransaction(clientId, message.transactionHash);
        break;
      case "subscribe_wallet":
        this.subscribeToWallet(clientId, message.walletAddress);
        break;
      case "unsubscribe_transaction":
        this.unsubscribeFromTransaction(clientId, message.transactionHash);
        break;
      case "unsubscribe_wallet":
        this.unsubscribeFromWallet(clientId, message.walletAddress);
        break;
      case "ping":
        this.sendToClient(clientId, {
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
          type: "pong"
        });
        break;
      default:
        logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  private handleClientDisconnect(clientId: string) {
    logger.info(`WebSocket client disconnected: ${clientId}`);

    // Remove from all subscriptions
    this.transactionSubscriptions.forEach((clients, txHash) => {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.transactionSubscriptions.delete(txHash);
      }
    });

    this.walletSubscriptions.forEach((clients, wallet) => {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.walletSubscriptions.delete(wallet);
      }
    });

    // Remove client
    this.clients.delete(clientId);
  }

  private subscribeToTransaction(clientId: string, transactionHash: string) {
    if (!this.transactionSubscriptions.has(transactionHash)) {
      this.transactionSubscriptions.set(transactionHash, new Set());
    }
    this.transactionSubscriptions.get(transactionHash)?.add(clientId);

    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.add(`tx:${transactionHash}`);
    }

    logger.info(
      `Client ${clientId} subscribed to transaction ${transactionHash}`
    );
  }

  private subscribeToWallet(clientId: string, walletAddress: string) {
    const normalizedAddress = walletAddress.toLowerCase();

    if (!this.walletSubscriptions.has(normalizedAddress)) {
      this.walletSubscriptions.set(normalizedAddress, new Set());
    }
    this.walletSubscriptions.get(normalizedAddress)?.add(clientId);

    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.add(`wallet:${normalizedAddress}`);
    }

    logger.info(`Client ${clientId} subscribed to wallet ${normalizedAddress}`);
  }

  private unsubscribeFromTransaction(
    clientId: string,
    transactionHash: string
  ) {
    const subscribers = this.transactionSubscriptions.get(transactionHash);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.transactionSubscriptions.delete(transactionHash);
      }
    }

    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.delete(`tx:${transactionHash}`);
    }

    logger.info(
      `Client ${clientId} unsubscribed from transaction ${transactionHash}`
    );
  }

  private unsubscribeFromWallet(clientId: string, walletAddress: string) {
    const normalizedAddress = walletAddress.toLowerCase();
    const subscribers = this.walletSubscriptions.get(normalizedAddress);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.walletSubscriptions.delete(normalizedAddress);
      }
    }

    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.delete(`wallet:${normalizedAddress}`);
    }

    logger.info(
      `Client ${clientId} unsubscribed from wallet ${normalizedAddress}`
    );
  }

  private sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== 1) {
      logger.warn(`Client ${clientId} not connected or ready`);
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error(`Error sending message to client ${clientId}: ${error}`);
      this.handleClientDisconnect(clientId);
    }
  }

  // Public methods for broadcasting updates

  /**
   * Broadcast transaction status update to subscribed clients
   */
  broadcastTransactionUpdate(
    transactionHash: string,
    update: TransactionStatusUpdate
  ) {
    const subscribers = this.transactionSubscriptions.get(transactionHash);
    if (!subscribers) return;

    const message: WebSocketMessage = {
      data: update,
      timestamp: new Date().toISOString(),
      type: "transaction_status"
    };

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message);
    }

    logger.info(
      `Broadcasted transaction update for ${transactionHash} to ${subscribers.size} clients`
    );
  }

  /**
   * Broadcast registration update to subscribed clients
   */
  broadcastRegistrationUpdate(
    walletAddress: string,
    update: RegistrationUpdate
  ) {
    const normalizedAddress = walletAddress.toLowerCase();
    const subscribers = this.walletSubscriptions.get(normalizedAddress);
    if (!subscribers) return;

    const message: WebSocketMessage = {
      data: update,
      timestamp: new Date().toISOString(),
      type: "registration_update",
      walletAddress: normalizedAddress
    };

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message);
    }

    logger.info(
      `Broadcasted registration update for ${normalizedAddress} to ${subscribers.size} clients`
    );
  }

  /**
   * Broadcast premium status update to subscribed clients
   */
  broadcastPremiumStatusUpdate(
    walletAddress: string,
    update: PremiumStatusUpdate
  ) {
    const normalizedAddress = walletAddress.toLowerCase();
    const subscribers = this.walletSubscriptions.get(normalizedAddress);
    if (!subscribers) return;

    const message: WebSocketMessage = {
      data: update,
      timestamp: new Date().toISOString(),
      type: "premium_status",
      walletAddress: normalizedAddress
    };

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message);
    }

    logger.info(
      `Broadcasted premium status update for ${normalizedAddress} to ${subscribers.size} clients`
    );
  }

  /**
   * Broadcast profile linked update to subscribed clients
   */
  broadcastProfileLinkedUpdate(
    walletAddress: string,
    update: ProfileLinkedUpdate
  ) {
    const normalizedAddress = walletAddress.toLowerCase();
    const subscribers = this.walletSubscriptions.get(normalizedAddress);
    if (!subscribers) return;

    const message: WebSocketMessage = {
      data: update,
      timestamp: new Date().toISOString(),
      type: "profile_linked",
      walletAddress: normalizedAddress
    };

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message);
    }

    logger.info(
      `Broadcasted profile linked update for ${normalizedAddress} to ${subscribers.size} clients`
    );
  }

  /**
   * Broadcast error message to specific client
   */
  sendErrorToClient(clientId: string, error: string, details?: any) {
    const message: WebSocketMessage = {
      data: {
        details,
        error,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      type: "error"
    };

    this.sendToClient(clientId, message);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      activeConnections: Array.from(this.clients.values()).filter(
        (client) => client.ws.readyState === 1
      ).length,
      totalClients: this.clients.size,
      transactionSubscriptions: this.transactionSubscriptions.size,
      walletSubscriptions: this.walletSubscriptions.size
    };
  }

  /**
   * Broadcast to all connected clients (admin function)
   */
  broadcastToAll(message: WebSocketMessage) {
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === 1) {
        this.sendToClient(clientId, message);
      }
    });
  }
}

export default WebSocketService;
