import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { dislikeGame, likeGame, rateGame } from "../helpers/gameHub";

export interface GameActionsState {
  isLiking: boolean;
  isDisliking: boolean;
  isRating: boolean;
  error: string | null;
}

export interface GameActionsActions {
  handleLike: (gameId: string) => void;
  handleDislike: (gameId: string) => void;
  handleRate: (gameId: string, rating: number) => void;
  clearError: () => void;
}

export const useGameActions = (): GameActionsState & GameActionsActions => {
  const queryClient = useQueryClient();

  // Like game mutation
  const likeMutation = useMutation({
    mutationFn: (gameSlug: string) => likeGame(gameSlug),
    onError: (error) => {
      console.error("Like game error:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    }
  });

  // Dislike game mutation
  const dislikeMutation = useMutation({
    mutationFn: (gameSlug: string) => dislikeGame(gameSlug),
    onError: (error) => {
      console.error("Dislike game error:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    }
  });

  // Rate game mutation
  const rateMutation = useMutation({
    mutationFn: ({ gameSlug, rating }: { gameSlug: string; rating: number }) =>
      rateGame(gameSlug, rating),
    onError: (error) => {
      console.error("Rate game error:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    }
  });

  const handleLike = useCallback(
    (gameId: string) => {
      likeMutation.mutate(gameId);
    },
    [likeMutation]
  );

  const handleDislike = useCallback(
    (gameId: string) => {
      dislikeMutation.mutate(gameId);
    },
    [dislikeMutation]
  );

  const handleRate = useCallback(
    (gameId: string, rating: number) => {
      rateMutation.mutate({ gameSlug: gameId, rating });
    },
    [rateMutation]
  );

  const clearError = useCallback(() => {
    // Clear any error state
  }, []);

  return {
    clearError,
    error:
      likeMutation.error?.message ||
      dislikeMutation.error?.message ||
      rateMutation.error?.message ||
      null,
    handleDislike,

    // Actions
    handleLike,
    handleRate,
    isDisliking: dislikeMutation.isPending,
    // State
    isLiking: likeMutation.isPending,
    isRating: rateMutation.isPending
  };
};