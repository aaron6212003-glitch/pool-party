-- 1. Secure function to join group by invite code
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
    SELECT g.id, g.name INTO target_group_id, target_group_name
    FROM groups g
    WHERE UPPER(g.invite_code) = UPPER(invite_code_input)
    LIMIT 1;

    IF target_group_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite code.');
    END IF;

    IF EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = target_group_id AND gm.user_id = auth.uid()) THEN
        RETURN jsonb_build_object('success', true, 'group_id', target_group_id, 'group_name', target_group_name);
    END IF;

    SELECT p.display_name INTO caller_name FROM profiles p WHERE p.id = auth.uid() LIMIT 1;
    IF caller_name IS NULL OR caller_name = '' THEN
        caller_name := COALESCE(auth.jwt() -> 'user_metadata' ->> 'full_name', 'Server');
    END IF;

    INSERT INTO group_members (group_id, user_id, display_name)
    VALUES (target_group_id, auth.uid(), caller_name);

    RETURN jsonb_build_object('success', true, 'group_id', target_group_id, 'group_name', target_group_name);
END;
$$;

-- 2. NUCLEAR RLS FIX (Guaranteed Visibility)

-- GROUPS: Allow all authenticated users to SELECT (Breaks recursion & join hidden-ness)
DROP POLICY IF EXISTS "g_select_final" ON groups;
DROP POLICY IF EXISTS "g_select_membership_hardened" ON groups;
DROP POLICY IF EXISTS "g_select_secure" ON groups;
CREATE POLICY "g_select_final" ON groups 
FOR SELECT TO authenticated 
USING (true);

-- GROUP MEMBERS: Allow all authenticated users to SELECT
DROP POLICY IF EXISTS "m_select_final" ON group_members;
DROP POLICY IF EXISTS "m_select_membership_hardened" ON group_members;
DROP POLICY IF EXISTS "m_select_secure" ON group_members;
CREATE POLICY "m_select_final" ON group_members 
FOR SELECT TO authenticated 
USING (true); 

-- GROUP MEMBERS: Delete logic is still restricted
DROP POLICY IF EXISTS "m_delete_final" ON group_members;
DROP POLICY IF EXISTS "m_delete_owner_hardened" ON group_members;
CREATE POLICY "m_delete_final" ON group_members
FOR DELETE TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.owner_id = auth.uid())
);
