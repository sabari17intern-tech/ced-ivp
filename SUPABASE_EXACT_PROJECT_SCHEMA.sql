-- ==============================================================================
-- CED GRANT MANAGEMENT SYSTEM — EXACT PROJECT SCHEMA & DATA SCRIPT
-- Run this in your Supabase SQL Editor to initialize all 10 tables + RLS + Data
-- ==============================================================================

-- 1. ivp_app_state Table (Primary App State Storage)
CREATE TABLE IF NOT EXISTS public.ivp_app_state (
  id integer NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ivp_app_state_pkey PRIMARY KEY (id)
);
ALTER TABLE public.ivp_app_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on ivp_app_state" ON public.ivp_app_state;
CREATE POLICY "Allow anon all on ivp_app_state" ON public.ivp_app_state FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. ivp_applications Table
CREATE TABLE IF NOT EXISTS public.ivp_applications (
  application_id text NOT NULL,
  member_id text,
  team_id text,
  ced_team_id text,
  type text NOT NULL DEFAULT 'individual'::text,
  applicant_name text NOT NULL,
  phone text,
  email text,
  batch text,
  gender text,
  caste text,
  tier text,
  college text,
  women_beneficiaries integer DEFAULT 0,
  idea_name text,
  sector text,
  industry text,
  idea_description text,
  problem_statement text,
  proposed_solution text,
  business_model text,
  expected_impact text,
  funding_requested numeric DEFAULT 0,
  stage text NOT NULL DEFAULT 'registration'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  pitch_link text,
  bootcamp jsonb,
  data_collection jsonb,
  rounds jsonb,
  final_eval jsonb,
  edi jsonb,
  bank jsonb,
  registration jsonb,
  grant_details jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  notes jsonb DEFAULT '[]'::jsonb,
  history jsonb DEFAULT '[]'::jsonb,
  created_date text,
  last_updated text,
  raw_data jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  pitch_deck_link text,
  roll_number text,
  dob text,
  year text,
  department text,
  address text,
  startup_registered text,
  CONSTRAINT ivp_applications_pkey PRIMARY KEY (application_id)
);
ALTER TABLE public.ivp_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on ivp_applications" ON public.ivp_applications;
CREATE POLICY "Allow anon all on ivp_applications" ON public.ivp_applications FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. ivp_members Table
CREATE TABLE IF NOT EXISTS public.ivp_members (
  member_id text NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  college text,
  department text,
  district text,
  state text,
  address text,
  gender text,
  caste text,
  tier text,
  dob text,
  qualification text,
  occupation text,
  role text,
  team_id text,
  active boolean DEFAULT true,
  raw_data jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  roll_number text,
  year text,
  CONSTRAINT ivp_members_pkey PRIMARY KEY (member_id)
);
ALTER TABLE public.ivp_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on ivp_members" ON public.ivp_members;
CREATE POLICY "Allow anon all on ivp_members" ON public.ivp_members FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. ivp_teams Table
CREATE TABLE IF NOT EXISTS public.ivp_teams (
  team_id text NOT NULL,
  team_name text NOT NULL,
  leader_id text,
  members jsonb DEFAULT '[]'::jsonb,
  member_count integer DEFAULT 0,
  raw_data jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ivp_teams_pkey PRIMARY KEY (team_id)
);
ALTER TABLE public.ivp_teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on ivp_teams" ON public.ivp_teams;
CREATE POLICY "Allow anon all on ivp_teams" ON public.ivp_teams FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. ivp_users Table
CREATE TABLE IF NOT EXISTS public.ivp_users (
  username text NOT NULL,
  password text,
  role text NOT NULL DEFAULT 'applicant'::text,
  name text NOT NULL,
  title text,
  linked_application_id text,
  raw_data jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ivp_users_pkey PRIMARY KEY (username)
);
ALTER TABLE public.ivp_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on ivp_users" ON public.ivp_users;
CREATE POLICY "Allow anon all on ivp_users" ON public.ivp_users FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. ivp_reviewers Table
CREATE TABLE IF NOT EXISTS public.ivp_reviewers (
  reviewer_id text NOT NULL,
  name text NOT NULL,
  role text,
  round integer,
  mode text,
  email text,
  phone text,
  active boolean DEFAULT true,
  raw_data jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ivp_reviewers_pkey PRIMARY KEY (reviewer_id)
);
ALTER TABLE public.ivp_reviewers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on ivp_reviewers" ON public.ivp_reviewers;
CREATE POLICY "Allow anon all on ivp_reviewers" ON public.ivp_reviewers FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. ivp_reviewer_slots Table
CREATE TABLE IF NOT EXISTS public.ivp_reviewer_slots (
  slot_id text NOT NULL,
  reviewer_id text,
  date text,
  time text,
  status text DEFAULT 'available'::text,
  booked_by_app_id text,
  raw_data jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  round integer,
  CONSTRAINT ivp_reviewer_slots_pkey PRIMARY KEY (slot_id)
);
ALTER TABLE public.ivp_reviewer_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on ivp_reviewer_slots" ON public.ivp_reviewer_slots;
CREATE POLICY "Allow anon all on ivp_reviewer_slots" ON public.ivp_reviewer_slots FOR ALL TO public USING (true) WITH CHECK (true);

-- 8. ivp_messages Table
CREATE TABLE IF NOT EXISTS public.ivp_messages (
  msg_id text NOT NULL,
  title text,
  body text,
  created_by text,
  created_at bigint,
  active boolean DEFAULT true,
  raw_data jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  audience text DEFAULT 'all'::text,
  target text,
  tone text DEFAULT 'info'::text,
  CONSTRAINT ivp_messages_pkey PRIMARY KEY (msg_id)
);
ALTER TABLE public.ivp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on ivp_messages" ON public.ivp_messages;
CREATE POLICY "Allow anon all on ivp_messages" ON public.ivp_messages FOR ALL TO public USING (true) WITH CHECK (true);

-- 9. ivp_notifications Table
CREATE TABLE IF NOT EXISTS public.ivp_notifications (
  notif_id text NOT NULL,
  text text,
  link text,
  read boolean DEFAULT false,
  created_at bigint,
  raw_data jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  from_admin boolean DEFAULT false,
  audience text,
  batch text,
  app_id text,
  kind text,
  doc_name text,
  link_page text,
  CONSTRAINT ivp_notifications_pkey PRIMARY KEY (notif_id)
);
ALTER TABLE public.ivp_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on ivp_notifications" ON public.ivp_notifications;
CREATE POLICY "Allow anon all on ivp_notifications" ON public.ivp_notifications FOR ALL TO public USING (true) WITH CHECK (true);

-- 10. ivp_meta Table
CREATE TABLE IF NOT EXISTS public.ivp_meta (
  id integer NOT NULL DEFAULT 1,
  org_name text,
  batches jsonb,
  current_batch text,
  round1_criteria jsonb,
  round2_gates jsonb,
  created_at bigint,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ivp_meta_pkey PRIMARY KEY (id)
);
ALTER TABLE public.ivp_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on ivp_meta" ON public.ivp_meta;
CREATE POLICY "Allow anon all on ivp_meta" ON public.ivp_meta FOR ALL TO public USING (true) WITH CHECK (true);

-- ==============================================================================
-- DONE! All 10 tables created with full public anon read/write permissions.
-- ==============================================================================
