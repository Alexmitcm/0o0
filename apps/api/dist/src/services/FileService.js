"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const unzip_stream_1 = require("unzip-stream");
class FileService {
    static uploadsDir = (0, node_path_1.join)(process.cwd(), "uploads");
    static gamesDir = (0, node_path_1.join)(this.uploadsDir, "games");
    static thumbnailsDir = (0, node_path_1.join)(this.uploadsDir, "thumbnails");
    static async ensureDirectories() {
        await (0, promises_1.mkdir)(FileService.uploadsDir, { recursive: true });
        await (0, promises_1.mkdir)(FileService.gamesDir, { recursive: true });
        await (0, promises_1.mkdir)(FileService.thumbnailsDir, { recursive: true });
    }
    static async saveGameFile(file, slug) {
        await FileService.ensureDirectories();
        const gameDir = (0, node_path_1.join)(FileService.gamesDir, slug);
        await (0, promises_1.mkdir)(gameDir, { recursive: true });
        // Save the ZIP file
        const zipPath = (0, node_path_1.join)(gameDir, "game.zip");
        const arrayBuffer = await file.arrayBuffer();
        await (0, promises_1.writeFile)(zipPath, Buffer.from(arrayBuffer));
        // Extract the ZIP file
        await FileService.extractZip(zipPath, gameDir);
        // Try to detect entry file path (common locations: root index.html or nested html5/index.html)
        // Default to 'index.html' if not found
        let entryFilePath = "index.html";
        try {
            const chosen = await FileService.pickBestIndexHtml(gameDir);
            if (chosen) {
                entryFilePath = chosen
                    .replace(`${gameDir}\\`, "")
                    .replace(`${gameDir}/`, "");
            }
        }
        catch { }
        // Return the local path and detected entry path
        return { basePath: `/uploads/games/${slug}`, entryFilePath };
    }
    static async saveThumbnail(file, slug, type) {
        await FileService.ensureDirectories();
        const ext = (0, node_path_1.extname)(file.name);
        const filename = `${type}${ext}`;
        const thumbnailPath = (0, node_path_1.join)(FileService.thumbnailsDir, `${slug}_${filename}`);
        const arrayBuffer = await file.arrayBuffer();
        await (0, promises_1.writeFile)(thumbnailPath, Buffer.from(arrayBuffer));
        return `/uploads/thumbnails/${slug}_${filename}`;
    }
    static async extractZip(zipPath, extractPath) {
        return new Promise((resolve, reject) => {
            const readStream = (0, node_fs_1.createReadStream)(zipPath);
            readStream
                .pipe((0, unzip_stream_1.Extract)({ path: extractPath }))
                .on("close", () => {
                // Clean up the ZIP file after extraction
                (0, promises_1.unlink)(zipPath).catch(console.error);
                resolve();
            })
                .on("error", reject);
        });
    }
    // Prefer real game entry over documentation:
    // - Deprioritize paths containing: documentation, docs, manual, guide, help
    // - Prioritize folders: html5, build, dist, public, www, webgl
    // - Inspect file content for known engines (Construct c3runtime.js, Phaser, UnityLoader, Godot)
    static async pickBestIndexHtml(dir) {
        const candidates = [];
        const queue = [dir];
        while (queue.length) {
            const current = queue.shift();
            const entries = await (0, promises_1.readdir)(current, { withFileTypes: true });
            for (const entry of entries) {
                const full = (0, node_path_1.join)(current, entry.name);
                if (entry.isFile() && entry.name.toLowerCase() === "index.html") {
                    candidates.push(full);
                }
                else if (entry.isDirectory()) {
                    queue.push(full);
                }
            }
        }
        if (candidates.length === 0)
            return null;
        const lowerBad = ["documentation", "docs", "manual", "guide", "help"];
        const preferDirs = ["html5", "build", "dist", "public", "www", "webgl"];
        let bestScore = Number.NEGATIVE_INFINITY;
        let bestPath = candidates[0];
        for (const p of candidates) {
            let score = 0;
            const pl = p.toLowerCase();
            if (preferDirs.some((d) => pl.includes(`\\${d}\\`) || pl.includes(`/${d}/`)))
                score += 5;
            if (lowerBad.some((d) => pl.includes(`\\${d}\\`) || pl.includes(`/${d}/`)))
                score -= 5;
            // Shallower paths are better
            score -= pl.split(/[/\\]/).length - dir.split(/[/\\]/).length;
            // Content-based signals
            try {
                const html = await (0, promises_1.readFile)(p, "utf8");
                if (/c3runtime\.js|construct|phaser|unity|godot/i.test(html))
                    score += 10;
                if (/table of contents|documentation|changelog|support policy/i.test(html))
                    score -= 8;
            }
            catch { }
            if (score > bestScore) {
                bestScore = score;
                bestPath = p;
            }
        }
        return bestPath;
    }
    static async deleteGameFiles(slug) {
        try {
            const gameDir = (0, node_path_1.join)(FileService.gamesDir, slug);
            // Delete game directory
            await FileService.deleteDirectory(gameDir);
            // Delete thumbnails
            const thumbnails = await (0, promises_1.readdir)(FileService.thumbnailsDir);
            for (const thumbnail of thumbnails) {
                if (thumbnail.startsWith(slug)) {
                    await (0, promises_1.unlink)((0, node_path_1.join)(FileService.thumbnailsDir, thumbnail));
                }
            }
        }
        catch (error) {
            console.error("Error deleting game files:", error);
        }
    }
    static async deleteDirectory(dirPath) {
        try {
            const files = await (0, promises_1.readdir)(dirPath);
            for (const file of files) {
                const filePath = (0, node_path_1.join)(dirPath, file);
                await (0, promises_1.unlink)(filePath);
            }
            await rmdir(dirPath);
        }
        catch (error) {
            console.error("Error deleting directory:", error);
        }
    }
}
exports.FileService = FileService;
// Helper function to remove directory
async function rmdir(path) {
    const { rmdir } = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
    return rmdir(path);
}
