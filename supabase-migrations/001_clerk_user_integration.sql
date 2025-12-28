-- Migration: Clerk User Integration
-- This migration updates the User table to support Clerk authentication
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xohqmhnpzcbjaqucodrz/sql

-- 1. Rename existing User table to backup (optional, for safety)
-- ALTER TABLE "User" RENAME TO "User_backup";

-- 2. Drop existing User table and recreate with Clerk-compatible schema
-- WARNING: This will delete existing data. Backup first if needed!
DROP TABLE IF EXISTS "User" CASCADE;

-- 3. Create new User table with Clerk fields
CREATE TABLE "User" (
  -- Primary key: Clerk user ID
  id TEXT PRIMARY KEY,  -- Clerk user ID (e.g., "user_2abc123...")

  -- Basic user info from Clerk
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  username TEXT,

  -- Profile image
  image_url TEXT,

  -- Clerk metadata
  clerk_created_at BIGINT,  -- Clerk timestamp (milliseconds)
  clerk_updated_at BIGINT,  -- Clerk timestamp (milliseconds)

  -- Additional custom fields (add as needed)
  phone_number TEXT,
  email_verified BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for better query performance
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_username ON "User"(username);
CREATE INDEX idx_user_created_at ON "User"(created_at);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Policy: Anyone can read user profiles (adjust based on your needs)
CREATE POLICY "Users are viewable by everyone"
ON "User"
FOR SELECT
USING (true);

-- Policy: Users can insert their own profile (via webhook)
-- For webhook: disable RLS or use service role key
CREATE POLICY "Users can insert via service role"
ON "User"
FOR INSERT
WITH CHECK (true);  -- Webhook uses service role key which bypasses RLS

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON "User"
FOR UPDATE
USING (auth.jwt() ->> 'sub' = id);  -- Clerk user ID in JWT sub claim

-- Policy: Only service role can delete users
CREATE POLICY "Only service can delete users"
ON "User"
FOR DELETE
USING (auth.jwt() ->> 'role' = 'service_role');

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-update updated_at
CREATE TRIGGER update_user_updated_at
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 9. (Optional) Create a view for public user data
CREATE OR REPLACE VIEW "PublicUser" AS
SELECT
  id,
  email,
  first_name,
  last_name,
  username,
  image_url,
  created_at
FROM "User";

-- 10. Grant access to the view
GRANT SELECT ON "PublicUser" TO anon, authenticated;

-- Migration complete!
-- Next steps:
-- 1. Set up Clerk webhook in dashboard
-- 2. Configure webhook endpoint in your Spring Boot app
-- 3. Test user creation flow
