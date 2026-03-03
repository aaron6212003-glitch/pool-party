-- Sportsbook Core Tables
CREATE TABLE public.bankrolls (
    user_id uuid REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL PRIMARY KEY,
    group_id uuid REFERENCES public.groups(id) NOT NULL,
    chips integer DEFAULT 100 NOT NULL,
    last_reset_date date DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE public.slips (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.groups(id) NOT NULL,
    target_user_id uuid REFERENCES public.profiles(id) NOT NULL, -- The user the bet is about
    shift_date date NOT NULL,
    line_type text NOT NULL, -- 'sales' or 'tips'
    line_value numeric(10,2) NOT NULL, -- The over/under target
    status text DEFAULT 'open' NOT NULL, -- 'open', 'locked', 'resolved_over', 'resolved_under', 'void'
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.wagers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL, -- The person betting
    slip_id uuid REFERENCES public.slips(id) NOT NULL,
    prediction text NOT NULL, -- 'over' or 'under'
    amount integer DEFAULT 10 NOT NULL,
    status text DEFAULT 'pending' NOT NULL, -- 'pending', 'won', 'lost', 'void'
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Basic Policies
ALTER TABLE public.bankrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wagers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bankrolls_select" ON public.bankrolls FOR SELECT TO authenticated USING (true);
CREATE POLICY "bankrolls_update" ON public.bankrolls FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bankrolls_insert" ON public.bankrolls FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "slips_select" ON public.slips FOR SELECT TO authenticated USING (true);
CREATE POLICY "slips_insert" ON public.slips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "slips_update" ON public.slips FOR UPDATE TO authenticated USING (true);

CREATE POLICY "wagers_select" ON public.wagers FOR SELECT TO authenticated USING (true);
CREATE POLICY "wagers_insert" ON public.wagers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wagers_update" ON public.wagers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
