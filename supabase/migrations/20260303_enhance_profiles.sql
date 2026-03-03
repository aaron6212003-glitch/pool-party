-- Add profile fields for social features
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS birthday TEXT,
ADD COLUMN IF NOT EXISTS work_anniversary TEXT,
ADD COLUMN IF NOT EXISTS favorite_section TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;
