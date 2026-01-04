-- Create the ads storage bucket (PRIVATE - only owners can access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can only read their own files (stored in user_id/ folder)
CREATE POLICY "Users can read own ad files" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'ads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload own ads" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own ad files" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'ads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
