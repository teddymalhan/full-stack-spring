-- Migration: Make email column nullable
-- This allows users to be created without an email address
-- (e.g., users authenticating via phone number only)

-- Make email nullable and drop UNIQUE constraint
ALTER TABLE "User"
  ALTER COLUMN email DROP NOT NULL;

-- Recreate the index as a partial unique index (only for non-null emails)
DROP INDEX IF EXISTS idx_user_email;
CREATE UNIQUE INDEX idx_user_email ON "User"(email) WHERE email IS NOT NULL;
