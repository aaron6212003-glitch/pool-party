-- Create reports table for App Store UGC compliance
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    post_id UUID REFERENCES public.party_feed(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can report
CREATE POLICY "r_insert" ON reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Policy: Admins or owners can see reports (though we don't have a dashboard yet, it's good for safety)
CREATE POLICY "r_select" ON reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
