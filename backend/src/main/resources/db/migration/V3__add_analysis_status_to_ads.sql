-- Add analysis status to ads table (Supabase REST managed)
ALTER TABLE ads
ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(20) DEFAULT 'pending';

-- Create index for filtering by analysis status
CREATE INDEX IF NOT EXISTS idx_ads_analysis_status ON ads(analysis_status);
