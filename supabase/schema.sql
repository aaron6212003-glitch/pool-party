-- Pool Party - EMERGENCY RLS CLEANUP
-- COPY AND RUN THE ENTIRE SCRIPT BELOW IN YOUR SUPABASE SQL EDITOR

-- 1. DROP EVERY POSSIBLE POLICY NAME (Brute force)
-- This targets every name we've used and known recursive patterns
DO $$ 
DECLARE 
    r record;
BEGIN 
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename); 
    END LOOP; 
END $$;

-- 2. DISABLE AND RE-ENABLE RLS TO BE CERTAIN
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE shift_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipout_rules DISABLE ROW LEVEL SECURITY;

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipout_rules ENABLE ROW LEVEL SECURITY;

-- 3. APPLY ULTRA-FLAT POLICIES (Zero subqueries, zero recursion)

-- PROFILES
CREATE POLICY "p_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "p_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- GROUPS
CREATE POLICY "g_select" ON groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "g_insert" ON groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "g_update" ON groups FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

-- GROUP MEMBERS
-- We use USING (true) for SELECT to completely bypass join-based recursion
CREATE POLICY "m_select" ON group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "m_insert" ON group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "m_delete" ON group_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SHIFT ENTRIES
CREATE POLICY "s_select" ON shift_entries FOR SELECT TO authenticated USING (auth.uid() = user_id OR share_to_feed = true);
CREATE POLICY "s_insert" ON shift_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "s_update" ON shift_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "s_delete" ON shift_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- TIPOUT RULES
CREATE POLICY "t_select" ON tipout_rules FOR SELECT TO authenticated USING (true);
