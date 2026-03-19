-- 1. Secure function to join group by invite code
-- Uses explicit aliases (g, gm, p) to avoid "ambiguous column" or "id error"
CREATE OR REPLACE FUNCTION join_party_by_code(invite_code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_group_id UUID;
    target_group_name TEXT;
    caller_name TEXT;
BEGIN
    -- Find group by code (Qualify columns)
    SELECT g.id, g.name INTO target_group_id, target_group_name
    FROM groups g
    WHERE UPPER(g.invite_code) = UPPER(invite_code_input)
    LIMIT 1;

    IF target_group_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite code.');
    END IF;

    -- Check if already a member
    IF EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = target_group_id AND gm.user_id = auth.uid()) THEN
        RETURN jsonb_build_object('success', true, 'group_id', target_group_id, 'group_name', target_group_name, 'message', 'Already a member');
    END IF;

    -- Get display name with multi-layered fallback
    SELECT p.display_name INTO caller_name FROM profiles p WHERE p.id = auth.uid() LIMIT 1;
    
    IF caller_name IS NULL OR caller_name = '' THEN
        caller_name := COALESCE(auth.jwt() -> 'user_metadata' ->> 'full_name', 'Server');
    END IF;

    -- Join the group
    INSERT INTO group_members (group_id, user_id, display_name)
    VALUES (target_group_id, auth.uid(), caller_name);

    RETURN jsonb_build_object(
        'success', true, 
        'group_id', target_group_id, 
        'group_name', target_group_name
    );
END;
$$;

-- 2. HARDENED RLS POLICIES (Aliases everywhere to prevent "id error")

-- GROUPS: Secure invite code visibility
DROP POLICY IF EXISTS "g_select_secure" ON groups;
CREATE POLICY "g_select_membership_hardened" ON groups 
FOR SELECT TO authenticated 
USING (
    id IN (SELECT gm.group_id FROM group_members gm WHERE gm.user_id = auth.uid()) 
    OR owner_id = auth.uid()
);

-- GROUP MEMBERS: Allow members to see each other, allow owners to manage
DROP POLICY IF EXISTS "m_select_secure" ON group_members;
CREATE POLICY "m_select_membership_hardened" ON group_members 
FOR SELECT TO authenticated 
USING (
    user_id = auth.uid() 
    OR 
    group_id IN (SELECT g.id FROM groups g WHERE g.owner_id = auth.uid())
);

-- Note: We still use the hotfix recursion-free delete policy if active
DROP POLICY IF EXISTS "m_delete_admin" ON group_members;
CREATE POLICY "m_delete_owner_hardened" ON group_members
FOR DELETE TO authenticated
USING (
    auth.uid() = user_id -- Self-delete
    OR 
    group_id IN (SELECT g.id FROM groups g WHERE g.owner_id = auth.uid())
);
