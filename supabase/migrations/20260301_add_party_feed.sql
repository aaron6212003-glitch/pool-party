create table public.party_feed (
    id uuid default gen_random_uuid() primary key,
    group_id uuid references public.groups(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    event_type text not null check (event_type in ('system', 'chat')),
    content text not null,
    metadata jsonb default '{}'::jsonb,
    is_anonymous boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.party_feed enable row level security;

-- Policies
create policy "Users can view feed for their groups"
    on public.party_feed for select
    using (
        exists (
            select 1 from public.group_members
            where group_members.group_id = party_feed.group_id
            and group_members.user_id = auth.uid()
        )
    );

create policy "Users can insert into their groups feed"
    on public.party_feed for insert
    with check (
        exists (
            select 1 from public.group_members
            where group_members.group_id = party_feed.group_id
            and group_members.user_id = auth.uid()
        )
        and auth.uid() = user_id
    );

create policy "Users can delete their own chat messages"
    on public.party_feed for delete
    using (auth.uid() = user_id and event_type = 'chat');
