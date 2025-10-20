"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2_1 = __importDefault(require("argon2"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("crypto");
const hono_1 = require("hono");
const jose_1 = require("jose");
const zod_1 = require("zod");
const ApiError_1 = require("../errors/ApiError");
const handleApiError_1 = __importDefault(require("../utils/handleApiError"));
const prisma = new client_1.PrismaClient();
const adminPanel = new hono_1.Hono();
// Health check endpoint
adminPanel.get("/health", async (c) => {
    try {
        // Test database connection
        await prisma.$queryRaw `SELECT 1`;
        return c.json({
            database: "connected",
            service: "admin-panel-enhanced",
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "1.0.0"
        });
    }
    catch (error) {
        return c.json({
            database: "disconnected",
            error: error instanceof Error ? error.message : "Unknown error",
            service: "admin-panel-enhanced",
            status: "unhealthy",
            timestamp: new Date().toISOString()
        }, 503);
    }
});
// Validation schemas
const adminLoginSchema = zod_1.z.object({
    password: zod_1.z.string().min(1),
    username: zod_1.z.string().min(1)
});
const resetUserPasswordSchema = zod_1.z.object({
    adminToken: zod_1.z.string(),
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});
const deductUserCoinsSchema = zod_1.z.object({
    adminToken: zod_1.z.string(),
    amount: zod_1.z.number().int().positive(),
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});
const listUserWithdrawalsSchema = zod_1.z.object({
    includeAll: zod_1.z.boolean().default(false),
    limit: zod_1.z.number().int().positive().max(1000).default(100),
    maxTx: zod_1.z.number().int().optional(),
    maxUsdt: zod_1.z.number().optional(),
    minTx: zod_1.z.number().int().optional(),
    minUsdt: zod_1.z.number().optional(),
    page: zod_1.z.number().int().positive().default(1),
    sortBy: zod_1.z.enum(["amount", "tx"]).default("amount"),
    sortDir: zod_1.z.enum(["desc", "asc"]).default("desc"),
    wallet: zod_1.z.string().optional()
});
const purgeSystemSchema = zod_1.z.object({
    description: zod_1.z.string().optional()
});
const importWalletsSchema = zod_1.z.object({
    wallets: zod_1.z.array(zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/))
});
// Helper function to validate admin token
async function validateAdminToken(token) {
    // In a real implementation, you would validate the admin token
    // For now, we'll use a simple check
    return token.length > 0;
}
// POST /login - Admin login
adminPanel.post("/login", async (c) => {
    try {
        const body = await c.req.json();
        const { username, password } = adminLoginSchema.parse(body);
        // Find admin user
        const admin = await prisma.admin.findUnique({
            where: { email: username }
        });
        if (!admin) {
            throw new ApiError_1.ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
        }
        // Verify password (migrate from MD5 to bcrypt)
        let isValidPassword = false;
        console.log("Admin found:", {
            email: admin.email,
            id: admin.id,
            passwordHash: admin.password.substring(0, 20) + "..."
        });
        console.log("Password to verify:", password);
        if (admin.password.startsWith("$argon2")) {
            // Already argon2
            console.log("Using argon2 verification");
            isValidPassword = await argon2_1.default.verify(admin.password, password);
            console.log("Argon2 verification result:", isValidPassword);
        }
        else if (admin.password.startsWith("$2")) {
            // bcrypt (legacy)
            console.log("Using bcrypt verification");
            isValidPassword = await bcrypt_1.default.compare(password, admin.password);
            console.log("Bcrypt verification result:", isValidPassword);
            // Migrate to argon2
            if (isValidPassword) {
                console.log("Migrating to argon2");
                const argon2Hash = await argon2_1.default.hash(password);
                await prisma.admin.update({
                    data: { password: argon2Hash },
                    where: { id: admin.id }
                });
                console.log("Password migrated to argon2");
            }
        }
        else {
            // MD5 hash (legacy)
            console.log("Using MD5 verification");
            const md5Hash = (0, crypto_1.createHash)("md5").update(password).digest("hex");
            console.log("MD5 hash:", md5Hash);
            console.log("Stored hash:", admin.password);
            isValidPassword = admin.password === md5Hash;
            console.log("MD5 verification result:", isValidPassword);
            // Migrate to argon2
            if (isValidPassword) {
                console.log("Migrating to argon2");
                const argon2Hash = await argon2_1.default.hash(password);
                await prisma.admin.update({
                    data: { password: argon2Hash },
                    where: { id: admin.id }
                });
                console.log("Password migrated to argon2");
            }
        }
        console.log("Final password verification result:", isValidPassword);
        if (!isValidPassword) {
            throw new ApiError_1.ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
        }
        // Generate JWT token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-here");
        const adminToken = await new jose_1.SignJWT({
            adminId: admin.id,
            email: admin.email,
            type: "admin"
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(secret);
        return c.json({
            admin: {
                email: admin.email,
                id: admin.id
            },
            success: true,
            token: adminToken
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /reset-user-password - Reset user password
adminPanel.post("/reset-user-password", async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress } = resetUserPasswordSchema.parse(body);
        // Get admin from context (set by authContext middleware)
        const adminId = c.get("adminId");
        if (!adminId) {
            throw new ApiError_1.ApiError("Admin authentication required", 401);
        }
        // Find user
        const user = await prisma.user.findUnique({
            where: { walletAddress }
        });
        if (!user) {
            throw new ApiError_1.ApiError("User not found", 404);
        }
        // Reset password to null (first-time setup)
        await prisma.user.update({
            data: { password: null },
            where: { walletAddress }
        });
        return c.json({
            hasPass: false,
            message: "User password reset successfully",
            success: true,
            walletAddress
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /deduct-user-coins - Deduct coins from user
adminPanel.post("/deduct-user-coins", async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress, amount } = deductUserCoinsSchema.parse(body);
        // Get admin from context (set by authContext middleware)
        const adminId = c.get("adminId");
        if (!adminId) {
            throw new ApiError_1.ApiError("Admin authentication required", 401);
        }
        // Use transaction for data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Get user with coin balance
            const user = await tx.user.findUnique({
                include: { userCoinBalance: true },
                where: { walletAddress }
            });
            if (!user) {
                throw new ApiError_1.ApiError("User not found", 404);
            }
            if (!user.userCoinBalance || user.userCoinBalance.totalCoins < amount) {
                throw new ApiError_1.ApiError("Insufficient coins", 400);
            }
            // Deduct coins
            const newBalance = user.userCoinBalance.totalCoins - amount;
            await tx.userCoinBalance.update({
                data: { totalCoins: newBalance },
                where: { walletAddress }
            });
            // Create transaction record
            await tx.coinTransaction.create({
                data: {
                    amount,
                    balanceAfter: newBalance,
                    balanceBefore: user.userCoinBalance.totalCoins,
                    coinType: "Experience",
                    description: `Admin deducted ${amount} coins`,
                    sourceType: "Admin",
                    transactionType: "AdminAdjustment",
                    walletAddress
                }
            });
            return {
                amountDeducted: amount,
                newBalance
            };
        });
        return c.json({
            amountDeducted: result.amountDeducted,
            coins: result.newBalance,
            message: "Coins deducted successfully",
            success: true,
            walletAddress
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /list-user-withdrawals - List user withdrawals
adminPanel.get("/list-user-withdrawals", async (c) => {
    try {
        const query = c.req.query();
        const { wallet, minUsdt, maxUsdt, minTx, maxTx, includeAll, sortBy, sortDir, page, limit } = listUserWithdrawalsSchema.parse(query);
        const skip = (page - 1) * limit;
        // Build where clause
        const where = {};
        if (wallet) {
            where.walletAddress = wallet;
        }
        if (minUsdt !== undefined || maxUsdt !== undefined) {
            where.amount = {};
            if (minUsdt !== undefined) {
                where.amount.gte = minUsdt * 1000000; // Convert to micro-units
            }
            if (maxUsdt !== undefined) {
                where.amount.lte = maxUsdt * 1000000;
            }
        }
        // Get withdrawals with aggregation
        const withdrawals = await prisma.withdrawTransaction.findMany({
            orderBy: sortBy === "amount"
                ? { amount: sortDir }
                : { dateOfTransaction: sortDir },
            skip,
            take: limit,
            where
        });
        // Aggregate by wallet address
        const aggregated = withdrawals.reduce((acc, withdrawal) => {
            const walletAddress = withdrawal.walletAddress;
            if (!acc[walletAddress]) {
                acc[walletAddress] = {
                    totalWithdrawUsd: 0,
                    totalWithdrawUsdt: 0,
                    txCount: 0,
                    txUnique: new Set(),
                    walletAddress
                };
            }
            const amountUsdt = Number(withdrawal.amount) / 1000000; // Convert from micro-units
            acc[walletAddress].totalWithdrawUsdt += amountUsdt;
            acc[walletAddress].totalWithdrawUsd += amountUsdt; // Assuming 1:1 USDT/USD
            acc[walletAddress].txCount++;
            acc[walletAddress].txUnique.add(withdrawal.userTx);
        }, {});
        // Convert to array and add txUnique count
        const result = Object.values(aggregated).map((item) => ({
            ...item,
            txUnique: item.txUnique.size
        }));
        // Get total count
        const total = Object.keys(aggregated).length;
        return c.json({
            limit,
            page,
            success: true,
            totalPages: Math.ceil(total / limit),
            totalUsers: total,
            users: result
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /list-user-withdrawals-csv - Export user withdrawals as CSV
adminPanel.get("/list-user-withdrawals-csv", async (c) => {
    try {
        const query = c.req.query();
        const { wallet, minUsdt, maxUsdt, minTx, maxTx, includeAll, sortBy, sortDir, limit } = listUserWithdrawalsSchema.parse({ ...query, limit: 1000, page: 1 });
        // Build where clause (same as above)
        const where = {};
        if (wallet) {
            where.walletAddress = wallet;
        }
        if (minUsdt !== undefined || maxUsdt !== undefined) {
            where.amount = {};
            if (minUsdt !== undefined) {
                where.amount.gte = minUsdt * 1000000;
            }
            if (maxUsdt !== undefined) {
                where.amount.lte = maxUsdt * 1000000;
            }
        }
        const withdrawals = await prisma.withdrawTransaction.findMany({
            orderBy: sortBy === "amount"
                ? { amount: sortDir }
                : { dateOfTransaction: sortDir },
            take: limit,
            where
        });
        // Aggregate (same as above)
        const aggregated = withdrawals.reduce((acc, withdrawal) => {
            const walletAddress = withdrawal.walletAddress;
            if (!acc[walletAddress]) {
                acc[walletAddress] = {
                    totalWithdrawUsd: 0,
                    totalWithdrawUsdt: 0,
                    txCount: 0,
                    txUnique: new Set(),
                    walletAddress
                };
            }
            const amountUsdt = Number(withdrawal.amount) / 1000000;
            acc[walletAddress].totalWithdrawUsdt += amountUsdt;
            acc[walletAddress].totalWithdrawUsd += amountUsdt;
            acc[walletAddress].txCount++;
            acc[walletAddress].txUnique.add(withdrawal.userTx);
        }, {});
        const result = Object.values(aggregated).map((item) => ({
            ...item,
            txUnique: item.txUnique.size
        }));
        // Generate CSV
        const csvHeader = "walletaddress,total_withdraw_usdt,total_withdraw_usd,tx_count,tx_unique\n";
        const csvRows = result
            .map((item) => `${item.walletAddress},${item.totalWithdrawUsdt},${item.totalWithdrawUsd},${item.txCount},${item.txUnique}`)
            .join("\n");
        const csv = csvHeader + csvRows;
        // Set headers for CSV download
        c.header("Content-Type", "text/csv");
        c.header("Content-Disposition", 'attachment; filename="user_withdrawals.csv"');
        return c.text(csv);
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /withdraw-category-summary - Get withdrawal category summary
adminPanel.get("/withdraw-category-summary", async (c) => {
    try {
        const [fromFieldSummary, toFieldSummary] = await Promise.all([
            prisma.withdrawTransaction.groupBy({
                _count: { fromField: true },
                _sum: { amount: true },
                by: ["fromField"]
            }),
            prisma.withdrawTransaction.groupBy({
                _count: { toField: true },
                _sum: { amount: true },
                by: ["toField"]
            })
        ]);
        const fromField = fromFieldSummary.map((item) => ({
            totalUsdt: Number(item._sum.amount || 0) / 1000000,
            txCount: item._count.fromField,
            value: item.fromField
        }));
        const toField = toFieldSummary.map((item) => ({
            totalUsdt: Number(item._sum.amount || 0) / 1000000,
            txCount: item._count.toField,
            value: item.toField
        }));
        return c.json({
            fromField,
            success: true,
            toField
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /purge - Purge all user coins
adminPanel.post("/purge", async (c) => {
    try {
        const body = await c.req.json();
        const { description } = purgeSystemSchema.parse(body);
        // Use transaction for data consistency
        await prisma.$transaction(async (tx) => {
            // Reset all user coins
            await tx.userCoinBalance.updateMany({
                data: {
                    achievementCoins: 0,
                    experienceCoins: 0,
                    premiumCoins: 0,
                    socialCoins: 0,
                    totalCoins: 0
                }
            });
            // Reset daily points
            await tx.user.updateMany({
                data: { todaysPoints: 0 }
            });
            // Create system notification
            await tx.notification.create({
                data: {
                    description: description ||
                        "All coins have been reset as part of system maintenance.",
                    isAll: true,
                    priority: "High",
                    title: "System Maintenance",
                    type: "System"
                }
            });
        });
        return c.json({
            message: "Purge process completed and notification sent",
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /reset-todays-points - Reset today's points
adminPanel.post("/reset-todays-points", async (c) => {
    try {
        await prisma.user.updateMany({
            data: { todaysPoints: 0 }
        });
        return c.json({
            message: "Today's points reset successfully",
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /import-wallets - Import wallets
adminPanel.post("/import-wallets", async (c) => {
    try {
        const body = await c.req.json();
        const { wallets } = importWalletsSchema.parse(body);
        const results = [];
        const errors = [];
        for (const walletAddress of wallets) {
            try {
                // Check if user already exists
                const existingUser = await prisma.user.findUnique({
                    where: { walletAddress }
                });
                if (existingUser) {
                    results.push({
                        status: "exists",
                        username: existingUser.username,
                        walletAddress
                    });
                    continue;
                }
                // Generate username and email
                const username = `user_${walletAddress.slice(-8)}`;
                const email = `user_${walletAddress.slice(-8)}@example.com`;
                const token = (0, crypto_1.createHash)("sha256")
                    .update(walletAddress.slice(-15))
                    .digest("hex");
                // Create user
                const user = await prisma.user.create({
                    data: {
                        email,
                        rolePermission: "Premium",
                        status: "Premium",
                        token,
                        username,
                        walletAddress
                    }
                });
                results.push({
                    status: "created",
                    token: user.token,
                    username: user.username,
                    walletAddress
                });
            }
            catch (error) {
                errors.push({
                    error: error instanceof Error ? error.message : "Unknown error",
                    walletAddress
                });
            }
        }
        return c.json({
            errors,
            message: `Processed ${wallets.length} wallets`,
            results,
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /user-stats - Get user statistics
adminPanel.get("/user-stats", async (c) => {
    try {
        const [totalUsers, premiumUsers, bannedUsers, totalCoins, totalWithdrawals] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: "Premium" } }),
            prisma.user.count({ where: { banned: true } }),
            prisma.userCoinBalance.aggregate({
                _sum: { totalCoins: true }
            }),
            prisma.withdrawTransaction.aggregate({
                _sum: { amount: true }
            })
        ]);
        return c.json({
            stats: {
                bannedUsers,
                premiumUsers,
                totalCoins: totalCoins._sum.totalCoins || 0,
                totalUsers,
                totalWithdrawals: Number(totalWithdrawals._sum.amount || 0) / 1000000
            },
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /recent-users - Get recent users
adminPanel.get("/recent-users", async (c) => {
    try {
        const limit = Number.parseInt(c.req.query("limit") || "50");
        const since = c.req.query("since");
        const where = {};
        if (since) {
            where.createdAt = { gte: new Date(since) };
        }
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                banned: true,
                createdAt: true,
                email: true,
                status: true,
                userCoinBalance: {
                    select: { totalCoins: true }
                },
                username: true,
                walletAddress: true
            },
            take: limit,
            where
        });
        return c.json({
            success: true,
            users
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
exports.default = adminPanel;
