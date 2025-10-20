import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = new Hono();
const prisma = new PrismaClient();

// Schema for export request
const exportRequestSchema = z.object({
  type: z.enum(['full', 'users', 'transactions']),
  includeArchives: z.boolean().optional().default(true),
  timestamp: z.string()
});

// Test endpoint without authentication
app.post('/test-export-database', async (c) => {
  try {
    const body = await c.req.json();
    const { type, includeArchives } = exportRequestSchema.parse(body);

    console.log(`Starting database export - Type: ${type}, Include Archives: ${includeArchives}`);

    let exportData: any = {
      metadata: {
        exportType: type,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        includeArchives
      },
      data: {}
    };

    // Export based on type
    switch (type) {
      case 'full':
        exportData.data = await exportFullDatabase(includeArchives);
        break;
      case 'users':
        exportData.data = await exportUsersData(includeArchives);
        break;
      case 'transactions':
        exportData.data = await exportTransactionsData();
        break;
    }

    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Set response headers for file download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `database-export-${type}-${timestamp}.json`;
    
    c.header('Content-Type', 'application/json');
    c.header('Content-Disposition', `attachment; filename="${fileName}"`);
    c.header('Content-Length', jsonData.length.toString());

    return c.text(jsonData);

  } catch (error) {
    console.error('Database export error:', error);
    return c.json(
      { 
        error: 'Export failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      500
    );
  }
});

// Main export endpoint with authentication
app.post('/export-database', async (c) => {
  try {
    const body = await c.req.json();
    const { type, includeArchives } = exportRequestSchema.parse(body);

    console.log(`Starting database export - Type: ${type}, Include Archives: ${includeArchives}`);

    let exportData: any = {
      metadata: {
        exportType: type,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        includeArchives
      },
      data: {}
    };

    // Export based on type
    switch (type) {
      case 'full':
        exportData.data = await exportFullDatabase(includeArchives);
        break;
      case 'users':
        exportData.data = await exportUsersData(includeArchives);
        break;
      case 'transactions':
        exportData.data = await exportTransactionsData();
        break;
    }

    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Set response headers for file download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `database-export-${type}-${timestamp}.json`;
    
    c.header('Content-Type', 'application/json');
    c.header('Content-Disposition', `attachment; filename="${fileName}"`);
    c.header('Content-Length', jsonData.length.toString());

    return c.text(jsonData);

  } catch (error) {
    console.error('Database export error:', error);
    return c.json(
      { 
        error: 'Export failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      500
    );
  }
});

async function exportFullDatabase(includeArchives: boolean) {
  const data: any = {};

  // Export all main tables
  data.users = await prisma.user.findMany({
    include: {
      userCoinBalance: true,
      premiumProfile: true,
      preferences: true,
      userNotifications: true,
      userQuests: true,
      userRewards: true,
      adminNotes: true,
      featureAccesses: true,
      gameLikes: true,
      gameRatings: true,
      gameDislikes: true,
      gameComments: true,
      gameCommentLikes: true,
      gameFavorites: true,
      gameReviews: true,
      tournamentParticipants: true,
      lootBoxOpens: true,
      lootBoxCooldowns: true,
      lootBoxDailyLimits: true,
      playHistory: true,
      manualCaptcha: true,
      withdrawTransactions: true,
      userTransactions: true,
      tournamentOfUsers: true,
      notificationRecipients: true,
      tokenTx: true
    }
  });

  data.games = await prisma.game.findMany({
    include: {
      gameLikes: true,
      gameRatings: true,
      gameDislikes: true,
      gameComments: true,
      gameFavorites: true,
      gameReviews: true,
      GameScreenshot: true,
      categories: true,
      GameTag: true,
      gamePlays: true,
      gameReports: true
    }
  });

  data.tournaments = await prisma.tournament.findMany({
    include: {
      participants: true,
      tournamentOfUsers: true,
      userTransactions: true
    }
  });

  data.lootBoxes = await prisma.lootBox.findMany({
    include: {
      userOpens: true,
      cooldowns: true,
      dailyLimits: true,
      rewards: true
    }
  });

  data.notifications = await prisma.notification.findMany({
    include: {
      recipients: true
    }
  });

  data.admins = await prisma.admin.findMany();

  // Include archives if requested
  if (includeArchives) {
    data.usersArchive = await prisma.usersArchive.findMany();
  }

  // Get counts for metadata
  data.metadata = {
    totalUsers: data.users.length,
    totalGames: data.games.length,
    totalTournaments: data.tournaments.length,
    totalLootBoxes: data.lootBoxes.length,
    totalNotifications: data.notifications.length,
    totalAdmins: data.admins.length,
    archivedUsers: includeArchives ? data.usersArchive?.length || 0 : 0
  };

  return data;
}

async function exportUsersData(includeArchives: boolean) {
  const data: any = {};

  data.users = await prisma.user.findMany({
    include: {
      userCoinBalance: true,
      premiumProfile: true,
      preferences: true,
      userNotifications: true,
      userQuests: true,
      userRewards: true,
      adminNotes: true,
      featureAccesses: true
    }
  });

  if (includeArchives) {
    data.usersArchive = await prisma.usersArchive.findMany();
  }

  data.metadata = {
    totalUsers: data.users.length,
    archivedUsers: includeArchives ? data.usersArchive?.length || 0 : 0
  };

  return data;
}

async function exportTransactionsData() {
  const data: any = {};

  data.withdrawTransactions = await prisma.withdrawTransaction.findMany();
  data.userTransactions = await prisma.userTransaction.findMany();
  data.tokenTx = await prisma.tokenTx.findMany();
  data.coinTransactions = await prisma.coinTransaction.findMany();

  data.metadata = {
    totalWithdrawTransactions: data.withdrawTransactions.length,
    totalUserTransactions: data.userTransactions.length,
    totalTokenTx: data.tokenTx.length,
    totalCoinTransactions: data.coinTransactions.length
  };

  return data;
}

export default app;
