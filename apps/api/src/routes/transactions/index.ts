import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "../../middlewares/errorHandler";
import rateLimiter from "../../middlewares/rateLimiter";
import prisma from "../../prisma/client";

const transactionsRouter = new Hono();

// Validation schemas
const getTransactionsSchema = z.object({
  address: z.string().optional(),
  blockHash: z.string().optional(),
  blockNumber: z.string().optional(),
  confirmations: z.string().optional(),
  contractAddress: z.string().optional(),
  cumulativeGasUsed: z.string().optional(),
  gas: z.string().optional(),
  gasPrice: z.string().optional(),
  gasUsed: z.string().optional(),
  hash: z.string().optional(),
  input: z.string().optional(),
  limit: z.string().optional(),
  nonce: z.string().optional(),
  page: z.string().optional(),
  recipient: z.string().optional(),
  sender: z.string().optional(),
  timeStamp: z.string().optional(),
  tokenDecimal: z.string().optional(),
  tokenName: z.string().optional(),
  tokenSymbol: z.string().optional(),
  transactionIndex: z.string().optional(),
  value: z.string().optional()
});

const saveTransactionSchema = z.object({
  amount: z.number().positive(),
  coinType: z.enum(["Experience", "Achievement", "Social", "Premium"]),
  metadata: z.record(z.any()).optional(),
  reason: z.string().optional(),
  transactionHash: z.string().min(1),
  walletAddress: z.string().min(42).max(42)
});

const saveWithdrawSchema = z.object({
  amount: z.number().positive(),
  coinType: z.enum(["Experience", "Achievement", "Social", "Premium"]),
  reason: z.string().optional(),
  walletAddress: z.string().min(42).max(42),
  withdrawAddress: z.string().min(1)
});

// GET /transactions - Get all transactions (equivalent to Transactions/ShowAll.php)
transactionsRouter.get(
  "/",
  rateLimiter({ max: 30, windowMs: 60000 }),
  zValidator("query", getTransactionsSchema),
  async (c) => {
    try {
      const query = c.req.valid("query");
      const page = Number.parseInt(query.page || "1");
      const limit = Number.parseInt(query.limit || "10");
      const offset = (page - 1) * limit;

      // Build where conditions
      const where: any = {};

      if (query.address) {
        where.OR = [
          { fromAddress: query.address },
          { toAddress: query.address }
        ];
      }

      if (query.blockNumber)
        where.blockNumber = Number.parseInt(query.blockNumber);
      if (query.txHash) where.txHash = query.txHash;
      if (query.fromAddress) where.fromAddress = query.fromAddress;
      if (query.toAddress) where.toAddress = query.toAddress;
      if (query.tokenAddress) where.tokenAddress = query.tokenAddress;
      if (query.transactionIndex)
        where.transactionIndex = Number.parseInt(query.transactionIndex);
      if (query.gasPrice) where.gasPrice = Number.parseFloat(query.gasPrice);
      if (query.gasUsed) where.gasUsed = Number.parseFloat(query.gasUsed);

      // Get total count
      const total = await prisma.tokenTx.count({ where });

      // Get transactions
      const transactions = await prisma.tokenTx.findMany({
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        where
      });

      return c.json({
        data: transactions,
        limit,
        page,
        total_pages: Math.ceil(total / limit)
      });
    } catch (error) {
      logger.error("Error getting transactions:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /transactions/contract - Get contract transactions (equivalent to Transactions/ContractTransactions.php)
transactionsRouter.get(
  "/contract",
  rateLimiter({ max: 30, windowMs: 60000 }),
  async (c) => {
    try {
      const page = Number.parseInt(c.req.query("page") || "1");
      const limit = Number.parseInt(c.req.query("limit") || "10");
      const contractAddress = c.req.query("contractAddress");
      const offset = (page - 1) * limit;

      const where: any = {};
      if (contractAddress) {
        where.contractAddress = contractAddress;
      }

      const [transactions, total] = await Promise.all([
        prisma.tokenTx.findMany({
          orderBy: { timeStamp: "desc" },
          skip: offset,
          take: limit,
          where
        }),
        prisma.tokenTx.count({ where })
      ]);

      return c.json({
        data: transactions,
        limit,
        page,
        total_pages: Math.ceil(total / limit)
      });
    } catch (error) {
      logger.error("Error getting contract transactions:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /transactions/save - Save a transaction
transactionsRouter.post(
  "/save",
  rateLimiter({ max: 20, windowMs: 60000 }),
  zValidator("json", saveTransactionSchema),
  async (c) => {
    try {
      const {
        walletAddress,
        transactionHash,
        amount,
        coinType,
        reason,
        metadata
      } = c.req.valid("json");

      // Save transaction
      const transaction = await prisma.userTransaction.create({
        data: {
          amount,
          coinType,
          metadata: metadata || {},
          reason: reason || "User transaction",
          timestamp: new Date(),
          transactionHash,
          walletAddress
        }
      });

      return c.json({
        data: transaction,
        success: true
      });
    } catch (error) {
      logger.error("Error saving transaction:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /transactions/save-withdraw - Save a withdrawal transaction (equivalent to saveWithdraw.php)
transactionsRouter.post(
  "/save-withdraw",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator("json", saveWithdrawSchema),
  async (c) => {
    try {
      const { walletAddress, amount, withdrawAddress, coinType, reason } =
        c.req.valid("json");

      // Check if user has enough balance
      const userBalance = await prisma.userCoinBalance.findUnique({
        where: { walletAddress }
      });

      if (!userBalance) {
        return c.json({ error: "User not found" }, 404);
      }

      const currentBalance =
        (userBalance[
          `${coinType.toLowerCase()}Coins` as keyof typeof userBalance
        ] as number) || 0;

      if (currentBalance < amount) {
        return c.json({ error: "Insufficient balance" }, 400);
      }

      // Create withdrawal transaction
      const withdrawTransaction = await prisma.withdrawTransaction.create({
        data: {
          amount,
          coinType,
          reason: reason || "Withdrawal",
          status: "pending",
          timestamp: new Date(),
          walletAddress,
          withdrawAddress
        }
      });

      // Update user balance
      await prisma.userCoinBalance.update({
        data: {
          [`${coinType.toLowerCase()}Coins`]: { decrement: amount },
          totalCoins: { decrement: amount }
        },
        where: { walletAddress }
      });

      return c.json({
        data: withdrawTransaction,
        success: true
      });
    } catch (error) {
      logger.error("Error saving withdrawal:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /transactions/retrieve - Retrieve transactions for a user
transactionsRouter.get(
  "/retrieve/:walletAddress",
  rateLimiter({ max: 30, windowMs: 60000 }),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");
      const page = Number.parseInt(c.req.query("page") || "1");
      const limit = Number.parseInt(c.req.query("limit") || "20");
      const offset = (page - 1) * limit;

      const [userTransactions, total] = await Promise.all([
        prisma.userTransaction.findMany({
          orderBy: { timestamp: "desc" },
          skip: offset,
          take: limit,
          where: { walletAddress }
        }),
        prisma.userTransaction.count({
          where: { walletAddress }
        })
      ]);

      return c.json({
        data: userTransactions,
        pagination: {
          limit,
          page,
          total,
          totalPages: Math.ceil(total / limit)
        },
        success: true
      });
    } catch (error) {
      logger.error("Error retrieving transactions:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default transactionsRouter;
