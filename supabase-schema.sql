-- ==============================================================================
-- SHARAN GRANT MANAGEMENT SYSTEM - SUPABASE SCHEMA MIGRATION
-- ==============================================================================
-- Run this in your Supabase SQL Editor to initialize the database
-- for the single-file application.

-- 1. Create the main state table
-- The application stores its entire state as a JSON blob in the `data` column.
CREATE TABLE IF NOT EXISTS ivp_app_state (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert the initial row if it doesn't exist
-- The app expects row id=1 to be present.
INSERT INTO ivp_app_state (id, data) 
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE ivp_app_state ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- The app handles its own internal role-based authentication using the JSON data.
-- Therefore, we allow the Supabase 'anon' (public) key to read and update this specific row.

-- Allow read access
CREATE POLICY "Allow anon read" 
ON ivp_app_state 
FOR SELECT 
USING (true);

-- Allow insert access (for the upsert operation)
CREATE POLICY "Allow anon insert" 
ON ivp_app_state 
FOR INSERT 
WITH CHECK (true);

-- Allow update access
CREATE POLICY "Allow anon update" 
ON ivp_app_state 
FOR UPDATE 
USING (true);

-- ==============================================================================
-- DONE! The app can now sync data to the cloud.
-- Make sure to update App.SUPABASE_URL and App.SUPABASE_ANON_KEY in the HTML file.
-- ==============================================================================
