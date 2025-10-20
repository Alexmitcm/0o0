import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import authMiddleware from "../middlewares/authMiddleware";
import { errorHandler } from "../middlewares/errorHandler";
import rateLimiter from "../middlewares/rateLimiter";

const prisma = new PrismaClient();
const transactionSystemRouter = new Hono();

// Validation schemas
const createWithdrawSchema = z.object({
  amount: z.number().positive(),
  from: z.string().min(1),
  to: z.string().min(1),
  userTx: z.string().min(1),
  walletAddress: z.string().min(42).max(42)
});

const getTransactionsSchema = z.object({
  amount: z.number().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  userTx: z.string().optional(),
  walletAddress: z.string().min(42).max(42).optional()
});

// POST /transaction-system/withdraw - Create withdraw transaction (equivalent to saveWithdraw.php)
transactionSystemRouter.post(
  "/withdraw",
  authMiddleware,
  rateLimiter({ max: 5, windowMs: 60000 }), // 5 requests per minute
  zValidator("json", createWithdrawSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const { walletAddress, userTx, amount, from, to } = data;
      const authWalletAddress = c.get("walletAddress");

      // Check if user is creating withdraw for themselves
      if (walletAddress !== authWalletAddress) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      // Check if user has sufficient coins
      const userBalance = await prisma.userCoinBalance.findUnique({
        where: { walletAddress }
      });

      if (!userBalance || userBalance.totalCoins < amount) {
        return c.json({ error: "Insufficient coins" }, 400);
      }

      // Check withdrawal limits (you can implement this based on your business logic)
      const totalWithdrawals = await prisma.coinTransaction.aggregate({
        _sum: {
          amount: true
        },
        where: {
          sourceType: "Withdrawal",
          transactionType: "Spent",
          walletAddress
        }
      });

      const totalWithdrawn = Math.abs(totalWithdrawals._sum.amount || 0);
      const maxWithdrawalLimit = 300000000; // 300M coins limit

      if (totalWithdrawn + amount > maxWithdrawalLimit) {
        return c.json(
          {
            currentWithdrawn: totalWithdrawn,
            error: "Withdrawal limit exceeded",
            maxLimit: maxWithdrawalLimit,
            remainingLimit: maxWithdrawalLimit - totalWithdrawn
          },
          400
        );
      }

      // Create withdraw transaction
      const withdrawTransaction = await prisma.coinTransaction.create({
        data: {
          amount: -amount,
          balanceAfter: userBalance.totalCoins - amount,
          balanceBefore: userBalance.totalCoins,
          coinType: "Experience", // Default coin type for withdrawals
          description: `Withdrawal of ${amount} coins`,
          sourceId: userTx,
          sourceMetadata: {
            from,
            to,
            userTx,
            withdrawalType: "manual"
          },
          sourceType: "Withdrawal",
          transactionType: "Spent",
          walletAddress
        }
      });

      // Update user balance
      await prisma.userCoinBalance.update({
        data: {
          lastUpdatedAt: new Date(),
          totalCoins: { decrement: amount }
        },
        where: { walletAddress }
      });

      return c.json(
        {
          message: "Withdrawal transaction created successfully",
          success: true,
          transaction: {
            amount: withdrawTransaction.amount,
            balanceAfter: withdrawTransaction.balanceAfter,
            balanceBefore: withdrawTransaction.balanceBefore,
            createdAt: withdrawTransaction.createdAt,
            from,
            id: withdrawTransaction.id,
            to,
            userTx: withdrawTransaction.sourceId,
            walletAddress: withdrawTransaction.walletAddress
          }
        },
        201
      );
    } catch (error) {
      logger.error("Error creating withdraw transaction:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /transaction-system - Get transactions (equivalent to retrieveTransactions.php)
transactionSystemRouter.get(
  "/",
  rateLimiter({ max: 30, windowMs: 60000 }),
  zValidator("query", getTransactionsSchema),
  async (c) => {
    try {
      const query = c.req.valid("query");
      const page = Number.parseInt(c.req.query("page") || "1");
      const limit = Number.parseInt(c.req.query("limit") || "20");
      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      if (query.walletAddress) where.walletAddress = query.walletAddress;
      if (query.userTx) where.sourceId = query.userTx;
      if (query.amount) where.amount = query.amount;
      if (query.from)
        where.sourceMetadata = { equals: query.from, path: ["from"] };
      if (query.to) where.sourceMetadata = { equals: query.to, path: ["to"] };

      const [transactions, total] = await Promise.all([
        prisma.coinTransaction.findMany({
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
          where
        }),
        prisma.coinTransaction.count({ where })
      ]);

      return c.json({
        pagination: {
          limit,
          page,
          total,
          totalPages: Math.ceil(total / limit)
        },
        success: true,
        transactions: transactions.map((transaction) => ({
          amount: transaction.amount,
          balanceAfter: transaction.balanceAfter,
          balanceBefore: transaction.balanceBefore,
          coinType: transaction.coinType,
          createdAt: transaction.createdAt,
          description: transaction.description,
          id: transaction.id,
          sourceId: transaction.sourceId,
          sourceMetadata: transaction.sourceMetadata,
          sourceType: transaction.sourceType,
          transactionType: transaction.transactionType,
          walletAddress: transaction.walletAddress
        }))
      });
    } catch (error) {
      logger.error("Error getting transactions:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /transaction-system/:walletAddress - Get user transactions
transactionSystemRouter.get(
  "/:walletAddress",
  rateLimiter({ max: 30, windowMs: 60000 }),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");
      const page = Number.parseInt(c.req.query("page") || "1");
      const limit = Number.parseInt(c.req.query("limit") || "20");
      const transactionType = c.req.query("transactionType");
      const coinType = c.req.query("coinType");
      const offset = (page - 1) * limit;

      const where: any = { walletAddress };
      if (transactionType) where.transactionType = transactionType;
      if (coinType) where.coinType = coinType;

      const [transactions, total] = await Promise.all([
        prisma.coinTransaction.findMany({
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
          where
        }),
        prisma.coinTransaction.count({ where })
      ]);

      return c.json({
        pagination: {
          limit,
          page,
          total,
          totalPages: Math.ceil(total / limit)
        },
        success: true,
        transactions: transactions.map((transaction) => ({
          amount: transaction.amount,
          balanceAfter: transaction.balanceAfter,
          balanceBefore: transaction.balanceBefore,
          coinType: transaction.coinType,
          createdAt: transaction.createdAt,
          description: transaction.description,
          id: transaction.id,
          sourceId: transaction.sourceId,
          sourceMetadata: transaction.sourceMetadata,
          sourceType: transaction.sourceType,
          transactionType: transaction.transactionType
        }))
      });
    } catch (error) {
      logger.error("Error getting user transactions:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /transaction-system/stats/:walletAddress - Get transaction statistics
transactionSystemRouter.get(
  "/stats/:walletAddress",
  rateLimiter({ max: 30, windowMs: 60000 }),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");

      const [
        totalTransactions,
        totalEarned,
        totalSpent,
        byType,
        byCoinType,
        recentActivity
      ] = await Promise.all([
        prisma.coinTransaction.count({
          where: { walletAddress }
        }),
        prisma.coinTransaction.aggregate({
          _sum: { amount: true },
          where: {
            transactionType: "Earned",
            walletAddress
          }
        }),
        prisma.coinTransaction.aggregate({
          _sum: { amount: true },
          where: {
            transactionType: "Spent",
            walletAddress
          }
        }),
        prisma.coinTransaction.groupBy({
          _count: { transactionType: true },
          _sum: { amount: true },
          by: ["transactionType"],
          where: { walletAddress }
        }),
        prisma.coinTransaction.groupBy({
          _count: { coinType: true },
          _sum: { amount: true },
          by: ["coinType"],
          where: { walletAddress }
        }),
        prisma.coinTransaction.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            amount: true,
            coinType: true,
            createdAt: true,
            description: true,
            id: true,
            transactionType: true
          },
          take: 5,
          where: { walletAddress }
        })
      ]);

      return c.json({
        stats: {
          byCoinType: byCoinType.reduce(
            (acc, item) => {
              acc[item.coinType] = {
                count: item._count.coinType,
                totalAmount: item._sum.amount || 0
              };
              return acc;
            },
            {} as Record<string, { count: number; totalAmount: number }>
          ),
          byType: byType.reduce(
            (acc, item) => {
              acc[item.transactionType] = {
                count: item._count.transactionType,
                totalAmount: item._sum.amount || 0
              };
              return acc;
            },
            {} as Record<string, { count: number; totalAmount: number }>
          ),
          netEarnings:
            (totalEarned._sum.amount || 0) -
            Math.abs(totalSpent._sum.amount || 0),
          recentActivity,
          totalEarned: totalEarned._sum.amount || 0,
          totalSpent: Math.abs(totalSpent._sum.amount || 0),
          totalTransactions
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting transaction stats:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default transactionSystemRouter;
