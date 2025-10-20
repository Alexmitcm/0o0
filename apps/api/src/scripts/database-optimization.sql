-- Database Optimization Script for Hey Protocol Clone
-- This script adds missing indexes and optimizes queries for better performance

-- ==============================================
-- GAME HUB OPTIMIZATIONS
-- ==============================================

-- Optimize game search queries (used in admin-games.ts and games routes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_search_text 
ON "Game" USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(developer_name, '')));

-- Optimize game filtering by status and type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_status_type_created 
ON "Game" (status, game_type, created_at DESC);

-- Optimize game category filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_category_lookup 
ON "GameCategory" (slug, name);

-- Optimize game tag filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_tag_lookup 
ON "GameTag" (name);

-- Optimize game rating and like counts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_rating_stats 
ON "Game" (rating DESC, rating_count DESC, like_count DESC);

-- Optimize game play count for trending
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_play_count 
ON "Game" (play_count DESC, created_at DESC);

-- ==============================================
-- USER MANAGEMENT OPTIMIZATIONS
-- ==============================================

-- Optimize user search queries (used in admin-system.ts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_search_text 
ON "User" USING gin(to_tsvector('english', COALESCE(username, '') || ' ' || COALESCE(display_name, '') || ' ' || wallet_address));

-- Optimize user status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_status_created 
ON "User" (status, created_at DESC);

-- Optimize user activity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_last_active 
ON "User" (last_active_at DESC) WHERE last_active_at IS NOT NULL;

-- Optimize user coin balance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_coin_balance_total 
ON "UserCoinBalance" (total_coins DESC, last_updated_at DESC);

-- ==============================================
-- GAME INTERACTION OPTIMIZATIONS
-- ==============================================

-- Optimize game likes queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_like_user_game 
ON "GameLike" (user_address, game_id, created_at DESC);

-- Optimize game ratings queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_rating_user_game 
ON "GameRating" (user_address, game_id, rating, created_at DESC);

-- Optimize game favorites queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_favorite_user_game 
ON "GameFavorite" (user_address, game_id, created_at DESC);

-- Optimize game comments queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_comment_game_created 
ON "GameComment" (game_id, created_at DESC, parent_id);

-- ==============================================
-- TOURNAMENT SYSTEM OPTIMIZATIONS
-- ==============================================

-- Optimize tournament queries by status and dates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_status_dates 
ON "Tournament" (status, start_date, end_date);

-- Optimize tournament participant queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_participant_user 
ON "TournamentParticipant" (wallet_address, tournament_id, created_at DESC);

-- Optimize tournament participant coins queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_participant_coins 
ON "TournamentParticipant" (coins_burned DESC, created_at DESC);

-- ==============================================
-- LOOT BOX SYSTEM OPTIMIZATIONS
-- ==============================================

-- Optimize loot box opens by user and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loot_box_open_user_date 
ON "LootBoxOpen" (wallet_address, opened_at DESC, loot_box_id);

-- Optimize loot box cooldown queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loot_box_cooldown_user_box 
ON "LootBoxCooldown" (wallet_address, loot_box_id, next_available_at);

-- Optimize loot box daily limits
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loot_box_daily_limit_user_date 
ON "LootBoxDailyLimit" (wallet_address, date DESC, loot_box_id);

-- ==============================================
-- NOTIFICATION SYSTEM OPTIMIZATIONS
-- ==============================================

-- Optimize user notifications by read status and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notification_read_date 
ON "UserNotification" (wallet_address, is_read, created_at DESC);

-- Optimize notification recipients
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_recipient_seen 
ON "NotificationRecipient" (recipient, is_seen, created_at DESC);

-- ==============================================
-- COIN SYSTEM OPTIMIZATIONS
-- ==============================================

-- Optimize coin transactions by user and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transaction_user_date 
ON "CoinTransaction" (wallet_address, created_at DESC, coin_type);

-- Optimize coin transactions by type and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transaction_type_date 
ON "CoinTransaction" (transaction_type, created_at DESC);

-- ==============================================
-- ADMIN SYSTEM OPTIMIZATIONS
-- ==============================================

-- Optimize admin actions by admin and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_action_admin_date 
ON "AdminAction" (admin_user_id, created_at DESC, action_type);

-- Optimize admin actions by target wallet
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_action_target_wallet 
ON "AdminAction" (target_wallet, created_at DESC);

-- ==============================================
-- LEADERBOARD OPTIMIZATIONS
-- ==============================================

-- Optimize leaderboard entries by rank
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_entry_rank 
ON "LeaderboardEntry" (leaderboard_id, rank, total_coins DESC);

-- Optimize leaderboard entries by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_entry_user 
ON "LeaderboardEntry" (wallet_address, leaderboard_id, created_at DESC);

-- ==============================================
-- REFERRAL SYSTEM OPTIMIZATIONS
-- ==============================================

-- Optimize referral balance cache
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_balance_cache_updated 
ON "ReferralBalanceCache" (updated_at DESC, wallet_address);

-- ==============================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ==============================================

-- Optimize game queries with multiple filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_complex_filter 
ON "Game" (status, game_type, is_featured, created_at DESC) 
WHERE status = 'Published';

-- Optimize user queries with multiple filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_complex_filter 
ON "User" (status, banned, created_at DESC) 
WHERE banned = false;

-- Optimize tournament queries with multiple filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_complex_filter 
ON "Tournament" (status, type, start_date, end_date) 
WHERE is_disabled = false;

-- ==============================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- ==============================================

-- Optimize active games only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_active_only 
ON "Game" (created_at DESC, play_count DESC) 
WHERE status = 'Published';

-- Optimize premium users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_premium_only 
ON "User" (created_at DESC, last_active_at DESC) 
WHERE status = 'Premium';

-- Optimize active tournaments only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_active_only 
ON "Tournament" (start_date, end_date, prize_pool DESC) 
WHERE status = 'Active' AND is_disabled = false;

-- ==============================================
-- STATISTICS AND ANALYTICS OPTIMIZATIONS
-- ==============================================

-- Optimize game statistics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_stats_aggregation 
ON "Game" (status, game_type, created_at) 
INCLUDE (play_count, like_count, rating, rating_count);

-- Optimize user statistics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_aggregation 
ON "User" (status, created_at) 
INCLUDE (total_logins, last_active_at);

-- ==============================================
-- CLEANUP AND MAINTENANCE
-- ==============================================

-- Update table statistics for better query planning
ANALYZE "Game";
ANALYZE "User";
ANALYZE "GameLike";
ANALYZE "GameRating";
ANALYZE "GameFavorite";
ANALYZE "GameComment";
ANALYZE "Tournament";
ANALYZE "TournamentParticipant";
ANALYZE "LootBoxOpen";
ANALYZE "UserNotification";
ANALYZE "CoinTransaction";
ANALYZE "AdminAction";
ANALYZE "LeaderboardEntry";

-- ==============================================
-- QUERY OPTIMIZATION RECOMMENDATIONS
-- ==============================================

/*
RECOMMENDED QUERY OPTIMIZATIONS:

1. Game Search Queries:
   - Use the new text search index for better performance
   - Consider implementing search result caching
   - Use pagination with proper LIMIT/OFFSET

2. User Management Queries:
   - Use the new text search index for user search
   - Implement proper pagination for large user lists
   - Consider caching frequently accessed user data

3. Game Interaction Queries:
   - Use composite indexes for complex filtering
   - Implement proper pagination for comments and reviews
   - Consider denormalizing some frequently accessed data

4. Tournament Queries:
   - Use the new status/date indexes for better performance
   - Implement proper pagination for participant lists
   - Consider caching tournament statistics

5. Loot Box Queries:
   - Use the new user/date indexes for better performance
   - Implement proper cooldown checking logic
   - Consider caching loot box availability

6. General Recommendations:
   - Monitor query performance with EXPLAIN ANALYZE
   - Consider implementing Redis caching for frequently accessed data
   - Use connection pooling for better database performance
   - Implement proper error handling and retry logic
   - Consider read replicas for read-heavy operations
*/
