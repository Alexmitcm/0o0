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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const promises_1 = require("fs/promises");
const hono_1 = require("hono");
const path_1 = require("path");
const zod_1 = require("zod");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const handleApiError_1 = __importDefault(require("../utils/handleApiError"));
const prisma = new client_1.PrismaClient();
const backupSystem = new hono_1.Hono();
// Validation schemas
const backupSchema = zod_1.z.object({
    includeData: zod_1.z.boolean().default(true),
    includeSchema: zod_1.z.boolean().default(true),
    tables: zod_1.z.array(zod_1.z.string()).optional()
});
// const restoreSchema = z.object({
//   backupFile: z.string(),
//   confirm: z.boolean().default(false)
// });
// Helper function to generate SQL backup
async function generateSQLBackup(options) {
    const { includeData, includeSchema, tables } = options;
    let sql = "-- 0xArena Database Backup\n";
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += "-- Include Schema: " + includeSchema + "\n";
    sql += "-- Include Data: " + includeData + "\n\n";
    if (includeSchema) {
        // Get all tables
        const tableNames = tables || [
            "users",
            "tournaments",
            "userTransactions",
            "TournamentOfUsers",
            "withdraw_transactions",
            "admin",
            "Notifications",
            "NotificationRecipients",
            "play_history",
            "ManualCaptcha",
            "eq_levels_stamina",
            "slides",
            "hero_slides",
            "tokentx",
            "users_archive",
            "userLog",
            "userCoinBalance",
            "coinTransaction",
            "tournamentParticipant",
            "withdrawTransaction",
            "TokenTx",
            "UsersArchive",
            "Slide",
            "HeroSlide"
        ];
        for (const tableName of tableNames) {
            try {
                // Get table structure
                const tableInfo = await prisma.$queryRaw `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position
        `;
                if (Array.isArray(tableInfo) && tableInfo.length > 0) {
                    sql += `\n-- Table structure for ${tableName}\n`;
                    sql += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
                    sql += `CREATE TABLE "${tableName}" (\n`;
                    const columns = tableInfo
                        .map((col) => {
                        let columnDef = `  "${col.column_name}" ${col.data_type}`;
                        if (col.is_nullable === "NO")
                            columnDef += " NOT NULL";
                        if (col.column_default)
                            columnDef += ` DEFAULT ${col.column_default}`;
                        return columnDef;
                    })
                        .join(",\n");
                    sql += columns + "\n);\n";
                }
            }
            catch {
                console.warn(`Could not get structure for table ${tableName}`);
            }
        }
    }
    if (includeData) {
        // Get all tables and their data
        const tableNames = tables || [
            "users",
            "tournaments",
            "userTransactions",
            "TournamentOfUsers",
            "withdraw_transactions",
            "admin",
            "Notifications",
            "NotificationRecipients",
            "play_history",
            "ManualCaptcha",
            "eq_levels_stamina",
            "slides",
            "hero_slides",
            "tokentx",
            "users_archive",
            "userLog",
            "userCoinBalance",
            "coinTransaction",
            "tournamentParticipant",
            "withdrawTransaction",
            "TokenTx",
            "UsersArchive",
            "Slide",
            "HeroSlide"
        ];
        for (const tableName of tableNames) {
            try {
                const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
                if (Array.isArray(data) && data.length > 0) {
                    sql += `\n-- Data for table ${tableName}\n`;
                    // Get column names
                    const columns = Object.keys(data[0]);
                    const columnNames = columns.map((col) => `"${col}"`).join(", ");
                    // Insert data
                    for (const row of data) {
                        const values = columns
                            .map((col) => {
                            const value = row[col];
                            if (value === null)
                                return "NULL";
                            if (typeof value === "string")
                                return `'${value.replace(/'/g, "''")}'`;
                            if (value instanceof Date)
                                return `'${value.toISOString()}'`;
                            return value;
                        })
                            .join(", ");
                        sql += `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values});\n`;
                    }
                }
            }
            catch {
                console.warn(`Could not backup data for table ${tableName}`);
            }
        }
    }
    return sql;
}
// POST /backup - Create database backup
backupSystem.post("/backup", authMiddleware_1.default, async (c) => {
    try {
        const body = await c.req.json();
        const { includeData, includeSchema, tables } = backupSchema.parse(body);
        // Generate backup
        const sql = await generateSQLBackup({ includeData, includeSchema, tables });
        // Create backup directory if it doesn't exist
        const backupDir = (0, path_1.join)(process.cwd(), "backups");
        await (0, promises_1.mkdir)(backupDir, { recursive: true });
        // Save backup file
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `backup_${timestamp}.sql`;
        const filepath = (0, path_1.join)(backupDir, filename);
        await (0, promises_1.writeFile)(filepath, sql, "utf8");
        // Get file size
        const stats = await Promise.resolve().then(() => __importStar(require("fs"))).then((fs) => fs.promises.stat(filepath));
        return c.json({
            backup: {
                createdAt: new Date().toISOString(),
                filename,
                filepath,
                includeData,
                includeSchema,
                size: stats.size,
                tables: tables || "all"
            },
            message: "Backup created successfully",
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /backups - List all backups
backupSystem.get("/backups", authMiddleware_1.default, async (c) => {
    try {
        const backupDir = (0, path_1.join)(process.cwd(), "backups");
        try {
            const files = await Promise.resolve().then(() => __importStar(require("fs"))).then((fs) => fs.promises.readdir(backupDir));
            const backupFiles = files
                .filter((file) => file.endsWith(".sql"))
                .map((file) => {
                const filepath = (0, path_1.join)(backupDir, file);
                const stats = require("fs").statSync(filepath);
                return {
                    createdAt: stats.birthtime,
                    filename: file,
                    modifiedAt: stats.mtime,
                    size: stats.size
                };
            })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            return c.json({
                backups: backupFiles,
                success: true
            });
        }
        catch {
            return c.json({
                backups: [],
                message: "No backups found",
                success: true
            });
        }
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /backups/:filename - Download backup file
backupSystem.get("/backups/:filename", authMiddleware_1.default, async (c) => {
    try {
        const filename = c.req.param("filename");
        const backupDir = (0, path_1.join)(process.cwd(), "backups");
        const filepath = (0, path_1.join)(backupDir, filename);
        try {
            const content = await (0, promises_1.readFile)(filepath, "utf8");
            c.header("Content-Type", "application/sql");
            c.header("Content-Disposition", `attachment; filename="${filename}"`);
            return c.text(content);
        }
        catch {
            return c.json({
                error: "Backup file not found",
                success: false
            }, 404);
        }
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// DELETE /backups/:filename - Delete backup file
backupSystem.delete("/backups/:filename", authMiddleware_1.default, async (c) => {
    try {
        const filename = c.req.param("filename");
        const backupDir = (0, path_1.join)(process.cwd(), "backups");
        const filepath = (0, path_1.join)(backupDir, filename);
        try {
            await Promise.resolve().then(() => __importStar(require("fs"))).then((fs) => fs.promises.unlink(filepath));
            return c.json({
                message: "Backup file deleted successfully",
                success: true
            });
        }
        catch {
            return c.json({
                error: "Backup file not found",
                success: false
            }, 404);
        }
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /backup/export-excel - Export users as Excel
backupSystem.post("/backup/export-excel", authMiddleware_1.default, async (c) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                banned: true,
                coins: true,
                createdAt: true,
                email: true,
                lastActiveAt: true,
                leftNode: true,
                rightNode: true,
                status: true,
                totalEq: true,
                username: true,
                walletAddress: true
            }
        });
        // Create CSV (simplified Excel export)
        const headers = [
            "walletAddress",
            "username",
            "email",
            "status",
            "banned",
            "totalEq",
            "leftNode",
            "rightNode",
            "coins",
            "createdAt",
            "lastActiveAt"
        ];
        const csvRows = users.map((user) => [
            user.walletAddress,
            user.username,
            user.email || "",
            user.status,
            user.banned,
            user.totalEq,
            user.leftNode,
            user.rightNode,
            user.coins,
            user.createdAt.toISOString(),
            user.lastActiveAt?.toISOString() || ""
        ]);
        const csv = [
            headers.join(","),
            ...csvRows.map((row) => row.join(","))
        ].join("\n");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `users_export_${timestamp}.csv`;
        c.header("Content-Type", "text/csv");
        c.header("Content-Disposition", `attachment; filename="${filename}"`);
        return c.text(csv);
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /backup/stats - Get backup statistics
backupSystem.get("/backup/stats", authMiddleware_1.default, async (c) => {
    try {
        const [totalUsers, totalTournaments, totalTransactions, totalNotifications, totalLogs] = await Promise.all([
            prisma.user.count(),
            prisma.tournament.count(),
            prisma.coinTransaction.count(),
            prisma.notification.count(),
            prisma.userLog.count()
        ]);
        const backupDir = (0, path_1.join)(process.cwd(), "backups");
        let backupCount = 0;
        let totalBackupSize = 0;
        try {
            const files = await Promise.resolve().then(() => __importStar(require("fs"))).then((fs) => fs.promises.readdir(backupDir));
            const backupFiles = files.filter((file) => file.endsWith(".sql"));
            backupCount = backupFiles.length;
            for (const file of backupFiles) {
                const filepath = (0, path_1.join)(backupDir, file);
                const stats = require("fs").statSync(filepath);
                totalBackupSize += stats.size;
            }
        }
        catch {
            // Backup directory doesn't exist
        }
        return c.json({
            stats: {
                backups: {
                    averageSize: backupCount > 0 ? Math.round(totalBackupSize / backupCount) : 0,
                    count: backupCount,
                    totalSize: totalBackupSize
                },
                database: {
                    totalLogs,
                    totalNotifications,
                    totalTournaments,
                    totalTransactions,
                    totalUsers
                }
            },
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /backup/cleanup - Cleanup old backups
backupSystem.post("/backup/cleanup", authMiddleware_1.default, async (c) => {
    try {
        const body = await c.req.json();
        const { keepDays = 30 } = zod_1.z
            .object({
            keepDays: zod_1.z.number().int().positive().default(30)
        })
            .parse(body);
        const backupDir = (0, path_1.join)(process.cwd(), "backups");
        const cutoffDate = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);
        try {
            const files = await Promise.resolve().then(() => __importStar(require("fs"))).then((fs) => fs.promises.readdir(backupDir));
            const backupFiles = files.filter((file) => file.endsWith(".sql"));
            let deletedCount = 0;
            let deletedSize = 0;
            for (const file of backupFiles) {
                const filepath = (0, path_1.join)(backupDir, file);
                const stats = require("fs").statSync(filepath);
                if (stats.birthtime < cutoffDate) {
                    await Promise.resolve().then(() => __importStar(require("fs"))).then((fs) => fs.promises.unlink(filepath));
                    deletedCount++;
                    deletedSize += stats.size;
                }
            }
            return c.json({
                cleanup: {
                    deletedCount,
                    deletedSize,
                    keepDays
                },
                message: `Cleaned up ${deletedCount} old backup files`,
                success: true
            });
        }
        catch {
            return c.json({
                cleanup: {
                    deletedCount: 0,
                    deletedSize: 0,
                    keepDays
                },
                message: "No backups to cleanup",
                success: true
            });
        }
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
exports.default = backupSystem;
