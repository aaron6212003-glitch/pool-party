alter table public.party_feed add column reactions jsonb default '{}'::jsonb;

create policy "Users can update reactions on their group feed"
    on public.party_feed for update
    using (
        exists (
            select 1 from public.group_members
            where group_members.group_id = party_feed.group_id
            and group_members.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.group_members
            where group_members.group_id = party_feed.group_id
            and group_members.user_id = auth.uid()
        )
    );
