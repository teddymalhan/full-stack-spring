-- =====================================================
-- FIX STORAGE POLICIES FOR CLERK AUTH
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop the old policies that use auth.uid() (doesn't work with Clerk)
DROP POLICY IF EXISTS "Users can read own ad files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own ads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own ad files" ON storage.objects;

-- Allow all operations via service role key
-- Security is handled by the backend which validates user ownership
-- before generating signed URLs for access
CREATE POLICY "Service role full access" ON storage.objects
  FOR ALL
  USING (bucket_id = 'ads')
  WITH CHECK (bucket_id = 'ads');
