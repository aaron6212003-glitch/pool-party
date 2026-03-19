-- 1. Create a secure join function
CREATE OR REPLACE FUNCTION join_party_by_code(invite_code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to check invite_code
AS $$
DECLARE
    target_group_id UUID;
    target_group_name TEXT;
    existing_member_id UUID;
BEGIN
    -- Get the group ID and name from the invite code
    SELECT id, name INTO target_group_id, target_group_name
    FROM groups
    WHERE invite_code = invite_code_input
    LIMIT 1;

    IF target_group_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code');
    END IF;

    -- Check if user is already a member
    SELECT id INTO existing_member_id
    FROM group_members
    WHERE group_id = target_group_id AND user_id = auth.uid();

    IF existing_member_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are already in this party');
    END IF;

    -- Join the group
    INSERT INTO group_members (group_id, user_id, display_name)
    VALUES (target_group_id, auth.uid(), (SELECT display_name FROM profiles WHERE id = auth.uid() LIMIT 1));

    RETURN jsonb_build_object(
        'success', true, 
        'group_id', target_group_id,
        'group_name', target_group_name
    );
END;
$$;

-- 2. Tighten Groups RLS
-- Only allow viewing the invite_code if you are a member or the owner
DROP POLICY IF EXISTS "g_select" ON groups;
CREATE POLICY "g_select_secure" ON groups 
FOR SELECT TO authenticated 
USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()) 
    OR owner_id = auth.uid()
);

-- Note: We still need a policy to allow anyone to select the group name 
-- BUT NOT THE INVITE CODE during joining. However, with the RPC, 
-- we don't need the client to search by code anymore.

-- 3. Enhance Group Members RLS for Admin Kicking
-- Allow members to see each other
DROP POLICY IF EXISTS "m_select" ON group_members;
CREATE POLICY "m_select_secure" ON group_members
FOR SELECT TO authenticated
USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- Allow admins to delete (kick) members
DROP POLICY IF EXISTS "m_delete" ON group_members;
CREATE POLICY "m_delete_admin" ON group_members
FOR DELETE TO authenticated
USING (
    auth.uid() = user_id -- Self-delete
    OR 
    EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = group_members.group_id 
        AND user_id = auth.uid() 
        AND is_admin = true
    )
);
