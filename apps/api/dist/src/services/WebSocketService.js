"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const node_url_1 = require("node:url");
const ws_1 = require("ws");
const logger_1 = __importDefault(require("../utils/logger"));
class WebSocketService {
    wss;
    clients = new Map();
    transactionSubscriptions = new Map();
    walletSubscriptions = new Map();
    constructor(server) {
        this.wss = new ws_1.WebSocketServer({ noServer: true });
        this.setupWebSocketServer();
        this.setupServerUpgrade(server);
    }
    setupWebSocketServer() {
        this.wss.on("connection", (ws, request) => {
            const url = (0, node_url_1.parse)(request.url || "", true);
            const walletAddress = url.query.walletAddress;
            const clientId = this.generateClientId();
            logger_1.default.info(`WebSocket client connected: ${clientId}, wallet: ${walletAddress}`);
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
                }
                catch (error) {
                    logger_1.default.error(`Error parsing WebSocket message: ${error}`);
                }
            });
            // Handle client disconnect
            ws.on("close", () => {
                this.handleClientDisconnect(clientId);
            });
            ws.on("error", (error) => {
                logger_1.default.error(`WebSocket error for client ${clientId}: ${error}`);
                this.handleClientDisconnect(clientId);
            });
        });
    }
    setupServerUpgrade(server) {
        server.on("upgrade", (request, socket, head) => {
            const pathname = (0, node_url_1.parse)(request.url).pathname;
            if (pathname === "/ws") {
                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    this.wss.emit("connection", ws, request);
                });
            }
            else {
                socket.destroy();
            }
        });
    }
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    handleClientMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        logger_1.default.info(`Received message from client ${clientId}: ${message.type}`);
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
                logger_1.default.warn(`Unknown message type: ${message.type}`);
        }
    }
    handleClientDisconnect(clientId) {
        logger_1.default.info(`WebSocket client disconnected: ${clientId}`);
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
    subscribeToTransaction(clientId, transactionHash) {
        if (!this.transactionSubscriptions.has(transactionHash)) {
            this.transactionSubscriptions.set(transactionHash, new Set());
        }
        this.transactionSubscriptions.get(transactionHash)?.add(clientId);
        const client = this.clients.get(clientId);
        if (client) {
            client.subscriptions.add(`tx:${transactionHash}`);
        }
        logger_1.default.info(`Client ${clientId} subscribed to transaction ${transactionHash}`);
    }
    subscribeToWallet(clientId, walletAddress) {
        const normalizedAddress = walletAddress.toLowerCase();
        if (!this.walletSubscriptions.has(normalizedAddress)) {
            this.walletSubscriptions.set(normalizedAddress, new Set());
        }
        this.walletSubscriptions.get(normalizedAddress)?.add(clientId);
        const client = this.clients.get(clientId);
        if (client) {
            client.subscriptions.add(`wallet:${normalizedAddress}`);
        }
        logger_1.default.info(`Client ${clientId} subscribed to wallet ${normalizedAddress}`);
    }
    unsubscribeFromTransaction(clientId, transactionHash) {
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
        logger_1.default.info(`Client ${clientId} unsubscribed from transaction ${transactionHash}`);
    }
    unsubscribeFromWallet(clientId, walletAddress) {
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
        logger_1.default.info(`Client ${clientId} unsubscribed from wallet ${normalizedAddress}`);
    }
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client || client.ws.readyState !== 1) {
            logger_1.default.warn(`Client ${clientId} not connected or ready`);
            return;
        }
        try {
            client.ws.send(JSON.stringify(message));
        }
        catch (error) {
            logger_1.default.error(`Error sending message to client ${clientId}: ${error}`);
            this.handleClientDisconnect(clientId);
        }
    }
    // Public methods for broadcasting updates
    /**
     * Broadcast transaction status update to subscribed clients
     */
    broadcastTransactionUpdate(transactionHash, update) {
        const subscribers = this.transactionSubscriptions.get(transactionHash);
        if (!subscribers)
            return;
        const message = {
            data: update,
            timestamp: new Date().toISOString(),
            type: "transaction_status"
        };
        for (const clientId of subscribers) {
            this.sendToClient(clientId, message);
        }
        logger_1.default.info(`Broadcasted transaction update for ${transactionHash} to ${subscribers.size} clients`);
    }
    /**
     * Broadcast registration update to subscribed clients
     */
    broadcastRegistrationUpdate(walletAddress, update) {
        const normalizedAddress = walletAddress.toLowerCase();
        const subscribers = this.walletSubscriptions.get(normalizedAddress);
        if (!subscribers)
            return;
        const message = {
            data: update,
            timestamp: new Date().toISOString(),
            type: "registration_update",
            walletAddress: normalizedAddress
        };
        for (const clientId of subscribers) {
            this.sendToClient(clientId, message);
        }
        logger_1.default.info(`Broadcasted registration update for ${normalizedAddress} to ${subscribers.size} clients`);
    }
    /**
     * Broadcast premium status update to subscribed clients
     */
    broadcastPremiumStatusUpdate(walletAddress, update) {
        const normalizedAddress = walletAddress.toLowerCase();
        const subscribers = this.walletSubscriptions.get(normalizedAddress);
        if (!subscribers)
            return;
        const message = {
            data: update,
            timestamp: new Date().toISOString(),
            type: "premium_status",
            walletAddress: normalizedAddress
        };
        for (const clientId of subscribers) {
            this.sendToClient(clientId, message);
        }
        logger_1.default.info(`Broadcasted premium status update for ${normalizedAddress} to ${subscribers.size} clients`);
    }
    /**
     * Broadcast profile linked update to subscribed clients
     */
    broadcastProfileLinkedUpdate(walletAddress, update) {
        const normalizedAddress = walletAddress.toLowerCase();
        const subscribers = this.walletSubscriptions.get(normalizedAddress);
        if (!subscribers)
            return;
        const message = {
            data: update,
            timestamp: new Date().toISOString(),
            type: "profile_linked",
            walletAddress: normalizedAddress
        };
        for (const clientId of subscribers) {
            this.sendToClient(clientId, message);
        }
        logger_1.default.info(`Broadcasted profile linked update for ${normalizedAddress} to ${subscribers.size} clients`);
    }
    /**
     * Broadcast error message to specific client
     */
    sendErrorToClient(clientId, error, details) {
        const message = {
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
            activeConnections: Array.from(this.clients.values()).filter((client) => client.ws.readyState === 1).length,
            totalClients: this.clients.size,
            transactionSubscriptions: this.transactionSubscriptions.size,
            walletSubscriptions: this.walletSubscriptions.size
        };
    }
    /**
     * Broadcast to all connected clients (admin function)
     */
    broadcastToAll(message) {
        this.clients.forEach((client, clientId) => {
            if (client.ws.readyState === 1) {
                this.sendToClient(clientId, message);
            }
        });
    }
}
exports.WebSocketService = WebSocketService;
exports.default = WebSocketService;
