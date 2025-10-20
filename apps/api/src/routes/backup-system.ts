import { PrismaClient } from "@prisma/client";
import { mkdir, readFile, writeFile } from "fs/promises";
import { Hono } from "hono";
import { join } from "path";
import { z } from "zod";
import authMiddleware from "../middlewares/authMiddleware";
import handleApiError from "../utils/handleApiError";

const prisma = new PrismaClient();
const backupSystem = new Hono();

// Validation schemas
const backupSchema = z.object({
  includeData: z.boolean().default(true),
  includeSchema: z.boolean().default(true),
  tables: z.array(z.string()).optional()
});

// const restoreSchema = z.object({
//   backupFile: z.string(),
//   confirm: z.boolean().default(false)
// });

// Helper function to generate SQL backup
async function generateSQLBackup(options: {
  includeData: boolean;
  includeSchema: boolean;
  tables?: string[];
}) {
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
        const tableInfo = await prisma.$queryRaw`
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
            .map((col: any) => {
              let columnDef = `  "${col.column_name}" ${col.data_type}`;
              if (col.is_nullable === "NO") columnDef += " NOT NULL";
              if (col.column_default)
                columnDef += ` DEFAULT ${col.column_default}`;
              return columnDef;
            })
            .join(",\n");

          sql += columns + "\n);\n";
        }
      } catch {
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
        const data = await prisma.$queryRawUnsafe(
          `SELECT * FROM "${tableName}"`
        );

        if (Array.isArray(data) && data.length > 0) {
          sql += `\n-- Data for table ${tableName}\n`;

          // Get column names
          const columns = Object.keys(data[0] as any);
          const columnNames = columns.map((col) => `"${col}"`).join(", ");

          // Insert data
          for (const row of data as any[]) {
            const values = columns
              .map((col) => {
                const value = row[col];
                if (value === null) return "NULL";
                if (typeof value === "string")
                  return `'${value.replace(/'/g, "''")}'`;
                if (value instanceof Date) return `'${value.toISOString()}'`;
                return value;
              })
              .join(", ");

            sql += `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values});\n`;
          }
        }
      } catch {
        console.warn(`Could not backup data for table ${tableName}`);
      }
    }
  }

  return sql;
}

// POST /backup - Create database backup
backupSystem.post("/backup", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { includeData, includeSchema, tables } = backupSchema.parse(body);

    // Generate backup
    const sql = await generateSQLBackup({ includeData, includeSchema, tables });

    // Create backup directory if it doesn't exist
    const backupDir = join(process.cwd(), "backups");
    await mkdir(backupDir, { recursive: true });

    // Save backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${timestamp}.sql`;
    const filepath = join(backupDir, filename);

    await writeFile(filepath, sql, "utf8");

    // Get file size
    const stats = await import("fs").then((fs) => fs.promises.stat(filepath));

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
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /backups - List all backups
backupSystem.get("/backups", authMiddleware, async (c) => {
  try {
    const backupDir = join(process.cwd(), "backups");

    try {
      const files = await import("fs").then((fs) =>
        fs.promises.readdir(backupDir)
      );
      const backupFiles = files
        .filter((file) => file.endsWith(".sql"))
        .map((file) => {
          const filepath = join(backupDir, file);
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
    } catch {
      return c.json({
        backups: [],
        message: "No backups found",
        success: true
      });
    }
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /backups/:filename - Download backup file
backupSystem.get("/backups/:filename", authMiddleware, async (c) => {
  try {
    const filename = c.req.param("filename");
    const backupDir = join(process.cwd(), "backups");
    const filepath = join(backupDir, filename);

    try {
      const content = await readFile(filepath, "utf8");

      c.header("Content-Type", "application/sql");
      c.header("Content-Disposition", `attachment; filename="${filename}"`);
      return c.text(content);
    } catch {
      return c.json(
        {
          error: "Backup file not found",
          success: false
        },
        404
      );
    }
  } catch (error) {
    return handleApiError(c, error);
  }
});

// DELETE /backups/:filename - Delete backup file
backupSystem.delete("/backups/:filename", authMiddleware, async (c) => {
  try {
    const filename = c.req.param("filename");
    const backupDir = join(process.cwd(), "backups");
    const filepath = join(backupDir, filename);

    try {
      await import("fs").then((fs) => fs.promises.unlink(filepath));

      return c.json({
        message: "Backup file deleted successfully",
        success: true
      });
    } catch {
      return c.json(
        {
          error: "Backup file not found",
          success: false
        },
        404
      );
    }
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /backup/export-excel - Export users as Excel
backupSystem.post("/backup/export-excel", authMiddleware, async (c) => {
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
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /backup/stats - Get backup statistics
backupSystem.get("/backup/stats", authMiddleware, async (c) => {
  try {
    const [
      totalUsers,
      totalTournaments,
      totalTransactions,
      totalNotifications,
      totalLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.coinTransaction.count(),
      prisma.notification.count(),
      prisma.userLog.count()
    ]);

    const backupDir = join(process.cwd(), "backups");
    let backupCount = 0;
    let totalBackupSize = 0;

    try {
      const files = await import("fs").then((fs) =>
        fs.promises.readdir(backupDir)
      );
      const backupFiles = files.filter((file) => file.endsWith(".sql"));
      backupCount = backupFiles.length;

      for (const file of backupFiles) {
        const filepath = join(backupDir, file);
        const stats = require("fs").statSync(filepath);
        totalBackupSize += stats.size;
      }
    } catch {
      // Backup directory doesn't exist
    }

    return c.json({
      stats: {
        backups: {
          averageSize:
            backupCount > 0 ? Math.round(totalBackupSize / backupCount) : 0,
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
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /backup/cleanup - Cleanup old backups
backupSystem.post("/backup/cleanup", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { keepDays = 30 } = z
      .object({
        keepDays: z.number().int().positive().default(30)
      })
      .parse(body);

    const backupDir = join(process.cwd(), "backups");
    const cutoffDate = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);

    try {
      const files = await import("fs").then((fs) =>
        fs.promises.readdir(backupDir)
      );
      const backupFiles = files.filter((file) => file.endsWith(".sql"));

      let deletedCount = 0;
      let deletedSize = 0;

      for (const file of backupFiles) {
        const filepath = join(backupDir, file);
        const stats = require("fs").statSync(filepath);

        if (stats.birthtime < cutoffDate) {
          await import("fs").then((fs) => fs.promises.unlink(filepath));
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
    } catch {
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
  } catch (error) {
    return handleApiError(c, error);
  }
});

export default backupSystem;
