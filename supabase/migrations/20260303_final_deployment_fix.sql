-- Super Migration: Theme + Social + Achievements
-- Run this in your Supabase SQL Editor to support the new features

-- 1. Profiles Table Updates
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS favorite_section TEXT;

-- 2. Storage Buckets & Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for avatars (clean up old ones first to avoid errors)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatar Update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. User Achievements Table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, group_id, achievement_type)
);

-- RLS for Achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "achievements_select" ON public.user_achievements;
CREATE POLICY "achievements_select" ON public.user_achievements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "achievements_insert" ON public.user_achievements;
CREATE POLICY "achievements_insert" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Party Feed (Add Poll Support if missing)
-- The party_feed should have a metadata column. If it doesn't, this adds it.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='party_feed' AND column_name='metadata') THEN
        ALTER TABLE public.party_feed ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
