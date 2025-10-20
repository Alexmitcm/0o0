import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import authMiddleware from "../middlewares/authMiddleware";
import handleApiError from "../utils/handleApiError";

const prisma = new PrismaClient();
const csvGenerator = new Hono();

// Validation schemas
const generateCsvSchema = z.object({
  dataType: z.enum([
    "users",
    "tournaments",
    "transactions",
    "notifications",
    "withdrawals",
    "logs",
    "eqLevels",
    "all"
  ]),
  dateRange: z
    .object({
      endDate: z.string().datetime().optional(),
      startDate: z.string().datetime().optional()
    })
    .optional(),
  filters: z.record(z.any()).optional(),
  format: z.enum(["csv", "excel"]).default("csv")
});

// Helper function to generate CSV
function generateCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(",");
  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",")
  );
  return [csvHeaders, ...csvRows].join("\n");
}

// POST /generate - Generate CSV/Excel file
csvGenerator.post("/generate", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { dataType, filters, dateRange, format } =
      generateCsvSchema.parse(body);

    let data: any[] = [];
    let headers: string[] = [];
    let filename = "";

    // Build date filter
    const dateFilter =
      dateRange?.startDate && dateRange?.endDate
        ? {
            createdAt: {
              gte: new Date(dateRange.startDate),
              lte: new Date(dateRange.endDate)
            }
          }
        : {};

    switch (dataType) {
      case "users": {
        data = await prisma.user.findMany({
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
          },
          where: { ...dateFilter, ...filters }
        });
        headers = [
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
        filename = "users";
        break;
      }

      case "tournaments": {
        data = await prisma.tournament.findMany({
          include: {
            participants: {
              select: {
                user: {
                  select: {
                    username: true,
                    walletAddress: true
                  }
                }
              }
            }
          },
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "name",
          "type",
          "status",
          "prizePool",
          "coinsGathered",
          "participantCount",
          "startDate",
          "endDate",
          "createdAt"
        ];
        filename = "tournaments";
        break;
      }

      case "transactions": {
        data = await prisma.coinTransaction.findMany({
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true
              }
            }
          },
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "walletAddress",
          "username",
          "coinType",
          "amount",
          "transactionType",
          "sourceType",
          "description",
          "createdAt"
        ];
        filename = "transactions";
        break;
      }

      case "notifications": {
        data = await prisma.notification.findMany({
          include: {
            recipients: {
              select: {
                isSeen: true,
                recipient: true
              }
            }
          },
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "title",
          "description",
          "priority",
          "type",
          "isAll",
          "recipientCount",
          "seenCount",
          "createdAt"
        ];
        filename = "notifications";
        break;
      }

      case "withdrawals": {
        data = await prisma.withdrawTransaction.findMany({
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true
              }
            }
          },
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "walletAddress",
          "username",
          "userTx",
          "amount",
          "fromField",
          "toField",
          "dateOfTransaction",
          "createdAt"
        ];
        filename = "withdrawals";
        break;
      }

      case "logs": {
        data = await prisma.userLog.findMany({
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true
              }
            }
          },
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "walletAddress",
          "username",
          "action",
          "details",
          "ipAddress",
          "userAgent",
          "timestamp"
        ];
        filename = "logs";
        break;
      }

      case "eqLevels": {
        data = await prisma.eqLevelsStamina.findMany({
          where: filters
        });
        headers = [
          "id",
          "minEq",
          "maxEq",
          "levelValue",
          "description",
          "creationDate"
        ];
        filename = "eq_levels";
        break;
      }

      case "all": {
        // Generate multiple files
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const results = [];

        for (const type of [
          "users",
          "tournaments",
          "transactions",
          "notifications",
          "withdrawals",
          "logs",
          "eqLevels"
        ]) {
          const result = await csvGenerator.fetch("/generate", {
            body: JSON.stringify({
              dataType: type,
              dateRange,
              filters,
              format
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST"
          });

          const resultData = await result.json();
          if (resultData.success) {
            results.push({
              data: resultData.data,
              filename: `${type}_${timestamp}.${format}`,
              type
            });
          }
        }

        return c.json({
          message: "Multiple CSV files generated",
          results,
          success: true
        });
      }
    }

    // Generate CSV content
    const csvContent = generateCSV(data, headers);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const finalFilename = `${filename}_${timestamp}.${format}`;

    c.header("Content-Type", "text/csv");
    c.header("Content-Disposition", `attachment; filename="${finalFilename}"`);
    return c.text(csvContent);
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /download/:filename - Download generated CSV file
csvGenerator.get("/download/:filename", authMiddleware, async (c) => {
  try {
    // In a real implementation, you would read from a file storage
    // For now, we'll return an error
    return c.json(
      {
        error: "File not found. Please generate a new CSV file.",
        success: false
      },
      404
    );
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /templates - Get available CSV templates
csvGenerator.get("/templates", authMiddleware, async (c) => {
  try {
    const templates = [
      {
        description: "Export all user data",
        fields: [
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
        ],
        name: "users"
      },
      {
        description: "Export tournament data",
        fields: [
          "id",
          "name",
          "type",
          "status",
          "prizePool",
          "coinsGathered",
          "participantCount",
          "startDate",
          "endDate",
          "createdAt"
        ],
        name: "tournaments"
      },
      {
        description: "Export coin transactions",
        fields: [
          "id",
          "walletAddress",
          "username",
          "coinType",
          "amount",
          "transactionType",
          "sourceType",
          "description",
          "createdAt"
        ],
        name: "transactions"
      },
      {
        description: "Export notification data",
        fields: [
          "id",
          "title",
          "description",
          "priority",
          "type",
          "isAll",
          "recipientCount",
          "seenCount",
          "createdAt"
        ],
        name: "notifications"
      },
      {
        description: "Export withdrawal transactions",
        fields: [
          "id",
          "walletAddress",
          "username",
          "userTx",
          "amount",
          "fromField",
          "toField",
          "dateOfTransaction",
          "createdAt"
        ],
        name: "withdrawals"
      },
      {
        description: "Export user logs",
        fields: [
          "id",
          "walletAddress",
          "username",
          "action",
          "details",
          "ipAddress",
          "userAgent",
          "timestamp"
        ],
        name: "logs"
      },
      {
        description: "Export EQ levels",
        fields: [
          "id",
          "minEq",
          "maxEq",
          "levelValue",
          "description",
          "creationDate"
        ],
        name: "eqLevels"
      }
    ];

    return c.json({
      success: true,
      templates
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /preview - Preview CSV data without downloading
csvGenerator.post("/preview", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const {
      dataType,
      filters,
      dateRange,
      limit = 10
    } = z
      .object({
        dataType: z.enum([
          "users",
          "tournaments",
          "transactions",
          "notifications",
          "withdrawals",
          "logs",
          "eqLevels"
        ]),
        dateRange: z
          .object({
            endDate: z.string().datetime().optional(),
            startDate: z.string().datetime().optional()
          })
          .optional(),
        filters: z.record(z.any()).optional(),
        limit: z.number().int().positive().default(10)
      })
      .parse(body);

    let data: any[] = [];
    let headers: string[] = [];

    // Build date filter
    const dateFilter =
      dateRange?.startDate && dateRange?.endDate
        ? {
            createdAt: {
              gte: new Date(dateRange.startDate),
              lte: new Date(dateRange.endDate)
            }
          }
        : {};

    // Get limited data for preview
    switch (dataType) {
      case "users":
        data = await prisma.user.findMany({
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
          },
          take: limit,
          where: { ...dateFilter, ...filters }
        });
        headers = [
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
        break;

      case "tournaments":
        data = await prisma.tournament.findMany({
          take: limit,
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "name",
          "type",
          "status",
          "prizePool",
          "coinsGathered",
          "participantCount",
          "startDate",
          "endDate",
          "createdAt"
        ];
        break;

      case "transactions":
        data = await prisma.coinTransaction.findMany({
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true
              }
            }
          },
          take: limit,
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "walletAddress",
          "username",
          "coinType",
          "amount",
          "transactionType",
          "sourceType",
          "description",
          "createdAt"
        ];
        break;

      case "notifications":
        data = await prisma.notification.findMany({
          take: limit,
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "title",
          "description",
          "priority",
          "type",
          "isAll",
          "createdAt"
        ];
        break;

      case "withdrawals":
        data = await prisma.withdrawTransaction.findMany({
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true
              }
            }
          },
          take: limit,
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "walletAddress",
          "username",
          "userTx",
          "amount",
          "fromField",
          "toField",
          "dateOfTransaction",
          "createdAt"
        ];
        break;

      case "logs":
        data = await prisma.userLog.findMany({
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true
              }
            }
          },
          take: limit,
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "walletAddress",
          "username",
          "action",
          "details",
          "ipAddress",
          "userAgent",
          "timestamp"
        ];
        break;

      case "eqLevels":
        data = await prisma.eqLevelsStamina.findMany({
          take: limit,
          where: filters
        });
        headers = [
          "id",
          "minEq",
          "maxEq",
          "levelValue",
          "description",
          "creationDate"
        ];
        break;
    }

    // Get total count
    const totalCount = await prisma[dataType as keyof typeof prisma].count({
      where: { ...dateFilter, ...filters }
    });

    return c.json({
      preview: {
        data,
        hasMore: data.length < totalCount,
        headers,
        previewCount: data.length,
        totalCount
      },
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

export default csvGenerator;
