-- Create watch_history table for tracking user video watches
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  video_title TEXT,
  thumbnail_url TEXT,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  ad_ids UUID[] DEFAULT '{}'
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);

-- Enable Row Level Security
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own history
CREATE POLICY "Users can view own history" ON watch_history
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Users can insert their own history
CREATE POLICY "Users can insert own history" ON watch_history
  FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Users can delete their own history
CREATE POLICY "Users can delete own history" ON watch_history
  FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');