-- Migration: Add supabase_user_id column to users table
-- Run this in Supabase SQL Editor

-- Add supabase_user_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_user_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users (supabase_user_id);

-- Make it unique (optional, but recommended)
-- ALTER TABLE users ADD CONSTRAINT users_supabase_user_id_unique UNIQUE (supabase_user_id);