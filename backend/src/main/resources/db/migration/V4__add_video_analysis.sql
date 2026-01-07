-- Create video_analysis table for caching YouTube video metadata analysis
CREATE TABLE IF NOT EXISTS video_analysis (
    id BIGSERIAL PRIMARY KEY,
    video_id VARCHAR(20) NOT NULL UNIQUE,
    youtube_url VARCHAR(500) NOT NULL,
    title VARCHAR(500),
    description TEXT,
    duration_seconds INT,
    categories TEXT[] DEFAULT '{}',
    topics TEXT[] DEFAULT '{}',
    sentiment VARCHAR(50),
    ad_break_suggestions JSONB DEFAULT '[]',
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_video_analysis_video_id ON video_analysis(video_id);
CREATE INDEX IF NOT EXISTS idx_video_analysis_categories ON video_analysis USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_video_analysis_analyzed_at ON video_analysis(analyzed_at);
