"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveGameFile = void 0;
const node_path_1 = require("node:path");
const serve_static_1 = require("@hono/node-server/serve-static");
const client_1 = __importDefault(require("../../prisma/client"));
const serveGameFile = async (c) => {
    try {
        const slug = c.req.param("slug");
        const filePath = c.req.param("*") || "index.html";
        // Get the game from database
        const game = await client_1.default.game.findUnique({
            where: { slug }
        });
        if (!game) {
            return c.json({ error: "Game not found" }, 404);
        }
        if (game.status !== "Published") {
            return c.json({ error: "Game is not available" }, 404);
        }
        // Serve files from the games directory using the game's packageUrl
        const packageUrl = game.packageUrl;
        const gameFolder = packageUrl.split('/').slice(-2, -1)[0]; // Extract folder name from packageUrl
        const gamesDir = (0, node_path_1.join)(process.cwd(), "uploads", "games", gameFolder);
        // Set CORS headers for game files
        c.header("Access-Control-Allow-Origin", "*");
        c.header("Access-Control-Allow-Methods", "GET, OPTIONS");
        c.header("Access-Control-Allow-Headers", "Content-Type");
        // Use Hono's serveStatic to serve the file
        return (0, serve_static_1.serveStatic)({
            path: filePath,
            root: gamesDir
        })(c);
    }
    catch (error) {
        console.error("Serve game file error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.serveGameFile = serveGameFile;
