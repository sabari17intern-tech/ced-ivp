-- ==============================================================================
-- CED GRANT MANAGEMENT SYSTEM — COMPLETE SUPABASE DATABASE MASTER QUERY
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and click "RUN"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART 1: MAIN STATE ENGINE TABLE (Used by ced-grant-management.html)
-- ------------------------------------------------------------------------------

-- 1. Create the primary state table
CREATE TABLE IF NOT EXISTS public.ivp_app_state (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.ivp_app_state ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any to prevent conflict errors
DROP POLICY IF EXISTS "Allow anon read" ON public.ivp_app_state;
DROP POLICY IF EXISTS "Allow anon insert" ON public.ivp_app_state;
DROP POLICY IF EXISTS "Allow anon update" ON public.ivp_app_state;

-- 4. Create RLS policies allowing the public 'anon' key to Read, Insert, and Update
CREATE POLICY "Allow anon read" 
ON public.ivp_app_state 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow anon insert" 
ON public.ivp_app_state 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Allow anon update" 
ON public.ivp_app_state 
FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);

-- 5. Insert initial row (id = 1) if it doesn't exist yet
INSERT INTO public.ivp_app_state (id, data, updated_at) 
VALUES (1, '{"users":[{"username":"admin","password":"admin123","role":"admin","name":"CED Administrator","title":"Programme Office, CED"}],"members":[],"teams":[],"applications":[],"reviewers":[],"reviewerSlots":[],"rounds":{},"messages":[],"notifications":[],"docSeq":0,"notifSeq":0,"slotSeq":0,"msgSeq":0,"meta":{"orgName":"Centre for Entrepreneurship Development, Anna University"}}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- PART 2: INDIVIDUAL RELATIONAL TABLES (For Direct SQL Queries & React Integration)
-- ------------------------------------------------------------------------------

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  name TEXT NOT NULL,
  title TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on users" ON public.users;
CREATE POLICY "Allow anon all on users" ON public.users FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  application_id TEXT PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  team_id TEXT,
  type TEXT DEFAULT 'individual',
  idea_name TEXT,
  sector TEXT,
  batch TEXT,
  college TEXT,
  funding_requested NUMERIC DEFAULT 0,
  stage TEXT DEFAULT 'registration',
  status TEXT DEFAULT 'pending',
  bootcamp_attended BOOLEAN DEFAULT false,
  pitch_link TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  registration_data JSONB DEFAULT '{}'::jsonb,
  grant_data JSONB DEFAULT '{}'::jsonb,
  created_date DATE DEFAULT CURRENT_DATE,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on applications" ON public.applications;
CREATE POLICY "Allow anon all on applications" ON public.applications FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id TEXT REFERENCES public.applications(application_id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  attempt_number INT DEFAULT 1,
  reviewer_name TEXT,
  marks JSONB DEFAULT '{}'::jsonb,
  total_score NUMERIC,
  score_out_of_10 NUMERIC,
  outcome TEXT,
  remarks TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on evaluations" ON public.evaluations;
CREATE POLICY "Allow anon all on evaluations" ON public.evaluations FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. GRANTS TABLE
CREATE TABLE IF NOT EXISTS public.grants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id TEXT REFERENCES public.applications(application_id) ON DELETE CASCADE,
  approved_amount NUMERIC DEFAULT 0,
  grant_type TEXT DEFAULT 'Grant Fund',
  sanction_letter_no TEXT,
  bank_verification TEXT DEFAULT 'Pending',
  phase1_status TEXT DEFAULT 'pending',
  phase1_amount NUMERIC DEFAULT 0,
  phase2_status TEXT DEFAULT 'pending',
  phase2_amount NUMERIC DEFAULT 0,
  phase3_status TEXT DEFAULT 'pending',
  phase3_amount NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on grants" ON public.grants;
CREATE POLICY "Allow anon all on grants" ON public.grants FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notif_id TEXT UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT DEFAULT 'all',
  batch TEXT,
  app_id TEXT,
  created_by TEXT DEFAULT 'CED Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on notifications" ON public.notifications;
CREATE POLICY "Allow anon all on notifications" ON public.notifications FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. AUDIT HISTORY LOG TABLE
CREATE TABLE IF NOT EXISTS public.application_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id TEXT REFERENCES public.applications(application_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  user_name TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT,
  remarks TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.application_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on history" ON public.application_history;
CREATE POLICY "Allow anon all on history" ON public.application_history FOR ALL TO public USING (true) WITH CHECK (true);

-- ==============================================================================
-- DONE! RUN THIS QUERY IN SUPABASE SQL EDITOR TO FIX ALL SAVING & PERMISSION ISSUES.
-- ==============================================================================
