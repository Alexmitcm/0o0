-- Enable pg_trgm extension for trigram indexes (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes to accelerate ILIKE/contains searches on title and description
CREATE INDEX IF NOT EXISTS "Game_title_trgm_idx" ON "Game" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Game_description_trgm_idx" ON "Game" USING GIN ("description" gin_trgm_ops);


