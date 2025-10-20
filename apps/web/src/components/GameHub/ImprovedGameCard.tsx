import React, { useState, useCallback } from 'react';
import { useBetterState, useFormState } from '@/hooks/useBetterState';
import { safeArray, safeObject, validateState, handleStateError } from '@/helpers/stateManagement';

interface Game {
  id: string;
  name: string;
  description: string;
  thumb1Url?: string;
  thumb2Url?: string;
  likeCount: number;
  dislikeCount: number;
  rating: number;
  ratingCount: number;
  userLike?: boolean;
  userDislike?: boolean;
  userRating?: number;
}

interface ImprovedGameCardProps {
  game: Game;
  onLike?: (gameId: string) => Promise<void>;
  onDislike?: (gameId: string) => Promise<void>;
  onRate?: (gameId: string, rating: number) => Promise<void>;
  className?: string;
}

const ImprovedGameCard: React.FC<ImprovedGameCardProps> = ({
  game,
  onLike,
  onDislike,
  onRate,
  className = ""
}) => {
  // Better state management
  const gameState = useBetterState<Game>(game);
  const likeState = useBetterState<number>(game.likeCount);
  const dislikeState = useBetterState<number>(game.dislikeCount);
  const ratingState = useBetterState<number>(game.rating);
  
  // Form state for rating
  const ratingForm = useFormState({ rating: game.userRating || 0 });
  
  // Image state with fallback
  const [imageUrl, setImageUrl] = useState<string>(
    game.thumb1Url || game.thumb2Url || '/placeholder.jpg'
  );
  
  // Action handlers with better error handling
  const handleLike = useCallback(async () => {
    if (!onLike) return;
    
    try {
      // Optimistic update
      likeState.actions.setData((likeState.data || 0) + 1);
      
      await onLike(game.id);
      
      // Refresh game data
      gameState.actions.setData(game);
    } catch (error) {
      // Revert optimistic update
      likeState.actions.setData(game.likeCount);
      likeState.actions.setError(handleStateError(error));
    }
  }, [game, onLike, likeState, gameState]);
  
  const handleDislike = useCallback(async () => {
    if (!onDislike) return;
    
    try {
      // Optimistic update
      dislikeState.actions.setData((dislikeState.data || 0) + 1);
      
      await onDislike(game.id);
      
      // Refresh game data
      gameState.actions.setData(game);
    } catch (error) {
      // Revert optimistic update
      dislikeState.actions.setData(game.dislikeCount);
      dislikeState.actions.setError(handleStateError(error));
    }
  }, [game, onDislike, dislikeState, gameState]);
  
  const handleRate = useCallback(async () => {
    if (!onRate || !validateState.isNumber(ratingForm.values.rating)) return;
    
    try {
      // Optimistic update
      ratingState.actions.setData(ratingForm.values.rating);
      
      await onRate(game.id, ratingForm.values.rating);
      
      // Refresh game data
      gameState.actions.setData(game);
    } catch (error) {
      // Revert optimistic update
      ratingState.actions.setData(game.rating);
      ratingState.actions.setError(handleStateError(error));
    }
  }, [game, onRate, ratingForm.values.rating, ratingState, gameState]);
  
  // Image error handling
  const handleImageError = useCallback(() => {
    setImageUrl('/placeholder.jpg');
  }, []);
  
  return (
    <div className={`game-card ${className}`}>
      {/* Game Image */}
      <div className="game-card-image-container">
        <img
          src={imageUrl}
          alt={game.name}
          onError={handleImageError}
          className="game-card-image"
        />
      </div>
      
      {/* Game Info */}
      <div className="game-card-content">
        <h3 className="game-card-title">
          {gameState.data?.name || 'Unknown Game'}
        </h3>
        
        <p className="game-card-description">
          {gameState.data?.description || 'No description available'}
        </p>
        
        {/* Stats */}
        <div className="game-card-stats">
          <div className="stat">
            <span className="stat-label">Likes:</span>
            <span className="stat-value">
              {likeState.getDisplayValue('0')}
            </span>
            {likeState.error && (
              <span className="stat-error">{likeState.error}</span>
            )}
          </div>
          
          <div className="stat">
            <span className="stat-label">Dislikes:</span>
            <span className="stat-value">
              {dislikeState.getDisplayValue('0')}
            </span>
            {dislikeState.error && (
              <span className="stat-error">{dislikeState.error}</span>
            )}
          </div>
          
          <div className="stat">
            <span className="stat-label">Rating:</span>
            <span className="stat-value">
              {ratingState.getDisplayValue('0.0')}
            </span>
            {ratingState.error && (
              <span className="stat-error">{ratingState.error}</span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="game-card-actions">
          <button
            onClick={handleLike}
            disabled={likeState.loading}
            className="btn-like"
            aria-label={`Like ${game.name}`}
            title="Like this game"
          >
            {likeState.loading ? 'Liking...' : 'Like'}
          </button>
          
          <button
            onClick={handleDislike}
            disabled={dislikeState.loading}
            className="btn-dislike"
            aria-label={`Dislike ${game.name}`}
            title="Dislike this game"
          >
            {dislikeState.loading ? 'Disliking...' : 'Dislike'}
          </button>
          
          {/* Rating Form */}
          <div className="rating-form">
            <label htmlFor={`rating-${game.id}`} className="sr-only">
              Rate this game from 1 to 5 stars
            </label>
            <input
              id={`rating-${game.id}`}
              type="number"
              min="1"
              max="5"
              value={ratingForm.values.rating}
              onChange={(e) => ratingForm.setValue('rating', parseInt(e.target.value))}
              onBlur={() => ratingForm.setTouchedField('rating')}
              className="rating-input"
              placeholder="Rate 1-5"
              aria-label="Game rating from 1 to 5 stars"
              title="Enter a rating from 1 to 5 stars"
            />
            <button
              onClick={handleRate}
              disabled={ratingState.loading || !ratingForm.isValid}
              className="btn-rate"
              aria-label={`Submit rating of ${ratingForm.values.rating} stars`}
              title="Submit your rating"
            >
              {ratingState.loading ? 'Rating...' : 'Rate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedGameCard;
