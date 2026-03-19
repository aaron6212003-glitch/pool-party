-- Migration to add wrap_template selection to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wrap_template TEXT DEFAULT 'obsidian';
