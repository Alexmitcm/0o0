import { HEY_API_URL } from "@hey/data/constants";

// Types for Game Hub API responses
export interface UserData {
  id: string;
  walletAddress: string;
  username?: string;
  isEmailVerified: boolean;
  isUsernameChanged: boolean;
  rolePermission: string;
  banned: boolean;
  cheatCount: number;
  totalEq: number;
  leftNode: number;
  rightNode: number;
  todaysPoints: number;
  lastCoinUpdated: string;
  staminaLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoinData {
  experienceCoins: number;
  achievementCoins: number;
  socialCoins: number;
  premiumCoins: number;
}

export interface TournamentData {
  id: string;
  tournamentId: string;
  name: string;
  gameName: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  prizePool: string;
  coinsGathered: number;
  isDisabled: boolean;
  tagForSeo: string;
  minimumCoin: number;
  minimumRefer: number;
  maximumRefer: number;
  storageCapacity: number;
  tournamentPrize: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  isSeen: boolean;
  createdAt: string;
}

export interface EqLevelData {
  id: string;
  level: number;
  requiredPoints: number;
  staminaBonus: number;
  coinMultiplier: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLogData {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface WithdrawTransactionData {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
}

// API Client Class
export class GameHubApiClient {
  private baseUrl: string;
  private token?: string;

  constructor(token?: string) {
    this.baseUrl = HEY_API_URL;
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers
    };

    if (this.token) {
      (headers as any).Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // User Management APIs
  async getUserData(
    walletAddress: string
  ): Promise<{ success: boolean; data: UserData }> {
    return this.request("/user-management/get-user-data", {
      body: JSON.stringify({ walletAddress }),
      method: "POST"
    });
  }

  async updateUserData(
    walletAddress: string,
    data: Partial<UserData>
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/user-management/update-user-data", {
      body: JSON.stringify({ walletAddress, ...data }),
      method: "POST"
    });
  }

  // Legacy referral tree method - use referral system APIs instead

  // Coin System APIs
  async getCoinBalance(
    walletAddress: string
  ): Promise<{ success: boolean; data: CoinData }> {
    return this.request("/coin-system-enhanced/get-coin-balance", {
      body: JSON.stringify({ walletAddress }),
      method: "POST"
    });
  }

  async updateCoins(
    walletAddress: string,
    coinType: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/coin-system-enhanced/update-coins", {
      body: JSON.stringify({ amount, coinType, walletAddress }),
      method: "POST"
    });
  }

  async insertCoinsToTournament(
    walletAddress: string,
    tournamentId: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/tournament-system-enhanced/join", {
      body: JSON.stringify({
        coinsBurned: amount,
        tournamentId,
        walletAddress
      }),
      method: "POST"
    });
  }

  // Tournament System APIs
  async getAllTournaments(): Promise<{
    success: boolean;
    data: TournamentData[];
  }> {
    return this.request("/tournament-system");
  }

  async getTournament(
    tournamentId: string
  ): Promise<{ success: boolean; data: TournamentData }> {
    return this.request(`/tournament-system-new/${tournamentId}`);
  }

  async addTournament(
    tournamentData: Partial<TournamentData>
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/tournament-system-new", {
      body: JSON.stringify(tournamentData),
      method: "POST"
    });
  }

  async disableTournament(
    tournamentId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/tournament-system-new/${tournamentId}`, {
      body: JSON.stringify({ isDisabled: true }),
      method: "PUT"
    });
  }

  async registerForTournament(
    walletAddress: string,
    tournamentId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/tournament-system-new/register", {
      body: JSON.stringify({ tournamentId, walletAddress }),
      method: "POST"
    });
  }

  async getUserTournaments(
    walletAddress: string
  ): Promise<{ success: boolean; data: any[] }> {
    return this.request(`/tournament-system-new/user/${walletAddress}`);
  }

  // Notification System APIs
  async getAllNotifications(
    walletAddress: string
  ): Promise<{ success: boolean; data: NotificationData[] }> {
    return this.request(`/notification-system-new/${walletAddress}`);
  }

  async getAdminNotifications(): Promise<{ success: boolean; data: any[] }> {
    return this.request("/notification-system-new/admin");
  }

  async createNotification(notificationData: {
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    type?: "info" | "warning" | "error" | "success" | "promotion";
    isAll?: boolean;
    recipients?: string[];
  }): Promise<{ success: boolean; message: string }> {
    return this.request("/notification-system-new", {
      body: JSON.stringify(notificationData),
      method: "POST"
    });
  }

  async markNotificationAsSeen(
    notificationId: string,
    recipient: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/notification-system-new/mark-read", {
      body: JSON.stringify({ notificationId, recipient }),
      method: "POST"
    });
  }

  async deleteNotification(
    notificationId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/notification-system-new/${notificationId}`, {
      method: "DELETE"
    });
  }

  // EQ Levels APIs
  async getEqLevels(): Promise<{ success: boolean; data: EqLevelData[] }> {
    return this.request("/eq-levels-new");
  }

  async getUserEqLevel(
    walletAddress: string
  ): Promise<{ success: boolean; data: EqLevelData }> {
    return this.request(`/eq-levels-new/${walletAddress}`);
  }

  // User Log APIs
  async getUserLogs(
    walletAddress: string,
    limit = 50
  ): Promise<{ success: boolean; data: UserLogData[] }> {
    return this.request(
      `/user-log-new/log-user?walletAddress=${walletAddress}&limit=${limit}`
    );
  }

  async checkLevelValue(
    walletAddress: string
  ): Promise<{ success: boolean; data: { levelValue: number } }> {
    return this.request(
      `/user-log-new/check-level-value?walletAddress=${walletAddress}`
    );
  }

  async updateUserCoins(
    walletAddress: string,
    coinType: string,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/user-log-new/update-users-coin", {
      body: JSON.stringify({ amount, coinType, reason, walletAddress }),
      method: "POST"
    });
  }

  // Analytics APIs
  async getDashboardStats(): Promise<{ success: boolean; data: any }> {
    return this.request("/analytics-new/overview");
  }

  async getUserAnalytics(
    walletAddress: string
  ): Promise<{ success: boolean; data: any }> {
    return this.request(`/analytics-new/user/${walletAddress}`);
  }

  async getCsvExport(type = "users"): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/analytics-new/csv-export?type=${type}`
    );
    return response.blob();
  }

  // Admin APIs
  async adminLogin(
    username: string,
    password: string
  ): Promise<{ success: boolean; token: string }> {
    return this.request("/admin-panel-enhanced/admin-login", {
      body: JSON.stringify({ password, username }),
      method: "POST"
    });
  }

  async resetUserPassword(
    walletAddress: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/admin-panel-enhanced/reset-user-password", {
      body: JSON.stringify({ newPassword, walletAddress }),
      method: "POST"
    });
  }

  async deductUserCoins(
    walletAddress: string,
    coinType: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/admin-panel-enhanced/deduct-user-coins", {
      body: JSON.stringify({ amount, coinType, walletAddress }),
      method: "POST"
    });
  }

  async listUserWithdrawals(): Promise<{
    success: boolean;
    data: WithdrawTransactionData[];
  }> {
    return this.request("/admin-panel-enhanced/list-user-withdrawals");
  }

  // File Upload APIs (legacy - use content management APIs instead)

  async uploadHeroSlide(
    file: File
  ): Promise<{ success: boolean; data: { url: string } }> {
    const formData = new FormData();
    formData.append("heroSlide", file);

    return this.request("/file-upload-system/upload-hero-slide", {
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
      method: "POST"
    });
  }

  // Blockchain Integration APIs
  async syncTransactions(
    walletAddress: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/blockchain-integration/sync-transactions", {
      body: JSON.stringify({ walletAddress }),
      method: "POST"
    });
  }

  async getTransactionHistory(
    walletAddress: string
  ): Promise<{ success: boolean; data: any[] }> {
    return this.request("/blockchain-integration/get-transaction-history", {
      body: JSON.stringify({ walletAddress }),
      method: "POST"
    });
  }

  // D3 Visualization APIs (legacy - use referral system APIs instead)

  async getNetworkData(): Promise<{ success: boolean; data: any }> {
    return this.request("/d3-visualization/get-network-data");
  }

  // Vis.js Network APIs
  async getVisNetworkData(
    filters?: any
  ): Promise<{ success: boolean; data: any }> {
    return this.request("/vis-network/get-network-data", {
      body: JSON.stringify({ filters }),
      method: "POST"
    });
  }

  // CSV Generator APIs
  async generateUserCsv(): Promise<{
    success: boolean;
    data: { downloadUrl: string };
  }> {
    return this.request("/csv-generator/generate-users-csv", {
      method: "POST"
    });
  }

  async generateTournamentCsv(): Promise<{
    success: boolean;
    data: { downloadUrl: string };
  }> {
    return this.request("/csv-generator/generate-tournaments-csv", {
      method: "POST"
    });
  }

  // Backup System APIs
  async generateBackup(): Promise<{
    success: boolean;
    data: { backupId: string };
  }> {
    return this.request("/backup-system/generate-backup", {
      method: "POST"
    });
  }

  async listBackups(): Promise<{ success: boolean; data: any[] }> {
    return this.request("/backup-system/list-backups");
  }

  // Python Testing APIs
  async runApiTests(): Promise<{ success: boolean; data: any }> {
    return this.request("/python-testing/run-api-tests", {
      method: "POST"
    });
  }

  async getTestResults(): Promise<{ success: boolean; data: any[] }> {
    return this.request("/python-testing/get-test-results");
  }

  // Submit game for review
  async submitGame(
    data: any
  ): Promise<{ success: boolean; message: string; gameId?: string }> {
    return this.request("/games/submit", {
      body: JSON.stringify(data),
      method: "POST"
    });
  }

  // Ban & Security APIs
  async checkBanStatus(walletAddress: string): Promise<{
    success: boolean;
    data: { banned: boolean; remaining_time?: string };
  }> {
    return this.request(`/ban-security/check/${walletAddress}`);
  }

  async banUser(
    walletAddress: string,
    banDurationHours = 24,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/ban-security/ban", {
      body: JSON.stringify({ banDurationHours, reason, walletAddress }),
      method: "POST"
    });
  }

  async unbanUser(
    walletAddress: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/ban-security/unban", {
      body: JSON.stringify({ walletAddress }),
      method: "POST"
    });
  }

  async getBannedUsers(): Promise<{ success: boolean; data: any[] }> {
    return this.request("/ban-security/banned-users");
  }

  // Transaction System APIs
  async getTransactions(
    filters?: any
  ): Promise<{ success: boolean; data: any[] }> {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/transactions?${queryParams}`);
  }

  async getContractTransactions(
    contractAddress?: string
  ): Promise<{ success: boolean; data: any[] }> {
    const queryParams = contractAddress
      ? `?contractAddress=${contractAddress}`
      : "";
    return this.request(`/transactions/contract${queryParams}`);
  }

  async saveTransaction(transactionData: {
    walletAddress: string;
    transactionHash: string;
    amount: number;
    coinType: "Experience" | "Achievement" | "Social" | "Premium";
    reason?: string;
    metadata?: any;
  }): Promise<{ success: boolean; data: any }> {
    return this.request("/transactions/save", {
      body: JSON.stringify(transactionData),
      method: "POST"
    });
  }

  async saveWithdraw(withdrawData: {
    walletAddress: string;
    withdrawAddress: string;
    amount: number;
    coinType: "Experience" | "Achievement" | "Social" | "Premium";
    reason?: string;
  }): Promise<{ success: boolean; data: any }> {
    return this.request("/transactions/save-withdraw", {
      body: JSON.stringify(withdrawData),
      method: "POST"
    });
  }

  async getUserTransactions(
    walletAddress: string,
    page = 1,
    limit = 20
  ): Promise<{ success: boolean; data: any[] }> {
    return this.request(
      `/transactions/retrieve/${walletAddress}?page=${page}&limit=${limit}`
    );
  }

  // Content Management APIs
  async getHeroSlides(): Promise<{ success: boolean; data: any[] }> {
    return this.request("/content-management/hero-slides");
  }

  async createHeroSlide(slideData: {
    title: string;
    startTime: string;
    endTime: string;
    imageData: string;
    imageType: string;
  }): Promise<{ success: boolean; data: any }> {
    return this.request("/content-management/hero-slides", {
      body: JSON.stringify(slideData),
      method: "POST"
    });
  }

  async uploadBanner(
    file: File,
    title: string,
    description?: string
  ): Promise<{ success: boolean; data: any }> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("title", title);
    if (description) formData.append("description", description);

    return this.request("/content-management/upload-banner", {
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
      method: "POST"
    });
  }

  // Referral System APIs
  async getReferralTree(
    walletAddress: string
  ): Promise<{ success: boolean; data: any }> {
    return this.request(`/referral-new/tree/${walletAddress}`);
  }

  async refreshReferralData(
    walletAddress: string
  ): Promise<{ success: boolean; data: any }> {
    return this.request("/referral-new/refresh", {
      body: JSON.stringify({ walletAddress }),
      method: "POST"
    });
  }

  async getReferralStats(
    walletAddress: string
  ): Promise<{ success: boolean; data: any }> {
    return this.request(`/referral-new/stats/${walletAddress}`);
  }

  async getReferralLeaderboard(
    limit = 50
  ): Promise<{ success: boolean; data: any[] }> {
    return this.request(`/referral-new/leaderboard?limit=${limit}`);
  }

  // Admin Features APIs
  async getAdminStats(): Promise<{ success: boolean; data: any }> {
    return this.request("/admin-features/stats");
  }

  async getSystemHealth(): Promise<{ success: boolean; data: any }> {
    return this.request("/admin-features/health");
  }

  async getRecentActivities(): Promise<{ success: boolean; data: any[] }> {
    return this.request("/admin-features/activities");
  }

  async getSystemMetrics(): Promise<{ success: boolean; data: any }> {
    return this.request("/admin-features/metrics");
  }
}

// Export singleton instance
export const gameHubApi = new GameHubApiClient();
