-- Add share_to_leaderboard column to group_members
-- Default TRUE (opted in) so existing members stay visible
ALTER TABLE group_members
ADD COLUMN IF NOT EXISTS share_to_leaderboard boolean NOT NULL DEFAULT true;
