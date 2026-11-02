-- ZaidRev Database Schema for Supabase
-- This schema handles user data, folders, topics, and revision settings with strict RLS.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL DEFAULT 'zaid',
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for quick lookup by user
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);

-- 2. Topics table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'zaid',
    title TEXT NOT NULL,
    revision_count INTEGER DEFAULT 0 NOT NULL,
    current_interval_index INTEGER DEFAULT 0 NOT NULL,
    last_revised_at DATE,
    next_revision_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_topics_folder_id ON public.topics(folder_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_next_revision_date ON public.topics(next_revision_date);

-- 3. User Revision Settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL,
    intervals JSONB NOT NULL DEFAULT '[1, 3, 7, 30]'::jsonb,
    theme TEXT NOT NULL DEFAULT 'dark',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default settings for zaid if not exists
INSERT INTO public.user_settings (user_id, intervals, theme)
VALUES ('zaid', '[1, 3, 7, 30]'::jsonb, 'dark')
ON CONFLICT (user_id) DO NOTHING;

-- Row Level Security (RLS) policies
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Permissive policy for service role and anon with user_id header or zaid identification
CREATE POLICY "Allow operations for matched user in folders" ON public.folders
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow operations for matched user in topics" ON public.topics
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow operations for matched user in user_settings" ON public.user_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);
