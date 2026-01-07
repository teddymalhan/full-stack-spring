-- Add analysis status to ad_uploads table
ALTER TABLE ad_uploads
ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(20) DEFAULT 'pending'
    CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed'));

-- Create ad_metadata table for AI analysis results
CREATE TABLE IF NOT EXISTS ad_metadata (
    id BIGSERIAL PRIMARY KEY,
    ad_id BIGINT NOT NULL REFERENCES ad_uploads(id) ON DELETE CASCADE,
    categories TEXT[] DEFAULT '{}',
    tone VARCHAR(50),
    era_style VARCHAR(50),
    keywords TEXT[] DEFAULT '{}',
    transcript TEXT,
    brand_name VARCHAR(255),
    energy_level INT CHECK (energy_level >= 1 AND energy_level <= 10),
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ad_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_metadata_ad_id ON ad_metadata(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_metadata_categories ON ad_metadata USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_ad_uploads_analysis_status ON ad_uploads(analysis_status);
