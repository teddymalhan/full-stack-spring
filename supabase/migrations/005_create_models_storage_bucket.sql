-- Create a public storage bucket for 3D models (GLB files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('models', 'models', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can read models (public bucket)
CREATE POLICY "Anyone can read models" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'models');

-- Policy: Only authenticated users can upload models (admin functionality)
CREATE POLICY "Authenticated users can upload models" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'models'
    AND auth.role() = 'authenticated'
  );

-- Policy: Only authenticated users can delete models
CREATE POLICY "Authenticated users can delete models" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'models'
    AND auth.role() = 'authenticated'
  );

