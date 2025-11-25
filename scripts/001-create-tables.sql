-- Creative Studio Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Assets table MUST be created FIRST since jobs references it
-- Assets table: stores uploaded images for editing
CREATE TABLE IF NOT EXISTS assets (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL,
  url TEXT NOT NULL,
  thumb_url TEXT,
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table: stores all generation/edit jobs
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'failed')),
  original_prompt TEXT,
  enhanced_prompt TEXT,
  preview_url TEXT,
  final_url TEXT,
  asset_id UUID REFERENCES assets(asset_id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  thought_signature TEXT,
  conversation_history JSONB DEFAULT '[]',
  -- Added progress_message column for UI feedback
  progress_message TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_device_id ON jobs(device_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_device_id ON assets(device_id);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all operations based on device_id
-- Since we're not using auth, we use service role key server-side
-- These policies allow the service role to access all data

-- Jobs policies
CREATE POLICY "Service role can do everything on jobs" ON jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Assets policies  
CREATE POLICY "Service role can do everything on assets" ON assets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to jobs table
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
