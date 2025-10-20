import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  type CoinData,
  type EqLevelData,
  gameHubApi,
  type NotificationData,
  type TournamentData,
  type UserData
} from "@/lib/api/gameHubApi";

export interface GameHubState {
  user: UserData | null;
  coins: CoinData | null;
  tournaments: TournamentData[];
  notifications: NotificationData[];
  eqLevels: EqLevelData[];
  loading: boolean;
  error: string | null;
}

export interface GameHubActions {
  refreshUser: () => Promise<void>;
  refreshCoins: () => Promise<void>;
  refreshTournaments: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  updateCoins: (coinType: string, amount: number) => Promise<void>;
  joinTournament: (tournamentId: string, amount: number) => Promise<void>;
  markNotificationAsSeen: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  syncTransactions: () => Promise<void>;
}

export function useGameHub(): GameHubState & GameHubActions {
  const { address } = useAccount();
  const [state, setState] = useState<GameHubState>({
    coins: null,
    eqLevels: [],
    error: null,
    loading: false,
    notifications: [],
    tournaments: [],
    user: null
  });

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  // Set error state
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      const response = await gameHubApi.getUserData(address);
      if (response.success) {
        setState((prev) => ({ ...prev, user: response.data }));
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch user data"
      );
    } finally {
      setLoading(false);
    }
  }, [address, setLoading, setError]);

  // Refresh coin balance
  const refreshCoins = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      const response = await gameHubApi.getCoinBalance(address);
      if (response.success) {
        setState((prev) => ({ ...prev, coins: response.data }));
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch coin balance"
      );
    } finally {
      setLoading(false);
    }
  }, [address, setLoading, setError]);

  // Refresh tournaments
  const refreshTournaments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await gameHubApi.getAllTournaments();
      if (response.success) {
        setState((prev) => ({ ...prev, tournaments: response.data }));
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch tournaments"
      );
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      const response = await gameHubApi.getAllNotifications(address);
      if (response.success) {
        setState((prev) => ({ ...prev, notifications: response.data }));
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch notifications"
      );
    } finally {
      setLoading(false);
    }
  }, [address, setLoading, setError]);

  // Update coins
  const updateCoins = useCallback(
    async (coinType: string, amount: number) => {
      if (!address) return;

      try {
        setLoading(true);
        setError(null);
        const response = await gameHubApi.updateCoins(
          address,
          coinType,
          amount
        );
        if (response.success) {
          await refreshCoins(); // Refresh coin balance after update
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to update coins"
        );
      } finally {
        setLoading(false);
      }
    },
    [address, refreshCoins, setLoading, setError]
  );

  // Join tournament
  const joinTournament = useCallback(
    async (tournamentId: string, amount: number) => {
      if (!address) return;

      try {
        setLoading(true);
        setError(null);
        const response = await gameHubApi.insertCoinsToTournament(
          address,
          tournamentId,
          amount
        );
        if (response.success) {
          await refreshCoins(); // Refresh coin balance after joining
          await refreshTournaments(); // Refresh tournaments
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to join tournament"
        );
      } finally {
        setLoading(false);
      }
    },
    [address, refreshCoins, refreshTournaments, setLoading, setError]
  );

  // Mark notification as seen
  const markNotificationAsSeen = useCallback(
    async (notificationId: string) => {
      try {
        setError(null);
        // require recipient (wallet address) per API
        const response = await gameHubApi.markNotificationAsSeen(
          notificationId,
          address ?? ""
        );
        if (response.success) {
          await refreshNotifications(); // Refresh notifications
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to mark notification as seen"
        );
      }
    },
    [address, refreshNotifications, setError]
  );

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        setError(null);
        const response = await gameHubApi.deleteNotification(notificationId);
        if (response.success) {
          await refreshNotifications(); // Refresh notifications
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to delete notification"
        );
      }
    },
    [refreshNotifications, setError]
  );

  // Sync transactions
  const syncTransactions = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      const response = await gameHubApi.syncTransactions(address);
      if (response.success) {
        await refreshCoins(); // Refresh coin balance after sync
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to sync transactions"
      );
    } finally {
      setLoading(false);
    }
  }, [address, refreshCoins, setLoading, setError]);

  // Load EQ levels on mount
  useEffect(() => {
    const loadEqLevels = async () => {
      try {
        const response = await gameHubApi.getEqLevels();
        if (response.success) {
          setState((prev) => ({ ...prev, eqLevels: response.data }));
        }
      } catch (error) {
        console.error("Failed to load EQ levels:", error);
      }
    };

    loadEqLevels();
  }, []);

  // Load data when wallet address changes
  useEffect(() => {
    if (address) {
      refreshUser();
      refreshCoins();
      refreshTournaments();
      refreshNotifications();
    }
  }, [
    address,
    refreshUser,
    refreshCoins,
    refreshTournaments,
    refreshNotifications
  ]);

  return {
    ...state,
    deleteNotification,
    joinTournament,
    markNotificationAsSeen,
    refreshCoins,
    refreshNotifications,
    refreshTournaments,
    refreshUser,
    syncTransactions,
    updateCoins
  };
}
