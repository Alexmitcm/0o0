import { PrismaClient } from '@prisma/client';
import { Hono } from 'hono';
import { z } from 'zod';

const prisma = new PrismaClient();
const app = new Hono();

// Schema for deduct coins request
const deductCoinsSchema = z.object({
  walletaddress: z.string(),
  amount: z.number().positive()
});

// Schema for withdrawal filters
const withdrawalFiltersSchema = z.object({
  wallet: z.string().optional(),
  min_usdt: z.string().optional(),
  max_usdt: z.string().optional(),
  min_tx: z.string().optional(),
  max_tx: z.string().optional(),
  include_all: z.string().optional(),
  sort_by: z.enum(['amount', 'tx']).optional().default('amount'),
  sort_dir: z.enum(['desc', 'asc']).optional().default('desc'),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50')
});

// POST /admin/deduct-user-coins - Deduct coins from user
app.post('/deduct-user-coins', async (c) => {
  try {
    const body = await c.req.json();
    const { walletaddress, amount } = deductCoinsSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletaddress },
      include: { userCoinBalance: true }
    });

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    if (!user.userCoinBalance) {
      return c.json({ success: false, message: 'User has no coin balance' }, 400);
    }

    const currentBalance = parseFloat(user.userCoinBalance.experience.toString());
    if (currentBalance < amount) {
      return c.json({ 
        success: false, 
        message: 'Insufficient balance',
        current_balance: currentBalance,
        requested_amount: amount
      }, 400);
    }

    // Deduct coins with transaction
    await prisma.$transaction(async (tx) => {
      await tx.userCoinBalance.update({
        where: { walletAddress: walletaddress },
        data: {
          experience: {
            decrement: amount
          }
        }
      });

      // Log the transaction
      await tx.userTransaction.create({
        data: {
          walletAddress: walletaddress,
          tournamentId: 'admin-deduct',
          tournamentName: 'Admin Deduction',
          startDate: new Date(),
          endDate: new Date(),
          coinsGathered: -amount
        }
      });
    });

    // Get updated balance
    const updatedUser = await prisma.user.findUnique({
      where: { walletAddress: walletaddress },
      include: { userCoinBalance: true }
    });

    return c.json({
      success: true,
      message: 'Coins deducted successfully',
      walletaddress,
      amount_deducted: amount,
      coins: parseFloat(updatedUser?.userCoinBalance?.experience.toString() || '0')
    });

  } catch (error) {
    console.error('Deduct coins error:', error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// GET /admin/list-user-withdrawals - List user withdrawals with filters
app.get('/list-user-withdrawals', async (c) => {
  try {
    const query = c.req.query();
    const filters = withdrawalFiltersSchema.parse(query);
    
    const page = parseInt(filters.page);
    const limit = parseInt(filters.limit);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (filters.wallet) {
      where.walletAddress = { contains: filters.wallet, mode: 'insensitive' };
    }

    // Get withdrawal transactions
    const withdrawalTxs = await prisma.withdrawTransaction.findMany({
      where: {
        ...where
      },
      select: {
        walletAddress: true,
        amount: true,
        createdAt: true
      }
    });

    // Group by wallet address and calculate totals
    const userWithdrawals = new Map();
    
    withdrawalTxs.forEach(tx => {
      const wallet = tx.walletAddress;
      if (!userWithdrawals.has(wallet)) {
        userWithdrawals.set(wallet, {
          walletaddress: wallet,
          total_withdraw_usdt: 0,
          total_withdraw_usd: 0,
          tx_count: 0,
          tx_unique: 0
        });
      }
      
      const userData = userWithdrawals.get(wallet);
      userData.total_withdraw_usdt += parseFloat(tx.amount.toString());
      userData.total_withdraw_usd += parseFloat(tx.amount.toString()); // Assuming 1:1 ratio
      userData.tx_count += 1;
    });

    // Apply filters
    let filteredWithdrawals = Array.from(userWithdrawals.values());

    if (filters.min_usdt) {
      const minUsdt = parseFloat(filters.min_usdt);
      filteredWithdrawals = filteredWithdrawals.filter(w => w.total_withdraw_usdt >= minUsdt);
    }

    if (filters.max_usdt) {
      const maxUsdt = parseFloat(filters.max_usdt);
      filteredWithdrawals = filteredWithdrawals.filter(w => w.total_withdraw_usdt <= maxUsdt);
    }

    if (filters.min_tx) {
      const minTx = parseInt(filters.min_tx);
      filteredWithdrawals = filteredWithdrawals.filter(w => w.tx_count >= minTx);
    }

    if (filters.max_tx) {
      const maxTx = parseInt(filters.max_tx);
      filteredWithdrawals = filteredWithdrawals.filter(w => w.tx_count <= maxTx);
    }

    // Sort
    filteredWithdrawals.sort((a, b) => {
      const aValue = filters.sort_by === 'amount' ? a.total_withdraw_usdt : a.tx_count;
      const bValue = filters.sort_by === 'amount' ? b.total_withdraw_usdt : b.tx_count;
      
      return filters.sort_dir === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Pagination
    const totalUsers = filteredWithdrawals.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const users = filteredWithdrawals.slice(offset, offset + limit);

    return c.json({
      page,
      limit,
      total_users: totalUsers,
      total_pages: totalPages,
      users
    });

  } catch (error) {
    console.error('List withdrawals error:', error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// GET /admin/list-user-withdrawals-csv - Download CSV
app.get('/list-user-withdrawals-csv', async (c) => {
  try {
    const query = c.req.query();
    const filters = withdrawalFiltersSchema.parse(query);

    // Get withdrawal data (same logic as list-user-withdrawals but without pagination)
    const withdrawalTxs = await prisma.withdrawTransaction.findMany({
      where: {},
      select: {
        walletAddress: true,
        amount: true,
        createdAt: true
      }
    });

    // Group by wallet address
    const userWithdrawals = new Map();
    
    withdrawalTxs.forEach(tx => {
      const wallet = tx.walletAddress;
      if (!userWithdrawals.has(wallet)) {
        userWithdrawals.set(wallet, {
          walletaddress: wallet,
          total_withdraw_usdt: 0,
          total_withdraw_usd: 0,
          tx_count: 0,
          tx_unique: 0
        });
      }
      
      const userData = userWithdrawals.get(wallet);
      userData.total_withdraw_usdt += parseFloat(tx.amount.toString());
      userData.total_withdraw_usd += parseFloat(tx.amount.toString());
      userData.tx_count += 1;
    });

    // Apply filters
    let filteredWithdrawals = Array.from(userWithdrawals.values());

    if (filters.wallet) {
      filteredWithdrawals = filteredWithdrawals.filter(w => 
        w.walletaddress.toLowerCase().includes(filters.wallet!.toLowerCase())
      );
    }

    if (filters.min_usdt) {
      const minUsdt = parseFloat(filters.min_usdt);
      filteredWithdrawals = filteredWithdrawals.filter(w => w.total_withdraw_usdt >= minUsdt);
    }

    if (filters.max_usdt) {
      const maxUsdt = parseFloat(filters.max_usdt);
      filteredWithdrawals = filteredWithdrawals.filter(w => w.total_withdraw_usdt <= maxUsdt);
    }

    // Generate CSV
    const csvHeader = 'walletaddress,total_withdraw_usdt,total_withdraw_usd,tx_count,tx_unique\n';
    const csvRows = filteredWithdrawals.map(w => 
      `${w.walletaddress},${w.total_withdraw_usdt},${w.total_withdraw_usd},${w.tx_count},${w.tx_unique}`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;

    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', 'attachment; filename="withdrawals.csv"');
    return c.text(csvContent);

  } catch (error) {
    console.error('CSV export error:', error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// GET /admin/withdraw-category-summary - Withdrawal category summary
app.get('/withdraw-category-summary', async (c) => {
  try {
    // This would need to be implemented based on your specific categorization logic
    // For now, returning mock data structure
    const summary = {
      from_field: [
        { value: 'User Wallet', tx_count: 150, total_usdt: 5000.50 },
        { value: 'Admin Transfer', tx_count: 25, total_usdt: 1200.75 },
        { value: 'System Refund', tx_count: 10, total_usdt: 300.25 }
      ],
      to_field: [
        { value: 'External Wallet', tx_count: 120, total_usdt: 4500.00 },
        { value: 'Internal Transfer', tx_count: 30, total_usdt: 1000.50 },
        { value: 'System Hold', tx_count: 35, total_usdt: 1000.00 }
      ]
    };

    return c.json(summary);

  } catch (error) {
    console.error('Summary error:', error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// GET /admin/d3-nodes - D3 visualization nodes
app.get('/d3-nodes', async (c) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        walletAddress: true,
        username: true,
        displayName: true,
        totalEq: true,
        leftNode: true,
        rightNode: true
      },
      take: 1000 // Limit for performance
    });

    const nodes = users.map(user => ({
      id: user.walletAddress,
      walletAddress: user.walletAddress,
      username: user.username,
      displayName: user.displayName,
      totalEq: user.totalEq,
      leftNode: user.leftNode,
      rightNode: user.rightNode
    }));

    return c.json({ nodes });

  } catch (error) {
    console.error('D3 nodes error:', error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

export default app;
