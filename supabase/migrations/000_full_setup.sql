-- =====================================================
-- RETROWATCH LIBRARY SETUP
-- Run this in Supabase SQL Editor
-- =====================================================

-- ============ 001: ADS TABLE ============
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  status TEXT DEFAULT 'uploaded',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ads" ON ads FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can insert own ads" ON ads FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own ads" ON ads FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============ 002: WATCH HISTORY TABLE ============
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  video_title TEXT,
  thumbnail_url TEXT,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  ad_ids UUID[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history" ON watch_history FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can insert own history" ON watch_history FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can delete own history" ON watch_history FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============ 003: PRIVATE ADS STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', false)
ON CONFLICT (id) DO NOTHING;

-- Only owners can read their own files
CREATE POLICY "Users can read own ad files" ON storage.objects FOR SELECT
  USING (bucket_id = 'ads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Only owners can upload to their folder
CREATE POLICY "Users can upload own ads" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Only owners can delete their files
CREATE POLICY "Users can delete own ad files" ON storage.objects FOR DELETE
  USING (bucket_id = 'ads' AND (storage.foldername(name))[1] = auth.uid()::text);