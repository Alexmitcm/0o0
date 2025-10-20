import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import { ApiError } from "../errors/ApiError";
import authMiddleware from "../middlewares/authMiddleware";
import handleApiError from "../utils/handleApiError";

const prisma = new PrismaClient();
const blockchainIntegration = new Hono();

// Validation schemas
const syncTransactionsSchema = z.object({
  chainId: z.number().int().positive().default(42161), // Arbitrum
  tokenAddress: z.string().optional(),
  walletAddresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/))
});

const getTransactionHistorySchema = z.object({
  fromBlock: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).default(20),
  page: z.number().int().positive().default(1),
  toBlock: z.number().int().positive().optional(),
  tokenAddress: z.string().optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

// Mock Arbiscan API integration (replace with real implementation)
class ArbiscanService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey =
      process.env.ARBISCAN_API_KEY || "68VNDTYKGYFHYACCY35W4XSWS8F729ZI41";
    this.baseUrl = "https://api.arbiscan.io/api";
  }

  async getTokenTransfers(params: {
    address: string;
    contractAddress?: string;
    startBlock?: number;
    endBlock?: number;
    page?: number;
    offset?: number;
  }) {
    // Mock implementation - replace with real API call
    const mockTransactions = [
      {
        blockHash: "0x" + Math.random().toString(16).substr(2, 64),
        blockNumber: (18000000 + Math.floor(Math.random() * 1000)).toString(),
        confirmations: "1",
        cumulativeGasUsed: "21000",
        from: params.address,
        gas: "21000",
        gasPrice: "20000000000",
        gasUsed: "21000",
        hash: "0x" + Math.random().toString(16).substr(2, 64),
        input: "deprecated",
        timeStamp: Math.floor(Date.now() / 1000).toString(),
        to: "0x" + Math.random().toString(16).substr(2, 40),
        tokenDecimal: "6",
        tokenName: "Tether USD",
        tokenSymbol: "USDT",
        transactionIndex: "0",
        value: Math.floor(Math.random() * 1000000).toString()
      }
    ];

    return {
      message: "OK",
      result: mockTransactions,
      status: "1"
    };
  }
}

const arbiscanService = new ArbiscanService();

// POST /sync-transactions - Sync transactions from blockchain
blockchainIntegration.post("/sync-transactions", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddresses, tokenAddress, chainId } =
      syncTransactionsSchema.parse(body);

    const results = [];
    const errors = [];

    for (const walletAddress of walletAddresses) {
      try {
        // Get transactions from Arbiscan
        const response = await arbiscanService.getTokenTransfers({
          address: walletAddress,
          contractAddress: tokenAddress,
          offset: 100,
          page: 1
        });

        if (response.status !== "1") {
          errors.push({
            error: response.message || "Failed to fetch transactions",
            walletAddress
          });
          continue;
        }

        const transactions = response.result || [];
        let syncedCount = 0;

        // Process each transaction
        for (const tx of transactions) {
          try {
            // Check if transaction already exists
            const existingTx = await prisma.tokenTx.findUnique({
              where: {
                walletAddress_txHash: {
                  txHash: tx.hash,
                  walletAddress
                }
              }
            });

            if (existingTx) {
              continue; // Skip existing transaction
            }

            // Create transaction record
            await prisma.tokenTx.create({
              data: {
                amount: BigInt(tx.value),
                blockHash: tx.blockHash,
                blockNumber: Number.parseInt(tx.blockNumber),
                fromAddress: tx.from,
                gasPrice: BigInt(tx.gasPrice),
                gasUsed: BigInt(tx.gasUsed),
                toAddress: tx.to,
                tokenAddress:
                  tokenAddress || "0x0000000000000000000000000000000000000000",
                transactionIndex: Number.parseInt(tx.transactionIndex),
                txHash: tx.hash,
                walletAddress
              }
            });

            syncedCount++;
          } catch (txError) {
            console.error(`Error processing transaction ${tx.hash}:`, txError);
          }
        }

        results.push({
          syncedCount,
          totalFound: transactions.length,
          walletAddress
        });
      } catch (error) {
        errors.push({
          error: error instanceof Error ? error.message : "Unknown error",
          walletAddress
        });
      }
    }

    return c.json({
      errors,
      message: "Transaction sync completed",
      results,
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /transaction-history - Get transaction history for wallet
blockchainIntegration.get("/transaction-history/:walletAddress", async (c) => {
  try {
    const walletAddress = c.req.param("walletAddress");
    const query = c.req.query();
    const { tokenAddress, fromBlock, toBlock, page, limit } =
      getTransactionHistorySchema.parse({ walletAddress, ...query });

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { walletAddress };
    if (tokenAddress) {
      where.tokenAddress = tokenAddress;
    }
    if (fromBlock) {
      where.blockNumber = { gte: fromBlock };
    }
    if (toBlock) {
      where.blockNumber = { ...where.blockNumber, lte: toBlock };
    }

    const [transactions, total] = await Promise.all([
      prisma.tokenTx.findMany({
        orderBy: { blockNumber: "desc" },
        skip,
        take: limit,
        where
      }),
      prisma.tokenTx.count({ where })
    ]);

    // Format transactions
    const formattedTransactions = transactions.map((tx) => ({
      ...tx,
      amount: tx.amount.toString(),
      gasPrice: tx.gasPrice.toString(),
      gasUsed: tx.gasUsed.toString()
    }));

    return c.json({
      pagination: {
        limit,
        page,
        pages: Math.ceil(total / limit),
        total
      },
      success: true,
      transactions: formattedTransactions
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /balance/:walletAddress - Get token balance for wallet
blockchainIntegration.get("/balance/:walletAddress", async (c) => {
  try {
    const walletAddress = c.req.param("walletAddress");
    const tokenAddress = c.req.query("tokenAddress");

    // Calculate balance from transactions
    const transactions = await prisma.tokenTx.findMany({
      orderBy: { blockNumber: "asc" },
      where: {
        walletAddress,
        ...(tokenAddress && { tokenAddress })
      }
    });

    let balance = BigInt(0);
    const balanceHistory = [];

    for (const tx of transactions) {
      if (tx.toAddress.toLowerCase() === walletAddress.toLowerCase()) {
        // Incoming transaction
        balance += tx.amount;
      } else if (tx.fromAddress.toLowerCase() === walletAddress.toLowerCase()) {
        // Outgoing transaction
        balance -= tx.amount;
      }

      balanceHistory.push({
        amount: tx.amount.toString(),
        balance: balance.toString(),
        blockNumber: tx.blockNumber,
        txHash: tx.txHash,
        type:
          tx.toAddress.toLowerCase() === walletAddress.toLowerCase()
            ? "incoming"
            : "outgoing"
      });
    }

    return c.json({
      balance: balance.toString(),
      balanceHistory: balanceHistory.slice(-100), // Last 100 transactions
      success: true,
      tokenAddress: tokenAddress || "ETH",
      walletAddress
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /contract-transactions - Get transactions for specific contract
blockchainIntegration.get("/contract-transactions", async (c) => {
  try {
    const contractAddress = c.req.query("contractAddress");
    const page = Number.parseInt(c.req.query("page") || "1");
    const limit = Number.parseInt(c.req.query("limit") || "20");
    const skip = (page - 1) * limit;

    if (!contractAddress) {
      throw new ApiError("Contract address is required", 400);
    }

    const [transactions, total] = await Promise.all([
      prisma.tokenTx.findMany({
        include: {
          user: {
            select: {
              username: true,
              walletAddress: true
            }
          }
        },
        orderBy: { blockNumber: "desc" },
        skip,
        take: limit,
        where: { tokenAddress: contractAddress }
      }),
      prisma.tokenTx.count({
        where: { tokenAddress: contractAddress }
      })
    ]);

    // Format transactions
    const formattedTransactions = transactions.map((tx) => ({
      ...tx,
      amount: tx.amount.toString(),
      gasPrice: tx.gasPrice.toString(),
      gasUsed: tx.gasUsed.toString()
    }));

    return c.json({
      contractAddress,
      pagination: {
        limit,
        page,
        pages: Math.ceil(total / limit),
        total
      },
      success: true,
      transactions: formattedTransactions
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /monitor-addresses - Start monitoring addresses
blockchainIntegration.post("/monitor-addresses", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { addresses, tokenAddress, chainId } = z
      .object({
        addresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)),
        chainId: z.number().int().positive().default(42161),
        tokenAddress: z.string().optional()
      })
      .parse(body);

    // In a real implementation, you would start a background job
    // to monitor these addresses for new transactions
    // For now, we'll just return success

    return c.json({
      addresses,
      chainId,
      message: "Address monitoring started",
      success: true,
      tokenAddress
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /monitored-addresses - Get monitored addresses
blockchainIntegration.get("/monitored-addresses", authMiddleware, async (c) => {
  try {
    // Get unique wallet addresses that have transactions
    const addresses = await prisma.tokenTx.findMany({
      distinct: ["walletAddress"],
      orderBy: { walletAddress: "asc" },
      select: { walletAddress: true }
    });

    return c.json({
      addresses: addresses.map((a) => a.walletAddress),
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /transaction-stats - Get transaction statistics
blockchainIntegration.get("/transaction-stats", authMiddleware, async (c) => {
  try {
    const [
      totalTransactions,
      totalVolume,
      uniqueWallets,
      transactionsByToken,
      recentTransactions
    ] = await Promise.all([
      prisma.tokenTx.count(),
      prisma.tokenTx.aggregate({
        _sum: { amount: true }
      }),
      prisma.tokenTx.findMany({
        distinct: ["walletAddress"],
        select: { walletAddress: true }
      }),
      prisma.tokenTx.groupBy({
        _count: { tokenAddress: true },
        _sum: { amount: true },
        by: ["tokenAddress"]
      }),
      prisma.tokenTx.findMany({
        include: {
          user: {
            select: {
              username: true,
              walletAddress: true
            }
          }
        },
        orderBy: { blockNumber: "desc" },
        take: 10
      })
    ]);

    return c.json({
      stats: {
        recentTransactions: recentTransactions.map((tx) => ({
          ...tx,
          amount: tx.amount.toString(),
          gasPrice: tx.gasPrice.toString(),
          gasUsed: tx.gasUsed.toString()
        })),
        totalTransactions,
        totalVolume: totalVolume._sum.amount?.toString() || "0",
        transactionsByToken: transactionsByToken.map((item) => ({
          count: item._count.tokenAddress,
          tokenAddress: item.tokenAddress,
          volume: item._sum.amount?.toString() || "0"
        })),
        uniqueWallets: uniqueWallets.length
      },
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /sync-all - Sync all monitored addresses
blockchainIntegration.post("/sync-all", authMiddleware, async (c) => {
  try {
    // Get all unique wallet addresses
    const addresses = await prisma.tokenTx.findMany({
      distinct: ["walletAddress"],
      select: { walletAddress: true }
    });

    const walletAddresses = addresses.map((a) => a.walletAddress);

    if (walletAddresses.length === 0) {
      return c.json({
        message: "No addresses to sync",
        success: true
      });
    }

    // Sync transactions for all addresses
    const response = await fetch(
      `${c.req.url.replace("/sync-all", "/sync-transactions")}`,
      {
        body: JSON.stringify({ walletAddresses }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      }
    );

    const result = await response.json();

    return c.json({
      message: "Sync completed for all addresses",
      success: true,
      ...result
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

export default blockchainIntegration;
