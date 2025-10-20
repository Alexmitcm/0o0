"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const hono_1 = require("hono");
const zod_1 = require("zod");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const handleApiError_1 = __importDefault(require("../utils/handleApiError"));
const prisma = new client_1.PrismaClient();
const eqLevelsSystem = new hono_1.Hono();
// Validation schemas
const addLevelSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    levelValue: zod_1.z.number().int().min(0),
    maxEq: zod_1.z.number().int().min(0),
    minEq: zod_1.z.number().int().min(0)
});
const updateLevelSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    id: zod_1.z.string(),
    levelValue: zod_1.z.number().int().min(0).optional(),
    maxEq: zod_1.z.number().int().min(0).optional(),
    minEq: zod_1.z.number().int().min(0).optional()
});
// GET /levels - Get all EQ levels
eqLevelsSystem.get("/levels", authMiddleware_1.default, async (c) => {
    try {
        const levels = await prisma.eqLevelsStamina.findMany({
            orderBy: { minEq: "asc" }
        });
        return c.json({
            levels,
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /levels - Add new EQ level
eqLevelsSystem.post("/levels", authMiddleware_1.default, async (c) => {
    try {
        const body = await c.req.json();
        const { minEq, maxEq, levelValue, description } = addLevelSchema.parse(body);
        // Check for overlapping ranges
        const existingLevel = await prisma.eqLevelsStamina.findFirst({
            where: {
                OR: [
                    {
                        AND: [{ minEq: { lte: minEq } }, { maxEq: { gte: minEq } }]
                    },
                    {
                        AND: [{ minEq: { lte: maxEq } }, { maxEq: { gte: maxEq } }]
                    },
                    {
                        AND: [{ minEq: { gte: minEq } }, { maxEq: { lte: maxEq } }]
                    }
                ]
            }
        });
        if (existingLevel) {
            return c.json({
                error: "EQ range overlaps with existing level",
                success: false
            }, 400);
        }
        const newLevel = await prisma.eqLevelsStamina.create({
            data: {
                description,
                levelValue,
                maxEq,
                minEq
            }
        });
        return c.json({
            level: newLevel,
            message: "EQ level created successfully",
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// PUT /levels/:id - Update EQ level
eqLevelsSystem.put("/levels/:id", authMiddleware_1.default, async (c) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();
        const updateData = updateLevelSchema.parse({ id, ...body });
        const updatedLevel = await prisma.eqLevelsStamina.update({
            data: {
                description: updateData.description,
                levelValue: updateData.levelValue,
                maxEq: updateData.maxEq,
                minEq: updateData.minEq
            },
            where: { id }
        });
        return c.json({
            level: updatedLevel,
            message: "EQ level updated successfully",
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// DELETE /levels/:id - Delete EQ level
eqLevelsSystem.delete("/levels/:id", authMiddleware_1.default, async (c) => {
    try {
        const id = c.req.param("id");
        await prisma.eqLevelsStamina.delete({
            where: { id }
        });
        return c.json({
            message: "EQ level deleted successfully",
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /levels/csv - Export EQ levels as CSV
eqLevelsSystem.get("/levels/csv", authMiddleware_1.default, async (c) => {
    try {
        const levels = await prisma.eqLevelsStamina.findMany({
            orderBy: { minEq: "asc" }
        });
        const csvHeaders = [
            "id",
            "minEq",
            "maxEq",
            "levelValue",
            "description",
            "creationDate"
        ];
        const csvRows = levels.map((level) => [
            level.id,
            level.minEq,
            level.maxEq,
            level.levelValue,
            level.description || "",
            level.creationDate.toISOString()
        ]);
        const csv = [
            csvHeaders.join(","),
            ...csvRows.map((row) => row.join(","))
        ].join("\n");
        c.header("Content-Type", "text/csv");
        c.header("Content-Disposition", "attachment; filename=eq_levels.csv");
        return c.text(csv);
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /levels/count - Count EQ levels
eqLevelsSystem.get("/levels/count", authMiddleware_1.default, async (c) => {
    try {
        const count = await prisma.eqLevelsStamina.count();
        return c.json({
            count,
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /levels/check/:walletAddress - Check user's EQ level
eqLevelsSystem.get("/levels/check/:walletAddress", async (c) => {
    try {
        const walletAddress = c.req.param("walletAddress");
        const user = await prisma.user.findUnique({
            select: { totalEq: true },
            where: { walletAddress }
        });
        if (!user) {
            return c.json({
                error: "User not found",
                success: false
            }, 404);
        }
        const level = await prisma.eqLevelsStamina.findFirst({
            where: {
                maxEq: { gte: user.totalEq },
                minEq: { lte: user.totalEq }
            }
        });
        return c.json({
            level: level || null,
            message: level
                ? `User is at level ${level.levelValue}`
                : "No level found for user's EQ",
            success: true,
            userEq: user.totalEq
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /levels/stats - Get EQ levels statistics
eqLevelsSystem.get("/levels/stats", authMiddleware_1.default, async (c) => {
    try {
        const [totalLevels, totalUsers, usersByLevel] = await Promise.all([
            prisma.eqLevelsStamina.count(),
            prisma.user.count(),
            prisma.eqLevelsStamina.findMany({
                include: {
                    _count: {
                        select: {
                            users: {
                                where: {
                                    totalEq: {
                                        gte: prisma.eqLevelsStamina.fields.minEq,
                                        lte: prisma.eqLevelsStamina.fields.maxEq
                                    }
                                }
                            }
                        }
                    }
                }
            })
        ]);
        const levelStats = usersByLevel.map((level) => ({
            id: level.id,
            levelValue: level.levelValue,
            maxEq: level.maxEq,
            minEq: level.minEq,
            userCount: level._count.users
        }));
        return c.json({
            stats: {
                levelStats,
                totalLevels,
                totalUsers
            },
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
exports.default = eqLevelsSystem;
