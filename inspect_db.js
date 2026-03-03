import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvaydtxsajajgvxtojdh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YXlkdHhzYWphamd2eHRvamRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY0NTksImV4cCI6MjA4Nzk1MjQ1OX0.wqhSfKbvZAm_2CpHL30mZkeWye0x2Ril6yPuf-ZXuwc'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    await supabase.auth.signInWithPassword({
        email: 'percoco@pool.com',
        password: 'password'
    });

    const { data: { user } } = await supabase.auth.getUser();
    console.log("Logged in user:", user?.id, user?.user_metadata);

    const { data: memberData } = await supabase.from('group_members').select('*').eq('user_id', user?.id);
    console.log("Group Members data:", memberData);

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user?.id);
    console.log("Profiles data:", profileData);

    const { data: feedData } = await supabase.from('party_feed').select('*').order('created_at', { ascending: false }).limit(5);
    console.log("Recent Feed:", feedData);

    const { data: shiftsData } = await supabase.from('shift_entries').select('id, net_sales, tips').eq('user_id', user?.id).order('date', { ascending: false }).limit(5);
    console.log("Recent Shifts:", shiftsData);
}

test().catch(console.error);
