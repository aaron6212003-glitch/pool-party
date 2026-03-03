-- 1. Ensure profiles table has the avatar_url column
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create or replace the sync function
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET avatar_url = EXCLUDED.avatar_url
    WHERE EXCLUDED.avatar_url IS NOT NULL AND EXCLUDED.avatar_url != '';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop old trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_from_auth();

-- 4. One-time backfill: sync all existing auth users into profiles right now
INSERT INTO public.profiles (id, avatar_url)
SELECT 
    id,
    raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users
WHERE raw_user_meta_data->>'avatar_url' IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET avatar_url = EXCLUDED.avatar_url
WHERE EXCLUDED.avatar_url IS NOT NULL AND EXCLUDED.avatar_url != '';
