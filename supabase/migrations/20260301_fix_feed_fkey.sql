-- Fix foreign key constraint on party_feed to point to profiles instead of auth.users
ALTER TABLE public.party_feed
DROP CONSTRAINT IF EXISTS party_feed_user_id_fkey;

ALTER TABLE public.party_feed
ADD CONSTRAINT party_feed_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
