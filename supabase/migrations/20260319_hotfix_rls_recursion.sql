-- HOTFIX: RESOLVE RLS RECURSION
-- Run this in your Supabase SQL Editor to restore missing parties

-- 1. Fix Group Members SELECT (Revert to Ultra-Flat to avoid recursion)
DROP POLICY IF EXISTS "m_select_secure" ON group_members;
CREATE POLICY "m_select_flat" ON group_members
FOR SELECT TO authenticated
USING (true);

-- 2. Fix Group Members DELETE (Non-recursive check via groups table)
DROP POLICY IF EXISTS "m_delete_admin" ON group_members;
CREATE POLICY "m_delete_admin_new" ON group_members
FOR DELETE TO authenticated
USING (
    auth.uid() = user_id -- Self-delete
    OR 
    auth.uid() IN (SELECT owner_id FROM groups WHERE id = group_id) -- Admin/Owner check
);

-- 3. Ensure Groups SELECT is working
-- This will now work correctly because group_members is non-recursive
DROP POLICY IF EXISTS "g_select_secure" ON groups;
CREATE POLICY "g_select_membership" ON groups 
FOR SELECT TO authenticated 
USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()) 
    OR owner_id = auth.uid()
);
